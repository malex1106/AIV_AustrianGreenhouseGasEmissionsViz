# Greenhouse Emissions Austria

## Data

```js
const data_en = d3.dsvFormat(";").parse((await FileAttachment("data_en@1.csv").text()));
```

```js
const geo_en = FileAttachment("geo_en.json").json();
```

```js
const processedEmissionData = data_en.reduce((acc, d) => {
  const classification = d.Classification; // classification attribute
  const sector = d.Sector;
  
  // Skip unwanted sectors
  if (sector === "Energy & Industry" || sector === "Total") {
    return acc;
  }
  
  const year = +d.Year; // ensure the year is a number
  const value = +(d.Values.replace(",", ".") || 0); // parse the emission value correctly
  
  if (!d.Region || isNaN(year) || isNaN(value)) {
    console.error("Invalid data:", d);
    return acc;
  }
  
  // Initialize region and classification if they don't exist
  if (!acc[d.Region]) acc[d.Region] = {};
  if (!acc[d.Region][classification]) acc[d.Region][classification] = {};
  if (!acc[d.Region][classification][sector]) acc[d.Region][classification][sector] = {};

  
  // Accumulate the emission value for this year
  acc[d.Region][classification][sector][year] = (acc[d.Region][classification][sector][year] || 0) + value;
  
  return acc;
}, {});

```

```js
function getEmissionForRegionClassificationYear(region, classification, year) {
  return processedEmissionData[region] ? processedEmissionData[region][classification][year] || 0 : 0;
};
```

```js
const years = Array.from(
  new Set(
    data_en
      .filter(d => {
        const year = +d.Year;

        if (classification === "Total") return true;
        return year >= 2005;
      })
      .map(d => +d.Year)
  )
).sort((a, b) => a - b);
```

```js
function getMaxEmissionForYear(year, selectedClassifications, selectedRegions) {
  return d3.max(selectedRegions, region =>
    d3.sum(selectedClassifications, cls =>
      processedEmissionData[region]?.[cls]?.[year] || 0
    )
  );
}
```

```js
function getMaxEmissionAllYears(selectedClassifications, selectedRegions) {
  const years = Array.from(
    new Set(
      Object.values(processedEmissionData)
        .flatMap(region =>
          selectedClassifications.flatMap(cls =>
            Object.keys(region[cls] || {})
          )
        )
    )
  ).map(Number);

  return d3.max(years, year =>
    getMaxEmissionForYear(year, selectedClassifications, selectedRegions)
  );
}
```

```js
// Find the maximum emission value across all regions and years
const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, getMaxEmissionAllYears([classification], Object.keys(processedEmissionData))]);  // The range for the blue color scale
```

```js
// Helper: get the sector breakdown for a specific region, classification and year.
function getSectorBreakdown(region, classification, year) {
  const result = {};
  if (
    !processedEmissionData[region] ||
    !processedEmissionData[region][classification]
  )
    return result;
  // Here each key under processedEmissionData[region][classification] is a sector.
  Object.keys(processedEmissionData[region][classification]).forEach(sector => {
    // If the data for the year is missing, assume 0.
    result[sector] =
      processedEmissionData[region][classification][sector][year] || 0;
  });
  return result;
}
```

```js
// Helper: get the aggregated breakdown across all regions for a given classification and year.
function getSectorBreakdownForAllRegions(year, classification) {
  const result = {};
  Object.keys(processedEmissionData).forEach(region => {
    if (
      processedEmissionData[region] &&
      processedEmissionData[region][classification] &&
      region.toLowerCase() != "austria"
    ) {
      Object.keys(processedEmissionData[region][classification]).forEach(
        sector => {
          result[sector] =
            (result[sector] || 0) +
            (processedEmissionData[region][classification][sector][year] || 0);
        }
      );
    }
  });
  return result;
}
```

```js
function getColorForSector(sector) {
  const sectorColorMapping = {
    // German sectors
    "Industrie": "#f4823d",
    "Energie": "#e06666",
    "Gebäude": "#3c78d8",
    "Mobilität": "#f1c232",
    "Landwirtschaft": "#7bb662",
    "Abfall": "#8e7cc3",
    "Verkehr": "#f1c232",
    "F-Gase": "#00F5D4",
    
    // English sectors
    "Industry": "#f4823d",
    "Energy": "#e06666", 
    "Buildings": "#3c78d8",
    "Transport": "#f1c232",
    "Farming": "#7bb662",
    "Waste management": "#8e7cc3",
    "Traffic": "#f1c232",
    "F-Gases": "#00F5D4",
    
    // Default color for any other sectors
    "default": "#95d2bd"
  };
  
  return sectorColorMapping[sector] || sectorColorMapping["default"];
}
```

