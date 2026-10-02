# RFID Material Inventory Management System
## Client & Operator UI User Guide

---

### Executive Summary

The **RFID Material & Bundle Inventory System** provides real-time, cloud-synchronized tracking of material bundles (such as pipes, rebars, scaffolding, conduits, and fittings) across construction job sites and central storage yards. 

Every physical bundle or pallet is tagged with an **RFID tag** (e.g., EPC Gen2 standard). When materials are checked in, allocated to work zones, or restocked, the system updates the cloud database (**Supabase**) instantly and notifies site supervisors of low stock before project delays occur.

The system is fully responsive, working seamlessly across desktop monitors, field tablets, and mobile smartphones.

---

## 1. Login & Access Portal

The login screen authenticates site personnel and enforces role-based access.

| UI Element / Button | Description | How It Works |
| :--- | :--- | :--- |
| **Email & Password Form** | Standard credentials input for registered engineers and managers. | Enter work email and password, then click **Sign In**. Authenticates securely with Supabase Auth. |
| **One-Click Demo Roles** | 3 pre-configured field profile buttons: <br>• **Store Manager** (`manager@leanbuild.com`)<br>• **Field Supervisor** (`supervisor@leanbuild.com`)<br>• **Auditor** (`auditor@leanbuild.com`) | Click any demo button to log in instantly without entering credentials. Used for client presentations and user trials. |
| **Switch to Attendance Portal** | Prominent navigation button in the left panel / top mobile banner. | Navigates directly to **Module 1 (Worker Attendance Management)** running on port `5173`. Enables single-click switching between Lean Construction modules. |

---

## 2. Top Header & Global Actions

The header is fixed at the top of the screen on all devices.

| UI Element / Button | Location | Action & Behavior |
| :--- | :--- | :--- |
| **Lean Construction Logo & Brand** | Left | Displays the 3D cube logo and system title. |
| **Register Bundle** (`+` button) | Right | Opens the **Register New Material Bundle Modal**. Allows supervisors to link a new physical RFID tag to a material specification. *(On mobile screens, automatically collapses to a compact `+` icon).* |
| **User Profile Avatar** | Right | Displays the first letter of the user's name with an active colored badge showing their role (`Store Manager`, `Field Supervisor`, or `Auditor`). |
| **Sign Out Button** (Door Icon) | Far Right | Logs the current user out of the application and returns to the Login page. |

---

## 3. High-Level KPI Summary Cards

Located directly below the header, these 5 metrics summarize site stock health at a glance:

1. **Tracked Bundles**: Total number of registered physical bundles currently tagged in the inventory database.
2. **Total Material Units**: Aggregated sum of all pieces/units available across all active bundles on site.
3. **Low Stock Bundles**: Bundles whose current quantity has dropped to or below their safe minimum threshold (`<= min_quantity`). Highlights in warning amber.
4. **Out of Stock**: Bundles completely exhausted (`0 pcs`). Highlights in alert red.
5. **Removals Logged**: Total count of material dispatches or removals recorded in the audit history.

> **Mobile Optimization:** On mobile phones (`≤ 640px`), the cards arrange into a responsive **2-column grid** with compact spacing so all key numbers remain visible without vertical clutter.

---

## 4. Automated Low-Stock Alert Banner

*This banner appears dynamically only when one or more bundles drop below their designated safety threshold.*

| Element | Description | Action |
| :--- | :--- | :--- |
| **Alert Counter & Pulsing Icon** | Notifies site staff: *"Action Required: X bundles are running low or depleted."* | Draws immediate visual attention to stock shortages. |
| **Bundle Alert Cards** | Displays the Bundle ID, material type, RFID tag, and exact remaining count vs. minimum threshold. | Red badge denotes **Out of Stock**; Amber badge denotes **Low Stock**. |
| **Restock Button** (`+ Restock`) | Quick-action button on each warning card. | Opens the **Restock Modal** pre-filled with this specific bundle so new inventory can be added in seconds. |
| **Dismiss Button** (`✕`) | Top-right of banner. | Temporarily collapses the alert banner until the page is refreshed or stock changes. |

