# Module 1 – Attendance Management System
## Full Build Plan (Web Portal + Backend) — For AI Agent Execution

**Stack:** Supabase (Postgres + Auth + Realtime) via Supabase MCP, Web frontend (React), ESP32 + R307 Fingerprint Sensor (hardware, connected later remotely)

**Goal:** A working web portal where a fingerprint scan (via ESP32) logs attendance in real time, viewable across 3 role-based dashboards: Contractor, Supervisor, Worker.

---

## 1. Project Structure

```
/module1-attendance
  /frontend        → React app (dashboards)
  /esp32-firmware   → Arduino sketch for ESP32 + R307
  /scripts          → Simulation script (fake attendance data for testing)
  /docs             → schema.sql, api-notes.md
```

---

## 2. Supabase Schema (Postgres)

### Table: `users`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK, references auth.users) | |
| full_name | text | |
| role | text | enum: 'contractor', 'supervisor', 'worker' |
| fingerprint_id | int | maps to ID stored on R307 sensor |
| created_at | timestamptz | default now() |

### Table: `attendance`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | default gen_random_uuid() |
| user_id | uuid (FK → users.id) | |
| check_in | timestamptz | |
| check_out | timestamptz | nullable |
| status | text | 'present', 'late', 'absent' |
| device_id | text | which ESP32 sent this |
| created_at | timestamptz | default now() |

**Instruction to agent:** Generate this schema via Supabase MCP, including foreign key constraints and a `created_at` default of `now()` on all tables.

---

## 3. Row Level Security (RLS) Policies

Enable RLS on both tables. Then:

- **Workers:** `SELECT` on `attendance` only where `user_id = auth.uid()`
- **Supervisors:** `SELECT` on `attendance` for all workers (add a `supervisor_id` link later if team-scoping is needed; for Module 1, allow full read)
- **Contractor:** `SELECT` full access to `attendance` and `users`
- **Insert into `attendance`:** only allowed via a service role key (used by ESP32/backend), not by client-side users directly

**Instruction to agent:** Write and apply these as SQL policies via Supabase MCP. Test each role's access with a sample query before moving on.

---

## 4. Authentication

- Use Supabase Auth (email/password) for all 3 roles
- On signup/seed, insert a matching row into `users` table with the correct `role`
- Frontend reads `role` after login to decide which dashboard view to render

**Instruction to agent:** Set up Supabase Auth, and seed 3 test users (one per role) for development testing before real users exist.

---

## 5. Frontend — Single App, Role-Based Views

Build **one React app** with route/view logic based on logged-in user's `role`. Do not build 3 separate apps.

### Contractor View
- Today's attendance count (present/absent/late)
- List of all workers with today's status
- Simple table, read-only

### Supervisor View
- Same as Contractor view for Module 1 (task assignment comes in Module 2+, skip for now)

### Worker View
- Their own attendance history (check-in/check-out times, status)
- Read-only, filtered to `auth.uid()`

**Instruction to agent:** Use Supabase Realtime subscription on the `attendance` table so all dashboards update live without refresh when a new row is inserted.

---

## 6. Simulate Hardware (Before Real ESP32 Is Connected)

Since hardware is with the client, build and test everything using fake data first.

Create `/scripts/simulate_attendance.js`:
- Inserts a row into `attendance` every few seconds using the Supabase JS client + service role key
- Cycles through the 3 seeded test users
- Confirms the full pipeline (Realtime → dashboard update) works before touching real hardware

**Instruction to agent:** Build this script first, run it, and confirm dashboards update live. Do not proceed to ESP32 integration until this passes.

---

## 7. ESP32 Firmware (Prep for Remote Hardware Call)

Write `/esp32-firmware/attendance.ino`:
- Connects to WiFi (SSID/password as editable variables at top of file)
- Interfaces with R307 sensor to capture/verify fingerprint → maps to `fingerprint_id`
- On successful match, sends an HTTP POST to Supabase REST API to insert a row into `attendance` (using service role key, kept server-side/secure — NOT hardcoded if avoidable, use a lightweight relay if needed)
- Prints status at each step to Serial Monitor: `WiFi connected`, `Sensor ready`, `Fingerprint matched: ID {x}`, `Data sent to Supabase: {success/fail}`

**Instruction to agent:** Keep this file self-contained and heavily commented, since it will be edited live by a non-technical client on a Google Meet call. WiFi credentials and Supabase keys must be the only two things they need to change.

---

## 8. Testing Checklist (Before Client Call)

- [ ] All 3 test users can log in and see correct role-based dashboard
- [ ] Simulated attendance data appears in real time on all dashboards
- [ ] RLS confirmed: worker cannot see other workers' data via API/console test
- [ ] ESP32 sketch compiles with placeholder credentials
- [ ] Serial Monitor debug prints in place at every step

## 9. Remote Hardware Call Checklist (With Client)

- [ ] Client has Arduino IDE + ESP32 board package installed beforehand
- [ ] Client shares screen (not camera) for IDE/Serial Monitor
- [ ] Walk through: enter WiFi + Supabase credentials → select board/COM port → upload
- [ ] Verify live row insert in Supabase table editor as client scans a fingerprint
- [ ] Confirm dashboard updates in real time on your screen

---

## 10. Definition of Done (Module 1)

- Working web portal with 3 role-based views, live Supabase data
- ESP32 successfully sending real fingerprint scans to Supabase
- End-to-end tested: physical scan → database row → dashboard update, all in real time
