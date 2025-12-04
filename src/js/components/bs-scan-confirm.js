import { log } from '../utils/log.js';
import { toastify } from '../helpers/toastify.js';

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

  .confirm-container {
    padding: 1.5rem;
    max-width: 500px;
    margin: 0 auto;
  }

  .product-image {
    width: 100%;
    max-width: 300px;
    height: auto;
    margin: 0 auto 1.5rem;
    display: block;
    border-radius: var(--border-radius, 8px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .product-image-placeholder {
    width: 100%;
    max-width: 300px;
    height: 200px;
    margin: 0 auto 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--background-alt, #f5f5f5);
    border-radius: var(--border-radius, 8px);
    color: var(--text-muted, #888);
  }

  .product-info {
    margin-bottom: 1.5rem;
  }

  .product-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: var(--text-main, #333);
  }

  .product-brand {
    font-size: 1rem;
    color: var(--text-muted, #666);
    margin: 0 0 0.75rem 0;
  }

  .product-description {
    font-size: 0.9rem;
    color: var(--text-main, #555);
    margin: 0 0 1rem 0;
    line-height: 1.5;
  }

  .product-barcode {
    font-family: monospace;
    font-size: 0.95rem;
    padding: 0.5rem;
    background-color: var(--background-alt, #f5f5f5);
    border-radius: 4px;
    margin-bottom: 1rem;
    text-align: center;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-main, #333);
  }

  .form-group input {
    width: 100%;
    padding: 0.625rem;
    border: 1px solid var(--border, #ccc);
    border-radius: var(--border-radius, 4px);
    font-size: 1rem;
    font-family: inherit;
    color: var(--text-main, #333);
    background-color: var(--background-input, #fff);
  }

  .form-group input:focus {
    outline: none;
    border-color: var(--primary-color, #0066cc);
    box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
  }

  .form-group small {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.85rem;
    color: var(--text-muted, #666);
  }

  .actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  .btn {
    flex: 1;
    padding: 0.75rem;
    border: 0;
    border-radius: var(--border-radius, 4px);
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s ease;
  }

  .btn:hover:not(:disabled) {
    opacity: 0.9;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background-color: var(--primary-color, #0066cc);
    color: white;
  }

  .btn-secondary {
    background-color: var(--secondary-color, #6c757d);
    color: white;
  }

  .loading-state {
    text-align: center;
    padding: 2rem;
    color: var(--text-muted, #666);
  }

  @media (prefers-color-scheme: dark) {
    .product-image-placeholder {
      background-color: #2a2a2a;
    }

    .product-barcode {
      background-color: #2a2a2a;
    }
  }
`;

const template = document.createElement('template');

template.innerHTML = /* html */ `
  <style>${styles}</style>
  <div class="confirm-container">
    <div id="loadingState" class="loading-state" hidden>
      <p>Loading product information...</p>
    </div>

    <div id="confirmContent" hidden>
      <div id="productImageContainer"></div>
      
      <div class="product-info">
        <h2 class="product-title" id="productTitle">Unknown Product</h2>
        <p class="product-brand" id="productBrand" hidden></p>
        <p class="product-description" id="productDescription" hidden></p>
        <div class="product-barcode" id="productBarcode"></div>
      </div>

      <div class="form-group">
        <label for="expirationDate">Expiration Date (Optional)</label>
        <input type="date" id="expirationDate" />
        <small>Leave blank to use default (30 days from scan date)</small>
      </div>

      <div class="form-group">
        <label for="customNotes">Notes (Optional)</label>
        <input type="text" id="customNotes" placeholder="Add any notes about this item..." />
      </div>

      <div class="actions">
        <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
        <button type="button" class="btn btn-primary" id="saveBtn">Save to History</button>
      </div>
    </div>
  </div>
`;

class BSScanConfirm extends HTMLElement {
  #loadingStateEl = null;
  #confirmContentEl = null;
  #productImageContainerEl = null;
  #productTitleEl = null;
  #productBrandEl = null;
  #productDescriptionEl = null;
  #productBarcodeEl = null;
  #expirationDateEl = null;
  #customNotesEl = null;
  #cancelBtn = null;
  #saveBtn = null;
  #scanData = null;

  constructor() {
    super();

    if (!this.shadowRoot) {
      const shadowRoot = this.attachShadow({ mode: 'open' });
      shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }

  connectedCallback() {
    this.#loadingStateEl = this.shadowRoot.getElementById('loadingState');
    this.#confirmContentEl = this.shadowRoot.getElementById('confirmContent');
    this.#productImageContainerEl = this.shadowRoot.getElementById('productImageContainer');
    this.#productTitleEl = this.shadowRoot.getElementById('productTitle');
    this.#productBrandEl = this.shadowRoot.getElementById('productBrand');
    this.#productDescriptionEl = this.shadowRoot.getElementById('productDescription');
    this.#productBarcodeEl = this.shadowRoot.getElementById('productBarcode');
    this.#expirationDateEl = this.shadowRoot.getElementById('expirationDate');
    this.#customNotesEl = this.shadowRoot.getElementById('customNotes');
    this.#cancelBtn = this.shadowRoot.getElementById('cancelBtn');
    this.#saveBtn = this.shadowRoot.getElementById('saveBtn');

    this.#setupEventListeners();
  }

  #setupEventListeners() {
    this.#cancelBtn?.addEventListener('click', () => this.#handleCancel());
    this.#saveBtn?.addEventListener('click', () => this.#handleSave());
  }

  /**
   * Show the confirmation dialog with scan data
   * @param {Object} scanData - The scan data
   * @param {string} scanData.value - Barcode value
   * @param {string} [scanData.format] - Barcode format
   * @param {string} [scanData.title] - Product title
   * @param {string} [scanData.brand] - Product brand
   * @param {string} [scanData.description] - Product description
   * @param {string} [scanData.image] - Product image URL
   */
  async show(scanData) {
    this.#scanData = scanData;

    // Show loading state initially
    this.#loadingStateEl?.removeAttribute('hidden');
    this.#confirmContentEl?.setAttribute('hidden', '');

    // Simulate a small delay for product info (if needed)
    await new Promise(resolve => setTimeout(resolve, 100));

    this.#renderProductInfo();

    // Hide loading, show content
    this.#loadingStateEl?.setAttribute('hidden', '');
    this.#confirmContentEl?.removeAttribute('hidden');
  }

  #renderProductInfo() {
    if (!this.#scanData) return;

    const { value, title, brand, description, image } = this.#scanData;

    // Set barcode
    if (this.#productBarcodeEl) {
      this.#productBarcodeEl.textContent = `Barcode: ${value}`;
    }

    // Set title
    if (this.#productTitleEl) {
      this.#productTitleEl.textContent = title || 'Unknown Product';
    }

    // Set brand
    if (brand && this.#productBrandEl) {
      this.#productBrandEl.textContent = `Brand: ${brand}`;
      this.#productBrandEl.removeAttribute('hidden');
    } else if (this.#productBrandEl) {
      this.#productBrandEl.setAttribute('hidden', '');
    }

    // Set description
    if (description && this.#productDescriptionEl) {
      this.#productDescriptionEl.textContent = description;
      this.#productDescriptionEl.removeAttribute('hidden');
    } else if (this.#productDescriptionEl) {
      this.#productDescriptionEl.setAttribute('hidden', '');
    }

    // Set product image or placeholder
    if (this.#productImageContainerEl) {
      this.#productImageContainerEl.innerHTML = '';

      if (image) {
        const img = document.createElement('img');
        img.src = image;
        img.alt = title || 'Product image';
        img.className = 'product-image';
        img.onerror = () => {
          // If image fails to load, show placeholder
          this.#renderImagePlaceholder();
        };
        this.#productImageContainerEl.appendChild(img);
      } else {
        this.#renderImagePlaceholder();
      }
    }

    // Set default expiration date (30 days from now)
    if (this.#expirationDateEl) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 30);
      this.#expirationDateEl.value = defaultDate.toISOString().split('T')[0];
    }
  }

  #renderImagePlaceholder() {
    if (!this.#productImageContainerEl) return;

    const placeholder = document.createElement('div');
    placeholder.className = 'product-image-placeholder';
    placeholder.innerHTML = /* html */ `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
        <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
        <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
      </svg>
    `;
    this.#productImageContainerEl.appendChild(placeholder);
  }

  #handleCancel() {
    this.dispatchEvent(new CustomEvent('scan-confirm-cancel', {
      bubbles: true,
      composed: true
    }));
  }

  async #handleSave() {
    if (!this.#scanData) return;

    const expirationDate = this.#expirationDateEl?.value;
    const notes = this.#customNotesEl?.value;

    // Calculate expiration timestamp
    let expiresAt;
    if (expirationDate) {
      expiresAt = new Date(expirationDate).getTime();
    } else {
      // Default: 30 days from now
      expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000);
    }

    const enhancedScanData = {
      ...this.#scanData,
      expiresAt,
      notes: notes || '',
      confirmedAt: Date.now()
    };

    this.dispatchEvent(new CustomEvent('scan-confirm-save', {
      bubbles: true,
      composed: true,
      detail: enhancedScanData
    }));
  }

  static defineCustomElement(elementName = 'bs-scan-confirm') {
    if (typeof window !== 'undefined' && !window.customElements.get(elementName)) {
      window.customElements.define(elementName, BSScanConfirm);
    }
  }
}

BSScanConfirm.defineCustomElement();

export { BSScanConfirm };

