---
toc: false
title: Introduction - Austrian Emissions
---

<div class="hero" style="margin-bottom: -15px;">
  <h1>Austrian Emissions</h1>
  <h2>Official Austrian climate reporting according to the climate protecting act - Klimaschutzgesetz (KSG).</h2><br>
  <p style="text-align: justify">This dataset originates from Austria's official climate reporting in accordance with the Klimaschutzgesetz (KSG), the national Climate Protection Act. It covers greenhouse gas emissions from <b>2005 to 2022</b> and offers detailed breakdowns across several <b>key dimensions</b>, including region (Austrian federal states), pollutant type, sector, and classification under either KSG, the EU Emissions Trading System (EH), or total emissions (Total). All emission values are standardized in tonnes of <b>CO₂-equivalents</b> to enable meaningful comparisons across different gases such as carbon dioxide, methane, nitrous oxide, and fluorinated gases.
  </p>
</div>

```js
import * as d3 from "d3";

const data_en = d3.dsvFormat(";").parse((await FileAttachment("./data/data_en.csv").text()));
const geo_en = FileAttachment("./data/geo_en.json").json();

import { processEmissionData } from "./components/dataProcessing.js";
import { 
  createColorScale, 
  getEmissionForRegionClassificationYear, 
  getTotalEmissionAllYears, 
  getSectorBreakdownForAllRegions, 
  getSectorBreakdownForAllRegionsYears,
  getColorForSector
} from "./components/helpers.js";

// Process the CSV data.
const processedEmissionData = processEmissionData(data_en);

// Create a color scale based on processed data.
const colorScale = createColorScale(processedEmissionData, ["Total"]);
```

