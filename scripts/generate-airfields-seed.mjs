import fs from "fs";
import readline from "readline";

function parseCSVLine(line) {
  const result = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      result.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

function sqlEscape(value) {
  return value.replace(/'/g, "''");
}

const countries = new Set(["HR", "IT", "SI"]);
const types = new Set(["small_airport", "medium_airport"]);
const inputPath = new URL("../.tmp_airports.csv", import.meta.url);
const outputPath = new URL("../supabase/seed/airfields.sql", import.meta.url);

const rows = [];
const rl = readline.createInterface({
  input: fs.createReadStream(inputPath, { encoding: "utf8" }),
});

let headers = null;
for await (const line of rl) {
  if (!headers) {
    headers = parseCSVLine(line);
    continue;
  }
  const vals = parseCSVLine(line);
  const o = Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? ""]));
  if (!countries.has(o.iso_country)) continue;
  if (!types.has(o.type)) continue;
  if (!o.ident || o.ident[0] !== "L") continue;
  rows.push(o);
}

rows.sort((a, b) => a.ident.localeCompare(b.ident));

const lines = [
  "-- Seed airfields from OurAirports (https://ourairports.com/data/airports.csv)",
  "-- Filter: HR, IT, SI | small_airport, medium_airport | ICAO ident starting with L",
  `-- Generated: ${new Date().toISOString()}`,
  `-- Rows: ${rows.length}`,
  "",
  "INSERT INTO public.airfields (",
  "  icao_code,",
  "  name,",
  "  city,",
  "  country,",
  "  latitude,",
  "  longitude,",
  "  elevation_ft",
  ")",
  "VALUES",
];

const valueLines = rows.map((r) => {
  const city = r.municipality.trim() || null;
  const elevation = r.elevation_ft.trim();
  const elevationSql =
    elevation === "" || Number.isNaN(Number(elevation)) ? "NULL" : elevation;
  const citySql = city ? `'${sqlEscape(city)}'` : "NULL";
  return `  ('${sqlEscape(r.ident)}', '${sqlEscape(r.name)}', ${citySql}, '${sqlEscape(r.iso_country)}', ${r.latitude_deg}, ${r.longitude_deg}, ${elevationSql})`;
});

lines.push(valueLines.join(",\n"));
lines.push("ON CONFLICT (icao_code) DO UPDATE SET");
lines.push("  name = EXCLUDED.name,");
lines.push("  city = EXCLUDED.city,");
lines.push("  country = EXCLUDED.country,");
lines.push("  latitude = EXCLUDED.latitude,");
lines.push("  longitude = EXCLUDED.longitude,");
lines.push("  elevation_ft = EXCLUDED.elevation_ft,");
lines.push("  updated_at = now();");
lines.push("");

fs.mkdirSync(new URL("../supabase/seed/", import.meta.url), { recursive: true });
fs.writeFileSync(outputPath, lines.join("\n"), "utf8");

const byCountry = rows.reduce((acc, r) => {
  acc[r.iso_country] = (acc[r.iso_country] ?? 0) + 1;
  return acc;
}, {});

console.log(`Wrote ${rows.length} rows to ${outputPath.pathname}`);
console.log("By country:", byCountry);
