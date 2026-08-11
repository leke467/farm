/**
 * Formats a monetary number with standard thousands separators (commas) and decimal places.
 * Default symbol is Naira (₦) or custom currency symbol.
 * Example: 4750000 -> "₦4,750,000.00"
 * Example: 1250.5 -> "₦1,250.50"
 */
export function formatCurrency(amount, symbol = "₦", decimals = 2) {
  const cleanSymbol = !symbol || symbol === "?" || symbol === "â‚¦" ? "₦" : symbol;
  const num = Number(amount);
  if (isNaN(num)) return `${cleanSymbol}0.00`;
  return `${cleanSymbol}${num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function getFarmCurrencySymbol(activeFarm = null) {
  let symbol = activeFarm?.currency_symbol;
  if (!symbol || symbol === "?" || symbol === "â‚¦" || symbol === "") {
    return activeFarm?.currency === "USD" ? "$" : "₦";
  }
  return symbol;
}

/**
 * Formats currency using the farm owner's active farm currency symbol configuration.
 */
export function formatFarmCurrency(amount, activeFarm = null, decimals = 2) {
  const symbol = getFarmCurrencySymbol(activeFarm);
  return formatCurrency(amount, symbol, decimals);
}

/**
 * Formats a raw number with thousands separators (commas) without currency symbol.
 * Example: 4750000 -> "4,750,000"
 */
export function formatNumber(amount, decimals = 0) {
  const num = Number(amount);
  if (isNaN(num)) return "0";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Generates a clean URL slug for a farm name.
 * Example: "adehi" -> "adehifarm"
 * Example: "benson" -> "bensonfarm"
 */
export function toFarmSlug(farmOrName) {
  const rawName = typeof farmOrName === "string" ? farmOrName : (farmOrName?.name || "");
  if (!rawName) return "farmname";
  let cleaned = rawName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "");
  if (!cleaned) return "farmname";
  return cleaned;
}