```js
function map(width) {
  const height = 500;
  const classification = "Total";
  const START_YEAR = 1990;
  const END_YEAR = 2022;

  // We'll start the map at a smaller scale (e.g., 80% size) and scale it up to full size.
  const minScale = 0.8;

  // Set up the projection and path generator.
  const projection = d3.geoMercator().fitSize([width, height], geo_en);
  const pathGenerator = d3.geoPath().projection(projection);

  // Create the main SVG element.
  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height);

  // Set the initial scale so the map loads at the smaller (minScale) size.
  svg.style("transform", `scale(${minScale})`);

  // Append a <defs> section to define a linear gradient for the overlaid year text.
  const defs = svg.append("defs");
  const gradient = defs.append("linearGradient")
    .attr("id", "yearGradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");
  gradient.append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#333333");
  gradient.append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#000000");

  // Draw the map paths using emission data for the initial year.
  const paths = svg.selectAll("path")
    .data(geo_en.features)
    .join("path")
    .attr("d", pathGenerator)
    .attr("stroke", "gray")
    .attr("stroke-width", 0.5)
    .attr("fill", d => {
      const emission = getEmissionForRegionClassificationYear(
        processedEmissionData,
        d.properties.name,
        classification,
        START_YEAR
      );
      return colorScale(emission);
    });

  // Add a centered text overlay that displays the current year.
  const yearOverlay = svg.append("text")
    .attr("x", width / 2)
    .attr("y", height / 2)
    .attr("font-family", "var(--sans-serif)")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .style("font-size", "80px")
    .style("font-weight", "bold")
    .style("fill", "url(#yearGradient)")
    .style("stroke", "black")
    .style("stroke-width", "2px")
    .style("opacity", 0.85)
    .text(START_YEAR);

  // Define dimensions for the legend.
  const legendWidth = 15;
  const legendHeight = 100;
  const legendMarginLeft = 275;
  const legendMarginTop = 25;

  // Create a new gradient for the legend.
  const legendGradient = defs.append("linearGradient")
    .attr("id", "legendGradient")
    // Vertical gradient: bottom (offset 0%) is the minimum and top (offset 100%) the maximum.
    .attr("x1", "0%")
    .attr("y1", "100%")
    .attr("x2", "0%")
    .attr("y2", "0%");

  // Assuming colorScale is a sequential scale with a defined domain,
  // generate stops by sampling the scale.
  const legendStops = 10;  // number of discrete stops in the legend
  const [minEmission, maxEmission] = colorScale.domain(); // the emission range
  for (let i = 0; i <= legendStops; i++) {
    const t = i / legendStops;
    // Interpolate an emission value between minEmission and maxEmission.
    const emissionValue = minEmission + t * (maxEmission - minEmission);
    legendGradient.append("stop")
      .attr("offset", `${t * 100}%`)
      .attr("stop-color", colorScale(emissionValue));
  }

  // Create a group to contain the legend (positioned in the top-right corner).
  const legendGroup = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${legendWidth + legendMarginLeft}, ${legendMarginTop})`);

  // Append a rectangle that is filled with the legend gradient.
  legendGroup.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legendGradient)")
    .attr("stroke", "gray")
    .attr("stroke-width", 1);

  // Create a scale for the legend axis.
  const legendScale = d3.scaleLinear()
    .domain([minEmission, maxEmission])
    .range([legendHeight, 0]);

  // Create and append the legend axis (to the right of the legend rectangle).
  const legendAxis = d3.axisRight(legendScale)
    .ticks(5);
  legendGroup.append("g")
    .attr("transform", `translate(${legendWidth}, 0)`)
    .call(legendAxis);
  //

  let currentYear = START_YEAR;

  // Listen for scroll events on the window.
  window.addEventListener("scroll", function () {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const container = document.getElementById("map-container");
    if (!container) return;

    // Define the trigger: animation starts when the container’s bottom edge enters the viewport.
    const animationStart = container.offsetTop + container.offsetHeight - window.innerHeight;

    // Define a fixed animation range equal to the viewport’s height.
    const animationRange = window.innerHeight;

    // Compute a progress value between 0 and 1.
    const progress = Math.min(Math.max((scrollTop - animationStart) / animationRange, 0), 1);

    // Use progress (optionally multiplied for a faster effect) for determining the year.
    const fastProgress = Math.min(progress * 2, 1);
    let newYear = Math.round(START_YEAR + fastProgress * (END_YEAR - START_YEAR));
    newYear = Math.max(START_YEAR, Math.min(END_YEAR, newYear));

    if (newYear !== currentYear) {
      currentYear = newYear;
      // Update state colors immediately.
      paths.interrupt().attr("fill", d => {
        const emission = getEmissionForRegionClassificationYear(
          processedEmissionData,
          d.properties.name,
          classification,
          currentYear
        );
        return colorScale(emission);
      });
      // Update the overlaid year text immediately.
      yearOverlay.interrupt().text(currentYear);
    }

    // Update the scaling: scale up linearly from minScale (at progress = 0) to full size (1) at progress = 1.
    const scale = minScale + progress * (1 - minScale);
    svg.style("transform", `scale(${scale})`);
  });

  return svg.node();
}
```

```js
function forceGridParticlesStaggeredRowsNoAnimOnYearChangeBorders(width) {
  // ------------------------------
  // Data Breakdown & Particle Computation
  // ------------------------------
  const breakdown = getSectorBreakdownForAllRegionsYears(processedEmissionData, "Total");
        
  // Particle settings.
  const r = 5;         // Particle radius.
  const d = 2.5 * r;   // Spacing between centers.
  const maxParticlesPerSector = 100;
  const scaleFactor = 1e7;

  // Get sorted sectors.
  const sectors = Object.keys(breakdown).sort();

  // First: Build the particles array (without grid positions) grouped by sector.
  let particles = [];
  sectors.forEach(sector => {
    let count = Math.round(breakdown[sector] / scaleFactor);
    count = Math.max(count, 1); // at least one particle
    count = Math.min(count, maxParticlesPerSector);
    for (let j = 0; j < count; j++) {
      particles.push({ sector, key: `${sector}_${j}` });
    }
  });
  console.log("Total particles computed:", particles.length);

  // ------------------------------
  // Fixed Grid Layout for Sector Blocks
  // ------------------------------
  // Instead of one global grid, we compute grid positions for each sector “block.”
  const fixedColumns = 12; // 10 particles per row within each block.
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  const blockGap = 30; // vertical gap between the sector blocks.
  
  let particlesWithGrid = [];
  let blocks = []; // Will hold each sector block's boundaries.
  let currentYOffset = margin.top;
  
  // Compute positions per sector block and record each block’s dimensions.
  sectors.forEach(sector => {
    // Filter particles for this sector.
    const sectorParticles = particles.filter(p => p.sector === sector);
    const count = sectorParticles.length;
    // Determine how many rows are needed.
    const rowsInBlock = Math.ceil(count / fixedColumns);
    
    // Record this block's boundary (you can adjust the width/height if needed).
    blocks.push({
      sector: sector,
      x: margin.left,
      y: currentYOffset,
      width: fixedColumns * d,
      height: rowsInBlock * d
    });
    
    // Compute grid positions for particles in this block.
    sectorParticles.forEach((p, i) => {
      const col = i % fixedColumns;
      const row = Math.floor(i / fixedColumns);
      const gridX = margin.left + r + col * d;
      const gridY = currentYOffset + r + row * d;
      particlesWithGrid.push({ ...p, gridX, gridY, row, col });
    });
    
    // Update the current vertical offset for the next block.
    currentYOffset += rowsInBlock * d + blockGap;
  });
  particles = particlesWithGrid;
  
  // Compute overall SVG dimensions.
  const overallWidth = margin.left + fixedColumns * d + margin.right + 150;
  const overallHeight = currentYOffset + margin.bottom;
  
  // ------------------------------
  // Create the SVG Container & Color Scale
  // ------------------------------
  const svg = d3.create("svg")
    .attr("width", overallWidth)
    .attr("height", overallHeight);
  
  const sectorColor = d3.scaleOrdinal()
    .domain(sectors)
    .range(d3.schemeCategory10);
  
  // ------------------------------
  // Draw the Particles
  // ------------------------------
  // Create nodes starting at the left edge.
  const nodes = particles.map(d => ({
    ...d,
    x: margin.left + r,
    y: d.gridY
  }));
  
  const circles = svg.selectAll("circle")
    .data(nodes, d => d.key)
    .enter()
    .append("circle")
    .attr("r", r)
    .attr("fill", d => sectorColor(d.sector))
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("opacity", 0);
  
  // ------------------------------
  // Transition: Animate Particles
  // ------------------------------
  const fixedDuration = 200; // horizontal movement duration in ms
  const maxDelay = 200;      // max delay based on vertical position
  
  circles.transition()
    .delay(d => ((d.gridY - margin.top) / (overallHeight - margin.top)) * maxDelay)
    .duration(fixedDuration)
    .attr("cx", d => d.gridX)
    .attr("opacity", 1);

  // ------------------------------
  // Append Border Rectangles for Each Sector Block
  // ------------------------------
  // The border is drawn with a stroke-dasharray/dashoffset trick.
  const baseBorderDelay = 500;    // overall delay after circles animate
  const borderDuration = 700;     // duration of each border animation
  const borderPadding = 4;
  
  const borderRects = svg.selectAll("rect.sector-border")
    .data(blocks)
    .enter()
    .append("rect")
    .attr("class", "sector-border")
    .attr("x", d => d.x - borderPadding)
    .attr("y", d => d.y - borderPadding)
    .attr("width", d => d.width + 2 * borderPadding)
    .attr("height", d => d.height + 2 * borderPadding)
    .attr("fill", "none")
    .attr("stroke", d => sectorColor(d.sector))
    .attr("stroke-width", 2)
    .each(function(d) {
      // Compute the total perimeter length of the rectangle.
      d.totalLength = 2 * (d.width + d.height + borderPadding**2);
    })
    .attr("stroke-dasharray", d => d.totalLength)
    .attr("stroke-dashoffset", d => d.totalLength);
  
  // Sequentially animate each border drawing.
  // Each rectangle's animation is delayed so that they occur one after the other.
  borderRects.transition()
    .delay((d, i) => baseBorderDelay + i * (borderDuration + 100))
    .duration(borderDuration)
    .attr("stroke-dashoffset", 0);

  // ------------------------------
  // Animate Sector Descriptions
  // ------------------------------
  // Append a text label for each sector block.
  // These labels start off hidden and fade in concurrently with their block border.
  const sectorLabels = svg.selectAll("text.sector-label")
    .data(blocks)
    .enter()
    .append("text")
    .attr("class", "sector-label")
    // Position the label slightly above the block.
    .attr("x", d => d.x - borderPadding)
    .attr("y", d => d.y - 5 - borderPadding)
    .text(d => d.sector)
    .attr("fill", d => sectorColor(d.sector))
    .attr("font-size", "12px")
    .attr("opacity", 0);
  
  sectorLabels.transition()
    .delay((d, i) => baseBorderDelay + i * (borderDuration + 100))
    .duration(300)
    .attr("opacity", 1);
  
  return svg.node();
}
```

```js
function createStackedAreaChartWithScroll(width) {
  // Setup Parameters and Data Transformation
  const START_YEAR = 1990;
  const END_YEAR = 2022;
  let currentYear = START_YEAR;
  
  // Build a full time-series dataset.
  // We assume processedEmissionData is structured as:
  // { region: { "Total": { sector: { year: emission } } } }
  
  // 1. Collect all unique years.
  const yearsSet = new Set();
  for (const region in processedEmissionData) {
    if (!processedEmissionData.hasOwnProperty(region)) continue;
    const classificationData = processedEmissionData[region]?.["Total"];
    if (!classificationData) continue;
    for (const sector in classificationData) {
      const sectorData = classificationData[sector];
      for (const yr in sectorData) {
        yearsSet.add(+yr);
      }
    }
  }
  const years = Array.from(yearsSet).sort((a, b) => a - b);
  
  // 2. Build one record per year:
  // Each record is { year, "Sector A": value, "Sector B": value, ... }
  const seriesData = {};
  years.forEach(year => {
    seriesData[year] = { year };
  });
  
  for (const region in processedEmissionData) {
    if (!processedEmissionData.hasOwnProperty(region)) continue;
    const classificationData = processedEmissionData[region]?.["Total"];
    if (!classificationData) continue;
    for (const sector in classificationData) {
      const sectorData = processedEmissionData[region]["Total"][sector];
      for (const yr in sectorData) {
        const yearNum = +yr;
        seriesData[yearNum][sector] = (seriesData[yearNum][sector] || 0) + sectorData[yr];
      }
    }
  }
  
  // Full dataset for all years.
  const fullData = Object.values(seriesData).sort((a, b) => a.year - b.year);
  
  // Extract sectors (all keys except "year").
  const sectorsSet = new Set();
  fullData.forEach(d => {
    Object.keys(d).forEach(key => { if (key !== "year") sectorsSet.add(key); });
  });
  const sectors = Array.from(sectorsSet).sort();
  
  // SVG and Scale Setup
  const height = 500;
  const margin = { top: 20, right: 100, bottom: 30, left: 100 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  // x-scale: using the full time span.
  const xScale = d3.scaleLinear()
    .domain([START_YEAR, END_YEAR])
    .range([0, chartWidth]);
  
  // y-scale: Will be computed based on the filtered (stacked) data.
  let yScale = d3.scaleLinear()
    .domain([0, 1])
    .range([chartHeight, 0]);
  
  // Generators: Area and Line
  const area = d3.area()
    .x(d => xScale(d.data.year))
    .y0(d => yScale(d[0]))
    .y1(d => yScale(d[1]));
  
  const line = d3.line()
    .x(d => xScale(d.data.year))
    .y(d => yScale(d[1]));
  
  // Create SVG Container and Axes Groups
  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height);
  
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  const xAxisGroup = g.append("g")
    .attr("transform", `translate(0, ${chartHeight})`);
  
  const yAxisGroup = g.append("g");
  
  // Draw x-axis.
  xAxisGroup.call(d3.axisBottom(xScale).tickFormat(d3.format("d")))
    .append("text")
      .attr("x", chartWidth)
      .attr("y", -10)
      .attr("fill", "black")
      .style("text-anchor", "end")
      .text("Year");
  
  // Stack Setup
  const stack = d3.stack()
    .keys(sectors)
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);
  
  // Helper: filter fullData to include only records up to a given year.
  function getFilteredData(yearCutoff) {
    return fullData.filter(d => d.year <= yearCutoff);
  }
  
  // Initial filtered data for currentYear.
  let filteredData = getFilteredData(currentYear);
  let series = stack(filteredData);
  
  // Update y-scale domain based on filtered series.
  function updateYScale(seriesData) {
    const yMax = d3.max(seriesData, s => d3.max(s, d => d[1]));
    yScale.domain([0, yMax]).nice();
  }
  
  updateYScale(series);
  yAxisGroup.call(d3.axisLeft(yScale));
  
  // Draw the Stacked Areas and Lines
  let seriesGroup = g.selectAll(".series")
    .data(series, d => d.key)
    .join("g")
      .attr("class", "series");
  
  // Append the area paths.
  seriesGroup.append("path")
    .attr("class", "area")
    .attr("d", area)
    .attr("fill", (d, i) => getColorForSector(d.key))
    .attr("opacity", 0.7);
  
  // Append the line paths.
  seriesGroup.append("path")
    .attr("class", "line")
    .attr("d", line)
    .attr("fill", "none")
    .attr("stroke", (d, i) => getColorForSector(d.key))
    .attr("stroke-width", 2);
  
  // Update Function: Update the Chart for a New Year
  function updateChart(newYear) {
    // Filter data up to newYear.
    filteredData = getFilteredData(newYear);
    series = stack(filteredData);
    updateYScale(series);
    
    // Update y-axis.
    yAxisGroup.transition().duration(100).call(d3.axisLeft(yScale));
    
    // Rebind data to series groups.
    seriesGroup = g.selectAll(".series")
      .data(series, d => d.key);
    
    // Update both the area and line paths concurrently.
    seriesGroup.select("path.area")
      .transition()
      .duration(0)
      .attr("d", area);
      
    seriesGroup.select("path.line")
      .transition()
      .duration(0)
      .attr("d", line);
  }
  
  // Scroll-Triggered Animation: Start When Container's Bottom is Visible
  function onScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    // Use the container's ID "line-container".
    const containerEl = document.getElementById("line-container");
    if (!containerEl) return;
    // Compute the trigger point: when the bottom edge of the container becomes visible.
    const animationStart = containerEl.offsetTop + containerEl.offsetHeight - window.innerHeight + 10;
    // Use a reduced animation range so that progress reaches 100% faster.
    const animationRange = window.innerHeight / 3.5; 
    const progress = Math.min(Math.max((scrollTop - animationStart) / animationRange, 0), 1);
    const newYear = Math.round(START_YEAR + progress * (END_YEAR - START_YEAR));
    if (newYear !== currentYear) {
      currentYear = newYear;
      updateChart(newYear);
    }
  }

  // Draw horizontal grid line
  // Create a grid for horizontal lines using the y-scale ticks.
  /*const yGrid = d3.axisLeft(yScale)
    .tickSize(-chartWidth)   // Extend each tick across the chart width.
    .tickFormat("");         // Remove the tick labels.

  // Append a group for the grid lines.
  // Note: append this group before drawing chart content so grid lines appear behind.
  g.append("g")
    .attr("color", "gray")
    .attr("opacity", "0.4")
    .call(yGrid);*/

  // Add tooltip
  // Define a formatter for values in millions.
  const formatMillions = d3.format(".2f");

  // Define a formatter for percentages (d3 multiplies by 100).
  const formatPercent = d3.format(".1%");

  // Create a tooltip div appended to the page.
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "rgba(255,255,255,0.9)")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("padding", "8px")
    .style("pointer-events", "none")
    .style("opacity", 0);

  // Append an overlay rectangle over the chart area to capture mouse events.
  const overlay = g.append("rect")
    .attr("class", "overlay")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .style("fill", "none")
    .style("pointer-events", "all");

  // Append a vertical dotted line indicator (cursor).
  const focusLine = g.append("line")
    .attr("class", "focus-line")
    .attr("stroke", "black")
    .attr("stroke-dasharray", "4 2")
    .attr("stroke-width", 1)
    .attr("y1", 0)
    .attr("y2", chartHeight)
    .style("opacity", 0);

  // Mouse Event Handlers for the Overlay.
  overlay.on("mouseover", function(event) {
      tooltip.transition().duration(200).style("opacity", 0.9);
    })
    .on("mousemove", function(event) {
      // Get the mouse coordinates relative to the chart group.
      const [mx, my] = d3.pointer(event);

      // Convert mouse x position into a continuous year value.
      const xValue = xScale.invert(mx);

      // Use a bisector to find the closest year in fullData.
      const bisect = d3.bisector(d => d.year).left;
      let i = bisect(fullData, xValue);
      if (i >= fullData.length) i = fullData.length - 1;
      const d0 = fullData[i - 1];
      const d1 = fullData[i];
      const hoveredYear = !d0 ? fullData[0].year :
                            (!d1 ? fullData[fullData.length - 1].year :
                            (Math.abs(xValue - d0.year) <= Math.abs(d1.year - xValue) ? d0.year : d1.year));

      // Compute the x position for the vertical dotted line.
      const lineX = xScale(hoveredYear);
      focusLine.attr("x1", lineX)
              .attr("x2", lineX)
              .style("opacity", 1);

      // If the hovered year exceeds currentYear (data not yet revealed), show a message.
      if (hoveredYear > currentYear) {
        tooltip.html(`<strong>Year:</strong> ${hoveredYear}<br/>Data not available`)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
        return;
      }

      // Get the data record for the hovered year.
      const dataForYear = fullData.find(d => d.year === hoveredYear);
      if (!dataForYear) return;

      // Compute the total value for the year so percentages can be calculated.
      const totalYearValue = sectors.reduce((acc, sector) => acc + (dataForYear[sector] || 0), 0);

      // Compute the maximum raw value for that year to scale the mini bars.
      const maxValue = d3.max(sectors, sector => dataForYear[sector] || 0);

      // Build the tooltip HTML with a vertical list detailing each sector.
      // The text is always above the mini bar.
      console.log(totalYearValue);
      let htmlContent = `
      <div class="class="tooltip-year">
        <strong>Year:</strong> ${hoveredYear}
      </div>
      <div>
        <span style="font-weight:bold;">Total:</span> ${formatMillions(totalYearValue / 1e6) + "M"} t CO2-eq
      </div>
      <hr class="tooltip-hr"/>`;
      sectors.forEach(sector => {
        const rawValue = dataForYear[sector] || 0;
        const valueInMillions = rawValue / 1e6;
        const formattedValue = formatMillions(valueInMillions) + "M";
        const percentage = totalYearValue > 0 ? rawValue / totalYearValue : 0;
        const formattedPercent = formatPercent(percentage);
        const barWidthPercentage = maxValue > 0 ? (rawValue / maxValue * 100) : 0;
        
        htmlContent += `
          <div class="tooltip-box">
            <div>
              <span style="display:inline-block; width:10px; height:10px; background-color:${getColorForSector(sector)}; vertical-align: middle; margin-right:5px;"></span>
              <span style="font-weight:bold;">${sector}:</span> ${formattedValue} t CO2-eq (<span style="color:gray;">${formattedPercent}</span>)
            </div>
            <div style="background:${getColorForSector(sector)}; height:8px; width:${barWidthPercentage}%; margin-top:4px;"></div>
          </div>
        `;
      });

      // Update the tooltip's content and position.
      tooltip.html(htmlContent)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      tooltip.transition().duration(200).style("opacity", 0);
      focusLine.style("opacity", 0);
    });


  
  window.addEventListener("scroll", onScroll);
  onScroll(); // trigger once on load
  
  return svg.node();
}
```

```js
function createSectorListElement() {
  const sectors = [
    "Industry",
    "Energy", 
    "Buildings",
    "Transport",
    "Farming",
    "Waste management",
    "Traffic",
    "F-Gases",
  ];

  const ul = document.createElement("ul");
  ul.style.display = "flex";
  ul.style.flexWrap = "wrap";
  ul.style.gap = "0.5em";
  ul.style.padding = "0";
  ul.style.margin = "0";
  ul.style.listStyle = "none";
  ul.style.fontFamily = "sans-serif"; 
  ul.style.justifyContent = "center";

  sectors.forEach(sector => {
    const key = sector.includes("/") ? sector.split(" / ")[0] : sector;
    const color = getColorForSector(key);
    const li = document.createElement("li");

    li.textContent = sector;
    li.style.backgroundColor = color;
    li.style.color = ["#f1c232", "#00F5D4", "#95d2bd"].includes(color) ? "#000" : "#fff";
    li.style.padding = "0.5em 1em";
    li.style.marginBottom = "0.4em";
    li.style.borderRadius = "0.4em";
    li.style.fontWeight = "bold";
    li.style.width = "fit-content";

    ul.appendChild(li);
  });

  return ul;
}
```

<div class="grid grid-cols-1" style="grid-auto-rows: 504px;">
  <div id="map-container">${
    resize((width) => map(width))
  }</div>
</div>

<div class="hero" style="margin-bottom: 50px;">
  <p style="text-align: justify">The graph clearly shows that Upper Austria produced the highest greenhouse gas emission between 1990 and 2022. 
  Next, we will shift our focus on the individual sectors.</p>
  <p style="text-align: justify"> The greenhouse gas emissions are additionally categorized into serveral key <b>sectors</b> that reflect the primary sources of emissions across Austria. Each record in this dataset is assigned to one of these sectors. This sector-based classification helps distinguish between domenstic sources (e.g. buildings or mobility) and industrial emissions. These sectors include:
  </p>
  <div>${
    createSectorListElement()
  }
  </div>
</div>

<div class="grid grid-cols-1" style="grid-auto-rows: 504px; margin: 0 12rem;">
  <div id="line-container">${
    resize((width) => createStackedAreaChartWithScroll(width))
  }</div>
</div>

<style>

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: var(--sans-serif);
  margin: 3rem 0 8rem;
  text-wrap: balance;
  text-align: center;
}

.hero h1 {
  margin: 1rem 0;
  padding: 1rem 0;
  max-width: none;
  font-size: 14vw;
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(30deg, var(--theme-foreground-focus), currentColor);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero h2 {
  margin: 0;
  max-width: 34em;
  font-size: 20px;
  font-style: initial;
  font-weight: 500;
  line-height: 1.5;
  color: var(--theme-foreground-muted);
}

.tooltip-year {
  margin-bottom: 0;
}

.tooltip-hr {
  margin: 0px 0;
}

.tooltip-box {
  margin-bottom: 8px;
}

@media (min-width: 640px) {
  .hero h1 {
    font-size: 90px;
  }
}

</style>
