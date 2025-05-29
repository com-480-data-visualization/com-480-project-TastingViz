console.log("test_world_map.js loaded");

const width_viz_map = 960, height_viz_map = 600;
const worldMapSvg = d3.select("#map-svg").append("svg")
    .attr("width", width_viz_map)
    .attr("height", height_viz_map);



function createColorMatrix(ind_target_ingr, frequency_top_ing_per_cuisine, baseColor) {
    // boost saturation of base ingredient color for improved visual contrast
    let targetColor = d3.rgb(...baseColor);
    let colorHSL = d3.hsl(d3.rgb(...baseColor));
    if (isNaN(colorHSL.h)) {
        colorHSL.h = 0;
    }

    colorHSL.s = Math.min(colorHSL.s * 1.5, 1);  // Boost saturation by 50%, clamp at 1
    baseColor = d3.rgb(d3.hsl(colorHSL));

    let values = frequency_top_ing_per_cuisine[ind_target_ingr];
    // Normalize values between 0 and 1
    const maxVal = Math.max(...values);
    values = values.map(v => maxVal === 0 ? 0 : v / maxVal);

    // Create color interpolator between gray and the base color
    const gray = d3.rgb(70, 70, 70);
    const interpolate = d3.interpolateLab(gray, targetColor);

    // Generate color matrix
    let colorMatrix = values.map(v => {
        const color = d3.rgb(interpolate(v));
        return [color.r, color.g, color.b];
    });

    return colorMatrix;
}

function reverseCoordinates(geojson) {
    const coords = geojson.geometry.coordinates;
    function reverseRing(ring) {
        return ring.slice().reverse();
    }
    let newCoords;
    if (geojson.geometry.type === "Polygon") {
        newCoords = coords.map(ring => reverseRing(ring));
    } else if (geojson.geometry.type === "MultiPolygon") {
        newCoords = coords.map(polygon => polygon.map(ring => reverseRing(ring)));
    }
    return {
        ...geojson,
        geometry: {
            ...geojson.geometry,
            coordinates: newCoords
        }
    };
}

function combinePaths(P1, P2) {
    let combined = turf.union(P1, P2);
    combined = reverseCoordinates(combined);
    return combined;
}

function groupCountries(features, names) {
    const targetCountries = features.filter(f => names.includes(f.properties.name));
    let groupedCountries = targetCountries[0];
    for (let i = 1; i < targetCountries.length; i++) {
        groupedCountries = combinePaths(groupedCountries, targetCountries[i]);
    }
    return groupedCountries;
}

