# Module 2: RFID-Based Pipe Bundle Inventory System

Automated quantity calculation, inventory updating, and real-time low-stock alerts for construction piping logistics.

---

## 1. Features
* **Bundle Tag Identification:** Unique RFID tag attached per bundle rather than tagging every individual pipe.
* **Atomic Deduction Engine:** Automatically calculates `Current Qty = Previous Qty - Removed Qty`.
* **Low-Stock Notification:** When quantity drops to or below the minimum limit (e.g. 3 pipes), an alert is triggered immediately on the dashboard and stored in the reorder queue.
* **Full Audit History:** Every removal, restock, or adjustment is permanently logged with timestamp, operator, delta, and remaining balance.
* **Simulated Hardware Interface:** Interactive on-screen RFID reader and removal logger for immediate testing without physical sensors connected.
* **Supabase Cloud + Local Persistence:** Seamlessly connects to Supabase PostgreSQL or runs in persistent local memory mode if migrations are pending.

---

## 2. Directory Structure

```
/module2-inventory
  ├── /frontend              → React + Vite web dashboard (running on port 5174)
  ├── /esp32-firmware        → Arduino sketch for ESP32 + MFRC522 RFID reader
  ├── /scripts               → simulate_rfid_inventory.js (automated CLI test)
  └── /docs
        ├── schema.sql       → Supabase PostgreSQL schema, triggers & RPC
        ├── api_notes.md     → REST & RPC endpoint documentation
        └── wiring_diagram.md→ ESP32 to RC522 SPI pin wiring table
```

---

## 3. How to Run

### Step 1: Run the Simulation CLI
In your terminal:
```bash
cd module2-inventory/scripts
node simulate_rfid_inventory.js
```

### Step 2: Start the Web Dashboard
```bash
cd module2-inventory/frontend
npm run dev
```
Open **`http://localhost:5174`** in your browser.

### Step 3: Run Supabase Database Migration (Optional)
To persist data to your shared Supabase cloud project:
1. Open your Supabase dashboard at `https://supabase.com/dashboard/project/lngeqgisidwrimcyxwyv`.
2. Go to **SQL Editor** -> **New query**.
3. Paste the contents of `module2-inventory/docs/schema.sql` and click **Run**.
