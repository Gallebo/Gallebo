/**
 * Remove dummy pilots seeded by seed-dummy-flights.mjs and refresh route benchmarks.
 * Marker: emails matching dummy.pilotN@gallebo-internal.test
 *
 * Usage:
 *   node --env-file=.env.local scripts/cleanup-dummy-flights.mjs
 *
 * Order matters:
 * 1) snapshot route triples + storage paths (profile, aircraft, flight photos)
 * 2) auth.admin.deleteUser (CASCADE DB rows)
 * 3) storage.remove (objects are NOT cascaded)
 * 4) refresh_route_price_benchmark for each affected route
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const DUMMY_EMAIL_RE = /^dummy\.pilot\d+@gallebo-internal\.test$/i;

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function requireEnv() {
  loadEnvFile(path.join(ROOT, ".env.local"));
  loadEnvFile(path.join(ROOT, ".env"));

  const url =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY. Load .env.local or pass --env-file.",
    );
    process.exit(1);
  }
  return { url, key };
}

async function listAllUsers(supabase) {
  const users = [];
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw new Error(`listUsers: ${error.message}`);
    const batch = data?.users ?? [];
    users.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
  }
  return users;
}

async function main() {
  const { url, key } = requireEnv();
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const dummyUsers = (await listAllUsers(supabase)).filter((u) =>
    DUMMY_EMAIL_RE.test(u.email ?? ""),
  );

  if (dummyUsers.length === 0) {
    console.log("No dummy pilots found. Nothing to clean up.");
    process.exit(0);
  }

  const userIds = dummyUsers.map((u) => u.id);
  console.log(`Found ${userIds.length} dummy pilot(s):`);
  for (const u of dummyUsers) {
    console.log(`  ${u.id}  ${u.email}`);
  }

  const { data: flights, error: flErr } = await supabase
    .from("flights")
    .select(
      "id, departure_airfield_id, arrival_airfield_id, flight_type, pilot_user_id",
    )
    .in("pilot_user_id", userIds);

  if (flErr) {
    console.error(`flights snapshot failed: ${flErr.message}`);
    process.exit(1);
  }

  const flightCount = flights?.length ?? 0;
  /** @type {Map<string, {p_departure: string, p_arrival: string, p_type: string}>} */
  const routeTriples = new Map();
  for (const f of flights ?? []) {
    const key = `${f.departure_airfield_id}|${f.arrival_airfield_id}|${f.flight_type}`;
    routeTriples.set(key, {
      p_departure: f.departure_airfield_id,
      p_arrival: f.arrival_airfield_id,
      p_type: f.flight_type,
    });
  }

  const { data: profiles, error: profErr } = await supabase
    .from("profiles")
    .select("id, avatar_path")
    .in("id", userIds);

  if (profErr) {
    console.error(`profiles snapshot failed: ${profErr.message}`);
    process.exit(1);
  }

  const avatarPaths = (profiles ?? [])
    .map((p) => p.avatar_path)
    .filter((p) => typeof p === "string" && p.length > 0);

  const { data: aircraftRows, error: acErr } = await supabase
    .from("aircraft")
    .select("id")
    .in("pilot_user_id", userIds);

  if (acErr) {
    console.error(`aircraft snapshot failed: ${acErr.message}`);
    process.exit(1);
  }

  const aircraftIds = (aircraftRows ?? []).map((a) => a.id);
  let aircraftPhotoPaths = [];
  if (aircraftIds.length > 0) {
    const { data: photos, error: photoErr } = await supabase
      .from("aircraft_photos")
      .select("storage_path")
      .in("aircraft_id", aircraftIds);

    if (photoErr) {
      console.error(`aircraft_photos snapshot failed: ${photoErr.message}`);
      process.exit(1);
    }
    aircraftPhotoPaths = (photos ?? [])
      .map((p) => p.storage_path)
      .filter((p) => typeof p === "string" && p.length > 0);
  }

  const flightIds = (flights ?? []).map((f) => f.id);
  let flightPhotoPaths = [];
  if (flightIds.length > 0) {
    const { data: photos, error: photoErr } = await supabase
      .from("flight_photos")
      .select("storage_path")
      .in("flight_id", flightIds);

    if (photoErr) {
      console.error(`flight_photos snapshot failed: ${photoErr.message}`);
      process.exit(1);
    }
    flightPhotoPaths = (photos ?? [])
      .map((p) => p.storage_path)
      .filter((p) => typeof p === "string" && p.length > 0);
  }

  console.log(
    `Snapshot: ${flightCount} flights, ${routeTriples.size} route triples, ${avatarPaths.length} avatars, ${aircraftPhotoPaths.length} aircraft photos, ${flightPhotoPaths.length} flight photos.`,
  );

  let deletedUsers = 0;
  for (const id of userIds) {
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) {
      console.error(`deleteUser ${id}: ${error.message}`);
      process.exit(1);
    }
    deletedUsers += 1;
    console.log(`Deleted user ${id}`);
  }

  let storageRemoved = 0;
  if (avatarPaths.length > 0) {
    const { error } = await supabase.storage
      .from("profile-photos")
      .remove(avatarPaths);
    if (error) {
      console.error(`profile-photos remove: ${error.message}`);
      process.exit(1);
    }
    storageRemoved += avatarPaths.length;
    console.log(`Removed ${avatarPaths.length} profile-photos object(s).`);
  }

  if (aircraftPhotoPaths.length > 0) {
    const { error } = await supabase.storage
      .from("aircraft-photos")
      .remove(aircraftPhotoPaths);
    if (error) {
      console.error(`aircraft-photos remove: ${error.message}`);
      process.exit(1);
    }
    storageRemoved += aircraftPhotoPaths.length;
    console.log(
      `Removed ${aircraftPhotoPaths.length} aircraft-photos object(s).`,
    );
  }

  if (flightPhotoPaths.length > 0) {
    const { error } = await supabase.storage
      .from("flight-photos")
      .remove(flightPhotoPaths);
    if (error) {
      console.error(`flight-photos remove: ${error.message}`);
      process.exit(1);
    }
    storageRemoved += flightPhotoPaths.length;
    console.log(`Removed ${flightPhotoPaths.length} flight-photos object(s).`);
  }

  let refreshed = 0;
  for (const args of routeTriples.values()) {
    const { error } = await supabase.rpc("refresh_route_price_benchmark", args);
    if (error) {
      console.error(
        `refresh_route_price_benchmark ${args.p_departure}/${args.p_arrival}/${args.p_type}: ${error.message}`,
      );
      process.exit(1);
    }
    refreshed += 1;
  }

  console.log("\n=== Cleanup complete ===");
  console.log(`Pilots deleted:     ${deletedUsers}`);
  console.log(`Flights removed:    ${flightCount} (via CASCADE)`);
  console.log(`Storage objects:    ${storageRemoved}`);
  console.log(`Benchmarks refreshed: ${refreshed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
