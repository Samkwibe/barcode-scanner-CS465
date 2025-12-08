import { log } from '../utils/log.js';
import { formatDateTime } from '../utils/datetime-formatter.js';

const styles = /* css */ `
  :host {
    display: block;
    box-sizing: border-box;
  }

  :host *,
  :host *::before,
  :host *::after {
    box-sizing: inherit;
  }

  :host([hidden]),
  [hidden],
  ::slotted([hidden]) {
    display: none !important;
  }

  .details-container {
    padding: 2rem;
    max-width: 600px;
    margin: 0 auto;
    color: var(--text-main, #333);
    animation: fadeInUp 0.4s ease-out;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .product-image {
    width: 100%;
    max-width: 400px;
    height: auto;
    margin: 0 auto 1.5rem;
    display: block;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .product-image:hover {
    transform: scale(1.02);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
  }

  .product-image-placeholder {
    width: 100%;
    max-width: 400px;
    height: 250px;
    margin: 0 auto 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--background-alt, #f5f5f5);
    border-radius: var(--border-radius, 8px);
    color: var(--text-muted, #888);
  }

  .product-header {
    margin-bottom: 1.5rem;
  }

  .product-title {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    color: var(--text-main, #222);
    line-height: 1.2;
    background: linear-gradient(135deg, var(--accent, #0066cc), var(--primary-color, #0066cc));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .product-brand {
    font-size: 1.2rem;
    color: var(--text-muted, #666);
    margin: 0 0 0.5rem 0;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .product-brand::before {
    content: '🏷️';
    font-size: 1.1rem;
  }

  .detail-section {
    margin-bottom: 1.25rem;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid var(--border, #e0e0e0);
  }

  .detail-section:last-child {
    border-bottom: none;
  }

  .detail-label {
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-muted, #666);
    margin-bottom: 0.5rem;
  }

  .detail-value {
    font-size: 1rem;
    color: var(--text-main, #333);
    line-height: 1.6;
    margin: 0;
  }

  .barcode-value {
    font-family: 'Courier New', Courier, monospace;
    background-color: var(--background-alt, #f5f5f5);
    padding: 0.75rem;
    border-radius: 4px;
    font-size: 1.1rem;
    font-weight: 600;
    text-align: center;
    margin: 0;
  }

  .expiration-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: var(--border-radius, 6px);
    background-color: var(--background-alt, #f5f5f5);
  }

  .expiration-info.expired {
    background-color: rgba(220, 38, 38, 0.1);
    color: var(--danger-color, #dc2626);
  }

  .expiration-info.expiring-soon {
    background-color: rgba(217, 119, 6, 0.1);
    color: var(--warning-color, #d97706);
  }

  .expiration-info.fresh {
    background-color: rgba(22, 163, 74, 0.1);
    color: var(--success-color, #16a34a);
  }

  .expiration-icon {
    font-size: 1.5rem;
  }

  .expiration-text {
    flex: 1;
  }

  .expiration-date {
    font-weight: 600;
    font-size: 1rem;
  }

  .expiration-countdown {
    font-size: 0.85rem;
    opacity: 0.8;
  }

  .metadata-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.5rem 1rem;
    font-size: 0.9rem;
  }

  .metadata-label {
    font-weight: 500;
    color: var(--text-muted, #666);
  }

  .metadata-value {
    color: var(--text-main, #333);
  }

  .notes-section {
    background-color: rgba(59, 130, 246, 0.05);
    border-left: 3px solid var(--info-color, #3b82f6);
    padding: 0.75rem;
    border-radius: 4px;
    font-style: italic;
  }

  .empty-notes {
    color: var(--text-muted, #999);
    font-size: 0.9rem;
  }

  .actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border, #e0e0e0);
  }

  .btn {
    flex: 1;
    padding: 0.75rem;
    border: 0;
    border-radius: var(--border-radius, 6px);
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s ease, transform 0.1s ease;
  }

  .btn:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .btn-primary {
    background-color: var(--primary-color, #0066cc);
    color: white;
  }

  @media (prefers-color-scheme: dark) {
    .product-image-placeholder {
      background-color: #2a2a2a;
    }

    .barcode-value {
      background-color: #2a2a2a;
    }

    .expiration-info {
      background-color: #2a2a2a;
    }

    .expiration-info.expired {
      background-color: rgba(254, 92, 92, 0.15);
    }

    .expiration-info.expiring-soon {
      background-color: rgba(255, 189, 17, 0.15);
    }

    .expiration-info.fresh {
      background-color: rgba(58, 224, 117, 0.15);
    }

    .notes-section {
      background-color: rgba(59, 130, 246, 0.1);
    }
  }
`;