```js
function getIconForSector(sector) {
    const icons = {
      "Industry": "🏭",
      "Industrie": "🏭",
      "Buildings": "🏠",
      "Gebäude": "🏠",
      "Traffic": "🚗",
      "Verkehr": "🚗",
      "Farming": "🌾",
      "Landwirtschaft": "🌾",
      "Waste management": "♻️",
      "Abfall": "♻️",
      "Energy": "⚡",
      "Energie": "⚡",
      "F-Gases": "🔥",
      "F-Gase": "🔥",
    };
    
    return icons[sector] || "";
}

```

```js
try {
  const csvText = await FileAttachment("bonus.csv").text();
  const lines = csvText.split('\n').filter(line => line.trim());
  
  console.log("Parsing population CSV...");
  const processedData = {};
  
  // Find where the actual data starts (after the headers)
  let dataStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('"Time section","Bundesland"')) {
      dataStartIndex = i + 1;
      break;
    }
  }
  
  if (dataStartIndex === -1) {
    console.error("Could not find data start");
    const bonusData = {};
  }
  
  // Parse the data lines
  let currentYear = null;
  
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line (handle quoted values)
    const parts = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current.trim());
    
    // Extract data: year, region, population
    if (parts.length >= 3) {
      const yearStr = parts[0].replace(/"/g, '').trim();
      const regionStr = parts[1].replace(/"/g, '').trim();
      const populationStr = parts[2].replace(/"/g, '').trim();
      
      // If yearStr is not empty, it's a new year
      if (yearStr) {
        currentYear = yearStr;
      }
      
      // Use the current year (either from this line or carried over)
      const year = currentYear;
      const population = parseFloat(populationStr);
      
      if (year && regionStr && !isNaN(population)) {
        // Clean up region name (remove code in brackets)
        const cleanRegion = regionStr.replace(/<[^>]*>/g, '').trim();
        
        if (!processedData[cleanRegion]) {
          processedData[cleanRegion] = {};
        }
        
        processedData[cleanRegion][year] = {
          population: population
        };
        
        console.log(`Processed: ${cleanRegion} ${year} -> ${population}`);
      }
    }
  }
  
  console.log("Final processed data:", processedData);
  console.log("Regions found:", Object.keys(processedData));
  
  const bonusData = processedData;
  
} catch (error) {
  console.error("Error loading bonus data:", error);
  const bonusData = {};
}
```

## Visualizations

```js
const selectedRegion = Mutable("all");
```

```js
const selectedSector = Mutable("all");
```

```js
function Scrubber(values, {
  format = value => value,
  initial = 0,
  direction = 1,
  delay = null,
  autoplay = true,
  loop = true,
  loopDelay = null,
  alternate = false
} = {}) {
  values = Array.from(values);
  const form = html`<form style="font: 12px var(--sans-serif); font-variant-numeric: tabular-nums; display: flex; height: 33px; align-items: center;">
  <button name=b type=button style="margin-right: 0.4em; width: 5em;"></button>
  <label style="display: flex; align-items: center;">
    <input name=i type=range min=0 max=${values.length - 1} value=${initial} step=1 style="width: 180px;">
    <output name=o style="margin-left: 0.4em;"></output>
  </label>
