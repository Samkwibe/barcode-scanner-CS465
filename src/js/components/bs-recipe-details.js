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

  .recipe-details-container {
    padding: 1.5rem;
    max-width: 800px;
    margin: 0 auto;
    color: var(--text-main);
  }

  .recipe-header {
    margin-bottom: 2rem;
  }

  .recipe-image-large {
    width: 100%;
    max-width: 600px;
    height: 300px;
    object-fit: cover;
    border-radius: 12px;
    margin: 0 auto 1.5rem;
    display: block;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .recipe-title {
    font-size: 2rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: var(--text-main);
  }

  .recipe-meta {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
  }

  .recipe-badge {
    padding: 0.5rem 1rem;
    background: var(--accent);
    color: white;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .recipe-section {
    margin-bottom: 2rem;
  }

  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
    color: var(--text-main);
    border-bottom: 2px solid var(--accent);
    padding-bottom: 0.5rem;
  }

  .ingredients-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .ingredient-item {
    padding: 0.75rem;
    background: var(--background-alt);
    border-radius: 8px;
    border-left: 3px solid var(--accent);
  }

  .ingredient-name {
    font-weight: 500;
    color: var(--text-main);
  }

  .ingredient-measure {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
  }

  .instructions {
    line-height: 1.8;
    color: var(--text-main);
    white-space: pre-line;
  }

  .instructions ol {
    padding-left: 1.5rem;
  }

  .instructions li {
    margin-bottom: 0.75rem;
  }

  .recipe-video {
    margin-top: 1rem;
  }

  .video-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--danger-color);
    color: white;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    transition: opacity 0.2s ease;
  }

  .video-link:hover {
    opacity: 0.9;
  }

  .close-button {
    width: 100%;
    padding: 0.75rem;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    margin-top: 2rem;
  }

  .close-button:hover {
    opacity: 0.9;
  }
`;

const template = document.createElement('template');

template.innerHTML = /* html */ `
  <style>${styles}</style>
  <div class="recipe-details-container">
    <div class="recipe-header">
      <img id="recipeImage" class="recipe-image-large" alt="Recipe" />
      <h2 class="recipe-title" id="recipeTitle">Recipe Name</h2>
      <div class="recipe-meta" id="recipeMeta"></div>
    </div>

    <div class="recipe-section">
      <h3 class="section-title">Ingredients</h3>
      <div class="ingredients-list" id="ingredientsList"></div>
    </div>

    <div class="recipe-section">
      <h3 class="section-title">Instructions</h3>
      <div class="instructions" id="instructions"></div>
    </div>

    <div class="recipe-video" id="videoSection" hidden>
      <a id="videoLink" class="video-link" target="_blank" rel="noopener">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="M6.271 5.055a.5.5 0 0 1 .79-.407l5.5 4a.5.5 0 0 1 0 .816l-5.5 4a.5.5 0 0 1-.79-.407V5.055z"/>
        </svg>
        Watch Video Tutorial
      </a>
    </div>

    <button class="close-button" id="closeBtn">Close</button>
  </div>
`;

class BSRecipeDetails extends HTMLElement {
  #recipeImageEl = null;
  #recipeTitleEl = null;
  #recipeMetaEl = null;
  #ingredientsListEl = null;
  #instructionsEl = null;
  #videoSectionEl = null;
  #videoLinkEl = null;
  #closeBtn = null;

  constructor() {
    super();

    if (!this.shadowRoot) {
      const shadowRoot = this.attachShadow({ mode: 'open' });
      shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }

  connectedCallback() {
    this.#recipeImageEl = this.shadowRoot.getElementById('recipeImage');
    this.#recipeTitleEl = this.shadowRoot.getElementById('recipeTitle');
    this.#recipeMetaEl = this.shadowRoot.getElementById('recipeMeta');
    this.#ingredientsListEl = this.shadowRoot.getElementById('ingredientsList');
    this.#instructionsEl = this.shadowRoot.getElementById('instructions');
    this.#videoSectionEl = this.shadowRoot.getElementById('videoSection');
    this.#videoLinkEl = this.shadowRoot.getElementById('videoLink');
    this.#closeBtn = this.shadowRoot.getElementById('closeBtn');

    this.#closeBtn?.addEventListener('click', () => this.#handleClose());
  }

  show(recipe) {
    if (!recipe) return;

    // Set image
    if (this.#recipeImageEl) {
      this.#recipeImageEl.src = recipe.strMealThumb || 'https://via.placeholder.com/600x300?text=Recipe';
      this.#recipeImageEl.alt = recipe.strMeal || 'Recipe';
    }

    // Set title
    if (this.#recipeTitleEl) {
      this.#recipeTitleEl.textContent = recipe.strMeal || 'Recipe';
    }

    // Set meta badges
    if (this.#recipeMetaEl) {
      this.#recipeMetaEl.innerHTML = '';
      if (recipe.strCategory) {
        const category = document.createElement('span');
        category.className = 'recipe-badge';
        category.textContent = recipe.strCategory;
        this.#recipeMetaEl.appendChild(category);
      }
      if (recipe.strArea) {
        const area = document.createElement('span');
        area.className = 'recipe-badge';
        area.style.background = 'var(--background-alt)';
        area.style.color = 'var(--text-main)';
        area.textContent = recipe.strArea;
        this.#recipeMetaEl.appendChild(area);
      }
    }

    // Set ingredients
    if (this.#ingredientsListEl) {
      this.#ingredientsListEl.innerHTML = '';
      for (let i = 1; i <= 20; i++) {
        const ingredient = recipe[`strIngredient${i}`];
        const measure = recipe[`strMeasure${i}`];
        if (ingredient && ingredient.trim()) {
          const item = document.createElement('div');
          item.className = 'ingredient-item';
          item.innerHTML = `
            <div class="ingredient-name">${ingredient.trim()}</div>
            ${measure ? `<div class="ingredient-measure">${measure.trim()}</div>` : ''}
          `;
          this.#ingredientsListEl.appendChild(item);
        }
      }
    }

    // Set instructions
    if (this.#instructionsEl && recipe.strInstructions) {
      // Format instructions (number them if needed)
      let instructions = recipe.strInstructions.trim();
      // Split by numbers or periods if it's a paragraph
      if (!instructions.match(/^\d+\./)) {
        // Add numbering
        const sentences = instructions.split(/\.(?=\s[A-Z])/);
        instructions = sentences.map((s, i) => `${i + 1}. ${s.trim()}`).join('.\n\n');
      }
      this.#instructionsEl.textContent = instructions;
    }

    // Set video link
    if (recipe.strYoutube) {
      this.#videoSectionEl?.removeAttribute('hidden');
      if (this.#videoLinkEl) {
        this.#videoLinkEl.href = recipe.strYoutube;
      }
    } else {
      this.#videoSectionEl?.setAttribute('hidden', '');
    }
  }

  #handleClose() {
    this.dispatchEvent(new CustomEvent('recipe-details-close', {
      bubbles: true,
      composed: true
    }));
  }

  static defineCustomElement(elementName = 'bs-recipe-details') {
    if (typeof window !== 'undefined' && !window.customElements.get(elementName)) {
      window.customElements.define(elementName, BSRecipeDetails);
    }
  }
}

BSRecipeDetails.defineCustomElement();

export { BSRecipeDetails };

