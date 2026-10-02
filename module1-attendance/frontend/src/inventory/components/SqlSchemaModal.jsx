import React, { useState } from "react";
import "./Modals.css";

const SQL_SCRIPT = `-- ==============================================================================
-- RFID-BASED MATERIAL BUNDLE INVENTORY SYSTEM
-- Run this in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Create table: material_bundles
CREATE TABLE IF NOT EXISTS public.material_bundles (
    bundle_id TEXT PRIMARY KEY,
    tag_id TEXT UNIQUE NOT NULL,
    material_type TEXT NOT NULL,
    starting_quantity INTEGER NOT NULL CHECK (starting_quantity >= 0),
    current_quantity INTEGER NOT NULL CHECK (current_quantity >= 0),
    minimum_quantity INTEGER NOT NULL DEFAULT 3 CHECK (minimum_quantity >= 0),
    location TEXT DEFAULT 'Store Room A',
    status TEXT NOT NULL DEFAULT 'Available',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create table: inventory_history
CREATE TABLE IF NOT EXISTS public.inventory_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id TEXT NOT NULL REFERENCES public.material_bundles(bundle_id) ON DELETE CASCADE,
    tag_id TEXT,
    action TEXT NOT NULL CHECK (action IN ('Removed', 'Restocked', 'Initial', 'Adjusted')),
    qty_removed INTEGER NOT NULL DEFAULT 0,
    remaining_quantity INTEGER NOT NULL CHECK (remaining_quantity >= 0),
    performed_by TEXT DEFAULT 'Field Lead',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Automatic Status Computation Trigger
CREATE OR REPLACE FUNCTION public.compute_bundle_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_quantity = 0 THEN
        NEW.status := 'Out of Stock';
    ELSIF NEW.current_quantity <= NEW.minimum_quantity THEN
        NEW.status := 'Low Stock';
    ELSE
        NEW.status := 'Available';
    END IF;
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_compute_bundle_status ON public.material_bundles;
CREATE TRIGGER trigger_compute_bundle_status
BEFORE INSERT OR UPDATE OF current_quantity, minimum_quantity ON public.material_bundles
FOR EACH ROW
EXECUTE FUNCTION public.compute_bundle_status();

-- 4. Atomic Removal Function (Invoked by RFID Scanner / Gateway / Web App)
CREATE OR REPLACE FUNCTION public.record_material_removal(
    p_tag_id TEXT,
    p_qty INTEGER,
    p_operator TEXT DEFAULT 'Field Lead',
    p_notes TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
    v_bundle public.material_bundles%ROWTYPE;
    v_new_qty INTEGER;
    v_new_status TEXT;
BEGIN
    SELECT * INTO v_bundle
    FROM public.material_bundles
    WHERE tag_id = p_tag_id OR bundle_id = p_tag_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Bundle or RFID Tag not recognized in inventory registry: ' || p_tag_id
        );
    END IF;

    IF p_qty <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid deduction quantity. Must be greater than zero.'
        );
    END IF;

    IF v_bundle.current_quantity < p_qty THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient stock. Requested ' || p_qty || ' units, but only ' || v_bundle.current_quantity || ' available.'
        );
    END IF;

    v_new_qty := v_bundle.current_quantity - p_qty;

    IF v_new_qty = 0 THEN
        v_new_status := 'Out of Stock';
    ELSIF v_new_qty <= v_bundle.minimum_quantity THEN
        v_new_status := 'Low Stock';
    ELSE
        v_new_status := 'Available';
    END IF;

    UPDATE public.material_bundles
    SET current_quantity = v_new_qty,
        status = v_new_status,
        updated_at = timezone('utc'::text, now())
    WHERE bundle_id = v_bundle.bundle_id;

    INSERT INTO public.inventory_history (
        bundle_id,
        tag_id,
        action,
        qty_removed,
        remaining_quantity,
        performed_by,
        notes
    ) VALUES (
        v_bundle.bundle_id,
        v_bundle.tag_id,
        'Removed',
        p_qty,
        v_new_qty,
        p_operator,
        COALESCE(p_notes, 'Physical bundle scan & deduction')
    );

    RETURN jsonb_build_object(
        'success', true,
        'bundle_id', v_bundle.bundle_id,
        'tag_id', v_bundle.tag_id,
        'material_type', v_bundle.material_type,
        'previous_quantity', v_bundle.current_quantity,
        'quantity_removed', p_qty,
        'remaining_quantity', v_new_qty,
        'minimum_quantity', v_bundle.minimum_quantity,
        'status', v_new_status,
        'low_stock_triggered', (v_new_qty <= v_bundle.minimum_quantity)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Enable Row Level Security (RLS) & Policies
ALTER TABLE public.material_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view material_bundles" ON public.material_bundles;
CREATE POLICY "Public can view material_bundles" ON public.material_bundles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert material_bundles" ON public.material_bundles;
CREATE POLICY "Public can insert material_bundles" ON public.material_bundles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update material_bundles" ON public.material_bundles;
CREATE POLICY "Public can update material_bundles" ON public.material_bundles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public can delete material_bundles" ON public.material_bundles;
CREATE POLICY "Public can delete material_bundles" ON public.material_bundles FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public can view inventory_history" ON public.inventory_history;
CREATE POLICY "Public can view inventory_history" ON public.inventory_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert inventory_history" ON public.inventory_history;
CREATE POLICY "Public can insert inventory_history" ON public.inventory_history FOR INSERT WITH CHECK (true);

-- 6. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.material_bundles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_history;

-- 7. Seed Initial Materials (TMT Rebar, Timber Framing, Conduit, PVC)
INSERT INTO public.material_bundles (bundle_id, tag_id, material_type, starting_quantity, current_quantity, minimum_quantity, location, status)
VALUES
    ('MAT-B001', 'EPC-MAT-001', 'TMT Steel Rebar 16mm (Bundle of 8)', 15, 15, 4, 'Yard Bay 1', 'Available'),
    ('MAT-B002', 'EPC-MAT-002', 'Timber 2x4 Lumber Framing (10ft Pack)', 20, 20, 5, 'Store Room B', 'Available'),
    ('MAT-B003', 'EPC-MAT-003', '4" PVC Drain Pipe Schedule 40', 10, 3, 3, 'Store Room A', 'Low Stock'),
    ('MAT-B004', 'EPC-MAT-004', '1" HDPE Electrical Conduit (100m Roll)', 12, 0, 3, 'Electrical Store', 'Out of Stock')
ON CONFLICT (bundle_id) DO NOTHING;

INSERT INTO public.inventory_history (bundle_id, tag_id, action, qty_removed, remaining_quantity, performed_by, notes)
VALUES
    ('MAT-B001', 'EPC-MAT-001', 'Initial', 0, 15, 'System Seed', 'Initial stock received'),
    ('MAT-B002', 'EPC-MAT-002', 'Initial', 0, 20, 'System Seed', 'Initial stock received'),
    ('MAT-B003', 'EPC-MAT-003', 'Initial', 0, 10, 'System Seed', 'Initial stock received'),
    ('MAT-B003', 'EPC-MAT-003', 'Removed', 7, 3, 'Site Crew A', 'Plumbing installation phase 1'),
    ('MAT-B004', 'EPC-MAT-004', 'Initial', 0, 12, 'System Seed', 'Initial stock received'),
    ('MAT-B004', 'EPC-MAT-004', 'Removed', 12, 0, 'Electrical Crew', 'Underground trench conduit')
ON CONFLICT DO NOTHING;
ON CONFLICT DO NOTHING;
`;

export default function SqlSchemaModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog large">
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </div>
            <div>
              <h3 className="modal-title">Supabase PostgreSQL Schema Setup</h3>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Run this script in your Supabase SQL editor to create tables and triggers
              </p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="sql-instruction-box">
            <strong>How to run:</strong>
            <ol style={{ paddingLeft: "1.2rem", marginTop: "0.3rem" }}>
              <li>Log into your Supabase project dashboard at <code>https://supabase.com/dashboard/project/lngeqgisidwrimcyxwyv</code></li>
              <li>Go to <strong>SQL Editor</strong> in the left sidebar</li>
              <li>Click <strong>New query</strong>, paste the script below, and click <strong>Run</strong></li>
            </ol>
          </div>

          <pre className="sql-code-block">
            {SQL_SCRIPT}
          </pre>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-modal-cancel" onClick={onClose}>
            Close
          </button>
          <button 
            type="button" 
            className="btn-modal-submit"
            onClick={handleCopy}
          >
            {copied ? "✓ Copied to Clipboard!" : "Copy SQL Script"}
          </button>
        </div>
      </div>
    </div>
  );
}
