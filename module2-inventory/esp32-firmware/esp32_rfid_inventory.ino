/*
 * ==============================================================================
 * Module 2: RFID-Based Pipe Bundle Inventory System
 * ESP32 + MFRC522 RFID Reader Firmware
 * 
 * Target: ESP32 Dev Module
 * Sensors: MFRC522 RFID SPI Reader, Status LEDs, Piezo Buzzer
 * Protocol: HTTPS POST to Supabase REST / RPC endpoint
 * ==============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>

// -----------------------------------------------------------------------------
// WiFi & Supabase Credentials
// -----------------------------------------------------------------------------
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

const char* SUPABASE_URL  = "https://lngeqgisidwrimcyxwyv.supabase.co";
const char* SUPABASE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuZ2VxZ2lzaWR3cmltY3l4d3l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNTA2MDIsImV4cCI6MjEwMTgyNjYwMn0.o6SgW4-YZ-45j4aY7L59F0gBoxVBwKkVN9zsvw0nLTY";
const char* RPC_ENDPOINT  = "https://lngeqgisidwrimcyxwyv.supabase.co/rest/v1/rpc/record_material_removal";

// -----------------------------------------------------------------------------
// Pin Configuration (SPI for RC522)
// -----------------------------------------------------------------------------
#define RST_PIN         22          // Configurable reset pin
#define SS_PIN          5           // Configurable slave select (SDA) pin

#define LED_GREEN       2           // Normal stock indicator
#define LED_YELLOW      4           // Low stock indicator
#define LED_RED         15          // Out of stock / error indicator
#define BUZZER_PIN      13          // Audio feedback

MFRC522 mfrc522(SS_PIN, RST_PIN);   // Create MFRC522 instance

// Default pipes to remove per transaction scan if keypad is not attached
int pipesToRemove = 1;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- Lean Construction: Module 2 RFID Pipe Inventory ---");

  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  // Initialize SPI bus & MFRC522
  SPI.begin();
  mfrc522.PCD_Init();
  delay(100);
  mfrc522.PCD_DumpVersionToSerial();

  // Connect to WiFi
  connectWiFi();

  Serial.println("System Ready! Scan RFID tag attached to pipe bundle...");
  Serial.println("Send integer over Serial (e.g., '2', '3') to set removal qty (Default: 1)");
}

void loop() {
  // Check for serial input to set quantity removed
  if (Serial.available() > 0) {
    int incoming = Serial.parseInt();
    if (incoming > 0) {
      pipesToRemove = incoming;
      Serial.printf(">> Next scan will remove: %d pipe(s)\n", pipesToRemove);
      beep(1, 80);
    }
  }

  // Ensure WiFi is still connected
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Look for new RFID cards/tags
  if (!mfrc522.PICC_IsNewCardPresent()) {
    delay(50);
    return;
  }

  // Select one of the cards
  if (!mfrc522.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }

  // Read UID
  String tagId = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) tagId += "0";
    tagId += String(mfrc522.uid.uidByte[i], HEX);
  }
  tagId.toUpperCase();

  // For testing convenience, if UID matches specific test card or starts with EPC
  Serial.printf("\n[RFID DETECTED] Tag UID: %s | Removing: %d\n", tagId.c_str(), pipesToRemove);
  
  // Audio acknowledge scan
  beep(1, 100);

  // Send update to Supabase
  sendRemovalToSupabase(tagId, pipesToRemove);

  // Halt PICC to avoid re-reading immediately
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();

  delay(2000); // 2-second debounce
}

void sendRemovalToSupabase(String tagId, int qty) {
  WiFiClientSecure client;
  client.setInsecure(); // Skip certificate validation for embedded simplicity

  HTTPClient https;
  if (!https.begin(client, RPC_ENDPOINT)) {
    Serial.println("❌ Failed to initialize HTTPS connection");
    showStatus(LED_RED, 2);
    return;
  }

  https.addHeader("Content-Type", "application/json");
  https.addHeader("apikey", SUPABASE_KEY);
  https.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);

  // Prepare JSON Payload
  StaticJsonDocument<256> doc;
  doc["p_tag_id"] = tagId;
  doc["p_qty"] = qty;
  doc["p_operator"] = "ESP32-Reader-Yard1";
  doc["p_notes"] = "Physical scan at storage bay";

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = https.POST(requestBody);

  if (httpCode == HTTP_CODE_OK || httpCode == 201) {
    String response = https.getString();
    Serial.println("✅ Response from Supabase:");
    Serial.println(response);

    StaticJsonDocument<512> resDoc;
    DeserializationError error = deserializeJson(resDoc, response);
    if (!error && resDoc["success"] == true) {
      int remaining = resDoc["remaining_quantity"];
      bool isLowStock = resDoc["low_stock_triggered"] | resDoc["is_low_stock"];
      String status = resDoc["status"];

      Serial.printf("📦 Bundle: %s | Remaining: %d | Status: %s\n", 
        resDoc["bundle_id"].as<const char*>(), remaining, status.c_str());

      if (remaining == 0) {
        Serial.println("🚨 CRITICAL: OUT OF STOCK!");
        showStatus(LED_RED, 3);
        beep(3, 400);
      } else if (isLowStock) {
        Serial.println("⚠️ WARNING: LOW STOCK ALERT!");
        showStatus(LED_YELLOW, 3);
        beep(2, 200);
      } else {
        Serial.println("✔️ Stock Level Normal");
        showStatus(LED_GREEN, 1);
        beep(1, 150);
      }
    } else {
      Serial.printf("❌ Error from RPC: %s\n", resDoc["error"].as<const char*>());
      showStatus(LED_RED, 2);
    }
  } else {
    Serial.printf("❌ HTTP Error: %d\n", httpCode);
    showStatus(LED_RED, 2);
  }

  https.end();
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.printf("Connecting to Wi-Fi: %s ", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nConnected! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\nWiFi connection failed! Will retry...");
  }
}

void beep(int times, int durationMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(durationMs);
    digitalWrite(BUZZER_PIN, LOW);
    if (i < times - 1) delay(80);
  }
}

void showStatus(int pin, int blinks) {
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(LED_RED, LOW);
  for (int i = 0; i < blinks; i++) {
    digitalWrite(pin, HIGH);
    delay(200);
    digitalWrite(pin, LOW);
    if (i < blinks - 1) delay(100);
  }
}
