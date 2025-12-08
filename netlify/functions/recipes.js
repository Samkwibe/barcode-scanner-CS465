// Netlify Function to get recipes from TheMealDB API
// Endpoint: /.netlify/functions/recipes

exports.handler = async function(event) {
  const THEMEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  try {
    const { ingredients, expiringIngredients } = event.queryStringParameters || {};
    
    // If ingredients provided, search by ingredients
    if (ingredients) {
      const ingredientsList = ingredients.split(',').map(i => i.trim()).filter(Boolean);
      
      // Search for recipes by ingredient
      const recipes = [];
      
      // TheMealDB doesn't have a direct "search by ingredients" endpoint
      // So we'll use filter by main ingredient
      for (const ingredient of ingredientsList.slice(0, 3)) { // Limit to 3 ingredients
        try {
          const url = `${THEMEALDB_BASE}/filter.php?i=${encodeURIComponent(ingredient)}`;
          const res = await fetch(url);
          const data = await res.json();
          
          if (data.meals) {
            // Get full details for each recipe
            for (const meal of data.meals.slice(0, 5)) { // Limit to 5 per ingredient
              try {
                const detailUrl = `${THEMEALDB_BASE}/lookup.php?i=${meal.idMeal}`;
                const detailRes = await fetch(detailUrl);
                const detailData = await detailRes.json();
                
                if (detailData.meals && detailData.meals[0]) {
                  recipes.push(detailData.meals[0]);
                }
              } catch (e) {
                // Skip if detail fetch fails
              }
            }
          }
        } catch (e) {
          // Skip if ingredient search fails
        }
      }
      
      // Remove duplicates
      const uniqueRecipes = recipes.filter((recipe, index, self) =>
        index === self.findIndex(r => r.idMeal === recipe.idMeal)
      );
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          recipes: uniqueRecipes.slice(0, 10), // Return top 10
          ingredients: ingredientsList,
          expiringIngredients: expiringIngredients ? expiringIngredients.split(',') : []
        })
      };
    }
    
    // If no ingredients, return random recipes
    const url = `${THEMEALDB_BASE}/random.php`;
    const res = await fetch(url);
    const data = await res.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        recipes: data.meals ? data.meals : [],
        message: 'No ingredients provided, returning random recipe'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch recipes',
        details: String(error)
      })
    };
  }
};

