import { writeFileSync } from "fs";

const projectId = "vdtprfojirdayvfwnver";
const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!token) {
  console.error("Set SUPABASE_ACCESS_TOKEN to generate types");
  process.exit(1);
}

const res = await fetch(
  `https://api.supabase.com/v1/projects/${projectId}/types/typescript`,
  { headers: { Authorization: `Bearer ${token}` } }
);

if (!res.ok) {
  console.error(await res.text());
  process.exit(1);
}

const body = await res.json();
writeFileSync("types/database.ts", body.types ?? body);
console.log("Wrote types/database.ts");