---

## 5. Interactive RFID Reader & Removal Simulator

This widget demonstrates or manually simulates how an RFID reader at a storage gate or tool room records material removals.

### Step-by-Step Workflow:

1. **Step 1: Select Active Bundle / Tag**
   - Click the dropdown menu to choose which tagged bundle is being scanned.
   - Shows Tag ID, Bundle Code, Material Specification, and currently available stock.
   - *Example:* `EPC-MAT-002 (MAT-B002 - 2" PVC Pipe Schedule 40 | Avail: 18 pcs)`

2. **Step 2: Enter Quantity Removed**
   - Click a quick preset button: **1**, **2**, **5**, **10**, or **15** pieces.
   - Or type a custom number in the custom numeric input box.

3. **Step 3: Live Preview & Math Calculation**
   - Displays real-time calculation before confirming:
     $$\text{Current Available} - \text{Quantity To Remove} = \text{Remaining Balance}$$
   - Displays real-time status projection:
     - 🟢 **Normal Stock** (Remaining > Min Limit)
     - 🟠 **Low Stock Alert** (Remaining ≤ Min Limit)
     - 🔴 **Out of Stock** (Remaining = 0)

4. **Execute RFID Removal Scan Button**
   - Clicking **"Execute RFID Removal Scan"** triggers:
     - Direct cloud call to PostgreSQL Stored Procedure `record_material_removal()`.
     - Decrements the bundle's `current_quantity` in `material_bundles`.
     - Creates a timestamped record in `inventory_history`.
     - Displays a confirmation toast notification.

---

## 6. Material & Bundle Inventory Master View

This section provides complete visibility into every physical bundle in the facility.

### Toolbar & Search
- **Status Filter Tabs**: Filter bundles with one click:
  - **All**: Shows every bundle.
  - **Normal**: Shows bundles with healthy stock levels.
  - **Low Stock**: Filters only bundles that need reordering.
  - **Out of Stock**: Filters depleted bundles.
- **Search Bar**: Type any text to instantly filter by:
  - Bundle ID (e.g. `MAT-B001`)
  - RFID Tag ID (e.g. `EPC-MAT-001`)
  - Material Specification (e.g. `Copper Pipe`, `PVC`, `Scaffolding`)
  - Location (e.g. `Store Room A`, `Rack B-04`)
- **Clear Button (`✕`)**: Resets the search filter.

### Desktop View (Table Mode)
| Column | Description |
| :--- | :--- |
| **Bundle ID** | Unique system identifier for the bundle (e.g., `MAT-B001`). |
| **RFID Tag ID** | Physical electronic EPC tag attached to the bundle (e.g., `EPC-MAT-001`). |
| **Material / Specification** | Description and dimensions of the material. |
| **Stock Level (Gauge)** | Visual color-coded progress bar showing remaining percentage ($0\% - 100\%$). |
| **Starting Qty** | Original quantity loaded into the bundle at check-in. |
| **Current Qty** | Exact units currently remaining in stock. |
| **Min Limit** | Minimum threshold triggering low-stock alerts. |
| **Location** | Physical yard or warehouse storage area. |
| **Status** | Status pill: `Normal Stock` (Green), `Low Stock` (Amber), or `Out of Stock` (Red). |
| **Actions** | Two quick buttons: <br>• **Remove** (minus icon): Logs material taken from bundle.<br>• **Restock** (plus icon): Logs replenishment of new units into bundle. |

### Mobile View (Stacked Cards Mode)
On screens smaller than `640px` (such as iPhone or Android smartphones):
- The wide table automatically converts into **touch-friendly cards**.
- Each card shows:
  - Bundle ID & RFID Tag ID in monospace chips.
  - Live Status Pill.
  - Full Material Specification title.
  - Gauge Bar with percentage label.
  - 3-column detail grid: **Current Qty**, **Starting Qty**, and **Min Limit**.
  - Yard Location tag with map pin icon.
  - Side-by-side **Remove** and **Restock** touch buttons sized for easy one-tap operation on job sites.

