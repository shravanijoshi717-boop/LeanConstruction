/*
 * ==========================================
 * Lean Construction — Attendance System
 * ESP32 + R307 Fingerprint Sensor Firmware
 * ==========================================
 * 
 * SETUP INSTRUCTIONS (for client on Google Meet):
 * 1. Install Arduino IDE (https://www.arduino.cc/en/software)
 * 2. Add ESP32 board: File → Preferences → Additional Board Manager URLs:
 *    https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
 * 3. Install "esp32" from Tools → Board Manager
 * 4. Install "Adafruit Fingerprint Sensor Library" from Sketch → Include Library → Manage Libraries
 * 5. Change the TWO settings below (WiFi + Edge Function URL)
 * 6. Select your board: Tools → Board → ESP32 Dev Module
 * 7. Select COM port: Tools → Port
 * 8. Upload!
 * 
 * HARDWARE WIRING:
 * R307 Green  → ESP32 GPIO16 (RX2)
 * R307 White  → ESP32 GPIO17 (TX2)
 * R307 Red    → ESP32 3.3V
 * R307 Black  → ESP32 GND
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Adafruit_Fingerprint.h>

// ============================================
// ⚠️  CHANGE THESE TWO SETTINGS  ⚠️
// ============================================

// Your WiFi credentials
#define WIFI_SSID     "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Your Supabase Edge Function URL
#define EDGE_FUNCTION_URL "https://lngeqgisidwrimcyxwyv.supabase.co/functions/v1/attendance-relay"

// Device secret (must match what's set in Supabase Edge Function env vars)
#define DEVICE_SECRET "default-dev-secret"

// Device ID (change if you have multiple ESP32s)
#define DEVICE_ID "esp32-site-a"

// ============================================
// Don't change anything below unless you know what you're doing
// ============================================

// R307 sensor on Serial2 (GPIO16 = RX, GPIO17 = TX)
HardwareSerial mySerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("==========================================");
  Serial.println("  Attendance System - ESP32 + R307");
  Serial.println("==========================================");

  // Step 1: Connect to WiFi
  Serial.print("[1/3] Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.print("   IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi connection FAILED!");
    Serial.println("   Check SSID and password, then restart.");
    while (true) delay(1000); // Halt
  }

  // Step 2: Initialize fingerprint sensor
  Serial.println("[2/3] Initializing fingerprint sensor...");

  mySerial.begin(57600, SERIAL_8N1, 16, 17);
  finger.begin(57600);

  if (finger.verifyPassword()) {
    Serial.println("✅ Sensor ready!");
    Serial.print("   Stored fingerprints: ");
    finger.getTemplateCount();
    Serial.println(finger.templateCount);
  } else {
    Serial.println("❌ Fingerprint sensor NOT FOUND!");
    Serial.println("   Check wiring: Green→GPIO16, White→GPIO17, Red→3.3V, Black→GND");
    while (true) delay(1000); // Halt
  }

  // Step 3: Ready
  Serial.println("[3/3] System ready!");
  Serial.println("==========================================");
  Serial.println("Place your finger on the sensor to scan...");
  Serial.println("==========================================\n");
}

void loop() {
  // Wait for a finger
  int fingerprintId = getFingerprintID();

  if (fingerprintId > 0) {
    Serial.print("🔍 Fingerprint matched: ID ");
    Serial.println(fingerprintId);
    Serial.println("   Sending to server...");

    sendAttendance(fingerprintId);

    // Wait before accepting next scan (prevent rapid duplicates)
    Serial.println("   Waiting 3 seconds before next scan...\n");
    delay(3000);
  }

  delay(100); // Small delay between scan attempts
}

// ============================================
// Fingerprint scanning function
// ============================================
int getFingerprintID() {
  uint8_t p = finger.getImage();
  if (p != FINGERPRINT_OK) return -1; // No finger detected

  p = finger.image2Tz();
  if (p != FINGERPRINT_OK) {
    Serial.println("⚠️  Image conversion failed");
    return -1;
  }

  p = finger.fingerSearch();
  if (p != FINGERPRINT_OK) {
    Serial.println("❌ Fingerprint not recognized!");
    Serial.println("   This finger is not registered in the system.");
    delay(2000);
    return -1;
  }

  // finger.fingerID contains the matched ID
  Serial.print("   Confidence: ");
  Serial.println(finger.confidence);
  return finger.fingerID;
}

// ============================================
// Send attendance to Supabase via Edge Function
// ============================================
void sendAttendance(int fingerprintId) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi disconnected! Trying to reconnect...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
      delay(500);
      Serial.print(".");
      attempts++;
    }
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("\n❌ Reconnection failed. Data NOT sent.");
      return;
    }
    Serial.println("\n✅ Reconnected to WiFi");
  }

  HTTPClient http;
  http.begin(EDGE_FUNCTION_URL);
  http.addHeader("Content-Type", "application/json");

  // Build JSON payload
  String payload = "{";
  payload += "\"fingerprint_id\":" + String(fingerprintId) + ",";
  payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"device_secret\":\"" + String(DEVICE_SECRET) + "\"";
  payload += "}";

  Serial.print("   Payload: ");
  Serial.println(payload);

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.print("   HTTP ");
    Serial.print(httpCode);
    Serial.print(": ");
    Serial.println(response);

    if (httpCode == 200) {
      Serial.println("✅ Attendance logged successfully!");
    } else {
      Serial.println("⚠️  Server returned an error. Check response above.");
    }
  } else {
    Serial.print("❌ HTTP request failed: ");
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
}
