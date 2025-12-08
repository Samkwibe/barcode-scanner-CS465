/**
 * Dashboard component showing user statistics and quick insights
 */
import { getHistory } from '../services/storage.js';
import { getUserScans } from '../services/firebase-scans.js';
import { isFirebaseConfigured } from '../services/firebase-config.js';
import { isAuthenticated } from '../services/firebase-auth.js';
import { log } from '../utils/log.js';

const styles = /* css */ `
  :host {
    display: block;
    padding: 1.5rem;
    background: var(--background-alt);
    border-radius: var(--border-radius);
    margin-bottom: 1.5rem;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: var(--background-body);
    padding: 1.5rem;
    border-radius: var(--border-radius);
    border: 1px solid var(--border);
    text-align: center;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .stat-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--accent);
    margin-bottom: 0.5rem;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.9rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stat-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .insights {
    background: var(--background-body);
    padding: 1.5rem;
    border-radius: var(--border-radius);
    border: 1px solid var(--border);
  }

  .insights h3 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    color: var(--text-main);
  }

  .insight-item {
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background: var(--background-alt);
    border-radius: calc(var(--border-radius) / 2);
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .insight-item:last-child {
    margin-bottom: 0;
  }

  .insight-icon {
    font-size: 1.5rem;
  }

  .insight-text {
    flex: 1;
    color: var(--text-main);
    font-size: 0.95rem;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: var(--text-muted);
  }

  @media (max-width: 768px) {
    .dashboard-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .stat-value {
      font-size: 2rem;
    }
  }
`;

const template = document.createElement('template');
template.innerHTML = /* html */ `
  <style>${styles}</style>
  <div class="dashboard-container">
    <div class="dashboard-grid" id="statsGrid">
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-value" id="totalScans">0</div>
        <div class="stat-label">Total Scans</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⏰</div>
        <div class="stat-value" id="expiringSoon">0</div>
        <div class="stat-label">Expiring Soon</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-value" id="activeItems">0</div>
        <div class="stat-label">Active Items</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔴</div>
        <div class="stat-value" id="expiredItems">0</div>
        <div class="stat-label">Expired</div>
      </div>
    </div>
    <div class="insights" id="insightsContainer">
      <h3>💡 Quick Insights</h3>
      <div id="insightsList">
        <div class="loading">Loading insights...</div>
      </div>
    </div>
  </div>
`;