</form>`;
  let frame = null;
  let timer = null;
  let interval = null;
  function start() {
    form.b.textContent = "Pause";
    if (delay === null) frame = requestAnimationFrame(tick);
    else interval = setInterval(tick, delay);
  }
  function stop() {
    form.b.textContent = "Play";
    if (frame !== null) cancelAnimationFrame(frame), frame = null;
    if (timer !== null) clearTimeout(timer), timer = null;
    if (interval !== null) clearInterval(interval), interval = null;
  }
  function running() {
    return frame !== null || timer !== null || interval !== null;
  }
  function tick() {
    if (form.i.valueAsNumber === (direction > 0 ? values.length - 1 : direction < 0 ? 0 : NaN)) {
      if (!loop) return stop();
      if (alternate) direction = -direction;
      if (loopDelay !== null) {
        if (frame !== null) cancelAnimationFrame(frame), frame = null;
        if (interval !== null) clearInterval(interval), interval = null;
        timer = setTimeout(() => (step(), start()), loopDelay);
        return;
      }
    }
    if (delay === null) frame = requestAnimationFrame(tick);
    step();
  }
  function step() {
    form.i.valueAsNumber = (form.i.valueAsNumber + direction + values.length) % values.length;
    form.i.dispatchEvent(new CustomEvent("input", {bubbles: true}));
  }
  form.i.oninput = event => {
    if (event && event.isTrusted && running()) stop();
    form.value = values[form.i.valueAsNumber];
    form.o.value = format(form.value, form.i.valueAsNumber, values);
  };
  form.b.onclick = () => {
    if (running()) return stop();
    direction = alternate && form.i.valueAsNumber === values.length - 1 ? -1 : 1;
    form.i.valueAsNumber = (form.i.valueAsNumber + direction) % values.length;
    form.i.dispatchEvent(new CustomEvent("input", {bubbles: true}));
    start();
  };
  form.i.oninput();
  if (autoplay) start();
  else stop();
  Inputs.disposal(form).then(stop);
  return form;
}
```

```js
//viewof year = Inputs.range([years[0], years[years.length - 2]], {step: 1})
const year = view(Scrubber(years.slice(0, years.length - 1), {delay: 2000}));
```

```js
const classification = view(Inputs.select(["Total", "KSG", "EH"], {value: "Total", label: "Choose Category"}))
```

```js
const preprocessingOption = view(Inputs.select(["None", "Population"], {
  label: "Normalization:",
  value: "None"
}))
```

```js
function map(width) {
  const height = 500;
  
  // Define a projection and path generator for your GeoJSON data.
  const projection = d3.geoMercator().fitSize([width, height], geo_en);
  const pathGenerator = d3.geoPath().projection(projection);
  
  // Function to get normalization factor
  function getNormalizationFactor(region, year, option) {
    if (option === "None") return 1;
    
    // Map region names to match bonus data
    const regionMapping = {
      "Upper Austria": "Upper Austria",
      "Lower Austria": "Lower Austria",
      "Vienna": "Vienna",
      "Styria": "Styria",
      "Tyrol": "Tyrol",
      "Carinthia": "Carinthia",
      "Salzburg": "Salzburg",
      "Vorarlberg": "Vorarlberg",
      "Burgenland": "Burgenland"
    };
    
    const mappedRegion = regionMapping[region] || region;
    
    // Convert year to string to match CSV data
    const yearStr = year.toString();
    
    if (bonusData[mappedRegion] && bonusData[mappedRegion][yearStr]) {
      if (option === "Population") {
        const pop = bonusData[mappedRegion][yearStr].population;
        console.log(`Found population for ${mappedRegion} ${yearStr}: ${pop}`);
        return pop || 1;
      }
    } else {
      console.log(`No data found for ${mappedRegion} ${yearStr}`);
      console.log(`Available years for ${mappedRegion}:`, bonusData[mappedRegion] ? Object.keys(bonusData[mappedRegion]) : "No data");
    }
    
    return 1; // Default to no normalization if data not found
  }
  
  // Function to calculate total emission (same as your original)
  function getTotalEmission(region, classification, year) {
    let totalEmission = 0;
    if (processedEmissionData[region] && processedEmissionData[region][classification]) {
      const res = processedEmissionData[region][classification];
      for (const [key, value] of Object.entries(res)) {
        if (selectedSector === "all" || selectedSector === key) {
          totalEmission += value[year] || 0;
        }
      }
    }
    return totalEmission;
  }
  
  // Function to calculate normalized emission
  function getNormalizedEmission(region, classification, year, option) {
    const totalEmission = getTotalEmission(region, classification, year);
    const normalizationFactor = getNormalizationFactor(region, year, option);
    return totalEmission / normalizationFactor;
  }
  
  // Compute the maximum emission among regions for the chosen classification/year.
  function getMaxEmission(classification, regions, option) {
    let maxEmission = 0;
    regions.forEach(region => {
      const emission = getNormalizedEmission(region, classification, year, option);
      maxEmission = Math.max(maxEmission, emission);
    });
    return maxEmission;
  }
  
  const regions = Object.keys(processedEmissionData);
  const maxEmission = getMaxEmission(classification, regions, preprocessingOption);
  
  // Create a sequential color scale mapping emissions to colors.
  const colorScale = d3.scaleSequential(d3.interpolateBlues)
    .domain([0, maxEmission]);
  
  // Create the SVG element.
  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height);
  
  // Render regions (the GeoJSON features) on the map.
  svg.selectAll("path")
    .data(geo_en.features)
    .join("path")
    .attr("d", pathGenerator)
    .attr("stroke", "gray")
    .attr("stroke-width", 0.5)
    .attr("fill", d => {
      const region = d.properties.name;
      const normalizedEmission = getNormalizedEmission(region, classification, year, preprocessingOption);
      return colorScale(normalizedEmission);
    })
    // When hovering over a region, update the mutable selectedRegion.
    .on("mouseover", (event, d) => {
      mutable selectedRegion = d.properties.name;
      d3.select(event.currentTarget).attr("fill", "orange");
    })
    .on("mouseout", (event, d) => {
      mutable selectedRegion = "all";
      const normalizedEmission = getNormalizedEmission(d.properties.name, classification, year, preprocessingOption);
      d3.select(event.currentTarget).attr("fill", colorScale(normalizedEmission));
    });
  
  // Add text labels at region centroids (same format as your original).
  svg.selectAll("text")
    .data(geo_en.features)
    .join("text")
    .attr("transform", d => {
      const centroid = pathGenerator.centroid(d);
      return `translate(${centroid[0]}, ${centroid[1]})`;
    })
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("fill", d => {
      const region = d.properties.name;
      const normalizedEmission = getNormalizedEmission(region, classification, year, preprocessingOption);
      const fillColor = d3.color(colorScale(normalizedEmission));
      const luminance = 0.299 * fillColor.r + 0.587 * fillColor.g + 0.114 * fillColor.b;
      return luminance > 140 ? "black" : "white";
    })
    .text(d => {
      const region = d.properties.name;
      const normalizedEmission = getNormalizedEmission(region, classification, year, preprocessingOption);
      
      // Format the display based on preprocessing option
      if (preprocessingOption === "Population") {
        // Show as emissions per capita in smaller format
        if (normalizedEmission > 0) {
          if (normalizedEmission >= 1000) {
            return `${(normalizedEmission/1000).toFixed(1)}k/cap`;
          } else if (normalizedEmission >= 1) {
            return `${normalizedEmission.toFixed(1)}/cap`;
          } else {
            return `${(normalizedEmission*1000).toFixed(1)}m/cap`;
          }
        }
        return "";
      } else {
        // Original format: show in millions
        const emissionInMillions = normalizedEmission / 1e6;
        return emissionInMillions > 0 ? `${emissionInMillions.toFixed(2)}M` : "";
      }
    });
  
  return svg.node();
}

const mapChart = display(map(500));
```