function renderMap(colorMatrix, ind_target_ingr, frequency_top_ing_per_cuisine) {

    const originalRegionName = ['Thailand', 'Greece', 'Spain', 'Eastern Europe', 'Misc.: Portugal', 'Korea', 'Africa', 'Indian Subcontinent', 'Middle East', 'Japan', 'Italy', 'USA', 'Canada', 'Caribbean', 'Scandinavia', 'Misc.: Central America', 'China', 'Australia & NZ', 'British Isles', 'Misc.: Dutch', 'DACH Countries', 'South America', 'Mexico', 'South East Asia', 'Misc.: Belgian', 'France'];
    const displayRegionName = ['Thailand', 'Greece', 'Spain', 'Eastern Europe', 'Portugal', 'South Korea', 'Africa', 'India', 'Middle East', 'Japan', 'Italy', 'USA', 'Canada', 'Caribbean', 'Scandinavia', 'Central America', 'China', 'Australia and New Zealand', 'England', 'Netherlands', 'DACH', 'South America', 'Mexico', 'Southeast Asia', 'Belgium', 'France'];
    const sortedIndices = displayRegionName
        .map((name, index) => ({ name, index }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(item => item.index);

    worldMapSvg.selectAll(".group-path").remove();
    const projection = d3.geoNaturalEarth1().scale(170).translate([width_viz_map / 2, height_viz_map / 2]);
    const pathGenerator = d3.geoPath().projection(projection);

    const tooltip = d3.select("#tooltip");


    d3.json("Milestone2/js/continents.geojson").then(continentData => {
        worldMapSvg.selectAll(".continent")
            .data(continentData.features)
            .enter()
            .append("path")
            .attr("class", "continent")
            .attr("d", pathGenerator)
            .attr("fill", "rgb(50, 50, 50)")
            .attr("stroke", "black")
            .attr("stroke-width", 1.);
    });

    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(worldData => {
        const features = worldData.features;
        const countryLabels = features.map(d => d.properties.name);

        const africaCountries = ["Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cabo Verde", "Cameroon", "Central African Republic", "Chad", "Comoros", "Republic of the Congo", "Democratic Republic of the Congo", "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea", "Guinea Bissau", "Ivory Coast", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "Sao Tome and Principe", "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Sudan", "Swaziland", "United Republic of Tanzania", "Togo", "Tunisia", "Uganda", "Western Sahara", "Zambia", "Zimbabwe"];
        const easternEuropeCountries = ["Russia", "Belarus", "Bulgaria", "Czech Republic", "Hungary", "Moldova", "Poland", "Romania", "Slovakia", "Ukraine", "Serbia", "Bosnia and Herzegovina", "North Macedonia", "Albania", "Montenegro", "Croatia", "Slovenia", "Estonia", "Latvia", "Lithuania", "Georgia", "Armenia"];
        const middleEastCountries = ["Turkey", "Cyprus", "Syria", "Lebanon", "Israel", "Palestine", "Jordan", "Iraq", "Iran", "Saudi Arabia", "Kuwait", "Bahrain", "Qatar", "United Arab Emirates", "Oman", "Yemen"];
        const caribbeanCountries = ["Bahamas", "Cuba", "Jamaica", "Haiti", "Dominican Republic", "Puerto Rico", "Trinidad and Tobago", "Barbados", "Saint Lucia", "Saint Vincent and the Grenadines", "Grenada", "Antigua and Barbuda", "Dominica", "Saint Kitts and Nevis"];
        const scandinaviaCountries = ["Norway", "Sweden", "Denmark", "Finland", "Iceland"];
        const centralAmericaCountries = ["Belize", "Guatemala", "Honduras", "El Salvador", "Nicaragua", "Costa Rica", "Panama"];
        const dachCountries = ["Germany", "Austria", "Switzerland"];
        const southAmericaCountries = ["Argentina", "Bolivia", "Brazil", "Chile", "Colombia", "Ecuador", "Guyana", "Paraguay", "Peru", "Suriname", "Uruguay", "Venezuela"];
        const southeastAsiaCountries = ["Brunei", "Cambodia", "Indonesia", "Laos", "Malaysia", "Myanmar", "Philippines", "Singapore", "Timor-Leste", "Vietnam"];
        const oceaniaCountries = ["Australia", "New Zealand"];

        const groups = [
            { name: "Africa", countries: africaCountries, color: "yellow", strokeColor: "black", value: 0.5 },
            { name: "Eastern Europe", countries: easternEuropeCountries, color: "green", strokeColor: "black", value: 0.5 },
            { name: "Middle East", countries: middleEastCountries, color: "magenta", strokeColor: "black", value: 0.5 },
            { name: "Caribbean", countries: caribbeanCountries, color: "orange", strokeColor: "black", value: 0.5 },
            { name: "Scandinavia", countries: scandinaviaCountries, color: "cyan", strokeColor: "black", value: 0.5 },
            { name: "Central America", countries: centralAmericaCountries, color: "purple", strokeColor: "black", value: 0.5 },
            { name: "DACH", countries: dachCountries, color: "brown", strokeColor: "black", value: 0. },
            { name: "South America", countries: southAmericaCountries, color: "lime", strokeColor: "black", value: 0.5 },
            { name: "Southeast Asia", countries: southeastAsiaCountries, color: "gold", strokeColor: "black", value: 0.5 },
            { name: "Australia and New Zealand", countries: oceaniaCountries, color: "red", strokeColor: "black", value: 0.5 },
        ];
        displayRegionName.forEach(region => {
            if (countryLabels.includes(region)) {
                // Avoid adding duplicates from already defined groups
                const alreadyGrouped = groups.some(g => g.name === region);
                if (!alreadyGrouped) {
                    const randomColor = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
                    groups.push({
                        name: region,
                        countries: [region],
                        color: randomColor,
                        value: 0.5
                    });
                }
            }
        });

        //reorder alphabetically by name
        groups.sort((a, b) => a.name.localeCompare(b.name));

        //change the color of each group to the value in colorMatrix
        const rgbArrayToString = ([r, g, b]) => `rgb(${r}, ${g}, ${b})`;

        let values = frequency_top_ing_per_cuisine[ind_target_ingr];
        values = sortedIndices.map(i => values[i]);
        console.log(colorMatrix[0])
        groups.forEach((group, index) => {
            group.color = rgbArrayToString(colorMatrix[sortedIndices[index]]);
            group.value = Math.round(values[index] * 100 * 100) / 100;
        });

        groups.forEach(group => {
            const feature = groupCountries(features, group.countries);

            worldMapSvg.append("path")
                .datum(feature)
                .attr("class", "group-path")
                .attr("d", pathGenerator)
                .attr("fill", group.color)
                .attr("stroke", "black")
                .attr("stroke-width", 1.)
                .attr("data-name", group.name + " " + group.value + " %")

                .on("mouseover", function () {
                    d3.select(this)
                        .raise() // Bring to front
                        .attr("stroke-width", 2); // Thicker outline

                    tooltip
                        .style("opacity", 1)
                        .text(d3.select(this).attr("data-name"));
                })
                .on("mousemove", function (event) {
                    tooltip
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 20) + "px");
                })
                .on("mouseout", function () {
                    d3.select(this)
                        .attr("stroke-width", 1); // Restore original thickness

                    tooltip.style("opacity", 0);
                });
        });


        let indexMax = values.indexOf(Math.max(...values));

        const groupToRedraw = groups[indexMax];

        // Get the feature for this group again
        const featureToRedraw = groupCountries(features, groupToRedraw.countries);

        // Append a new path on top to highlight/redraw
        worldMapSvg.append("path")
            .datum(featureToRedraw)
            .attr("class", "group-path")
            .attr("d", pathGenerator)
            .attr("fill", groupToRedraw.color)
            .attr("stroke", "red") // highlight stroke color
            .attr("stroke-width", 3)
            .attr("data-name", groupToRedraw.name + " " + groupToRedraw.value + " %") // << ADDED LINE
            .on("mouseover", function () {
                tooltip
                    .style("opacity", 1)
                    .style("font-size", "28px")
                    .text(d3.select(this).attr("data-name")); // << MATCHING ORIGINAL TOOLTIP TEXT
                d3.select(this).raise().attr("stroke-width", 5);
            })
            .on("mouseout", function () {
                tooltip.style("opacity", 0);
                d3.select(this).attr("stroke-width", 3);
            });

    });
}


