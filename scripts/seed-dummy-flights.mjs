/**
 * Seed 4 dummy pilots + 8 published flights for pre-launch demos.
 * Marker: emails matching dummy.pilotN@gallebo-internal.test
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-dummy-flights.mjs
 *   (or rely on auto-load of .env.local from repo root)
 *
 * Does NOT run migrations. Uses service-role client only.
 * Do not commit SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ASSETS = path.join(__dirname, "seed-assets");

const DUMMY_EMAIL_RE = /^dummy\.pilot\d+@gallebo-internal\.test$/i;

const PILOTS = [
  {
    n: 1,
    email: "dummy.pilot1@gallebo-internal.test",
    firstName: "Ivan",
    lastName: "Marković",
    dateOfBirth: "1990-03-14",
    assetDir: "ivan",
    aircraft: { model: "Cessna 152", seats: 2, registration: "9A-DEM1" },
    language: "hr",
  },
  {
    n: 2,
    email: "dummy.pilot2@gallebo-internal.test",
    firstName: "Luca",
    lastName: "Bianchi",
    dateOfBirth: "1982-07-22",
    assetDir: "luca",
    aircraft: { model: "Cessna 172", seats: 4, registration: "9A-DEM2" },
    language: "it",
  },
  {
    n: 3,
    email: "dummy.pilot3@gallebo-internal.test",
    firstName: "Ana",
    lastName: "Novak",
    dateOfBirth: "1996-05-08",
    assetDir: "ana",
    aircraft: { model: "Cessna 172", seats: 4, registration: "9A-DEM3" },
    language: "en",
  },
  {
    n: 4,
    email: "dummy.pilot4@gallebo-internal.test",
    firstName: "Maja",
    lastName: "Zupančič",
    dateOfBirth: "1973-11-03",
    assetDir: "maja",
    aircraft: {
      model: "Cessna 206 Stationair",
      seats: 6,
      registration: "9A-DEM4",
    },
    language: "hr",
  },
];

/** @type {Array<{pilotN: number, flightType: string, depIcao: string, arrIcao: string, passengerSeats: number, totalCostEur: number, departureTime: string, dayOffset: number, description: string}>} */
const FLIGHTS = [
  {
    pilotN: 1,
    flightType: "panoramic",
    depIcao: "LDZL",
    arrIcao: "LDZL",
    passengerSeats: 1,
    totalCostEur: 120,
    departureTime: "09:30",
    dayOffset: 32,
    description:
      "Kratki panoramski let oko Zagreba iz Lučkog. Uživajte u pogledu na Medvednicu i Savu po mirnom jutarnjem vremenu. Idealno za prvo iskustvo u GA zrakoplovu.",
  },
  {
    pilotN: 1,
    flightType: "one_way",
    depIcao: "LDZL",
    arrIcao: "LDVA",
    passengerSeats: 1,
    totalCostEur: 160,
    departureTime: "14:00",
    dayOffset: 38,
    description:
      "Jednosmjerni let iz Lučkog do Varaždina. Lijepo popodne za kratki transfer preko sjeverne Hrvatske. Molimo javite se unaprijed ako putujete s prtljagom.",
  },
  {
    pilotN: 2,
    flightType: "excursion",
    depIcao: "LJPZ",
    arrIcao: "LDZL",
    passengerSeats: 3,
    totalCostEur: 320,
    departureTime: "10:00",
    dayOffset: 35,
    description:
      "Escursione da Portorož a Lučko con rientro lo stesso giorno. Vista sulla costa e sull'interno croato. Condivisione dei costi del volo, atmosfera rilassata a bordo.",
  },
  {
    pilotN: 2,
    flightType: "panoramic",
    depIcao: "LDPV",
    arrIcao: "LDPV",
    passengerSeats: 2,
    totalCostEur: 140,
    departureTime: "16:00",
    dayOffset: 41,
    description:
      "Volo panoramico da Vrsar sopra l'Istria e il mare. Pomeriggio ideale con luce calda. Posti limitati, portate una macchina fotografica.",
  },
  {
    pilotN: 3,
    flightType: "panoramic",
    depIcao: "LJCL",
    arrIcao: "LJCL",
    passengerSeats: 3,
    totalCostEur: 110,
    departureTime: "11:00",
    dayOffset: 33,
    description:
      "Scenic flight from Celje over the Savinja valley and nearby hills. Calm morning conditions preferred. Great introduction to light aircraft flying.",
  },
  {
    pilotN: 3,
    flightType: "excursion",
    depIcao: "LJCL",
    arrIcao: "LDVA",
    passengerSeats: 2,
    totalCostEur: 200,
    departureTime: "13:30",
    dayOffset: 40,
    description:
      "Day trip from Celje to Varaždin and back. Cross-border hop with shared operating costs. We will coordinate return timing once seats are confirmed.",
  },
  {
    pilotN: 4,
    flightType: "panoramic",
    depIcao: "LDSH",
    arrIcao: "LDSH",
    passengerSeats: 5,
    totalCostEur: 180,
    departureTime: "08:30",
    dayOffset: 36,
    description:
      "Panoramski let s Hvara — otoci, pakleni i otvoreno more. Rano jutro daje najljepše svjetlo. Više sjedala u Stationairu, javite se ako dolazite u grupi.",
  },
  {
    pilotN: 4,
    flightType: "excursion",
    depIcao: "LDPM",
    arrIcao: "LDPV",
    passengerSeats: 4,
    totalCostEur: 150,
    departureTime: "15:00",
    dayOffset: 43,
    description:
      "Istarska ekskurzija Medulin–Vrsar i povratak istog dana. Kratka obalna ruta, dijelimo troškove leta. Udoban Cessna 206 za više putnika.",
  },
];

