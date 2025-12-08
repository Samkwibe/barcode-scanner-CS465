import { getUserScans } from '../services/firebase-scans.js';
import { getHistory } from '../services/storage.js';
import { isFirebaseConfigured } from '../services/firebase-config.js';
import { isAuthenticated } from '../services/firebase-auth.js';
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

  .recipes-container {
    padding: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .recipes-header {
    margin-bottom: 2rem;
    text-align: center;
  }

  .recipes-title {
    font-size: 2rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: var(--text-main);
  }

  .recipes-subtitle {
    font-size: 1rem;
    color: var(--text-muted);
    margin: 0;
  }

  .recipes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
  }

  .recipe-card {
    background: var(--background-alt);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    cursor: pointer;
    border: 1px solid var(--border);
  }

  .recipe-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  .recipe-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .recipe-content {
    padding: 1.25rem;
  }

  .recipe-name {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 0.75rem 0;
    color: var(--text-main);
    line-height: 1.3;
  }

  .recipe-category {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: var(--accent);
    color: white;
    border-radius: 16px;
    font-size: 0.85rem;
    font-weight: 500;
    margin-bottom: 0.75rem;
  }

  .recipe-area {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background: var(--background);
    color: var(--text-main);
    border-radius: 16px;
    font-size: 0.85rem;
    margin-left: 0.5rem;
  }

  .recipe-ingredients {
    margin-top: 0.75rem;
    font-size: 0.9rem;
    color: var(--text-muted);
  }

  .recipe-ingredients-title {
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-main);
  }

  .recipe-ingredients-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .ingredient-tag {
    padding: 0.25rem 0.5rem;
    background: rgba(var(--accent-h), var(--accent-s), var(--accent-l), 0.1);
    border-radius: 8px;
    font-size: 0.8rem;
    color: var(--accent);
  }

  .ingredient-tag.expiring {
    background: rgba(217, 119, 6, 0.15);
    color: var(--warning-color);
    font-weight: 500;
  }

  .loading-state {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--text-muted);
  }

  .loading-spinner {
    display: inline-block;
    width: 40px;
    height: 40px;
    border: 4px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
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

  .refresh-button {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s ease;
  }

  .refresh-button:hover {
    opacity: 0.9;
  }

  .expiring-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: var(--warning-color);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    z-index: 10;
  }

  .recipe-card {
    position: relative;
  }

  @media (max-width: 768px) {
    .recipes-grid {
      grid-template-columns: 1fr;
    }
  }
`;

const template = document.createElement('template');

template.innerHTML = /* html */ `
  <style>${styles}</style>
  <div class="recipes-container">
    <div class="recipes-header">
      <h2 class="recipes-title">Recipe Suggestions</h2>
      <p class="recipes-subtitle">Discover delicious recipes using your scanned ingredients</p>
    </div>

    <div id="loadingState" class="loading-state" hidden>
      <div class="loading-spinner"></div>
      <p>Finding recipes based on your ingredients...</p>
    </div>

    <div id="emptyState" class="empty-state" hidden>
      <div class="empty-state-icon">🍳</div>
      <h3>No recipes found</h3>
      <p>Scan some items first to get recipe suggestions!</p>
      <button class="refresh-button" id="refreshBtn">Refresh Recipes</button>
    </div>

    <div id="recipesGrid" class="recipes-grid"></div>
  </div>
