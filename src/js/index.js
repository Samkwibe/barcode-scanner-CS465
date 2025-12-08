import '@georapbox/a-tab-group/dist/a-tab-group.js';
import '@georapbox/web-share-element/dist/web-share-defined.js';
import '@georapbox/files-dropzone-element/dist/files-dropzone-defined.js';
import '@georapbox/resize-observer-element/dist/resize-observer-defined.js';
import '@georapbox/modal-element/dist/modal-element-defined.js';
import '@georapbox/alert-element/dist/alert-element-defined.js';
import { ACCEPTED_MIME_TYPES } from './constants.js';
import { getSettings, setSettings } from './services/storage.js';
import { debounce } from './utils/debounce.js';
import { log } from './utils/log.js';
import { isDialogElementSupported } from './utils/isDialogElementSupported.js';
import { createResult } from './helpers/result.js';
import { triggerScanEffects } from './helpers/triggerScanEffects.js';
import { resizeScanFrame } from './helpers/resizeScanFrame.js';
import { BarcodeReader } from './helpers/BarcodeReader.js';
import { fetchItemInfo } from './helpers/fetchItemInfo.js';
import { toggleTorchButtonStatus } from './helpers/toggleTorchButtonStatus.js';
import { toastify } from './helpers/toastify.js';
import { VideoCapture } from './components/video-capture.js';
import './components/clipboard-copy.js';
import './components/bs-result.js';
import './components/bs-settings.js';
import './components/bs-history.js';
import './components/bs-auth.js';
import './components/bs-scan-confirm.js';
import './components/bs-product-details.js';
import './components/bs-recipes.js';
import './components/bs-recipe-details.js';
import './components/bs-items.js';
import { initAuth, signInAnonymous } from './services/firebase-auth.js';
import { initFirestore, saveScan, syncPendingScans } from './services/firebase-scans.js';
import { isFirebaseConfigured, initFirebaseRuntime } from './services/firebase-config.js';

