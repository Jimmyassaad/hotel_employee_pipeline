/**
 * Map country name (various forms) → ISO 3166-1 alpha-3.
 * Normalize input with trim + title-case lookup where needed.
 */

const COUNTRY_TO_ISO3: Record<string, string> = {
  // United Kingdom & constituents
  "United Kingdom": "GBR",
  "UK": "GBR",
  "Great Britain": "GBR",
  "England": "GBR",
  "Scotland": "GBR",
  "Wales": "GBR",
  "Northern Ireland": "GBR",

  // Common names
  "United States": "USA",
  "United States of America": "USA",
  "USA": "USA",
  "US": "USA",
  "America": "USA",

  "Australia": "AUS",
  "Austria": "AUT",
  "Belgium": "BEL",
  "Canada": "CAN",
  "China": "CHN",
  "Czech Republic": "CZE",
  "Czechia": "CZE",
  "Denmark": "DNK",
  "Finland": "FIN",
  "France": "FRA",
  "Germany": "DEU",
  "Greece": "GRC",
  "Hong Kong": "HKG",
  "Hungary": "HUN",
  "India": "IND",
  "Indonesia": "IDN",
  "Ireland": "IRL",
  "Republic of Ireland": "IRL",
  "Italy": "ITA",
  "Japan": "JPN",
  "Malaysia": "MYS",
  "Mexico": "MEX",
  "Netherlands": "NLD",
  "New Zealand": "NZL",
  "Norway": "NOR",
  "Philippines": "PHL",
  "Poland": "POL",
  "Portugal": "PRT",
  "Singapore": "SGP",
  "South Africa": "ZAF",
  "South Korea": "KOR",
  "Korea": "KOR",
  "Spain": "ESP",
  "Sweden": "SWE",
  "Switzerland": "CHE",
  "Thailand": "THA",
  "Turkey": "TUR",
  "Türkiye": "TUR",
  "United Arab Emirates": "ARE",
  "UAE": "ARE",
  "Emirates": "ARE",
  "Vietnam": "VNM",
  "Viet Nam": "VNM",
};

/** Default ISO3 when country is unknown */
const UNKNOWN_ISO3 = "XXX";

/**
 * Get ISO3 code for a country name.
 * Tries exact match first, then trimmed, then title-case.
 */
export function countryToIso3(country: string): string {
  if (!country || typeof country !== "string") return UNKNOWN_ISO3;
  const trimmed = country.trim();
  if (!trimmed) return UNKNOWN_ISO3;
  const exact = COUNTRY_TO_ISO3[trimmed];
  if (exact) return exact;
  const title = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  return COUNTRY_TO_ISO3[title] ?? COUNTRY_TO_ISO3[trimmed] ?? UNKNOWN_ISO3;
}

export { COUNTRY_TO_ISO3 };
