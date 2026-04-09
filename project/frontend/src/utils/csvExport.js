/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Filename for the CSV file
 */
export const exportToCSV = (data, filename = "export.csv") => {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  // Get all unique keys from the data
  const keys = Object.keys(data[0]);

  // Create CSV header
  const header = keys.join(",");

  // Create CSV rows
  const rows = data.map((item) => {
    return keys
      .map((key) => {
        let value = item[key];

        // Handle nested objects
        if (typeof value === "object" && value !== null) {
          value = value.name || value.id || JSON.stringify(value);
        }

        // Escape commas and quotes in values
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }

        return value ?? "";
      })
      .join(",");
  });

  // Combine header and rows
  const csv = [header, ...rows].join("\n");

  // Create blob and download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Format data for CSV export from dashboard tables
 * @param {Array} records - Array of records
 * @param {Array} selectedFields - Fields to include (optional - if not provided, all fields are included)
 * @returns {Array} Formatted data ready for CSV export
 */
export const formatRecordsForCSV = (records, selectedFields = null) => {
  if (!records || records.length === 0) return [];

  return records.map((record) => {
    const formatted = {};

    if (selectedFields) {
      selectedFields.forEach((field) => {
        formatted[field] = record[field];
      });
    } else {
      // Include all non-sensitive fields
      Object.keys(record).forEach((key) => {
        if (!key.startsWith("_") && key !== "id" && key !== "created_at" && key !== "updated_at") {
          formatted[key] = record[key];
        }
      });
    }

    return formatted;
  });
};
