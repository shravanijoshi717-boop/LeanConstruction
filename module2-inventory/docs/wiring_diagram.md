# Module 2 – ESP32 & RC522 RFID Hardware Wiring & Architecture

This guide details the hardware pin connections for connecting the **MFRC522 13.56MHz RFID Reader** (or UHF RFID equivalent) to the **ESP32 Dev Module**.

---

## 1. Pin Connection Table

| RC522 RFID Pin | ESP32 GPIO | Description |
|---|---|---|
| **VCC (3.3V)** | **3V3** | Power Supply (DO NOT connect to 5V; RC522 requires 3.3V) |
| **RST** | **GPIO 22** | Reset Pin |
| **GND** | **GND** | Ground |
| **MISO** | **GPIO 19** | SPI Master In Slave Out |
| **MOSI** | **GPIO 23** | SPI Master Out Slave In |
| **SCK** | **GPIO 18** | SPI Clock |
| **SDA (SS / CS)** | **GPIO 5** | SPI Chip Select |
| **IRQ** | Not Connected | Unused |

### Optional Feedback Indicators
| Component | ESP32 GPIO | Purpose |
|---|---|---|
| **Green LED** | GPIO 2 | Successful scan & normal stock |
| **Yellow/Amber LED** | GPIO 4 | Warning: Low Stock alert |
| **Red LED** | GPIO 15 | Error: Out of Stock or tag not found |
| **Buzzer (+)** | GPIO 13 | Beeps on scan; alert tone on low-stock |

---

## 2. Hardware Operation Flow

```
1. Power On: ESP32 connects to Site Wi-Fi and connects to Supabase REST endpoint.
2. Tag Detect: Worker taps pipe bundle tag against the RC522 antenna.
3. Reading: ESP32 reads 4-byte or 7-byte UID (e.g. EPC-PIPE-001).
4. Quantity Entry: 
   - Option A: Operator enters removed number on 4x4 matrix keypad or serial terminal.
   - Option B: Single button tap defaults to 1 pipe removed per press.
   - Option C: Web dashboard simulator receives the detected tag ID and prompts operator.
5. Transmission: ESP32 sends HTTPS POST payload to Supabase RPC `record_pipe_removal`.
6. Feedback:
   - If `status == "Available"`: 1 short beep, Green LED.
   - If `status == "Low Stock"`: 3 rapid beeps, Yellow LED.
   - If `status == "Out of Stock"`: Long 2-second beep, Red LED.
```
