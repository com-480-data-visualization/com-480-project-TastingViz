function renderChart(target_ingr, n_ingr_displayed, ingredients, categories, cat_colors, ingr_cat, coocc_matrix){
    d3.select("#sunburst-svg").select("svg").remove();
    
    // n_ingr_displayed must always smaller than the total number of ingredient - 1, in order to exclude the target_ingr
  // Find the index of the target_ingr
  let ind_target_ingr = ingredients.indexOf(target_ingr);

  // Find the target row of the coocc matrix
  let target_coocc_row = coocc_matrix[ind_target_ingr];
  
  
  // Set the element of the target element itself to a negative frequency
  target_coocc_row[ind_target_ingr] = -1.0;

  // ind_top_n contains the indices of the top n most cooccuring ingredients
  let ind_top_n = topNIndexes(target_coocc_row, n_ingr_displayed);

  // label_top_n contains the names of the top n most cooccuring ingredients
  let label_top_n = ind_top_n.map(i => ingredients[i]);

  // value_top_n contains the values of the cooccurence frequencies of the top n most cooccuring ingredients
  let value_top_n = ind_top_n.map(i => target_coocc_row[i]);

  // cat_top_n contains the categories of the top n most cooccuring ingredients
  let cat_top_n = ind_top_n.map(i => ingr_cat[i]);

  // unique_cat_top_n contains the unique categories of the top n most cooccuring ingredients
  let unique_cat_top_n = [...new Set(cat_top_n)];

  unique_cat_top_n.sort((a, b) => a - b);
  //count_each_cat_top_n contains the number of each unique categories amongst the top n ingredients
  let count_each_cat_top_n = [];

  //sum_each_cat_top_n contains the sum of the coocc frqu of each unique categories amongst the top n ingredients
  let sum_each_cat_top_n = [];
  
  for(let i = 0; i<unique_cat_top_n.length; i++){
      let indices = cat_top_n
      .map((val, idx) => val === unique_cat_top_n[i] ? idx : -1)
      .filter(idx => idx !== -1);
      count_each_cat_top_n.push(indices.length)
      sum_each_cat_top_n.push(indices.reduce((acc, i) => acc + value_top_n[i], 0))
  }

  let relative_freq_cat_top_n = sum_each_cat_top_n.map((a, i) => a / count_each_cat_top_n[i]);

  permutation = sortedIndicesDescending(relative_freq_cat_top_n)

  relative_freq_cat_top_n = permuteArray(relative_freq_cat_top_n,permutation)
  unique_cat_top_n = permuteArray(unique_cat_top_n,permutation)
  count_each_cat_top_n = permuteArray(count_each_cat_top_n,permutation)
  sum_each_cat_top_n = permuteArray(sum_each_cat_top_n,permutation)

  let labbels_unique_cat_top_n = unique_cat_top_n.map(i => categories[i]);
  
  let U_ind_top_n = []
  let U_label_top_n = []
  let U_cat_top_n = []
  let U_count_each_cat_top_n = []
  let U_value_top_n = []

  for(let i = 0; i<unique_cat_top_n.length;i++){
    let V = unique_cat_top_n[i]
    let indices_cat = cat_top_n
      .map((val, idx) => val === V ? idx : -1)
      .filter(idx => idx !== -1);
    
    U_ind_top_n= U_ind_top_n.concat(indices_cat.map(i =>ind_top_n[i]))
    U_label_top_n  = U_label_top_n.concat(indices_cat.map(i =>label_top_n[i]))
    U_cat_top_n  = U_cat_top_n.concat(indices_cat.map(i =>cat_top_n[i]))
    U_value_top_n  = U_value_top_n.concat(indices_cat.map(i =>value_top_n[i]))
  }

  // cat_colors
  let cat_colors_top_n = []
  for(let i = 0; i<unique_cat_top_n.length;i++){
    cat_colors_top_n[i] = cat_colors[unique_cat_top_n[i]]
  }
  
  let colorList = cat_colors_top_n.map(rgb => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
  let color = (d, i) => colorList[i];

  //------------------------------------------------------------
  //------------------------------------------------------------
  // ingr_colors
  let ingr_colors_top_n = []
  for(let i = 0; i<U_cat_top_n.length;i++){
    ingr_colors_top_n[i] = cat_colors[U_cat_top_n[i]]
  }
  
  let ingr_colorList = ingr_colors_top_n.map(rgb => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
  let ingr_color = (d, i) => ingr_colorList[i];

  const f = 0.6; 
  let ingr_color_scaled = ingr_colors_top_n.map(rgb =>
    rgb.map(c => Math.round(c * f))
  );

  let ingr_color_scaled_str = ingr_color_scaled.map(
    rgb => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
  );

  //------------------------------------------------------------
  // pie chart data categories
  let data = count_each_cat_top_n.map((value, i) => ({
    ingredient: labbels_unique_cat_top_n[i],
    value: value
  }));

// pie chart data ingredients
let ones = new Array(n_ingr_displayed).fill(1)
let ingr_data = ones.map((value, i) => ({
    ingredient: U_label_top_n[i],
    value: value
  }));

  //------------------------------------------------------------
  const widthSunburst = 1000, heightSunburst = 600, radius = Math.min(widthSunburst, height) /7;
  //const color = d3.scaleOrdinal(d3.schemeCategory10);

  let svgSunburst = d3.select("#sunburst-svg")
    .append("svg")
    .attr("width", widthSunburst)
    .attr("height", heightSunburst)
    .append("g")
    .attr("transform", `translate(${widthSunburst*0.33}, ${heightSunburst / 2})`)
  let pie = d3.pie()
    .value(d => d.value)
    .sort(null);
  
  let innerRarc1 = radius*0.64;
  let outerRarc1 = radius*1.04;

  
  let arc = d3.arc()
    .innerRadius(innerRarc1)
    .outerRadius(outerRarc1)
    .padAngle(0.02) // Adds spacing between slices
    .cornerRadius(3); // Optional: rounds corners slightly
  
  let arcs = svgSunburst.selectAll("arc")
    .data(pie(data))
    .enter()
    .append("g")
    .attr("class", "arc");

  arcs.append("path")
    .attr("d", arc)
    .attr("fill", (d, i) => colorList[i]);
  
  let R = (outerRarc1 + innerRarc1) * 0.47;
  svgSunburst.append("defs")
    .selectAll("path")
    .data(pie(data))
    .enter()
    .append("path")
    .attr("id", (d, i) => `textPath${i}`)
    .attr("d", d => {
      const angle = (d.startAngle + d.endAngle) / 2;
      const startX = Math.cos(d.startAngle - Math.PI / 2) * R;
      const startY = Math.sin(d.startAngle - Math.PI / 2) * R;
      const endX = Math.cos(d.endAngle - Math.PI / 2) * R;
      const endY = Math.sin(d.endAngle - Math.PI / 2) * R;
      const largeArc = d.endAngle - d.startAngle > Math.PI ? 1 : 0;
      return `M ${startX},${startY} A ${R},${R} 0 ${largeArc} 1 ${endX},${endY}`;
    });

  // Attach text to each path using <textPath>
  let limitAngle = 14
  arcs.append("text")
    .append("textPath")
    .attr("href", (d, i) => `#textPath${i}`)
    .attr("startOffset", "50%")
    .text(d => {
        const angleSpan = d.endAngle - d.startAngle;  // radians
        const fractionOfCircle = angleSpan / (2 * Math.PI);  // fraction of full circle

        // If the angle is smaller than 1/20 of a circle (~18 degrees)
        if (fractionOfCircle < 1 / limitAngle) {
            return d.data.ingredient.charAt(0);  // Show only first letter
        } else {
            return d.data.ingredient;  // Show full name
        }
    })
    .style("font-size", d => {
        const angleSpan = Math.max(2*Math.PI/limitAngle, d.endAngle - d.startAngle);  // radians
        const arcLength = R * angleSpan;
        const wordLength = d.data.ingredient.length;

        let f = 0.8*6/Math.PI;

        const minSize = 7;
        const maxSize = 40;

        let size = f*arcLength/wordLength;
        return `${Math.max(minSize, Math.min(maxSize, size))}px`;
    })
    .style("fill", "white")
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle");

  let pie2 = d3.pie()
    .value(d => d.value)
    .sort(null);
  
  let pieData = pie2(ingr_data);

  let arcs2_startAngles = []
  let arcs2_endAngles = []
  let arcs2_innerRadii = []
  let arcs2_outerRadii = []
  let arc2_strokeWidth = []
  let offsetAngle = []
  let typeTextStart = []

  let maxiData = Math.max(...U_value_top_n);
  let arrayIsMaxiValue = U_value_top_n.map(value => value === maxiData ? 1 : 0);

  console.log("U_value_top_n: " + U_value_top_n)
  console.log("maxiData: " + maxiData)

  pieData.forEach((d, i) => {
    arcs2_startAngles.push(d.startAngle)
    arcs2_endAngles.push(d.endAngle)
    arcs2_innerRadii.push(radius*1.07)
    arcs2_outerRadii.push(radius*1.07*(1+U_value_top_n[i]/maxiData))
    arc2_strokeWidth.push(arrayIsMaxiValue[i]*3.3)
    if( (d.startAngle + d.endAngle)/2 < Math.PI){
      offsetAngle.push(0)
      typeTextStart.push("start")
    } else {
      offsetAngle.push(180)
      typeTextStart.push("end")
    }
  });

  let arcDataArray = arcs2_startAngles.map((startAngle, i) => ({

    startAngle: arcs2_startAngles[i],
    endAngle: arcs2_endAngles[i],

    innerRadius: arcs2_innerRadii[i],
    outerRadius: arcs2_outerRadii[i],
    strokeWidth: arc2_strokeWidth[i],
    color: `rgb(${ingr_colors_top_n[i][0]}, ${ingr_colors_top_n[i][1]}, ${ingr_colors_top_n[i][2]})`,


  }));

  let arcGenerator = d3.arc()
    .padAngle(0.02)
    .cornerRadius(3)


  arcDataArray.forEach((d, i) => {
    d.label = U_label_top_n[i];
    d.angle = (d.startAngle + d.endAngle) / 2;
  });
  const labelRadiusOffset = 10;

  // Get the RGB color for this category
  const rgb = cat_colors[ingr_cat[ind_target_ingr]];
  // Convert RGB array to a string
  const fillColor = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

  // Inner circle
  const circleRadius = (radius *0.64) * 0.92;
  svgSunburst.append("circle")
      .attr("r", circleRadius)
      .attr("fill", fillColor)


  const textSize = Math.min(circleRadius * 0.5, 100 / target_ingr.length);  // Adjust size based on circle size and text length
      svgSunburst.append("text")
          .attr("x", 0)
          .attr("y", 0)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .style("font-size", `${textSize}px`)
          .style("fill", "white")  // You can adjust text color for contrast
          .text(target_ingr);

  // secondary arc array
  svgSunburst.selectAll(".custom-arc")
    .data(arcDataArray)
    .enter()
    .append("path")
    .attr("class", "custom-arc")
    .attr("d", d => arcGenerator(d))
    .attr("fill", d => d.color)
    .attr("stroke", "red")
    .attr("stroke-width", d => d.strokeWidth);
  
  // secondary arc labels
  let svg_labels_arc = svgSunburst.selectAll(".arc-label")
    .data(arcDataArray)
    .enter()
    .append("text")
    .attr("class", "arc-label")
    .attr("x", (d, i) => Math.cos(d.angle - Math.PI / 2) * (arcs2_outerRadii[i] + labelRadiusOffset)) // +5 as margin
    .attr("y", (d, i) => Math.sin(d.angle - Math.PI / 2) * (arcs2_outerRadii[i] + labelRadiusOffset))
    .attr("text-anchor", (d, i) => typeTextStart[i])
    .attr("alignment-baseline", "middle")
    .attr("transform", (d, i) => {
      const angleDeg = offsetAngle[i] + (d.angle * 180 / Math.PI) - 90;
      const r = arcs2_outerRadii[i] + labelRadiusOffset; // use outer radius plus small offset
      const x = Math.cos(d.angle - Math.PI / 2) * r;
      const y = Math.sin(d.angle - Math.PI / 2) * r;
      return `rotate(${angleDeg}, ${x}, ${y})`;
    })
    .text((d, i) => U_label_top_n[i])
    .style("font-size", "22px")
    .style("fill", (d, i) => ingr_color_scaled_str[i]); 

}

function topNIndexes(arr, n) {
    return arr
        .map((value, index) => ({ value, index }))
        .sort((a, b) => b.value - a.value)
        .slice(0, n)
        .map(d => d.index);
}

function sortedIndicesDescending(arr) {
  return arr
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value)
    .map(d => d.index);
}

function permuteArray(arr, perm) {
    const result = new Array(arr.length);
    for (let i = 0; i < perm.length; i++) {
        result[i] = arr[perm[i]] ;
    }
    return result;
}

fetch('Milestone2/js/data.json')
  .then(response => response.json())
  .then(data => {
    
      ingredients = data.ingredients;
      console.log(ingredients)
      categories = data.categories;
      cat_colors = data.cat_colors;
      ingr_cat = data.ingr_cat;
      coocc_matrix = data.coocc_matrix;
      frequency_top_ing_per_cuisine = data.frequency_top_ing_per_cuisine;


      const slider = document.getElementById("sliderN");
      const sliderVal = document.getElementById("sliderVal");

      //slider.max = ingredients.length - 1;  // Set dynamically
      slider.max = 40;  // hard codded is better
      slider.min = 3;  // Set dynamically

      sliderVal.textContent = slider.value;   

      let target_ingr = ingredients[0];
      let n_ingr_displayed = 6;

    renderChart(target_ingr, n_ingr_displayed, ingredients, categories, cat_colors, ingr_cat, coocc_matrix);

      const searchInput = document.getElementById("searchInput2");
      const autoList = document.getElementById("autocomplete-list2");

      searchInput.addEventListener("input", function() {
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
            renderChart(target_ingr, n_ingr_displayed, ingredients, categories, cat_colors, ingr_cat, coocc_matrix);
          });
          autoList.appendChild(item);
        });
      });

      searchInput.addEventListener("blur", () => {
        setTimeout(() => { autoList.innerHTML = ""; }, 200);
      });

      slider.addEventListener("input", function() {
        n_ingr_displayed = parseInt(this.value);
        sliderVal.textContent = n_ingr_displayed;
        renderChart(target_ingr, n_ingr_displayed, ingredients, categories, cat_colors, ingr_cat, coocc_matrix);
      });
})
.catch(error => console.error('Error loading JSON:', error));