<div class="grid grid-cols-1" style="grid-auto-rows: 504px;">
  <div id="map-container">${
    resize((width) => map(width))
  }</div>
</div>

```js
function lineChart() {
  const classifications = ["Total", "KSG", "EH"];
  let selectedRegions = Object.keys(processedEmissionData); // default: all regions
  if (selectedRegion !== "all") {
    selectedRegions = [mutable selectedRegion];
  }

  // Prepare data: [{year: 1990, classification: "Total", emission: 12345}, ...]
  const linesData = classifications.flatMap(classification =>
    years.map(year => {
      const values = selectedRegions.map(region => {
        let totalEmission = 0;
        const res = getSectorBreakdown(region, classification, year)
        for (const [key, value] of Object.entries(res)) {
          console.log(selectedSector, key)
          if (selectedSector === "all" || selectedSector === key) {
            totalEmission += value || 0;
          }
        }
        return totalEmission;
      }
                                         
      ).filter(d => d !== undefined);

      const value_sum = d3.sum(values);

      return {
        year,
        classification,
        emission: value_sum > 0 ? value_sum : undefined
      };
    })
  );

  const overallWidth = 1000;  // increased width
  const width = 800;
  const height = 400;
  const margin = { top: 10, right: 50, bottom: 30, left: 60 };

  const svg = d3.create("svg")
    .attr("width", overallWidth)
    .attr("height", height);

  // Create a group for the chart itself and translate it according to the margins
  const chartG = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(years))
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([
      0,
      d3.max(linesData, d => d.emission !== undefined ? d.emission : 0)
    ]).nice()
    .range([height - margin.bottom, margin.top]);

  const color = d3.scaleOrdinal()
    .domain(classifications)
    .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);

  const line = d3.line()
    .defined(d => d.emission !== undefined)
    .x(d => x(d.year))
    .y(d => y(d.emission));

  // Axes
  chartG.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));
    //.call(g => g.select(".domain").remove());

  chartG.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(6).tickFormat(d => `${(d / 1e6).toFixed(1)}M`));
    //.call(g => g.select(".domain").remove());

  // Y-axis gridlines
  chartG.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(${margin.left},0)`)
    .call(
      d3.axisLeft(y)
        .tickSize(-(width - margin.left - margin.right))
        .tickFormat("") // no labels
    )
    .call(g => g.select(".domain").remove())
    .selectAll("line")
    .attr("stroke", "#ccc")
    .attr("stroke-width", 1.5)
    .attr("stroke-opacity", 0.5);
  
  // Optional: X-axis gridlines
  //chartG.append("g")
  // .attr("class", "grid")
  //  .attr("transform", `translate(0,${height - margin.bottom})`)
  //  .call(
  //    d3.axisBottom(x)
  //      .tickSize(-(height - margin.top - margin.bottom))
  //      .tickFormat("")
  //  )
  //  .call(g => g.select(".domain").remove())
  //  .selectAll("line")
  //  .attr("stroke", "#ccc")
  //  .attr("stroke-opacity", 0.5);

  // Lines + labels
  for (const classification of classifications) {
    const data = linesData.filter(d => d.classification === classification);

    chartG.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", color(classification))
      .attr("stroke-width", 2)
      .attr("d", line);
  }

  // Append a legend group to the SVG
  const legend = svg.append("g")
    .attr("class", "legend")
    // Position the legend in the unused right margin area
    .attr("transform", `translate(${width + 20}, ${margin.top})`);
  
  // Create a legend entry for each classification
  classifications.forEach((classification, index) => {
    const legendRow = legend.append("g")
      .attr("transform", `translate(0, ${index * 20})`);
  
    legendRow.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", color(classification));
  
    legendRow.append("text")
      .attr("x", 18)
      .attr("y", 10)
      .text(classification)
      .attr("alignment-baseline", "middle")
      .style("font-size", "12px");
  });


  // ------------------------
  // Tooltip and vertical guide line functionality
  // ------------------------

  // Create a bisector to help find the nearest point by year
  const bisectYear = d3.bisector(d => d.year).left;

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "10px")
    .style("background", "rgba(255, 255, 255, 0.9)")
    .style("border", "1px solid #ddd")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("z-index", 1000);

  // After drawing the vertical guide line, add a circle marker.
  const markers = chartG.selectAll(".marker")
    .data(classifications)
    .enter().append("circle")
    .attr("class", "marker")
    .attr("r", 4.5)
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .style("pointer-events", "none")
    .style("opacity", 0);

  // Append a text element for the tooltip content.
  /*focus.append("text")
    .attr("x", 10)  // leave some space from the left edge of the rect
    .attr("y", "1em")
    .style("font-size", "13px");*/

  // Append a vertical line to indicate the current x position.
  const verticalLine = chartG.append("line")
    .attr("class", "vertical-line")
    .attr("stroke", "gray")
    .attr("stroke-dasharray", "3,3")
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .style("visibility", "hidden");

  chartG.append("rect")
    .attr("class", "overlay")
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mouseover", function(event) {
      tooltip.transition()
        .duration(200)
        .style("opacity", 0.9);
      verticalLine.style("visibility", "visible");
    })
    .on("mouseout", function(event) {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
      verticalLine.style("visibility", "hidden");
    })
    .on("mousemove", function(event) {
      // Get the x-coordinate in data terms.
      const pointer = d3.pointer(event);
      const mouseX = pointer[0];
      const x0 = x.invert(mouseX + margin.left);

      // Build the tooltip content by looking up the closest data point for each classification.
      let tooltipContent = "";
      markers.each(function(classification) {
        const data = linesData.filter(d => d.classification === classification);
        const i = bisectYear(data, x0);
        const d0 = data[i - 1] || data[0];
        const d1 = data[i] || d0;
        const dPoint = (x0 - d0.year) > (d1.year - x0) ? d1 : d0;
        if (dPoint.emission !== undefined) {
          d3.select(this)
            .attr("cx", x(dPoint.year))
            .attr("cy", y(dPoint.emission))
            .style("opacity", 1)
            .attr("fill", color(classification));
          
          tooltipContent += `<div><strong>${classification}</strong>: ${dPoint.year}, ${(dPoint.emission/1e6).toFixed(2)}M t CO2-eq</div>`;
        } else {
          tooltipContent += `<div><strong>${classification}</strong>: No data</div>`;
          d3.select(this)
            .style("opacity", 0);
        }
      });

      tooltip.html(tooltipContent)
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px");

      // Update the vertical guide line using the "Total" classification as reference.
      const data0 = linesData.filter(d => d.classification === classifications[0]);
      const i0 = bisectYear(data0, x0);
      const d0 = data0[i0 - 1] || data0[0];
      const d1 = data0[i0] || d0;
      const dPointMain = (x0 - d0.year) > (d1.year - x0) ? d1 : d0;
      const xPos = x(dPointMain.year);
      verticalLine.attr("x1", xPos)
                  .attr("x2", xPos);
    });

  return svg.node();
}
```

```js
function emissionsBarTreeChart {
  // Use mutable values for the selected year, region, and classification
  let currentYear = year;
  let currentRegion = selectedRegion;
  let currentClassification = classification;

  // If the region is "all" you show aggregated data across all regions;
  // otherwise, get data for the specific region.
  let sectorBreakdown = {};
  if (currentRegion.toLowerCase() === "all") {
    sectorBreakdown = getSectorBreakdownForAllRegions(year, classification);
  } else {
    sectorBreakdown = getSectorBreakdown(currentRegion, classification, year);
  }

  // Convert the breakdown object into an array for D3 consumption.
  // Each entry is {sector, value} and sorted descending by value.
  const data = Object.entries(sectorBreakdown)
    .map(([sector, value]) => ({ sector, value }))
    .sort((a, b) => b.value - a.value);

  // Calculate the total for reference or display.
  const total = data.reduce((sum, d) => sum + d.value, 0); 
  
  // Set up dimensions for the entire visualization
  const width = 900;
  const height = 500;
  const margin = { top: 40, right: 20, bottom: 40, left: 60 };
  
  // Create main SVG
  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height]);
  
  // Define chart areas - bar chart on left, treemap on right
  const barChartWidth = width * 0.45;
  const treemapWidth = width * 0.55;
  
  // Create tooltip div
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "10px")
    .style("background", "rgba(255, 255, 255, 0.9)")
    .style("border", "1px solid #ddd")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("z-index", 1000);
  
  // ================== BAR CHART SECTION ==================
  // Create bar chart group
  const barChartGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top + 20})`);
  
  // X scale for bar chart
  const barX = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .range([0, barChartWidth - margin.left - margin.right]);
  
  // Y scale for bar chart
  const barY = d3.scaleBand()
    .domain(data.map(d => d.sector))
    .range([0, height - margin.top - margin.bottom - 20])
    .padding(0.2);
  
  // Add bars
  barChartGroup.selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", 0)
    .attr("y", d => barY(d.sector))
    .attr("width", d => barX(d.value))
    .attr("height", barY.bandwidth())
    .attr("fill", d => getColorForSector(d.sector))
    .on("mouseover", function(event, d) {
      // Highlight the bar
      d3.select(this)
        .transition()
        .duration(200)
        .attr("opacity", 0.8)
        .attr("stroke", "#000")
        .attr("stroke-width", 1);
      
      // Show tooltip
      const percent = (d.value / total * 100).toFixed(1);
      tooltip.transition()
        .duration(200)
        .style("opacity", 0.9);
      tooltip.html(`<strong>${d.sector}</strong><br>
                   ${(d.value/1000000).toFixed(2)}M t CO2-eq<br>
                   ${percent}% of total`)
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px");

      // Update
      mutable selectedSector = d.sector;
    })
    .on("mouseout", function() {
      // Restore bar appearance
      d3.select(this)
        .transition()
        .duration(200)
        .attr("opacity", 1)
        .attr("stroke", "none");
      
      // Hide tooltip
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);

      // Update
      mutable selectedSector = "all";
    });

  // Check if year changes and if tooltip is visible => hide it!
  viewof year.addEventListener("input", () => {
    tooltip.transition().duration(200).style("opacity", 0);
  });
  
  // Add value labels to bars
  barChartGroup.selectAll(".value-label")
    .data(data)
    .join("text")
    .attr("class", "value-label")
    .attr("x", d => barX(d.value) + 5)
    .attr("y", d => barY(d.sector) + barY.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "start")
    .attr("font-size", "11px")
    .text(d => `${(d.value/1000000).toFixed(2)}M (${(d.value/total*100).toFixed(1)}%)`);
  
  // Add x-axis
  barChartGroup.append("g")
    .attr("transform", `translate(0, ${height - margin.top - margin.bottom - 20})`)
    .call(d3.axisBottom(barX).ticks(5).tickFormat(d => `${(d/1000000).toFixed(1)}M`))
    .selectAll("text")
    .attr("font-size", "10px");
  
  // Add y-axis
  barChartGroup.append("g")
    .call(d3.axisLeft(barY))
    .selectAll("text")
    .attr("font-size", "10px");
  
  // ================== TREEMAP SECTION ==================
  // Create treemap group
  const treemapGroup = svg.append("g")
    .attr("transform", `translate(${barChartWidth + 20}, ${margin.top + 20})`);
  
  // Convert data to hierarchical format needed for treemap
  const treemapData = {
    name: "root",
    children: data.map(d => ({ name: d.sector, value: d.value }))
  };
  
  // Create hierarchy
  const root = d3.hierarchy(treemapData)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);
  
  // Create treemap layout
  const treemapLayout = d3.treemap()
    .size([treemapWidth - 20, height - margin.top - margin.bottom - 20])
    .padding(2);
  
  // Apply layout
  treemapLayout(root);
  
  // Create treemap cells
  const cell = treemapGroup.selectAll("g")
    .data(root.leaves())
    .join("g")
    .attr("transform", d => `translate(${d.x0},${d.y0})`)
    .on("mouseover", function(event, d) {
      // Highlight the cell
      d3.select(this).select("rect")
        .transition()
        .duration(200)
        .attr("opacity", 0.8)
        .attr("stroke", "#000")
        .attr("stroke-width", 1);
      
      // Show tooltip
      const percent = (d.data.value / total * 100).toFixed(1);
      tooltip.transition()
        .duration(200)
        .style("opacity", 0.9);
      tooltip.html(`<strong>${d.data.name}</strong><br>
                   ${(d.data.value/1000000).toFixed(2)}M t CO2-eq<br>
                   ${percent}% of total`)
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px");

      // Update
      mutable selectedSector = d.data.name;
    })
    .on("mouseout", function() {
      // Restore cell appearance
      d3.select(this).select("rect")
        .transition()
        .duration(200)
        .attr("opacity", 1)
        .attr("stroke", "white");
      
      // Hide tooltip
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);

      // Update
      mutable selectedSector = "all";
    });
  
  // Add rectangles for cells
  cell.append("rect")
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", d => getColorForSector(d.data.name))
    .attr("stroke", "white");
  
  // Add text labels for cells
  cell.append("text")
    .attr("x", 4)
    .attr("y", 14)
    .attr("font-size", "11px")
    .attr("fill", "white")
    .text(d => {
      // Only add text if there's enough space
      return (d.x1 - d.x0 > 40 && d.y1 - d.y0 > 25) ? d.data.name : "";
    });
  
  // Add percentage labels
  cell.append("text")
    .attr("x", 4)
    .attr("y", 26)
    .attr("font-size", "10px")
    .attr("fill", "white")
    .text(d => {
      // Only add percentage if there's enough space
      const percent = (d.data.value / total * 100).toFixed(1);
      return (d.x1 - d.x0 > 40 && d.y1 - d.y0 > 35) ? `${percent}%` : "";
    });
  
  // Add small icon based on sector if space allows (optional)
  cell.append("text")
    .attr("class", "sector-icon")
    .attr("x", d => (d.x1 - d.x0) / 2)
    .attr("y", d => (d.y1 - d.y0) / 2)
    .attr("font-size", d => Math.min(36, (d.x1 - d.x0) / 3)) // Larger font size
    .attr("fill", "rgba(255,255,255,0.7)") // Higher opacity for better visibility
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .style("pointer-events", "none") // Make icons not interfere with hover
    .text(d => {
      // Only add icon if there's enough space
      if (d.x1 - d.x0 < 50 || d.y1 - d.y0 < 50) return "";

      return getIconForSector(d.data.name);
  });
  
  // Create the container elements
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.flexDirection = "column";
  container.style.gap = "15px";
  
  // Create chart container
  const chartContainer = document.createElement("div");
  chartContainer.id = "barTreeChartContainer";
  // Append the visualization to the container
  chartContainer.appendChild(svg.node());
  container.appendChild(chartContainer);
  
  return container;
}
```

