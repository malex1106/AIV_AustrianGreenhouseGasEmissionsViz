// This script takes the loaded CSV data and processes it.
export function processEmissionData(data_en) {
  return data_en.reduce((acc, d) => {
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
}
