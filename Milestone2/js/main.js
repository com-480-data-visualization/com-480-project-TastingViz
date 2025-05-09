//active navbar
let nav = document.querySelector(".navigation-wrap");
window.onscroll  = function ()
{
    if (document.documentElement.scrollTop > 20)
    {
        nav.classList.add("scroll-on");
    }
    else{
        nav.classList.remove("scroll-on");
    }
}

// making sure we arrive slightly higher so title is visible 
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                const offset = 100;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});


// counter design

document.addEventListener("DOMContentLoaded",() =>{
    function counter (id, start, end, duration)
    {
        let obj = document.getElementById(id),
        current = start,
        range = end - start,
        increment = end > start ? 1 : -1,
        step = Math.abs(Math.floor(duration / range)),
        timer = setInterval(() => {
            current += increment;
            obj.textContent = current;
            if(current == end)
            {
                clearInterval(timer);
            }
        }, step);
    }
    counter("count1", 43500, 45000, 10);
    counter("count2", 0, 900, 3000);
    counter("count3", 0, 100, 3000);
    counter("count4", 0, 1000, 3000);

})

// landing page search bar and display 

document.addEventListener("DOMContentLoaded", () => {
  let recipeData = [];
  let matchingRecipes = [];
  const UNSPLASH_ACCESS_KEY = "QM98dc35NF_HlSDWwbsbqsT_fTf61ejygYIxANfdHVY";

  // Load the JSON file
  fetch('Milestone2/js/recipes_with_ingredients.json')
    .then(res => res.json())
    .then(data => {
      recipeData = data;
      console.log("Recipes loaded:", recipeData);
    });

  function getRandomThree(recipes) {
    const shuffled = [...recipes].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }

  

  function fetchUnsplashImage(query, callback) {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=1`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const imageUrl = data.results.length ? data.results[0].urls.small : "fallback.jpg";
        callback(imageUrl);
      })
      .catch(() => callback("fallback.jpg"));
  }

  function renderRecipes(recipes) {
    const container = document.getElementById("recipe-list");
    container.innerHTML = '';

    getRandomThree(recipes).forEach(recipe => {

      const titleWords = recipe.Title.trim().split(" ");
      const query = titleWords.length > 2 ? titleWords.slice(1).join(" ") : recipe.Title;
      fetchUnsplashImage(recipe.Title, (imgUrl) => {
        const card = document.createElement('div');
        card.className = "col-lg-4 col-md-6 mb-lg-0 mb-5";
        card.innerHTML = `
          <div class="card">
              <img src="${imgUrl}" alt="${recipe.Title}" class="img-fluid">
              <div class="pt-3">
                  <h4>${recipe.Title}</h4>
                  <p>Cuisine: ${recipe.Cuisine}</p>
                  <p><strong>Ingredients:</strong> ${recipe["Aliased Ingredients"].join(", ")}</p>
              </div>
          </div>
        `;
        container.appendChild(card);
      });
    });
  }

  const form = document.getElementById('ingredientForm');
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const input = form.ingredient.value;
    const searchIngredients = input
      .split(',')
      .map(ing => ing.trim().toLowerCase())
      .filter(ing => ing !== '');

    if (recipeData.length === 0) {
      console.log("No recipes loaded yet.");
      return;
    }

    matchingRecipes = recipeData.filter(recipe =>
      searchIngredients.every(ing =>
        (Array.isArray(recipe["Aliased Ingredients"]) ? recipe["Aliased Ingredients"] : [])
          .map(i => i.toLowerCase())
          .includes(ing)
      )
    );

    console.log("Matching Recipes:", matchingRecipes.map(r => ({ id: r["Recipe ID"], title: r["Title"] })));

    if (matchingRecipes.length === 0) {
      document.getElementById("recipe-list").innerHTML = `<p class="text-center">No matching recipes found.</p>`;
    } else {
      renderRecipes(matchingRecipes);
    }
  });

  document.getElementById("regenerate-recipes").addEventListener("click", () => {
    if (matchingRecipes.length > 0) {
      renderRecipes(matchingRecipes);
    }
  });
});
