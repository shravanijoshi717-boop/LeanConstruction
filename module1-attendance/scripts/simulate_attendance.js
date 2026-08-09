/**
 * simulate_attendance.js
 * 
 * Simulates ESP32 fingerprint scans by calling the attendance-relay Edge Function.
 * This validates the full pipeline: Edge Function → DB insert → status trigger → Realtime.
 * 
 * Usage: node simulate_attendance.js
 * 
 * Environment:
 *   SUPABASE_URL       - Your Supabase project URL
 *   SUPABASE_ANON_KEY  - Your Supabase anon key (for client queries)
 *   DEVICE_SECRET      - The device secret set in Edge Function env vars
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "https://lngeqgisidwrimcyxwyv.supabase.co";
const DEVICE_SECRET = process.env.DEVICE_SECRET || "default-dev-secret";

const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/attendance-relay`;

// Simulate these fingerprint IDs (maps to workers in the users table)
const FINGERPRINT_IDS = [1];
const DEVICE_ID = "esp32-simulator";

async function simulateScan(fingerprintId) {
  console.log(`\n🔍 Scanning fingerprint ID: ${fingerprintId}...`);

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fingerprint_id: fingerprintId,
        device_id: DEVICE_ID,
        device_secret: DEVICE_SECRET,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Action: ${data.action}`);
      console.log(`   Message: ${data.message}`);
      if (data.status) console.log(`   Status: ${data.status}`);
      if (data.check_in) console.log(`   Check-in: ${data.check_in}`);
      if (data.check_out) console.log(`   Check-out: ${data.check_out}`);
    } else {
      console.error(`❌ Error (${response.status}): ${data.error}`);
      if (data.details) console.error(`   Details: ${data.details}`);
    }

    return data;
  } catch (err) {
    console.error(`❌ Network error: ${err.message}`);
    return null;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runSimulation() {
  console.log("===========================================");
  console.log("  Attendance Simulation Script");
  console.log("===========================================");
  console.log(`  Edge Function: ${EDGE_FUNCTION_URL}`);
  console.log(`  Device ID: ${DEVICE_ID}`);
  console.log(`  Fingerprint IDs: ${FINGERPRINT_IDS.join(", ")}`);
  console.log("===========================================");

  // Step 1: Simulate CHECK-IN for each worker
  console.log("\n📌 STEP 1: Simulating CHECK-IN scans...");
  for (const fpId of FINGERPRINT_IDS) {
    await simulateScan(fpId);
    await sleep(2000);
  }

  // Step 2: Wait, then simulate CHECK-OUT
  console.log("\n⏳ Waiting 5 seconds before check-out scans...");
  await sleep(5000);

  console.log("\n📌 STEP 2: Simulating CHECK-OUT scans...");
  for (const fpId of FINGERPRINT_IDS) {
    await simulateScan(fpId);
    await sleep(2000);
  }

  // Step 3: Try a third scan (should say "already done")
  console.log("\n⏳ Waiting 3 seconds before duplicate scan...");
  await sleep(3000);

  console.log("\n📌 STEP 3: Simulating DUPLICATE scan (should say already done)...");
  await simulateScan(FINGERPRINT_IDS[0]);

  console.log("\n===========================================");
  console.log("  Simulation complete!");
  console.log("  Check your Supabase dashboard for rows.");
  console.log("===========================================");
}

runSimulation();
