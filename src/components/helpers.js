import * as d3 from "d3";

export function getEmissionForRegionClassificationYear(
  processedEmissionData,
  region,
  classification,
  year
) {
  if (!processedEmissionData[region] || !processedEmissionData[region][classification]) {
    return 0;
  }
  return Object.keys(processedEmissionData[region][classification]).reduce((sum, sector) => {
    return sum + (processedEmissionData[region][classification][sector][year] || 0);
  }, 0);
}

export function getMaxEmissionForYear(
  processedEmissionData,
  year,
  selectedClassifications,
  selectedRegions
) {
  // Convert year to a string in case keys in the data are strings.
  const yearKey = year.toString();

  return d3.max(selectedRegions, region => {
    let regionTotal = 0;
    
    selectedClassifications.forEach(cls => {
      const classificationData = processedEmissionData[region]?.[cls];
      if (!classificationData) {
        console.warn(`No data for region "${region}" and classification "${cls}"`);
        return;
      }
      // Iterate over each sector under this classification
      Object.keys(classificationData).forEach(sector => {
        const emission = classificationData[sector]?.[yearKey] || 0;
        regionTotal += emission;
      });
    });
    return regionTotal;
  });
}


export function getMaxEmissionAllYears(processedEmissionData, selectedClassifications, selectedRegions) {
  const years = Array.from(
    new Set(
      Object.values(processedEmissionData).flatMap(region =>
        selectedClassifications.flatMap(cls =>
          Object.values(region[cls] || {}) // iterate over each sector
            .flatMap(sectorData => Object.keys(sectorData))
        )
      )
    )
  ).map(Number);

  return d3.max(years, year =>
    getMaxEmissionForYear(processedEmissionData, year, selectedClassifications, selectedRegions)
  );
}

export function getSectorBreakdownForAllRegions(processedEmissionData, year, classification) {
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

export function getSectorBreakdownForAllRegionsYears(processedEmissionData, classification) {
  const result = {};

  Object.keys(processedEmissionData).forEach(region => {
    // Exclude Austria (or any other region you wish to skip).
    if (
      processedEmissionData[region] &&
      processedEmissionData[region][classification] &&
      region.toLowerCase() !== "austria"
    ) {
      // Iterate over each sector within this region for the given classification.
      Object.keys(processedEmissionData[region][classification]).forEach(sector => {
        const sectorData = processedEmissionData[region][classification][sector];
        // Sum emissions for all years in this sector.
        const sectorTotal = Object.values(sectorData).reduce(
          (sum, emission) => sum + (emission || 0),
          0
        );
        result[sector] = (result[sector] || 0) + sectorTotal;
      });
    }
  });

  return result;
}


export function createColorScale(processedEmissionData, classification) {
  const selectedRegions = Object.keys(processedEmissionData);
  const maxEmission = getMaxEmissionAllYears(processedEmissionData, [classification], selectedRegions);
  return d3.scaleSequential(d3.interpolateBlues).domain([0, maxEmission]);
}

export function getColorForSector(sector) {
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