```js
import {interval} from '@mootari/range-slider'
```

```js
viewof comparisonYears = interval([d3.min(years), d3.max(years.slice(0, years.length -1))], {
  step: 1,
  value: [year - 1, year],
  label: 'Year Comparison',
})
```

```js
viewof metric = Inputs.radio(new Map([["Absolute", "absolute"], ["Relative", "relative"]]), {value: "absolute", label: "Change"})
```

```js
yearComparisonChart = {
  if (comparisonYears[0] === comparisonYears[1]) {
    const height = 100;
    const svg = d3.create("svg")
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");
    svg.append("text")
      .attr("font-family", "sans-serif")
      .attr("font-size", 18)
      .attr("transform-origin", "center")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(${width / 2},${height / 2})`)
      .text("Select two different years to compare them");
    
    return svg.node();
  }

  
  const [base, comparison] = comparisonYears.map(year => selectedRegion === "all" ? getSectorBreakdownForAllRegions(year, classification) : getSectorBreakdown(selectedRegion,classification,year));

  const baseArr = Object.entries(base).map(([sector, value]) => ({sector, value}));

   const data = d3.sort(baseArr, d => comparison[d.sector] - d.value)
    .map((d) => ({
      ...d,
      value: metric === "absolute" ? comparison[d.sector] - d.value : (comparison[d.sector] - d.value) / d.value
    }));

    // Specify the chart’s dimensions.
  const barHeight = 25;
  const marginTop = 30;
  const marginRight = 60;
  const marginBottom = 10;
  const marginLeft = 60;
  const height = Math.ceil((data.length + 0.1) * barHeight) + marginTop + marginBottom;

  // Create the positional scales.
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.value))
    .rangeRound([marginLeft, width - marginRight]);

  const y = d3.scaleBand()
    .domain(data.map(d => d.sector))
    .rangeRound([marginTop, height - marginBottom])
    .padding(0.1);

  // Create the format function.
  const format = d3.format(metric === "absolute" ? "+.2s" : "+.1%");
  const tickFormat = metric === "absolute" ? d3.formatPrefix("+.1", 1e6) : d3.format("+.0%");

  // Create the SVG container.
  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

  // Add a rect for each sector.
  svg.append("g")
    .selectAll()
    .data(data)
    .join("rect")
      .attr("fill", (d) => getColorForSector(d.sector))
      .attr("x", (d) => x(Math.min(d.value, 0)))
      .attr("y", (d) => y(d.sector))
      .attr("width", d => Math.abs(x(d.value) - x(0)))
      .attr("height", y.bandwidth())
      .attr("stroke", "#000")
      .attr("stroke-width", 0)
    .on("mouseover", function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("stroke-width", 2);
      mutable selectedSector = d.sector;
    })
    .on("mouseout", function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("stroke-width", 0);
      mutable selectedSector = "all";
    });

  // Add a text label for each sector.
  svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
    .selectAll()
    .data(data)
    .join("text")
      .attr("text-anchor", d => d.value < 0 ? "end" : "start")
      .attr("x", (d) => x(d.value) + Math.sign(d.value - 0) * 4)
      .attr("y", (d) => y(d.sector) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .text(d => format(d.value));

  // emojis
  svg.append("g")
    .selectAll()
    .data(data)
    .join("text")
      .attr("text-anchor", d => d.value < 0 ? "start" : "end")
      .attr("x", d => x(d.value) - Math.sign(d.value) * 4)
      .attr("y", d => y(d.sector) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .text(d => getIconForSector(d.sector));

  // Add the axes and grid lines.
  svg.append("g")
    .attr("transform", `translate(0,${marginTop})`)
    .call(d3.axisTop(x).ticks(width / 80).tickFormat(tickFormat))
    .call(g => g.selectAll(".tick line").clone()
          .attr("y2", height - marginTop - marginBottom)
          .attr("stroke-opacity", 0.1))
    .call(g => g.select(".domain").remove());

  svg.append("g")
    .attr("transform", `translate(${x(0)},0)`)
    .call(d3.axisLeft(y).tickSize(0).tickPadding(6))
    .call(g => g.selectAll(".tick text").filter((d, i) => data[i].value < 0)
        .attr("text-anchor", "start")
        .attr("x", 6));

  return svg.node();
}
```