(async function () {
  // Initialize Firebase Authentication and Firestore
  try {
    // Only try to initialize if Firebase looks properly configured
    // This prevents errors from invalid API keys in environment variables
    if (isFirebaseConfigured()) {
      // If a runtime config was injected into `window.__FIREBASE_CONFIG__`, initialize Firebase now.
      try { 
        const { error } = initFirebaseRuntime();
        if (error) {
          if (error.message?.includes('API key') || error.code === 'auth/api-key-not-valid') {
            log.warn('Firebase API key is invalid. User needs to configure Firebase.');
            // Don't proceed with Firebase initialization if API key is invalid
            // The error handler will reset the config, so isFirebaseConfigured() will return false
          } else {
            log.warn('Firebase initialization error:', error);
          }
          // Skip Firebase initialization if there's an error
        } else {
          // Only proceed if initialization was successful
          log.info('Initializing Firebase...');
          await initFirestore();

          // Initialize auth and automatically sign in anonymously if no user
          const user = await initAuth();
          if (!user) {
            log.info('No user signed in, signing in anonymously...');
            await signInAnonymous();
          }

          // Sync any pending scans from offline mode
          const { syncedCount } = await syncPendingScans();
          if (syncedCount > 0) {
            toastify(`Synced ${syncedCount} scans from offline mode`, { variant: 'success' });
          }

          // Listen for online/offline events
          window.addEventListener('online', async () => {
            log.info('Back online, syncing pending scans...');
            const { syncedCount } = await syncPendingScans();
            if (syncedCount > 0) {
              toastify(`Synced ${syncedCount} scans`, { variant: 'success' });
            }
          });

          window.addEventListener('offline', () => {
            log.info('Offline mode - scans will be saved locally');
            toastify('Offline mode - scans will sync when online', { variant: 'warning' });
          });
        }
      } catch (e) { 
        log.warn('Error initializing Firebase:', e);
      }
    } else {
      log.info('Firebase not configured - using local storage only');
    }
  } catch (error) {
    log.error('Error initializing Firebase:', error);
    toastify('Running in offline mode', { variant: 'warning' });
  }

  const tabGroupEl = document.querySelector('a-tab-group');
  const videoCaptureEl = document.querySelector('video-capture');
  const bsSettingsEl = document.querySelector('bs-settings');
  const bsHistoryEl = document.querySelector('bs-history');
  const cameraPanel = document.getElementById('cameraPanel');
  const cameraResultsEl = cameraPanel.querySelector('.results');
  const filePanel = document.getElementById('filePanel');
  const fileResultsEl = filePanel.querySelector('.results');
  const scanInstructionsEl = document.getElementById('scanInstructions');
  const scanBtn = document.getElementById('scanBtn');
  const dropzoneEl = document.getElementById('dropzone');
  const resizeObserverEl = document.querySelector('resize-observer');
  const scanFrameEl = document.getElementById('scanFrame');
  const torchButton = document.getElementById('torchButton');
  const globalActionsEl = document.getElementById('globalActions');
  const authBtn = document.getElementById('authBtn');
  const authDialog = document.getElementById('authDialog');
  const historyBtn = document.getElementById('historyBtn');
  const historyDialog = document.getElementById('historyDialog');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsDialog = document.getElementById('settingsDialog');
  const settingsForm = document.getElementById('settingsForm');
  const cameraSelect = document.getElementById('cameraSelect');
  const scanConfirmDialog = document.getElementById('scanConfirmDialog');
  const scanConfirmEl = document.querySelector('bs-scan-confirm');
  const productDetailsDialog = document.getElementById('productDetailsDialog');
  const productDetailsEl = document.querySelector('bs-product-details');
  const recipeDetailsDialog = document.getElementById('recipeDetailsDialog');
  const recipeDetailsEl = document.querySelector('bs-recipe-details');
  const homePage = document.getElementById('homePage');
  const itemsPage = document.getElementById('itemsPage');
  const recipesPage = document.getElementById('recipesPage');
  const navLinks = document.querySelectorAll('[data-page]');
  const homeLink = document.getElementById('homeLink');
  const navSearchForm = document.getElementById('navSearchForm');
  const navSearchInput = document.getElementById('navSearchInput');
  const navAuthBtn = document.getElementById('navAuthBtn');
  const navAuthText = document.getElementById('navAuthText');
  const SCAN_RATE_LIMIT = 1000;
  let scanTimeoutId = null;
  let shouldScan = true;
  let pendingScanData = null;
  let currentPage = 'home';

  // By default the dialog elements are hidden for browsers that don't support the dialog element.
  // If the dialog element is supported, we remove the hidden attribute and the dialogs' visibility
  // is controlled by using the `showModal()` and `close()` methods.
  if (isDialogElementSupported()) {
    globalActionsEl?.removeAttribute('hidden');
    authDialog?.removeAttribute('hidden');
    historyDialog?.removeAttribute('hidden');
    settingsDialog?.removeAttribute('hidden');
    scanConfirmDialog?.removeAttribute('hidden');
    productDetailsDialog?.removeAttribute('hidden');
    recipeDetailsDialog?.removeAttribute('hidden');
  }

  const { barcodeReaderError } = await BarcodeReader.setup();

  if (barcodeReaderError) {
    const alertEl = document.getElementById('barcodeReaderError');

    shouldScan = false;
    globalActionsEl?.setAttribute('hidden', '');
    tabGroupEl?.setAttribute('hidden', '');
    alertEl?.setAttribute('open', '');

    return; // Stop the script execution as BarcodeDetector API is not supported.
  }

  const supportedBarcodeFormats = await BarcodeReader.getSupportedFormats();
  const [, settings] = await getSettings();
  const intitialFormats = settings?.formats || supportedBarcodeFormats;
  let barcodeReader = await BarcodeReader.create(intitialFormats);

  videoCaptureEl.addEventListener('video-capture:video-play', handleVideoCapturePlay, {
    once: true
  });

  videoCaptureEl.addEventListener('video-capture:error', handleVideoCaptureError, {
    once: true
  });

  VideoCapture.defineCustomElement();

  /**
   * Render the fetched item details inside the provided tab panel.
   * Creates or updates a container with id `itemInfo` inside the panel.
   * @param {HTMLElement} panelEl
   * @param {Object} info
   */
  function renderItemDetails(panelEl, info) {
    if (!panelEl) {
      log.error('Cannot render item details: panelEl is null');
      return;
    }
    if (!info) {
      log.warn('Cannot render item details: info is null');
      return;
    }

    log.info('Rendering item details:', info);

    let itemInfoEl = panelEl.querySelector('#itemInfo');
    if (!itemInfoEl) {
      itemInfoEl = document.createElement('div');
      itemInfoEl.id = 'itemInfo';
      itemInfoEl.className = 'item-info';
      // Insert after the results element if present, otherwise append
      const resultsEl = panelEl.querySelector('.results');
      if (resultsEl && resultsEl.parentNode) {
        resultsEl.parentNode.insertBefore(itemInfoEl, resultsEl.nextSibling);
      } else {
        panelEl.appendChild(itemInfoEl);
      }
      log.info('Created new itemInfo element');
    } else {
      log.info('Using existing itemInfo element');
    }

    // Clear existing content
    itemInfoEl.textContent = '';
    itemInfoEl.style.display = 'block';
    itemInfoEl.style.visibility = 'visible';
    itemInfoEl.style.opacity = '1';

    // Add product image if available
    if (info.image || info.images?.[0]) {
      const img = document.createElement('img');
      img.className = 'item-info__image';
      img.src = info.image || info.images[0];
      img.alt = info.title || info.name || 'Product image';
      img.onerror = function() {
        log.warn('Product image failed to load:', this.src);
        this.style.display = 'none';
      };
      img.onload = function() {
        log.info('Product image loaded successfully:', this.src);
      };
      itemInfoEl.appendChild(img);
    }

    const title = document.createElement('h3');
    title.className = 'item-info__title';
    title.textContent = info.title || info.name || info.alias || 'Unknown Product';

    const brand = document.createElement('p');
    brand.className = 'item-info__brand';
    brand.textContent = info.brand ? `🏷️ ${info.brand}` : '';

    const desc = document.createElement('p');
    desc.className = 'item-info__description';
    desc.textContent = info.description || '';

    itemInfoEl.appendChild(title);
    if (brand.textContent) itemInfoEl.appendChild(brand);
    if (desc.textContent) itemInfoEl.appendChild(desc);
    
    log.info('Item details rendered successfully');
  }

  async function handleFetchedItemInfo(barcodeValue, panelEl, barcodeFormat = '', shouldShowConfirm = false) {
    try {
      const info = await fetchItemInfo(barcodeValue);
      const scanData = {
        value: barcodeValue,
        format: barcodeFormat,
        title: info?.title || info?.name || info?.alias || '',
        brand: info?.brand || '',
        description: info?.description || '',
        image: info?.image || info?.images?.[0] || '',
        metadata: {
          source: 'camera',
          hasProductInfo: !!info
        }
      };

      // Auto-save immediately
      await saveScanData(scanData);
      
      // ALWAYS render inline first (guaranteed to work and visible)
      if (info) {
        log.info('Rendering product details inline for:', info.title || info.name || barcodeValue);
        renderItemDetails(panelEl, info);
        // Scroll to show the product info
        setTimeout(() => {
          const itemInfoEl = panelEl.querySelector('#itemInfo');
          if (itemInfoEl) {
            itemInfoEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 100);
      } else {
        log.warn('No product info found for barcode:', barcodeValue);
        // Show basic barcode info even if no product found
        const basicInfo = {
          title: `Barcode: ${barcodeValue}`,
          description: 'Product information not available in database. The barcode was scanned and saved.'
        };
        renderItemDetails(panelEl, basicInfo);
      }
      
      // Also try to show modal if available (nice bonus feature)
      if (info && productDetailsEl && productDetailsDialog) {
        try {
          log.info('Attempting to show product details modal');
          if (typeof productDetailsEl.show === 'function') {
            await productDetailsEl.show(scanData);
            productDetailsDialog.open = true;
            log.info('Product details modal opened successfully');
          } else {
            log.warn('productDetailsEl.show is not a function');
          }
        } catch (modalError) {
          log.warn('Could not show product details modal:', modalError);
          // Inline display already shown above, so user still sees the info
        }
      }

      // Show success toast
      const name = info?.title || info?.name || info?.alias || barcodeValue;
      toastify(`✅ ${name} scanned and saved!`, { variant: 'success', duration: 3000 });

      // Update inline result element
      try {
        const resultsContainer = panelEl?.querySelector('.results');
        if (resultsContainer) {
          const resultEl = resultsContainer.querySelector(`bs-result[value="${barcodeValue}"]`);
          if (resultEl && info) {
            if (info.title) resultEl.setAttribute('data-title', info.title);
            if (info.brand) resultEl.setAttribute('data-brand', info.brand);
            if (info.description) resultEl.setAttribute('data-description', info.description);
          }
        }
      } catch (e) {
        // non-fatal
      }

      return scanData;
    } catch (err) {
      log.error('Error fetching item info:', err);
      // Still create scan data even if lookup fails
      const scanData = {
        value: barcodeValue,
        format: barcodeFormat,
        metadata: {
          source: 'camera',
          hasProductInfo: false,
          lookupFailed: true
        }
      };

      // Auto-save even if lookup failed
      await saveScanData(scanData);
      
      // Show product details modal with basic info
      if (productDetailsEl && productDetailsDialog) {
        await productDetailsEl.show(scanData);
        productDetailsDialog.open = true;
      }

      toastify(`📦 Barcode ${barcodeValue} scanned and saved!`, { variant: 'success', duration: 3000 });

      return scanData;
    }
  }

  async function saveScanData(scanData) {
    try {
      const result = await saveScan(scanData);
      
      if (result.error) {
        // Check if user needs to authenticate
        if (result.requiresAuth) {
          toastify('You must be signed in to save scans. Please create an account or sign in.', { 
            variant: 'warning',
            duration: 5000
          });
          // Open auth dialog
          if (authDialog) {
            authDialog.open = true;
          }
          return;
        }
        
        // Check if Firebase needs to be configured
        if (result.requiresFirebase) {
          toastify('Firebase is not configured. Please configure Firebase to save scans.', { 
            variant: 'warning',
            duration: 5000
          });
          // Open auth dialog to configure Firebase
          if (authDialog) {
            authDialog.open = true;
          }
          return;
        }
        
        // Other errors
        toastify('Failed to save scan. Please try again.', { variant: 'danger' });
        log.error('Error saving scan:', result.error);
        return;
      }
      
      log.info('Scan saved to Firestore:', result.scanId);
      toastify('Scan saved successfully!', { variant: 'success' });
    } catch (saveError) {
      log.error('Error saving scan:', saveError);
      toastify('Failed to save scan. Please try again.', { variant: 'danger' });
    }
  }

  const videoCaptureShadowRoot = videoCaptureEl?.shadowRoot;
  const videoCaptureVideoEl = videoCaptureShadowRoot?.querySelector('video');
  const videoCaptureActionsEl = videoCaptureShadowRoot?.querySelector('[part="actions-container"]');

  dropzoneEl.accept = ACCEPTED_MIME_TYPES.join(',');
  bsSettingsEl.supportedFormats = supportedBarcodeFormats;

  // let lastScanTime = 0;

  /**
   * Scans for barcodes.
   * If a barcode is detected, it stops scanning and displays the result.
   *
   * @returns {Promise<void>} - A Promise that resolves when the barcode is detected.
   */
  async function scan() {
    if (!shouldScan) {
      return;
    }

    log.info('Scanning...');

    scanInstructionsEl?.removeAttribute('hidden');

    try {
      const [, settings] = await getSettings();
      const barcode = await barcodeReader.detect(videoCaptureVideoEl);
      const barcodeValue = barcode?.rawValue ?? '';
      const barcodeFormat = barcode?.format ?? '';

      if (!barcodeValue) {
        throw new Error('No barcode detected');
      }

      createResult(cameraResultsEl, barcodeValue);

      // Attempt to fetch item info for 12-14 digit numeric barcodes
      handleFetchedItemInfo(barcodeValue, cameraPanel, barcodeFormat);

      if (settings?.addToHistory) {
        try {
          await bsHistoryEl?.add(barcodeValue);
          // Open history and scroll the new item into view so countdown is visible immediately
          if (historyDialog) {
            historyDialog.open = true;
            // small timeout to allow history element to render
            setTimeout(() => {
              try {
                const li = bsHistoryEl?.shadowRoot?.querySelector(
                  `li[data-value="${barcodeValue}"]`
                );
                li?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                li?.classList?.add('highlight');
                setTimeout(() => li?.classList?.remove('highlight'), 2000);
              } catch (e) {
                // ignore
              }
            }, 50);
          }
        } catch (e) {
          // ignore
        }
      }

      triggerScanEffects();

      if (!settings?.continueScanning) {
        if (scanTimeoutId) {
          clearTimeout(scanTimeoutId);
          scanTimeoutId = null;
        }
        scanBtn?.removeAttribute('hidden');
        scanFrameEl?.setAttribute('hidden', '');
        videoCaptureActionsEl?.setAttribute('hidden', '');
        return;
      }
    } catch {
      // If no barcode is detected, the error is caught here.
      // We can ignore the error and continue scanning.
    }

    if (shouldScan) {
      scanTimeoutId = setTimeout(() => scan(), SCAN_RATE_LIMIT);
    }
  }

  /**
   * Handles the click event on the scan button.
   * It is responsible for clearing previous results and starting the scan process again.
   */
  function handleScanButtonClick() {
    scanBtn?.setAttribute('hidden', '');
    scanFrameEl?.removeAttribute('hidden');
    videoCaptureActionsEl?.removeAttribute('hidden');
    // hideResult(cameraPanel);
    scan();
  }

  /**
   * Handles the tab show event.
   * It is responsible for starting or stopping the scan process based on the selected tab.
   *
   * @param {CustomEvent} evt - The event object.
   */
  function handleTabShow(evt) {
    const tabId = evt.detail.tabId;
    const videoCaptureEl = document.querySelector('video-capture'); // Get the latest instance of video-capture element to ensure we don't use the cached one.

    if (tabId === 'cameraTab') {
      shouldScan = true;

      if (!videoCaptureEl) {
        return;
      }

      if (!videoCaptureEl.loading && scanBtn.hasAttribute('hidden')) {
        scanFrameEl?.removeAttribute('hidden');
        videoCaptureActionsEl?.removeAttribute('hidden');
        scan();
      }

      if (typeof videoCaptureEl.startVideoStream === 'function') {
        const videoDeviceId = cameraSelect?.value || undefined;
        videoCaptureEl.startVideoStream(videoDeviceId);
      }
    } else if (tabId === 'fileTab') {
      shouldScan = false;

      if (videoCaptureEl != null && typeof videoCaptureEl.stopVideoStream === 'function') {
        videoCaptureEl.stopVideoStream();
      }

      scanFrameEl?.setAttribute('hidden', '');
      videoCaptureActionsEl?.setAttribute('hidden', '');
    }
  }

  /**
   * Handles the selection of a file.
   * It is responsible for displaying the selected file in the dropzone.
   *
   * @param {File} file - The selected file.
   */
  async function handleFileSelect(file) {
    if (!file) {
      return;
    }

    const [, settings] = await getSettings();
    const image = new Image();
    const reader = new FileReader();

    reader.onload = evt => {
      const data = evt.target.result;

      image.onload = async () => {
        try {
          const barcode = await barcodeReader.detect(image);
          const barcodeValue = barcode?.rawValue ?? '';
          const barcodeFormat = barcode?.format ?? '';

          if (!barcodeValue) {
            throw new Error('No barcode detected');
          }

          createResult(fileResultsEl, barcodeValue);

          // Try to fetch item info for file-scanned barcodes as well
          handleFetchedItemInfo(barcodeValue, filePanel, barcodeFormat);

          if (settings?.addToHistory) {
            try {
              await bsHistoryEl?.add(barcodeValue);
              if (historyDialog) {
                historyDialog.open = true;
                setTimeout(() => {
                  try {
                    const li = bsHistoryEl?.shadowRoot?.querySelector(
                      `li[data-value="${barcodeValue}"]`
                    );
                    li?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    li?.classList?.add('highlight');
                    setTimeout(() => li?.classList?.remove('highlight'), 2000);
                  } catch (e) {}
                }, 50);
              }
            } catch (e) {}
          }

          triggerScanEffects();
        } catch (err) {
          log.error(err);

          toastify(
            '<strong>No barcode detected</strong><br><small>Please try again with a different image.</small>',
            { variant: 'danger', trustDangerousInnerHTML: true }
          );

          triggerScanEffects({ success: false });
        }
      };

      image.src = data;
      image.alt = 'Image preview';

      dropzoneEl.replaceChildren();

      const preview = document.createElement('div');
      preview.className = 'dropzone-preview';

      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'dropzone-preview__image-wrapper';

      const fileNameWrapper = document.createElement('div');
      fileNameWrapper.className = 'dropzone-preview__file-name';
      fileNameWrapper.textContent = file.name;

      imageWrapper.appendChild(image);
      preview.appendChild(imageWrapper);
      preview.appendChild(fileNameWrapper);
      dropzoneEl.prepend(preview);
    };

    reader.readAsDataURL(file);
  }

  /**
   * Handles the drop event on the dropzone.
   *
   * @param {CustomEvent} evt - The event object.
   */
  function handleFileDrop(evt) {
    const file = evt.detail.acceptedFiles[0];
    handleFileSelect(file);
  }

  /**
   * Handles the resize event on the video-capture element.
   * It is responsible for resizing the scan frame based on the video element.
   */
  function handleVideoCaptureResize() {
    resizeScanFrame(videoCaptureEl.shadowRoot.querySelector('video'), scanFrameEl);
  }

  /**
   * Handles the video play event on the video-capture element.
   * It is responsible for displaying the scan frame and starting the scan process.
   * It also handles the zoom controls if the browser supports it.
   *
   * @param {CustomEvent} evt - The event object.
   */
  async function handleVideoCapturePlay(evt) {
    scanFrameEl?.removeAttribute('hidden');
    resizeScanFrame(evt.detail.video, scanFrameEl);
    scan();

    const trackSettings = evt.target.getTrackSettings();
    const trackCapabilities = evt.target.getTrackCapabilities();
    const zoomLevelEl = document.getElementById('zoomLevel');

    // Torch CTA
    if (trackCapabilities?.torch) {
      torchButton?.addEventListener('click', handleTorchButtonClick);
      torchButton?.removeAttribute('hidden');

      if (videoCaptureEl.hasAttribute('torch')) {
        toggleTorchButtonStatus({ el: torchButton, isTorchOn: true });
      }
    }

    // Zoom controls
    if (trackSettings?.zoom && trackCapabilities?.zoom) {
      const zoomControls = document.getElementById('zoomControls');
      const minZoom = trackCapabilities?.zoom?.min || 0;
      const maxZoom = trackCapabilities?.zoom?.max || 10;
      let currentZoom = trackSettings?.zoom || 1;

      const handleZoomControlsClick = evt => {
        const zoomInBtn = evt.target.closest('[data-action="zoom-in"]');
        const zoomOutBtn = evt.target.closest('[data-action="zoom-out"]');

        if (zoomInBtn && currentZoom < maxZoom) {
          currentZoom += 0.5;
        }

        if (zoomOutBtn && currentZoom > minZoom) {
          currentZoom -= 0.5;
        }

        zoomLevelEl.textContent = currentZoom.toFixed(1);
        videoCaptureEl.zoom = currentZoom;
      };

      zoomControls?.addEventListener('click', handleZoomControlsClick);
      zoomControls?.removeAttribute('hidden');
      zoomLevelEl.textContent = currentZoom.toFixed(1);
    }

    // Camera select
    const videoInputDevices = await VideoCapture.getVideoInputDevices();

    videoInputDevices.forEach((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || `Camera ${index + 1}`;
      cameraSelect.appendChild(option);
    });

    if (videoInputDevices.length > 1) {
      cameraSelect?.addEventListener('change', handleCameraSelectChange);
      cameraSelect?.removeAttribute('hidden');
    }
  }

  /**
   * Handles the error event on the video-capture element.
   * It is responsible for displaying an error message if the camera cannot be accessed or permission is denied.
   *
   * @param {CustomEvent} evt - The event object.
   */
  function handleVideoCaptureError(evt) {
    const error = evt.detail.error;

    if (error.name === 'NotFoundError') {
      // If the browser cannot find all media tracks with the specified types that meet the constraints given.
      return;
    }

    const errorMessage =
      error.name === 'NotAllowedError'
        ? `<strong>Error accessing camera</strong><br>Permission to use webcam was denied or video Autoplay is disabled. Reload the page to give appropriate permissions to webcam.`
        : error.message;

    cameraPanel.innerHTML = /* html */ `
      <alert-element variant="danger" open>
        <span slot="icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="1.25em" height="1.25em" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4.54.146A.5.5 0 0 1 4.893 0h6.214a.5.5 0 0 1 .353.146l4.394 4.394a.5.5 0 0 1 .146.353v6.214a.5.5 0 0 1-.146.353l-4.394 4.394a.5.5 0 0 1-.353.146H4.893a.5.5 0 0 1-.353-.146L.146 11.46A.5.5 0 0 1 0 11.107V4.893a.5.5 0 0 1 .146-.353zM5.1 1 1 5.1v5.8L5.1 15h5.8l4.1-4.1V5.1L10.9 1z"/>
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
          </svg>
        </span>
        ${errorMessage}
      </alert-element>
    `;
  }

  /**
   * Handles the auth button click event.
   * It is responsible for displaying the auth dialog.
   */
  function handleAuthButtonClick() {
    authDialog.open = true;
  }

  /**
   * Handles the settings button click event.
   * It is responsible for displaying the settings dialog.
   */
  function handleSettingsButtonClick() {
    settingsDialog.open = true;
  }

  /**
   * Handles the change event on the settings form.
   * It is responsible for saving the settings to persistent storage and updating the settings.
   *
   * @param {Event} evt - The event object.
   */
  async function handleSettingsFormChange(evt) {
    evt.preventDefault();

    const settings = {};
    const formData = new FormData(settingsForm);
    const generalSettings = formData.getAll('general-settings');
    const formatsSettings = formData.getAll('formats-settings');

    generalSettings.forEach(value => (settings[value] = true));
    settings.formats = formatsSettings;
    setSettings(settings);

    if (evt.target.name === 'formats-settings') {
      barcodeReader = await BarcodeReader.create(formatsSettings);
    }
  }

  /**
   * Handles the click event on the history button.
   * It is responsible for displaying the history dialog.
   */
  function handleHistoryButtonClick() {
    historyDialog.open = true;
  }

  /**
   * Handles the click event on the torch button.
   * It is responsible for toggling the torch on and off.
   *
   * @param {MouseEvent} evt - The event object.
   */
  function handleTorchButtonClick(evt) {
    videoCaptureEl.torch = !videoCaptureEl.torch;

    toggleTorchButtonStatus({
      el: evt.currentTarget,
      isTorchOn: videoCaptureEl.hasAttribute('torch')
    });
  }

  /**
   * Handles the change event on the camera select element.
   * It is responsible for restarting the video stream with the selected video input device id.
   *
   * @param {Event} evt - The event object.
   */
  function handleCameraSelectChange(evt) {
    if (typeof videoCaptureEl.restartVideoStream !== 'function') {
      return;
    }

    const videoDeviceId = evt.target.value || undefined;
    videoCaptureEl.restartVideoStream(videoDeviceId);
  }

  /**
   * Handles the visibility change event on the document.
   * It is responsible for stopping the scan process when the document is not visible.
   */
  function handleDocumentVisibilityChange() {
    const selectedTab = tabGroupEl.querySelector('[selected]');
    const tabId = selectedTab.getAttribute('id');

    if (tabId !== 'cameraTab') {
      return;
    }

    if (document.visibilityState === 'hidden') {
      shouldScan = false;

      if (videoCaptureEl != null && typeof videoCaptureEl.stopVideoStream === 'function') {
        videoCaptureEl.stopVideoStream();
      }
    } else {
      shouldScan = true;

      // Get the latest instance of video-capture element to ensure we don't use the cached one.
      const videoCaptureEl = document.querySelector('video-capture');

      if (!videoCaptureEl) {
        return;
      }

      if (!videoCaptureEl.loading && scanBtn.hasAttribute('hidden')) {
        scan();
      }

      if (typeof videoCaptureEl.startVideoStream === 'function') {
        const videoDeviceId = cameraSelect?.value || undefined;
        videoCaptureEl.startVideoStream(videoDeviceId);
      }
    }
  }

  /**
   * Handles the escape key press event on the document.
   * It is responsible for triggering the scan button click event if there is already a barcode detected.
   */
  function handleDocumentEscapeKey() {
    const cameraTabSelected = tabGroupEl.querySelector('#cameraTab').hasAttribute('selected');
    const scanBtnVisible = !scanBtn.hidden;
    const settingsDialogOpen = settingsDialog.hasAttribute('open');
    const historyDialogOpen = historyDialog.hasAttribute('open');
    const anyDialogOpen = settingsDialogOpen || historyDialogOpen;

    if (!scanBtnVisible || !cameraTabSelected || anyDialogOpen) {
      return;
    }

    scanBtn.click();
  }

  /**
   * Handles the key down event on the document.
   */
  function handleDocumentKeyDown(evt) {
    if (evt.key === 'Escape') {
      handleDocumentEscapeKey();
    }
  }

  /**
   * Handles success events from the history component.
   *
   * @param {CustomEvent<{ type: string, message: string }>} evt - The event object.
   */
  function handleHistorySuccess(evt) {
    const { type, message } = evt.detail;

    if (type === 'add') {
      toastify(message, { variant: 'success' });
    }
  }

  /**
   * Handles error events from the history component.
   *
   * @param {CustomEvent<{ type: string, message: string }>} evt - The event object.
   */
  function handleHistoryError(evt) {
    const { type, message } = evt.detail;

    if (type === 'remove' || type === 'empty') {
      historyDialog?.hide();
    }

    toastify(message, { variant: 'danger' });
  }

  scanBtn.addEventListener('click', handleScanButtonClick);
  tabGroupEl.addEventListener('a-tab-show', debounce(handleTabShow, 250));
  dropzoneEl.addEventListener('files-dropzone-drop', handleFileDrop);
  resizeObserverEl.addEventListener('resize-observer:resize', handleVideoCaptureResize);
  authBtn.addEventListener('click', handleAuthButtonClick);
  settingsBtn.addEventListener('click', handleSettingsButtonClick);
  settingsForm.addEventListener('change', debounce(handleSettingsFormChange, 500));
  historyBtn.addEventListener('click', handleHistoryButtonClick);
  document.addEventListener('visibilitychange', handleDocumentVisibilityChange);
  document.addEventListener('keydown', handleDocumentKeyDown);
  document.addEventListener('bs-history-success', handleHistorySuccess);
  document.addEventListener('bs-history-error', handleHistoryError);

  // Scan confirmation dialog events
  document.addEventListener('scan-confirm-save', async (evt) => {
    const enhancedScanData = evt.detail;
    
    if (enhancedScanData) {
      await saveScanData(enhancedScanData);
      
      const [, settings] = await getSettings();
      if (settings?.addToHistory) {
        try {
          await bsHistoryEl?.add(enhancedScanData.value);
          if (historyDialog) {
            historyDialog.open = true;
            setTimeout(() => {
              try {
                const li = bsHistoryEl?.shadowRoot?.querySelector(
                  `li[data-value="${enhancedScanData.value}"]`
                );
                li?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                li?.classList?.add('highlight');
                setTimeout(() => li?.classList?.remove('highlight'), 2000);
              } catch (e) {
                // ignore
              }
            }, 50);
          }
        } catch (e) {
          // ignore
        }
      }

      toastify('Scan saved successfully!', { variant: 'success' });
    }

    scanConfirmDialog.open = false;
    pendingScanData = null;
  });

  document.addEventListener('scan-confirm-cancel', () => {
    scanConfirmDialog.open = false;
    pendingScanData = null;
  });

  document.addEventListener('product-details-close', () => {
    productDetailsDialog.open = false;
  });

  // Show product details from history
  document.addEventListener('show-product-details', (evt) => {
    const productData = evt.detail;
    if (productDetailsEl && productDetailsDialog) {
      productDetailsEl.show(productData);
      productDetailsDialog.open = true;
    }
  });

  // Navigation handlers
  function showPage(pageName) {
    // Hide all pages
    homePage?.setAttribute('hidden', '');
    itemsPage?.setAttribute('hidden', '');
    recipesPage?.setAttribute('hidden', '');

    // Show selected page
    switch(pageName) {
      case 'home':
        homePage?.removeAttribute('hidden');
        break;
      case 'items':
        itemsPage?.removeAttribute('hidden');
        // Reload items when page is shown
        const itemsEl = document.querySelector('bs-items');
        if (itemsEl && typeof itemsEl.loadItems === 'function') {
          itemsEl.loadItems();
        }
        break;
      case 'recipes':
        recipesPage?.removeAttribute('hidden');
        // Reload recipes when page is shown
        const recipesEl = document.querySelector('bs-recipes');
        if (recipesEl && typeof recipesEl.loadRecipes === 'function') {
          recipesEl.loadRecipes();
        }
        break;
    }

    currentPage = pageName;

    // Update active nav link
    navLinks.forEach(link => {
      if (link.dataset.page === pageName) {
        link.style.color = 'var(--accent)';
        link.style.fontWeight = '600';
      } else {
        link.style.color = '';
        link.style.fontWeight = '';
      }
    });
  }

  // Navigation link handlers
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      showPage(page);
    });
  });

  // Home link handler
  homeLink?.addEventListener('click', (e) => {
    e.preventDefault();
    showPage('home');
  });

  // Navigation auth button handler
  navAuthBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (authDialog) {
      authDialog.open = true;
    }
  });

  // Update nav auth button based on auth state
  function updateNavAuthButton(user) {
    if (navAuthBtn && navAuthText) {
      if (user) {
        navAuthBtn.classList.add('authenticated');
        const displayText = user.email 
          ? (user.email.length > 15 ? user.email.substring(0, 15) + '...' : user.email)
          : (user.isAnonymous ? 'Anonymous' : 'Account');
        navAuthText.textContent = displayText;
      } else {
        navAuthBtn.classList.remove('authenticated');
        navAuthText.textContent = 'Login';
      }
    }
  }

  // Listen to auth state changes from bs-auth component
  document.addEventListener('auth-state-changed', (evt) => {
    updateNavAuthButton(evt.detail.user);
  });

  // Also subscribe to Firebase auth state changes
  import('./services/firebase-auth.js').then(({ onAuthStateChange, getCurrentUser }) => {
    // Check initial auth state
    const currentUser = getCurrentUser();
    updateNavAuthButton(currentUser);
    
    // Subscribe to future changes
    onAuthStateChange((user) => {
      updateNavAuthButton(user);
    });
  });

  // Navigation search handler
  navSearchForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = navSearchInput?.value.trim();
    if (query) {
      // Switch to items page and filter
      showPage('items');
      // Could add search filtering here
      toastify(`Searching for: ${query}`, { variant: 'info' });
    }
  });

  // Recipe details handler
  document.addEventListener('show-recipe-details', (evt) => {
    const recipeData = evt.detail.recipe;
    if (recipeDetailsEl && recipeDetailsDialog) {
      recipeDetailsEl.show(recipeData);
      recipeDetailsDialog.open = true;
    }
  });

  document.addEventListener('recipe-details-close', () => {
    recipeDetailsDialog.open = false;
  });

  // Initialize: show home page
  showPage('home');
})();