---

## 7. Inventory History Audit Log

A permanent, tamper-resistant transaction ledger recording every scan and stock adjustment.

| Feature / Element | How It Works |
| :--- | :--- |
| **Transaction Feed** | Displays chronologically sorted events (most recent first): timestamp, bundle ID, action type, quantity delta, balance, operator, and notes. |
| **Action Badges** | • `Initial`: Initial bundle check-in.<br>• `Removed`: Material checked out / consumed (displayed in red with negative quantity, e.g. `−4 pcs`).<br>• `Restocked`: Material replenished (displayed in green with positive quantity, e.g. `+10 pcs`). |
| **Bundle Filter Dropdown** | Filter the audit log to inspect the history of one single bundle. |
| **Export CSV Button** | Generates and downloads a `.csv` spreadsheet containing the filtered audit records with headers, timestamps, operator names, and remarks for Excel or ERP reporting. |
| **Mobile Card View** | On smartphones, history rows convert into compact summary cards with timestamps, quantity changes, and operator details. |

---

## 8. Modals & Data Entry Dialogs

### A. Register New Bundle Modal
- **Purpose**: Add a new material shipment or newly tagged bundle to the system.
- **Fields**:
  - `Bundle Identifier`: e.g. `MAT-B007`.
  - `RFID Tag ID (EPC)`: Scanned from handheld or typed (e.g. `EPC-MAT-007`).
  - `Material Specification`: Select from standard catalog (PVC Pipes, Scaffolding, GI Pipes, Copper Pipes, CPVC, Rebars) or enter custom spec.
  - `Initial Quantity`: Total units in this bundle.
  - `Minimum Alert Threshold`: Quantity at which low-stock alerts trigger.
  - `Storage Location`: Specific bay, rack, or room.
- **Save Action**: Saves directly to `material_bundles` table and writes an `Initial` record in `inventory_history`.

### B. Record Material Removal Modal
- **Purpose**: Manually log materials taken from a bundle when not using an automated gate reader.
- **Fields**:
  - Selected Bundle & current available count.
  - `Units to Remove`: Number of pieces taken.
  - `Taken By / Operator`: Name or badge ID of the field worker or supervisor.
  - `Work Zone / Notes`: Purpose (e.g. *"Plumbing Grid B, 3rd Floor"*).
- **Save Action**: Updates stock and writes an immutable removal audit entry.

### C. Restock Material Bundle Modal
- **Purpose**: Replenish inventory in an existing bundle upon delivery.
- **Fields**:
  - Selected Bundle & current stock.
  - `Units to Add`: Quantity of newly delivered items.
  - `Received By`: Supervisor receiving shipment.
  - `Supplier / Delivery Note`: Invoice or delivery voucher reference.
- **Save Action**: Increases bundle stock and logs a restock event.

---

## 9. Hardware & Real-World Scanner Integration

The web UI works hand-in-hand with physical RFID hardware:

```
[ Physical RFID Tag on Bundle ]
             │
             ▼ (UHF / HF RFID Radio Scan)
[ ESP32 Microcontroller + RC522 / UHF Reader ]
             │
             ▼ (Secure HTTPS / WiFi)
[ Supabase PostgreSQL Database (material_bundles & inventory_history) ]
             │
             ▼ (Realtime WebSocket Broadcast)
[ Web Application UI (Live update on Desktop & Mobile in < 500ms) ]
```

- When a worker carries a bundle through an RFID gate reader or scans it with an ESP32 handheld terminal, the ESP32 calls the Supabase RPC endpoint.
- The web dashboard receives the Postgres change event via **Supabase Realtime** and immediately updates KPI cards, tables, and history without needing a page refresh.
