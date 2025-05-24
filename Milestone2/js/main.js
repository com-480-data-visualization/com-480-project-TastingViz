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

// Search + knn 

document.addEventListener("DOMContentLoaded", () => {
  let recipeData = [];
  let matchingRecipes = [];
  const UNSPLASH_ACCESS_KEY = "QM98dc35NF_HlSDWwbsbqsT_fTf61ejygYIxANfdHVY";

  // loading recipes
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
      const doc = nlp(recipe.Title);
      const nouns = doc.nouns().out('array');
      // const verbs = doc.verbs().out('array');
      const queryWords = [...nouns]; // just keep nouns to avoid non food pics as much as possible
      const query = queryWords.length > 0 ? queryWords.join(" ") : recipe.Title;

      fetchUnsplashImage(query, (imgUrl) => {
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

    const recipeList = document.getElementById("recipe-list");
    const graphContainer = document.getElementById("knn-graph");
    const nodeInfo = document.getElementById("node-info"); 
    if (nodeInfo) {
      nodeInfo.innerHTML = `<p>Select a recipe to see its details.</p>`; // clearing sidebar with new ing search
    }

    if (matchingRecipes.length === 0) {
      recipeList.innerHTML = `<p class="text-center">No matching recipes found.</p>`;
      graphContainer.innerHTML = '';
    } else {
      renderRecipes(matchingRecipes);
      renderKNNGraph(matchingRecipes); 
    }
  });

  document.getElementById("regenerate-recipes").addEventListener("click", () => {
    if (matchingRecipes.length > 0) {
      renderRecipes(matchingRecipes);
      // renderKNNGraph(matchingRecipes);
    }
  });

  // similarity functions
  function jaccardSimilarity(setA, setB) {
    const intersection = setA.filter(i => setB.includes(i));
    const union = Array.from(new Set([...setA, ...setB]));
    return intersection.length / union.length;
  }

  function buildRecipeGraphData(recipes, threshold = 0.3) {
    const nodes = recipes.map((r, i) => ({
      id: i,
      label: r.Title,
      title: `${r.Title}`,
    }));
    // node hover is title 

    const edges = [];

    for (let i = 0; i < recipes.length; i++) {
      for (let j = i + 1; j < recipes.length; j++) {
        const sim = jaccardSimilarity(
          recipes[i]["Aliased Ingredients"].map(i => i.toLowerCase()),
          recipes[j]["Aliased Ingredients"].map(i => i.toLowerCase())
        );

        if (sim > threshold) {
          edges.push({
            from: i,
            to: j,
            value: sim,
            title: `Similarity: ${(sim * 100).toFixed(1)}%`,
          });
        }
      }
    }

    return { nodes, edges };
  }


  function renderKNNGraph(recipes) {
    const { nodes, edges } = buildRecipeGraphData(recipes);
  
    const container = document.getElementById("knn-graph");
    container.innerHTML = ''; // clearing old graph
  
    const nodeDataSet = new vis.DataSet(nodes);
  
    const originalEdges = edges.map(e => ({ ...e }));
  
    const edgeDataSet = new vis.DataSet([]); // no visible edges when first loaded
  
    const data = {
      nodes: nodeDataSet,
      edges: edgeDataSet
    };
  
    const options = {
      edges: {
        smooth: true,
        color: "#aaa",
        arrows: { to: { enabled: false } }, 
      },
      nodes: {
        shape: "dot",
        size: 15,
        font: {
          size: 14,
          color: "#333"
        }
      },
      physics: {
        solver: "repulsion",
        repulsion: {
          nodeDistance: 200,
          springLength: 200,
          springConstant: 0.01,
          damping: 0.09
        },
        stabilization: false
      },
      interaction: {
        hover: true
      }
    };
  
    const network = new vis.Network(container, data, options);
  
    // When a node is selected
    network.on("selectNode", function (params) {
      const selectedNodeId = params.nodes[0];
      const selectedRecipe = recipes[selectedNodeId];
  
      const capitalizedTitle = selectedRecipe.Title.charAt(0).match(/[a-zA-Z]/)
        ? selectedRecipe.Title.charAt(0).toUpperCase() + selectedRecipe.Title.slice(1)
        : selectedRecipe.Title;
    
      // recipe details
      const nodeInfo = document.getElementById("node-info");
      if (nodeInfo) {
        nodeInfo.innerHTML = `
          <div class="recipe-details">
            <h3>${capitalizedTitle}</h3>
            <p><strong>Cuisine:</strong> ${selectedRecipe.Cuisine}</p>
            <p><strong>Ingredients:</strong> ${selectedRecipe["Aliased Ingredients"].join(', ')}</p>
          </div>
        `;
      } else {
        console.error("Node-info element not found.");
      }
    
      // edges connected to this node with similarity percentages
      const connectedEdges = originalEdges.filter(edge =>
        edge.from === selectedNodeId || edge.to === selectedNodeId
      );
    
      const formattedEdges = connectedEdges.map(edge => {
        edge.title = `Similarity: ${(edge.value * 100).toFixed(1)}%`;
        return edge;
      });
    
      edgeDataSet.clear();
      edgeDataSet.add(formattedEdges);
    });
    
    
    
  
    network.on("deselectNode", function () {
      edgeDataSet.clear();
  
      // resetting the node-info section on deselect
      const nodeInfo = document.getElementById("node-info");
      if (nodeInfo) {
        nodeInfo.innerHTML = `<p>Select a recipe to see its details.</p>`;
      }
    });
  }
  
  
  
  
}
);
