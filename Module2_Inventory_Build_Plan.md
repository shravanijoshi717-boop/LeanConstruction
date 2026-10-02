# Module 2 – RFID-Based Pipe Bundle Inventory System
## Full Build Plan & Technical Specification

**Stack:** Supabase (Postgres + Realtime), React + Vite (Web Dashboard on Port 5174), ESP32 + MFRC522 RFID Sensor (Hardware / Gateway)

**Goal:** An automated, real-time inventory management system where RFID tags attached to pipe bundles track bundle identity, calculate quantity decrements upon removal, log immutable audit histories, and trigger automated low-stock notifications when remaining quantity reaches or drops below predefined minimum thresholds.

---

## 1. Project Structure

```
/module2-inventory
  ├── /frontend              → React + Vite dashboard (running on port 5174)
  │     ├── src/
  │     │    ├── components/ → KPI cards, RFID Scanner Simulator, Bundle Table, LowStockAlert, HistoryLog, AddBundleModal
  │     │    ├── lib/        → supabase.js client & mock fallback handler
  │     │    └── App.jsx     → Core layout, Realtime subscriptions, state management
  │     ├── package.json
  │     └── vite.config.js   → configured for port 5174
  ├── /esp32-firmware        → Arduino sketch for ESP32 + MFRC522 RFID reader + HTTP client
  ├── /scripts               → simulate_rfid_inventory.js (CLI automated testing script)
  └── /docs                  → schema.sql, api_notes.md, wiring_diagram.md
```

---

## 2. Supabase Database Schema (Postgres)

Shared with the same Supabase database (`https://lngeqgisidwrimcyxwyv.supabase.co`) using isolated tables:

### Table: `pipe_bundles`
Stores the current inventory status of each tagged bundle.

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` | Unique database identifier |
| `bundle_id` | `text` | UNIQUE, NOT NULL | Human-readable bundle code (e.g. `PIPE-B001`) |
| `tag_id` | `text` | UNIQUE, NOT NULL | RFID Tag EPC / UID (e.g. `EPC-PIPE-001`) |
| `pipe_type` | `text` | NOT NULL | Material/Spec (e.g. `PVC Pipe`, `GI Pipe 2"`) |
| `starting_quantity`| `integer`| NOT NULL, DEFAULT 10 | Original full bundle count |
| `current_quantity` | `integer`| NOT NULL, DEFAULT 10 | Current remaining count in bundle |
| `minimum_quantity` | `integer`| NOT NULL, DEFAULT 3  | Threshold for Low-Stock trigger |
| `location` | `text` | NOT NULL, DEFAULT 'Store Room A' | Storage yard or warehouse section |
| `status` | `text` | NOT NULL, DEFAULT 'Available' | Computed: `'Available'`, `'Low Stock'`, `'Out of Stock'` |
| `created_at` | `timestamptz` | DEFAULT `now()` | Registration timestamp |
| `updated_at` | `timestamptz` | DEFAULT `now()` | Last modification timestamp |

### Table: `inventory_history`
Chronological audit trail of all physical removals, restocks, and adjustments.

| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | `uuid` | PK, `gen_random_uuid()` | Unique log identifier |
| `bundle_id` | `text` | FK → `pipe_bundles(bundle_id)` | Linked bundle identifier |
| `tag_id` | `text` | NOT NULL | Scanned RFID tag |
| `action` | `text` | NOT NULL | `'Initial'`, `'Removed'`, `'Restocked'`, `'Adjusted'` |
| `qty_removed` | `integer`| DEFAULT 0 | Count of pipes removed in this action |
| `remaining_quantity`| `integer`| NOT NULL | Balance after the transaction |
| `performed_by` | `text` | DEFAULT 'Field Operator' | Person or device recording the change |
| `notes` | `text` | Nullable | Optional field remarks / reason |
| `created_at` | `timestamptz` | DEFAULT `now()` | Transaction timestamp |

### Automated Status & Quantity Logic
- **Formula:** `Current Quantity = Previous Quantity - Removed Quantity`
- **Validation:** Enforces `Current Quantity >= 0` (prevents negative inventory).
- **Status Trigger:**
  - `current_quantity == 0` ➔ `'Out of Stock'`
  - `current_quantity <= minimum_quantity` ➔ `'Low Stock'`
  - `current_quantity > minimum_quantity` ➔ `'Available'`
- **Realtime Replication:** Both tables published to `supabase_realtime` for sub-second dashboard synchronization.

---

## 3. Hardware Architecture (ESP32 + RC522 RFID)

```
[Pipe Bundle (with RFID Tag)]
         │
         ▼  (Physical Tap / Proximity)
[MFRC522 RFID Reader (SPI)]
         │
         ▼
[ESP32 Microcontroller]  ◄─── [Keypad / Serial / Web Simulator: Removed Quantity]
         │
         ▼  (WiFi HTTPS POST payload: tag_id, qty_removed)
[Supabase REST API / RPC]
         │
    ┌────┴───────────────────────────┐
    ▼                                ▼
[Updates pipe_bundles]    [Inserts inventory_history]
    │
    ▼ (Realtime WebSocket Broadcast)
[React Dashboard (Port 5174)] ➔ [Low Stock Alert Banner / Sound]
```

---

## 4. Frontend Web Dashboard (Port 5174)

- **Dedicated Port:** Runs on `http://localhost:5174` (independent from Module 1 on `5173`).
- **Cross-Module Switcher:** Direct header link between Module 1 (Attendance) and Module 2 (Pipe Inventory).
- **KPI Summary Cards:**
  - Total Bundles Tracked
  - Total Pipes in Stock
  - Low Stock Warning Count
  - Out of Stock Critical Count
- **Live RFID Scanner / Removal Simulator:**
  - Interactive simulator allows testing removals (`-2`, `-3`, custom) instantly on any tag without hardware connected.
  - Live preview of remaining stock before submitting.
- **Visual Inventory Grid & Table:**
  - Filter by Stock Status (`All`, `Available`, `Low Stock`, `Out of Stock`)
  - Visual stock gauge / progress bar per bundle.
  - Quick action buttons: "Log Removal", "Restock Bundle", "Edit Min Threshold".
- **Dynamic Low-Stock Alert System:**
  - Top alert banner highlighting affected bundles whenever remaining pipes ≤ minimum quantity.
  - Direct restock CTA.
- **Inventory History Log:**
  - Complete chronological audit log with timestamp, operator, delta, and remaining balance.
- **Database Self-Healing / Offline Demo Mode:**
  - If Supabase tables are not yet created in PostgreSQL, the UI seamlessly falls back to in-memory state while showing the exact SQL script to copy into Supabase SQL Editor.

---

## 5. Verification & Testing Steps

1. Run `module2-inventory/scripts/simulate_rfid_inventory.js` to verify:
   - Initial quantity (10)
   - Remove 2 ➔ 8 (Normal Stock)
   - Remove 3 ➔ 5 (Normal Stock)
   - Remove 2 ➔ 3 (Triggers Low Stock Alert!)
2. Launch frontend on port 5174 and test real-time UI reactions and simulator widget.
3. Verify cross-navigation between Module 1 (port 5173) and Module 2 (port 5174).