class BSDashboard extends HTMLElement {
  #stats = {
    totalScans: 0,
    expiringSoon: 0,
    activeItems: 0,
    expiredItems: 0
  };

  constructor() {
    super();
    if (!this.shadowRoot) {
      const shadowRoot = this.attachShadow({ mode: 'open' });
      shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }

  connectedCallback() {
    this.loadStats();
    // Refresh stats every 30 seconds
    this.#refreshInterval = setInterval(() => this.loadStats(), 30000);
  }

  disconnectedCallback() {
    if (this.#refreshInterval) {
      clearInterval(this.#refreshInterval);
    }
  }

  async loadStats() {
    try {
      let history = [];
      
      // Try to get from Firestore if authenticated
      if (isFirebaseConfigured() && isAuthenticated()) {
        try {
          const { error, scans } = await getUserScans(1000);
          if (!error && scans) {
            history = scans.map(scan => ({
              value: scan.value || '',
              addedAt: scan.scannedAt ? scan.scannedAt.getTime() : Date.now(),
              expiresAt: scan.expiresAt ? scan.expiresAt.getTime() : null,
              title: scan.title || '',
              brand: scan.brand || '',
              description: scan.description || ''
            }));
          }
        } catch (e) {
          log.warn('Error loading from Firestore, falling back to local:', e);
        }
      }

      // Fallback to local storage
      if (history.length === 0) {
        const [, localHistory = []] = await getHistory();
        history = localHistory || [];
      }

      this.#calculateStats(history);
      this.#updateUI();
      this.#generateInsights(history);
    } catch (error) {
      log.error('Error loading dashboard stats:', error);
    }
  }

  #calculateStats(history) {
    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    
    this.#stats = {
      totalScans: history.length,
      expiringSoon: 0,
      activeItems: 0,
      expiredItems: 0
    };

    history.forEach(item => {
      if (!item.expiresAt) {
        this.#stats.activeItems++;
        return;
      }

      const timeLeft = item.expiresAt - now;
      
      if (timeLeft <= 0) {
        this.#stats.expiredItems++;
      } else {
        this.#stats.activeItems++;
        if (timeLeft <= SEVEN_DAYS) {
          this.#stats.expiringSoon++;
        }
      }
    });
  }

  #updateUI() {
    const shadowRoot = this.shadowRoot;
    if (!shadowRoot) return;

    shadowRoot.getElementById('totalScans').textContent = this.#stats.totalScans;
    shadowRoot.getElementById('expiringSoon').textContent = this.#stats.expiringSoon;
    shadowRoot.getElementById('activeItems').textContent = this.#stats.activeItems;
    shadowRoot.getElementById('expiredItems').textContent = this.#stats.expiredItems;
  }

  #generateInsights(history) {
    const shadowRoot = this.shadowRoot;
    if (!shadowRoot) return;

    const insightsList = shadowRoot.getElementById('insightsList');
    if (!insightsList) return;

    const insights = [];
    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

    // Check for expiring items
    const expiringCount = history.filter(item => {
      if (!item.expiresAt) return false;
      const timeLeft = item.expiresAt - now;
      return timeLeft > 0 && timeLeft <= SEVEN_DAYS;
    }).length;

    if (expiringCount > 0) {
      insights.push({
        icon: '⚠️',
        text: `You have ${expiringCount} item${expiringCount === 1 ? '' : 's'} expiring within 7 days. Check your history!`
      });
    }

    // Check for expired items
    const expiredCount = history.filter(item => {
      if (!item.expiresAt) return false;
      return item.expiresAt - now <= 0;
    }).length;

    if (expiredCount > 0) {
      insights.push({
        icon: '🔴',
        text: `${expiredCount} item${expiredCount === 1 ? ' has' : 's have'} expired. Consider removing them from your list.`
      });
    }

    // Check total scans
    if (history.length === 0) {
      insights.push({
        icon: '📷',
        text: 'Start scanning items to track your inventory and reduce food waste!'
      });
    } else if (history.length < 5) {
      insights.push({
        icon: '📦',
        text: `You've scanned ${history.length} item${history.length === 1 ? '' : 's'}. Keep going!`
      });
    } else {
      insights.push({
        icon: '🎉',
        text: `Great job! You're tracking ${history.length} items. Keep managing your inventory!`
      });
    }

    // Check for items without expiration dates
    const noExpiryCount = history.filter(item => !item.expiresAt).length;
    if (noExpiryCount > 0 && history.length > 0) {
      insights.push({
        icon: '💡',
        text: `Tip: Set expiration dates for ${noExpiryCount} item${noExpiryCount === 1 ? '' : 's'} to get better tracking.`
      });
    }

    // Render insights
    if (insights.length === 0) {
      insightsList.innerHTML = '<div class="loading">No insights available</div>';
    } else {
      insightsList.innerHTML = insights.map(insight => `
        <div class="insight-item">
          <span class="insight-icon">${insight.icon}</span>
          <span class="insight-text">${insight.text}</span>
        </div>
      `).join('');
    }
  }

  /**
   * Refresh the dashboard manually
   */
  async refresh() {
    await this.loadStats();
  }
}

BSDashboard.defineCustomElement = function(elementName = 'bs-dashboard') {
  if (typeof window !== 'undefined' && !window.customElements.get(elementName)) {
    window.customElements.define(elementName, BSDashboard);
  }
};

BSDashboard.defineCustomElement();

export { BSDashboard };

