import { getUserScans } from '../services/firebase-scans.js';
import { getHistory } from '../services/storage.js';
import { isFirebaseConfigured } from '../services/firebase-config.js';
import { isAuthenticated } from '../services/firebase-auth.js';
import { log } from '../utils/log.js';

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

  .items-container {
    padding: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .items-header {
    margin-bottom: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .items-title {
    font-size: 2rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-main);
  }

  .items-stats {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .stat-card {
    padding: 0.75rem 1.25rem;
    background: var(--background-alt);
    border-radius: 8px;
    border-left: 3px solid var(--accent);
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--accent);
  }

  .stat-label {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
  }

  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
  }

  .item-card {
    background: var(--background-alt);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    border: 1px solid var(--border);
    position: relative;
  }

  .item-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  .item-image {
    width: 100%;
    height: 180px;
    object-fit: cover;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .item-content {
    padding: 1.25rem;
  }

  .item-name {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: var(--text-main);
  }

  .item-brand {
    font-size: 0.9rem;
    color: var(--text-muted);
    margin: 0 0 0.75rem 0;
  }

  .item-barcode {
    font-family: monospace;
    font-size: 0.85rem;
    color: var(--text-muted);
    margin-bottom: 0.75rem;
  }

  .item-expiration {
    padding: 0.5rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    text-align: center;
  }

  .item-expiration.fresh {
    background: rgba(22, 163, 74, 0.1);
    color: var(--success-color);
  }

  .item-expiration.expiring {
    background: rgba(217, 119, 6, 0.1);
    color: var(--warning-color);
  }

  .item-expiration.expired {
    background: rgba(220, 38, 38, 0.1);
    color: var(--danger-color);
  }

  .status-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    z-index: 10;
  }

  .status-badge.fresh {
    background: var(--success-color);
    color: white;
  }

  .status-badge.expiring {
    background: var(--warning-color);
    color: white;
  }

  .status-badge.expired {
    background: var(--danger-color);
    color: white;
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--text-muted);
  }

  .empty-state-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  @media (max-width: 768px) {
    .items-grid {
      grid-template-columns: 1fr;
    }
  }
`;

const template = document.createElement('template');

template.innerHTML = /* html */ `
  <style>${styles}</style>
  <div class="items-container">
    <div class="items-header">
      <h2 class="items-title">My Inventory</h2>
      <div class="items-stats" id="itemsStats"></div>
    </div>

    <div id="itemsGrid" class="items-grid"></div>

    <div id="emptyState" class="empty-state" hidden>
      <div class="empty-state-icon">📦</div>
      <h3>No items in inventory</h3>
      <p>Start scanning barcodes to build your inventory!</p>
    </div>
  </div>