fetch('Milestone2/js/data.json')

    .then(response => response.json())

    .then(data => {
        ingredients = data.ingredients;
        categories = data.categories;
        cat_colors = data.cat_colors;
        ingr_cat = data.ingr_cat;
        coocc_matrix = data.coocc_matrix;
        let frequency_top_ing_per_cuisine = data.frequency_top_ing_per_cuisine;

        let target_ingr = ingredients[0];
        let ind_target_ingr = ingredients.indexOf(target_ingr);

        // Declare colorMatrix once
        let baseColor = cat_colors[ingr_cat[ind_target_ingr]];
        let colorMatrix = createColorMatrix(ind_target_ingr, frequency_top_ing_per_cuisine, baseColor);

        const searchInput = document.getElementById("searchInput");
        const autoList = document.getElementById("autocomplete-list");

        renderMap(colorMatrix, ind_target_ingr, frequency_top_ing_per_cuisine);

        searchInput.addEventListener("input", function () {
            const val = this.value;
            autoList.innerHTML = "";
            if (!val) return;

            const matches = ingredients.filter(ing => ing.toLowerCase().includes(val.toLowerCase()));
            matches.forEach(match => {
                const item = document.createElement("div");
                item.textContent = match;
                item.addEventListener("click", () => {
                    searchInput.value = match;
                    autoList.innerHTML = "";
                    target_ingr = match;
                    ind_target_ingr = ingredients.indexOf(target_ingr);
                    baseColor = cat_colors[ingr_cat[ind_target_ingr]];
                    // Update existing colorMatrix
                    colorMatrix = createColorMatrix(ind_target_ingr, frequency_top_ing_per_cuisine, baseColor);
                    console.log("colorMatrix[0]", colorMatrix[0]);

                    renderMap(colorMatrix, ind_target_ingr, frequency_top_ing_per_cuisine);
                });
                autoList.appendChild(item);
            });
        });

        searchInput.addEventListener("blur", () => {
            setTimeout(() => { autoList.innerHTML = ""; }, 200);
        });
    });