const template = document.createElement('template');

template.innerHTML = /* html */ `
  <style>${styles}</style>
  <div class="details-container">
    <div id="productImageContainer"></div>
    
    <div class="product-header">
      <h2 class="product-title" id="productTitle">Product Details</h2>
      <p class="product-brand" id="productBrand" hidden></p>
    </div>

    <div class="detail-section">
      <div class="detail-label">Barcode</div>
      <p class="barcode-value" id="barcodeValue">—</p>
    </div>

    <div class="detail-section" id="descriptionSection" hidden>
      <div class="detail-label">Description</div>
      <p class="detail-value" id="productDescription">—</p>
    </div>

    <div class="detail-section" id="expirationSection" hidden>
      <div class="detail-label">Expiration Status</div>
      <div class="expiration-info" id="expirationInfo">
        <div class="expiration-icon" id="expirationIcon">📅</div>
        <div class="expiration-text">
          <div class="expiration-date" id="expirationDate">—</div>
          <div class="expiration-countdown" id="expirationCountdown">—</div>
        </div>
      </div>
    </div>

    <div class="detail-section" id="notesSection" hidden>
      <div class="detail-label">Notes</div>
      <div class="notes-section" id="notes">
        <span class="empty-notes">No notes added</span>
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-label">Additional Information</div>
      <div class="metadata-grid" id="metadataGrid">
        <span class="metadata-label">Scanned:</span>
        <span class="metadata-value" id="scannedDate">—</span>
        <span class="metadata-label">Format:</span>
        <span class="metadata-value" id="barcodeFormat">—</span>
      </div>
    </div>

    <div class="actions">
      <button type="button" class="btn btn-primary" id="closeBtn">Close</button>
    </div>
  </div>
`;

class BSProductDetails extends HTMLElement {
  #productImageContainerEl = null;
  #productTitleEl = null;
  #productBrandEl = null;
  #barcodeValueEl = null;
  #descriptionSectionEl = null;
  #productDescriptionEl = null;
  #expirationSectionEl = null;
  #expirationInfoEl = null;
  #expirationIconEl = null;
  #expirationDateEl = null;
  #expirationCountdownEl = null;
  #notesSectionEl = null;
  #notesEl = null;
  #scannedDateEl = null;
  #barcodeFormatEl = null;
  #closeBtn = null;

  constructor() {
    super();

    if (!this.shadowRoot) {
      const shadowRoot = this.attachShadow({ mode: 'open' });
      shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }

  connectedCallback() {
    this.#productImageContainerEl = this.shadowRoot.getElementById('productImageContainer');
    this.#productTitleEl = this.shadowRoot.getElementById('productTitle');
    this.#productBrandEl = this.shadowRoot.getElementById('productBrand');
    this.#barcodeValueEl = this.shadowRoot.getElementById('barcodeValue');
    this.#descriptionSectionEl = this.shadowRoot.getElementById('descriptionSection');
    this.#productDescriptionEl = this.shadowRoot.getElementById('productDescription');
    this.#expirationSectionEl = this.shadowRoot.getElementById('expirationSection');
    this.#expirationInfoEl = this.shadowRoot.getElementById('expirationInfo');
    this.#expirationIconEl = this.shadowRoot.getElementById('expirationIcon');
    this.#expirationDateEl = this.shadowRoot.getElementById('expirationDate');
    this.#expirationCountdownEl = this.shadowRoot.getElementById('expirationCountdown');
    this.#notesSectionEl = this.shadowRoot.getElementById('notesSection');
    this.#notesEl = this.shadowRoot.getElementById('notes');
    this.#scannedDateEl = this.shadowRoot.getElementById('scannedDate');
    this.#barcodeFormatEl = this.shadowRoot.getElementById('barcodeFormat');
    this.#closeBtn = this.shadowRoot.getElementById('closeBtn');

    this.#setupEventListeners();
  }

  #setupEventListeners() {
    this.#closeBtn?.addEventListener('click', () => this.#handleClose());
  }

  /**
   * Show product details
   * @param {Object} productData
   */
  show(productData) {
    if (!productData) return;

    // Reset all sections to default state
    this.#resetView();

    // Populate all fields
    this.#renderProductInfo(productData);
  }