`;

class BSItems extends HTMLElement {
  #itemsGridEl = null;
  #emptyStateEl = null;
  #itemsStatsEl = null;

  constructor() {
    super();

    if (!this.shadowRoot) {
      const shadowRoot = this.attachShadow({ mode: 'open' });
      shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }

  connectedCallback() {
    this.#itemsGridEl = this.shadowRoot.getElementById('itemsGrid');
    this.#emptyStateEl = this.shadowRoot.getElementById('emptyState');
    this.#itemsStatsEl = this.shadowRoot.getElementById('itemsStats');
    
    this.loadItems();
  }

  async loadItems() {
    try {
      const items = await this.#getUserItems();
      
      if (items.length === 0) {
        this.#showEmptyState();
        return;
      }

      this.#renderStats(items);
      this.#renderItems(items);
    } catch (error) {
      log.error('Error loading items:', error);
      this.#showEmptyState();
    }
  }

  async #getUserItems() {
    const items = [];
    
    try {
      // Try Firestore first
      if (isFirebaseConfigured() && isAuthenticated()) {
        const { error, scans } = await getUserScans(100);
        if (!error && scans) {
          scans.forEach(scan => {
            items.push({
              id: scan.id,
              title: scan.title || 'Unknown Product',
              brand: scan.brand || '',
              description: scan.description || '',
              barcode: scan.value,
              expiresAt: scan.scannedAt ? new Date(scan.scannedAt.getTime() + 30 * 24 * 60 * 60 * 1000).getTime() : Date.now() + 30 * 24 * 60 * 60 * 1000,
              image: null
            });
          });
        }
      }
      
      // Also check local storage
      const [, history = []] = await getHistory();
      history.forEach(item => {
        const existing = items.find(i => i.barcode === (typeof item === 'string' ? item : item.value));
        if (!existing) {
          items.push({
            id: typeof item === 'string' ? item : item.value,
            title: typeof item === 'string' ? 'Unknown Product' : (item.title || 'Unknown Product'),
            brand: typeof item === 'string' ? '' : (item.brand || ''),
            description: typeof item === 'string' ? '' : (item.description || ''),
            barcode: typeof item === 'string' ? item : item.value,
            expiresAt: typeof item === 'string' ? Date.now() + 30 * 24 * 60 * 60 * 1000 : (item.expiresAt || Date.now() + 30 * 24 * 60 * 60 * 1000),
            image: null
          });
        }
      });
    } catch (error) {
      log.error('Error getting items:', error);
    }
    
    return items;
  }

  #renderStats(items) {
    if (!this.#itemsStatsEl) return;

    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

    const fresh = items.filter(item => (item.expiresAt - now) > SEVEN_DAYS).length;
    const expiring = items.filter(item => {
      const timeLeft = item.expiresAt - now;
      return timeLeft > 0 && timeLeft <= SEVEN_DAYS;
    }).length;
    const expired = items.filter(item => (item.expiresAt - now) <= 0).length;

    this.#itemsStatsEl.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${items.length}</div>
        <div class="stat-label">Total Items</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--success-color)">${fresh}</div>
        <div class="stat-label">Fresh</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--warning-color)">${expiring}</div>
        <div class="stat-label">Expiring Soon</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--danger-color)">${expired}</div>
        <div class="stat-label">Expired</div>
      </div>
    `;
  }

  #renderItems(items) {
    if (!this.#itemsGridEl) return;

    this.#itemsGridEl.innerHTML = '';

    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

    items.forEach(item => {
      const timeLeft = item.expiresAt - now;
      let status = 'fresh';
      let statusText = 'Fresh';
      
      if (timeLeft <= 0) {
        status = 'expired';
        statusText = 'Expired';
      } else if (timeLeft <= SEVEN_DAYS) {
        status = 'expiring';
        statusText = 'Expiring Soon';
      }

      const daysLeft = Math.ceil(timeLeft / (24 * 60 * 60 * 1000));
      const expirationText = timeLeft <= 0 
        ? 'Expired' 
        : daysLeft === 1 
          ? '1 day left' 
          : `${daysLeft} days left`;

      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <span class="status-badge ${status}">${statusText}</span>
        <img src="${item.image || 'https://via.placeholder.com/400x300?text=Product'}" 
             alt="${item.title}" 
             class="item-image"
             onerror="this.src='https://via.placeholder.com/400x300?text=Product'">
        <div class="item-content">
          <h3 class="item-name">${item.title}</h3>
          ${item.brand ? `<p class="item-brand">${item.brand}</p>` : ''}
          <p class="item-barcode">${item.barcode}</p>
          <div class="item-expiration ${status}">${expirationText}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('show-product-details', {
          bubbles: true,
          composed: true,
          detail: item
        }));
      });

      this.#itemsGridEl.appendChild(card);
    });
  }

  #showEmptyState() {
    this.#itemsGridEl.innerHTML = '';
    this.#emptyStateEl?.removeAttribute('hidden');
  }

  static defineCustomElement(elementName = 'bs-items') {
    if (typeof window !== 'undefined' && !window.customElements.get(elementName)) {
      window.customElements.define(elementName, BSItems);
    }
  }
}

BSItems.defineCustomElement();

export { BSItems };