`;

class BSRecipes extends HTMLElement {
  #loadingStateEl = null;
  #emptyStateEl = null;
  #recipesGridEl = null;
  #refreshBtn = null;

  constructor() {
    super();

    if (!this.shadowRoot) {
      const shadowRoot = this.attachShadow({ mode: 'open' });
      shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }

  connectedCallback() {
    this.#loadingStateEl = this.shadowRoot.getElementById('loadingState');
    this.#emptyStateEl = this.shadowRoot.getElementById('emptyState');
    this.#recipesGridEl = this.shadowRoot.getElementById('recipesGrid');
    this.#refreshBtn = this.shadowRoot.getElementById('refreshBtn');

    this.#refreshBtn?.addEventListener('click', () => this.loadRecipes());
    
    // Load recipes when component is shown
    this.loadRecipes();
  }

  async loadRecipes() {
    this.#loadingStateEl?.removeAttribute('hidden');
    this.#emptyStateEl?.setAttribute('hidden', '');
    this.#recipesGridEl.innerHTML = '';

    try {
      // Get user's scanned items
      const ingredients = await this.#getUserIngredients();
      
      if (ingredients.length === 0) {
        this.#showEmptyState();
        return;
      }

      // Get recipes from API
      const recipes = await this.#fetchRecipes(ingredients);
      
      if (!recipes || recipes.length === 0) {
        this.#showEmptyState();
        return;
      }

      this.#renderRecipes(recipes, ingredients);
    } catch (error) {
      log.error('Error loading recipes:', error);
      toastify('Failed to load recipes. Please try again.', { variant: 'danger' });
      this.#showEmptyState();
    } finally {
      this.#loadingStateEl?.setAttribute('hidden', '');
    }
  }

  async #getUserIngredients() {
    const ingredients = [];
    
    try {
      // Try to get from Firestore first
      if (isFirebaseConfigured() && isAuthenticated()) {
        const { error, scans } = await getUserScans(100);
        if (!error && scans) {
          scans.forEach(scan => {
            if (scan.title) {
              ingredients.push(scan.title);
            }
          });
        }
      }
      
      // Also check local storage
      const [, history = []] = await getHistory();
      history.forEach(item => {
        const title = typeof item === 'string' ? null : item.title;
        if (title && !ingredients.includes(title)) {
          ingredients.push(title);
        }
      });
    } catch (error) {
      log.error('Error getting ingredients:', error);
    }
    
    return ingredients;
  }

  async #fetchRecipes(ingredients) {
    try {
      const ingredientsParam = ingredients.join(',');
      const url = `/.netlify/functions/recipes?ingredients=${encodeURIComponent(ingredientsParam)}`;
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();
      return data.recipes || [];
    } catch (error) {
      log.error('Error fetching recipes:', error);
      // Fallback: return empty array
      return [];
    }
  }

  #renderRecipes(recipes, userIngredients) {
    if (!this.#recipesGridEl) return;

    this.#recipesGridEl.innerHTML = '';

    recipes.forEach(recipe => {
      const card = this.#createRecipeCard(recipe, userIngredients);
      this.#recipesGridEl.appendChild(card);
    });
  }

  #createRecipeCard(recipe, userIngredients) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    
    // Extract ingredients from recipe
    const recipeIngredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = recipe[`strIngredient${i}`];
      const measure = recipe[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        recipeIngredients.push({
          name: ingredient.trim(),
          measure: measure ? measure.trim() : ''
        });
      }
    }

    // Check which ingredients user has
    const userHasIngredients = recipeIngredients
      .map(ing => ing.name.toLowerCase())
      .filter(name => userIngredients.some(ui => ui.toLowerCase().includes(name) || name.includes(ui.toLowerCase())));

    const hasExpiring = userHasIngredients.length > 0;

    card.innerHTML = /* html */ `
      ${hasExpiring ? '<span class="expiring-badge">Uses Your Items</span>' : ''}
      <img src="${recipe.strMealThumb || 'https://via.placeholder.com/400x300?text=Recipe'}" 
           alt="${recipe.strMeal}" 
           class="recipe-image"
           onerror="this.src='https://via.placeholder.com/400x300?text=Recipe'">
      <div class="recipe-content">
        <h3 class="recipe-name">${recipe.strMeal}</h3>
        <div>
          <span class="recipe-category">${recipe.strCategory || 'Recipe'}</span>
          ${recipe.strArea ? `<span class="recipe-area">${recipe.strArea}</span>` : ''}
        </div>
        ${recipeIngredients.length > 0 ? `
          <div class="recipe-ingredients">
            <div class="recipe-ingredients-title">Key Ingredients:</div>
            <div class="recipe-ingredients-list">
              ${recipeIngredients.slice(0, 5).map(ing => {
                const hasIt = userIngredients.some(ui => 
                  ui.toLowerCase().includes(ing.name.toLowerCase()) || 
                  ing.name.toLowerCase().includes(ui.toLowerCase())
                );
                return `<span class="ingredient-tag ${hasIt ? 'expiring' : ''}">${ing.name}</span>`;
              }).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Add click handler to show recipe details
    card.addEventListener('click', () => {
      this.#showRecipeDetails(recipe);
    });

    return card;
  }

  #showRecipeDetails(recipe) {
    // Emit event to show recipe details modal
    this.dispatchEvent(new CustomEvent('show-recipe-details', {
      bubbles: true,
      composed: true,
      detail: { recipe }
    }));
  }

  #showEmptyState() {
    this.#loadingStateEl?.setAttribute('hidden', '');
    this.#emptyStateEl?.removeAttribute('hidden');
    this.#recipesGridEl.innerHTML = '';
  }

  static defineCustomElement(elementName = 'bs-recipes') {
    if (typeof window !== 'undefined' && !window.customElements.get(elementName)) {
      window.customElements.define(elementName, BSRecipes);
    }
  }
}

BSRecipes.defineCustomElement();

export { BSRecipes };