const REQUIRED_ICAOS = [
  ...new Set(FLIGHTS.flatMap((f) => [f.depIcao, f.arrIcao])),
];

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

/** Same formula as lib/flights/schemas.ts computePricePerPassenger */
function computePricePerPassenger(totalCostEur, passengerSeats) {
  return Math.round((totalCostEur / (passengerSeats + 1)) * 100) / 100;
}

function addDaysIso(days) {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function yearsFromNowIso(years) {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString().slice(0, 10);
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

function assertAssetsExist() {
  for (const p of PILOTS) {
    const avatar = path.join(ASSETS, p.assetDir, "avatar.png");
    const aircraft = path.join(ASSETS, p.assetDir, "aircraft.png");
    if (!fs.existsSync(avatar)) {
      console.error(`Missing asset: ${avatar}`);
      process.exit(1);
    }
    if (!fs.existsSync(aircraft)) {
      console.error(`Missing asset: ${aircraft}`);
      process.exit(1);
    }
  }
}

async function main() {
  assertAssetsExist();
  const { url, key } = requireEnv();
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const existing = (await listAllUsers(supabase)).filter((u) =>
    DUMMY_EMAIL_RE.test(u.email ?? ""),
  );
  if (existing.length > 0) {
    console.error(
      `Found ${existing.length} existing dummy pilot(s). Run scripts/cleanup-dummy-flights.mjs first.`,
    );
    process.exit(1);
  }

  const { data: airfieldRows, error: afErr } = await supabase
    .from("airfields")
    .select("id, icao_code, name, country, status")
    .eq("status", "active")
    .in("icao_code", REQUIRED_ICAOS);

  if (afErr) {
    console.error(`airfields query failed: ${afErr.message}`);
    process.exit(1);
  }

  /** @type {Map<string, {id: string, icao_code: string, name: string, country: string}>} */
  const byIcao = new Map();
  for (const row of airfieldRows ?? []) {
    byIcao.set(row.icao_code, row);
  }
  for (const icao of REQUIRED_ICAOS) {
    if (!byIcao.has(icao)) {
      console.error(`Required active airfield missing: ${icao}`);
      process.exit(1);
    }
  }

  const nowIso = new Date().toISOString();
  const licenseExp = yearsFromNowIso(2);
  const medicalExp = yearsFromNowIso(2);

  /** @type {Array<{userId: string, email: string, aircraftId: string, seats: number, aircraftImageBuffer: Buffer}>} */
  const createdPilots = [];
  /** @type {Array<{id: string, pilotN: number, route: string, date: string}>} */
  const createdFlights = [];

  for (const pilot of PILOTS) {
    const password = randomBytes(24).toString("base64url");
    const { data: created, error: createErr } =
      await supabase.auth.admin.createUser({
        email: pilot.email,
        password,
        email_confirm: true,
      });

    if (createErr || !created?.user) {
      console.error(
        `createUser ${pilot.email}: ${createErr?.message ?? "no user"}`,
      );
      process.exit(1);
    }

    const userId = created.user.id;

    // protect_profiles_system_columns blocks UPDATE of role/status for service-role.
    // Delete auto-created profile, then INSERT verified pilot row.
    const { error: delProfErr } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);
    if (delProfErr) {
      console.error(`delete profile ${userId}: ${delProfErr.message}`);
      process.exit(1);
    }

    const { error: insProfErr } = await supabase.from("profiles").insert({
      id: userId,
      first_name: pilot.firstName,
      last_name: pilot.lastName,
      date_of_birth: pilot.dateOfBirth,
      role: "pilot",
      status: "verified",
    });
    if (insProfErr) {
      console.error(`insert profile ${userId}: ${insProfErr.message}`);
      process.exit(1);
    }

    const { error: notifErr } = await supabase
      .from("user_notification_settings")
      .insert({ user_id: userId });
    if (notifErr) {
      console.error(
        `insert user_notification_settings ${userId}: ${notifErr.message}`,
      );
      process.exit(1);
    }

    const { error: ppErr } = await supabase.from("pilot_profiles").insert({
      user_id: userId,
      onboarding_step: 5,
      license_expires_at: licenseExp,
      medical_expires_at: medicalExp,
      tax_declaration_accepted_at: nowIso,
    });
    if (ppErr) {
      console.error(`insert pilot_profiles ${userId}: ${ppErr.message}`);
      process.exit(1);
    }

    const { data: aircraft, error: acErr } = await supabase
      .from("aircraft")
      .insert({
        pilot_user_id: userId,
        model: pilot.aircraft.model,
        registration: pilot.aircraft.registration,
        seats: pilot.aircraft.seats,
      })
      .select("id")
      .single();
    if (acErr || !aircraft) {
      console.error(
        `insert aircraft ${pilot.aircraft.registration}: ${acErr?.message}`,
      );
      process.exit(1);
    }

    const avatarBuf = fs.readFileSync(
      path.join(ASSETS, pilot.assetDir, "avatar.png"),
    );
    const avatarPath = `${userId}/avatar.png`;
    const { error: avatarUpErr } = await supabase.storage
      .from("profile-photos")
      .upload(avatarPath, avatarBuf, {
        contentType: "image/png",
        upsert: true,
      });
    if (avatarUpErr) {
      console.error(`avatar upload ${userId}: ${avatarUpErr.message}`);
      process.exit(1);
    }

    const { error: avatarPathErr } = await supabase
      .from("profiles")
      .update({ avatar_path: avatarPath })
      .eq("id", userId);
    if (avatarPathErr) {
      console.error(`avatar_path update ${userId}: ${avatarPathErr.message}`);
      process.exit(1);
    }

    const aircraftBuf = fs.readFileSync(
      path.join(ASSETS, pilot.assetDir, "aircraft.png"),
    );
    const aircraftPhotoPath = `${aircraft.id}/photo.png`;
    const { error: acPhotoUpErr } = await supabase.storage
      .from("aircraft-photos")
      .upload(aircraftPhotoPath, aircraftBuf, {
        contentType: "image/png",
        upsert: true,
      });
    if (acPhotoUpErr) {
      console.error(
        `aircraft photo upload ${aircraft.id}: ${acPhotoUpErr.message}`,
      );
      process.exit(1);
    }

    const { error: acPhotoInsErr } = await supabase
      .from("aircraft_photos")
      .insert({
        aircraft_id: aircraft.id,
        storage_path: aircraftPhotoPath,
        position: 0,
      });
    if (acPhotoInsErr) {
      console.error(
        `aircraft_photos insert ${aircraft.id}: ${acPhotoInsErr.message}`,
      );
      process.exit(1);
    }

    createdPilots.push({
      userId,
      email: pilot.email,
      aircraftId: aircraft.id,
      seats: pilot.aircraft.seats,
      aircraftImageBuffer: aircraftBuf,
    });
    console.log(
      `Created pilot ${pilot.firstName} ${pilot.lastName} (${pilot.email}) → ${userId}`,
    );
  }

  const pilotByN = new Map(PILOTS.map((p) => [p.n, p]));
  const createdByN = new Map(
    createdPilots.map((c, i) => [PILOTS[i].n, c]),
  );

  for (const f of FLIGHTS) {
    const pilotMeta = pilotByN.get(f.pilotN);
    const created = createdByN.get(f.pilotN);
    if (!pilotMeta || !created) {
      console.error(`Internal: missing pilot ${f.pilotN}`);
      process.exit(1);
    }

    if (f.passengerSeats > created.seats - 1) {
      console.error(
        `passenger_seats ${f.passengerSeats} exceeds seats-1 (${created.seats - 1}) for pilot ${f.pilotN}`,
      );
      process.exit(1);
    }
    if (
      f.flightType === "panoramic" &&
      f.depIcao !== f.arrIcao
    ) {
      console.error(`panoramic must be A→A, got ${f.depIcao}→${f.arrIcao}`);
      process.exit(1);
    }

    const dep = byIcao.get(f.depIcao);
    const arr = byIcao.get(f.arrIcao);
    const flightDate = addDaysIso(f.dayOffset);
    const price = computePricePerPassenger(f.totalCostEur, f.passengerSeats);
    const publishedAt = new Date().toISOString();

    const { data: flight, error: flErr } = await supabase
      .from("flights")
      .insert({
        pilot_user_id: created.userId,
        flight_type: f.flightType,
        status: "published",
        departure_airfield_id: dep.id,
        arrival_airfield_id: arr.id,
        flight_date: flightDate,
        departure_time: f.departureTime,
        total_cost_eur: f.totalCostEur,
        price_per_passenger_eur: price,
        passenger_seats: f.passengerSeats,
        description: f.description,
        communication_language: pilotMeta.language,
        aircraft_id: created.aircraftId,
        rented_model: null,
        rented_registration: null,
        rented_seats: null,
        published_at: publishedAt,
        airworthiness_declared_at: publishedAt,
      })
      .select("id")
      .single();

    if (flErr || !flight) {
      console.error(
        `insert flight ${f.depIcao}→${f.arrIcao}: ${flErr?.message}`,
      );
      process.exit(1);
    }

    const flightPhotoPath = `${flight.id}/photo.png`;
    const { error: flPhotoUpErr } = await supabase.storage
      .from("flight-photos")
      .upload(flightPhotoPath, created.aircraftImageBuffer, {
        contentType: "image/png",
        upsert: true,
      });
    if (flPhotoUpErr) {
      console.error(
        `flight photo upload ${flight.id}: ${flPhotoUpErr.message}`,
      );
      process.exit(1);
    }

    const { error: flPhotoInsErr } = await supabase.from("flight_photos").insert({
      flight_id: flight.id,
      storage_path: flightPhotoPath,
      position: 0,
    });
    if (flPhotoInsErr) {
      console.error(
        `flight_photos insert ${flight.id}: ${flPhotoInsErr.message}`,
      );
      process.exit(1);
    }

    createdFlights.push({
      id: flight.id,
      pilotN: f.pilotN,
      route: `${f.depIcao}→${f.arrIcao} (${f.flightType})`,
      date: flightDate,
    });
  }

  console.log("\n=== Seed complete ===");
  console.log("Pilots:");
  for (const p of createdPilots) {
    console.log(`  ${p.userId}  ${p.email}`);
  }
  console.log("Flights:");
  for (const fl of createdFlights) {
    console.log(`  ${fl.id}  pilot${fl.pilotN}  ${fl.route}  ${fl.date}`);
  }
  console.log(
    `\n${createdPilots.length} pilots, ${createdFlights.length} flights.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
