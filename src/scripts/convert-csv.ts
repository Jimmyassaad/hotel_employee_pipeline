/**
 * Converts raw.csv to normalized src/data/data.json.
 * - Deduplicates hotels by hmid
 * - Maps country → ISO3
 * - Generates employee UUIDs
 */

import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import Papa from "papaparse";
import { countryToIso3 } from "../lib/countryIso";
import type { Hotel, Employee, EmployeeCategory, CrmData } from "../lib/types";

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const RAW_CSV = path.join(PROJECT_ROOT, "raw.csv");
const OUT_JSON = path.join(PROJECT_ROOT, "src", "data", "data.json");

interface CsvRow {
  hmid: string;
  "First Name": string;
  LastName: string;
  Hotel: string;
  City: string;
  Country: string;
  Function: string;
  Category: string;
  Email: string;
  "Company Linkedin": string;
  "Person Linkedin": string;
}

function parseCsv(filePath: string): CsvRow[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const parsed = Papa.parse<CsvRow>(content, {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length) {
    console.warn("CSV parse warnings:", parsed.errors);
  }
  return parsed.data;
}

function normalizeCategory(raw: string): EmployeeCategory {
  const s = (raw ?? "").trim().toLowerCase();
  if (s === "groups") return "Groups";
  return "Sales"; // default
}

function main(): void {
  if (!fs.existsSync(RAW_CSV)) {
    console.error(`Missing ${RAW_CSV}. Place your CSV there (e.g. copy from "Countries of Sales_Groups Employees - Sales_Groups London Employees.csv").`);
    process.exit(1);
  }

  const rows = parseCsv(RAW_CSV);

  const hotelsById = new Map<string, Hotel>();
  const employees: Employee[] = [];

  for (const row of rows) {
    const hmid = String(row.hmid ?? "").trim();
    if (!hmid) continue;

    const country = String(row.Country ?? "").trim();
    const iso3 = countryToIso3(country);

    if (!hotelsById.has(hmid)) {
      hotelsById.set(hmid, {
        id: hmid,
        name: String(row.Hotel ?? "").trim(),
        city: String(row.City ?? "").trim(),
        country: country || "Unknown",
        iso3,
      });
    }

    const firstName = String(row["First Name"] ?? "").trim();
    const lastName = String(row.LastName ?? "").trim();
    const email = String(row.Email ?? "").trim();
    employees.push({
      id: randomUUID(),
      hotelId: hmid,
      firstName,
      lastName,
      role: String(row.Function ?? "").trim(),
      category: normalizeCategory(row.Category),
      email,
      companyLinkedin: String(row["Company Linkedin"] ?? "").trim(),
      personLinkedin: String(row["Person Linkedin"] ?? "").trim(),
      searchIndex: `${firstName} ${lastName} ${email}`.toLowerCase(),
    });
  }

  const data: CrmData = {
    hotels: Array.from(hotelsById.values()),
    employees,
  };

  const outDir = path.dirname(OUT_JSON);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(OUT_JSON, JSON.stringify(data, null, 2), "utf-8");

  console.log(`Wrote ${data.hotels.length} hotels, ${data.employees.length} employees → ${OUT_JSON}`);
}

main();