  #resetView() {
    // Hide conditional sections by default
    this.#descriptionSectionEl?.setAttribute('hidden', '');
    this.#expirationSectionEl?.setAttribute('hidden', '');
    this.#notesSectionEl?.setAttribute('hidden', '');
  }

  #renderProductInfo(data) {
    const {
      value,
      title,
      brand,
      description,
      image,
      format,
      expiresAt,
      scannedAt,
      addedAt,
      notes
    } = data;

    // Barcode value
    if (this.#barcodeValueEl) {
      this.#barcodeValueEl.textContent = value || '—';
    }

    // Title
    if (this.#productTitleEl) {
      this.#productTitleEl.textContent = title || 'Unknown Product';
    }

    // Brand
    if (brand && this.#productBrandEl) {
      this.#productBrandEl.textContent = `Brand: ${brand}`;
      this.#productBrandEl.removeAttribute('hidden');
    }

    // Description
    if (description && this.#productDescriptionEl && this.#descriptionSectionEl) {
      this.#productDescriptionEl.textContent = description;
      this.#descriptionSectionEl.removeAttribute('hidden');
    }

    // Image
    this.#renderProductImage(image, title);

    // Expiration
    if (expiresAt) {
      this.#renderExpirationInfo(expiresAt);
      this.#expirationSectionEl?.removeAttribute('hidden');
    }

    // Notes
    if (notes && this.#notesEl && this.#notesSectionEl) {
      this.#notesEl.innerHTML = `<p style="margin: 0;">${notes}</p>`;
      this.#notesSectionEl.removeAttribute('hidden');
    }

    // Format
    if (this.#barcodeFormatEl) {
      this.#barcodeFormatEl.textContent = format || 'Unknown';
    }

    // Scanned date
    if (this.#scannedDateEl) {
      const timestamp = scannedAt || addedAt || Date.now();
      try {
        const formatted = formatDateTime(new Date(timestamp));
        this.#scannedDateEl.textContent = formatted;
      } catch (e) {
        this.#scannedDateEl.textContent = 'Unknown';
      }
    }
  }

  #renderProductImage(imageUrl, altText) {
    if (!this.#productImageContainerEl) return;

    this.#productImageContainerEl.innerHTML = '';

    if (imageUrl) {
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = altText || 'Product image';
      img.className = 'product-image';
      img.onerror = () => {
        this.#renderImagePlaceholder();
      };
      this.#productImageContainerEl.appendChild(img);
    } else {
      this.#renderImagePlaceholder();
    }
  }

  #renderImagePlaceholder() {
    if (!this.#productImageContainerEl) return;

    const placeholder = document.createElement('div');
    placeholder.className = 'product-image-placeholder';
    placeholder.innerHTML = /* html */ `
      <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="currentColor" viewBox="0 0 16 16">
        <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
        <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
      </svg>
    `;
    this.#productImageContainerEl.appendChild(placeholder);
  }

  #renderExpirationInfo(expiresAt) {
    const now = Date.now();
    const timeLeft = expiresAt - now;

    // Determine status
    let status = 'fresh';
    let icon = '✅';
    let countdown = '';

    if (timeLeft <= 0) {
      status = 'expired';
      icon = '❌';
      countdown = 'Expired';
    } else if (timeLeft <= 7 * 24 * 60 * 60 * 1000) { // 7 days
      status = 'expiring-soon';
      icon = '⚠️';
      countdown = this.#formatTimeRemaining(timeLeft);
    } else {
      status = 'fresh';
      icon = '✅';
      countdown = this.#formatTimeRemaining(timeLeft);
    }

    // Update UI
    if (this.#expirationInfoEl) {
      this.#expirationInfoEl.className = `expiration-info ${status}`;
    }

    if (this.#expirationIconEl) {
      this.#expirationIconEl.textContent = icon;
    }

    if (this.#expirationDateEl) {
      try {
        const formatted = formatDateTime(new Date(expiresAt));
        this.#expirationDateEl.textContent = `Expires: ${formatted}`;
      } catch (e) {
        this.#expirationDateEl.textContent = 'Expires: Unknown';
      }
    }

    if (this.#expirationCountdownEl) {
      this.#expirationCountdownEl.textContent = countdown;
    }
  }

  #formatTimeRemaining(ms) {
    if (ms <= 0) return 'Expired';

    const seconds = Math.floor(ms / 1000);
    const days = Math.floor(seconds / (24 * 3600));

    if (days > 0) return `${days} day${days === 1 ? '' : 's'} remaining`;

    const hours = Math.floor(seconds / 3600);
    if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} remaining`;

    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} remaining`;

    return 'Less than a minute remaining';
  }

  #handleClose() {
    this.dispatchEvent(new CustomEvent('product-details-close', {
      bubbles: true,
      composed: true
    }));
  }

  static defineCustomElement(elementName = 'bs-product-details') {
    if (typeof window !== 'undefined' && !window.customElements.get(elementName)) {
      window.customElements.define(elementName, BSProductDetails);
    }
  }
}

BSProductDetails.defineCustomElement();

export { BSProductDetails };

