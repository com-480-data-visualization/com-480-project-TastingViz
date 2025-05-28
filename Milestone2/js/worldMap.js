const width = 1250;
const height = 600;
const path = d3.geoPath().projection(d3.geoNaturalEarth1().scale(220).translate([width / 2, height / 2]));
const svg = d3.select("#world_map").append("svg").attr("width", width).attr("height", height);

let worldData, foodData;

// Load data
Promise.all([
  d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
  d3.csv("CulinaryDB/data_world_map.csv")])
  .then(([geo, csv]) => {
  worldData = geo;
  foodData = csv;

  drawMap("vegetable");
});

// Tab interactivity
const foodTabs = document.querySelectorAll("#foodTabs .nav-link");

foodTabs.forEach(tab => {
  tab.addEventListener("click", (e) => {
    e.preventDefault();

    foodTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    drawMap(tab.getAttribute("data-category")); // Redraw map when changing tab
  });
});

function drawMap(foodType) {
  const foodMap = new Map();

  foodData.forEach(d => foodMap.set(d.country, d[foodType]));

  // Delete previous map
  svg.selectAll("*").remove();

  // Create color per ingredients
  const ingredients = Array.from(new Set(foodData.map(d => d[foodType])));
  
  // Shuffle ingredients array to randomize color assignment so blue is not always for biggest category
  for (let i = ingredients.length - 1; i > 0; i--) 
    {
      const j = Math.floor(Math.random() * (i + 1));
      [ingredients[i], ingredients[j]] = [ingredients[j], ingredients[i]];
    }

  const colorScale = d3.scaleOrdinal().domain(ingredients).range(d3.schemeTableau10);

  // Draw each country
  svg.append("g").selectAll("path").data(worldData.features).join("path").attr("d", path)
  .attr("fill", d => {
    const countryName = d.properties.name;
    return foodMap.has(countryName) ? colorScale(foodMap.get(countryName)) : "#ccc"; // #ccc = gray for missing data
  })
  .attr("stroke", "#333") // Add country border in dark gray (#333)
  .on("mouseover", function (_event, d) {
    const topFood = foodMap.get(d.properties.name) || "Unknown";
    d3.select("#map_legend").html(`${d.properties.name} : ${topFood}`); // Show top food element of the country hovered

    // Highlight the country hovered by the mouse
    d3.select(this).attr("stroke", "black").attr("stroke-width", 1.8).raise();
  }).on("mouseout", function () {
    d3.select(this).attr("stroke", "#333").attr("stroke-width", 1);
  });

  // Show which tab is selected
  d3.select("#map_legend_fix").html(`<em>Showing most common ${foodType} per country</em>`);
}