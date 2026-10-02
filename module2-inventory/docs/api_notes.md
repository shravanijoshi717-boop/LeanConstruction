# Module 2 – API Integration Notes

This document describes how the hardware (ESP32 RFID Reader), gateway, and frontend interact with the Supabase backend for Module 2.

## Base Configuration
- **Supabase URL:** `https://lngeqgisidwrimcyxwyv.supabase.co`
- **Tables:** `pipe_bundles`, `inventory_history`

---

## 1. Direct RPC: Record Pipe Removal (`record_pipe_removal`)

The ESP32 or external gateway can perform an atomic removal and fetch the updated stock and alert flag in a single HTTPS POST request.

- **Endpoint:** `POST https://lngeqgisidwrimcyxwyv.supabase.co/rest/v1/rpc/record_pipe_removal`
- **Headers:**
  ```http
  apikey: <SUPABASE_ANON_KEY>
  Authorization: Bearer <SUPABASE_ANON_KEY>
  Content-Type: application/json
  ```
- **Request Body:**
  ```json
  {
    "p_tag_id": "EPC-PIPE-001",
    "p_qty_removed": 3,
    "p_performed_by": "ESP32-Reader-Yard1",
    "p_notes": "Removed for Sector 4 Plumbing"
  }
  ```
- **Successful Response (HTTP 200):**
  ```json
  {
    "success": true,
    "bundle_id": "PIPE-B001",
    "tag_id": "EPC-PIPE-001",
    "pipe_type": "PVC Pipe 4\"",
    "previous_quantity": 10,
    "qty_removed": 3,
    "remaining_quantity": 7,
    "minimum_quantity": 3,
    "status": "Available",
    "is_low_stock": false
  }
  ```
- **Low Stock Triggered Response (HTTP 200):**
  ```json
  {
    "success": true,
    "bundle_id": "PIPE-B001",
    "tag_id": "EPC-PIPE-001",
    "pipe_type": "PVC Pipe 4\"",
    "previous_quantity": 5,
    "qty_removed": 2,
    "remaining_quantity": 3,
    "minimum_quantity": 3,
    "status": "Low Stock",
    "is_low_stock": true
  }
  ```
- **Error Response (Insufficient Stock):**
  ```json
  {
    "success": false,
    "error": "Insufficient quantity. Available: 2, requested: 5"
  }
  ```

---

## 2. Standard REST Fallback

If direct RPC is not used, the client updates the row directly:
1. **Query Bundle by Tag:**
   `GET /rest/v1/pipe_bundles?tag_id=eq.EPC-PIPE-001&select=*`
2. **Calculate New Quantity:**
   `new_qty = current_quantity - qty_removed`
3. **Update Bundle:**
   `PATCH /rest/v1/pipe_bundles?id=eq.<id>` with body `{"current_quantity": new_qty}`
4. **Insert History Record:**
   `POST /rest/v1/inventory_history` with body:
   ```json
   {
     "bundle_id": "PIPE-B001",
     "tag_id": "EPC-PIPE-001",
     "action": "Removed",
     "qty_removed": 2,
     "remaining_quantity": 8,
     "performed_by": "Field Operator",
     "notes": "Manual removal entry"
   }
   ```

---

## 3. Realtime Subscriptions

The React dashboard subscribes to PostgreSQL changes:
```javascript
const subscription = supabase
  .channel('pipe_bundles_channel')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'pipe_bundles' }, (payload) => {
    // Refresh inventory and check for low stock triggers
  })
  .subscribe();
```
