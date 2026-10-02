-- ==============================================================================
-- MODULE 2: RFID-BASED PIPE BUNDLE INVENTORY SYSTEM
-- SUPABASE POSTGRESQL SCHEMA & STORED PROCEDURES
-- ==============================================================================

-- 1. Create table: pipe_bundles
CREATE TABLE IF NOT EXISTS public.pipe_bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id TEXT UNIQUE NOT NULL,
    tag_id TEXT UNIQUE NOT NULL,
    pipe_type TEXT NOT NULL,
    starting_quantity INTEGER NOT NULL DEFAULT 10,
    current_quantity INTEGER NOT NULL DEFAULT 10,
    minimum_quantity INTEGER NOT NULL DEFAULT 3,
    location TEXT NOT NULL DEFAULT 'Store Room A',
    status TEXT NOT NULL DEFAULT 'Available',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create table: inventory_history
CREATE TABLE IF NOT EXISTS public.inventory_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id TEXT NOT NULL REFERENCES public.pipe_bundles(bundle_id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'Initial', 'Removed', 'Restocked', 'Adjusted'
    qty_removed INTEGER DEFAULT 0,
    remaining_quantity INTEGER NOT NULL,
    performed_by TEXT DEFAULT 'Field Operator',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Automatic Status Computation Trigger
CREATE OR REPLACE FUNCTION public.compute_pipe_bundle_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_quantity <= 0 THEN
        NEW.current_quantity := 0;
        NEW.status := 'Out of Stock';
    ELSIF NEW.current_quantity <= NEW.minimum_quantity THEN
        NEW.status := 'Low Stock';
    ELSE
        NEW.status := 'Available';
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_compute_pipe_status ON public.pipe_bundles;
CREATE TRIGGER trigger_compute_pipe_status
BEFORE INSERT OR UPDATE OF current_quantity, minimum_quantity ON public.pipe_bundles
FOR EACH ROW
EXECUTE FUNCTION public.compute_pipe_bundle_status();

-- 4. Atomic Removal Function (Invoked by ESP32 / Gateway / Web App)
CREATE OR REPLACE FUNCTION public.record_pipe_removal(
    p_tag_id TEXT,
    p_qty_removed INTEGER,
    p_performed_by TEXT DEFAULT 'RFID Scanner',
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_bundle public.pipe_bundles%ROWTYPE;
    v_new_qty INTEGER;
    v_is_low_stock BOOLEAN;
BEGIN
    -- Locate bundle by tag_id or bundle_id
    SELECT * INTO v_bundle
    FROM public.pipe_bundles
    WHERE tag_id = p_tag_id OR bundle_id = p_tag_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Bundle not found for RFID Tag: ' || p_tag_id
        );
    END IF;

    IF p_qty_removed <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Removed quantity must be greater than 0'
        );
    END IF;

    IF v_bundle.current_quantity < p_qty_removed THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient quantity. Available: ' || v_bundle.current_quantity || ', requested: ' || p_qty_removed
        );
    END IF;

    -- Calculate new balance
    v_new_qty := v_bundle.current_quantity - p_qty_removed;

    -- Update bundle table (trigger automatically computes new status)
    UPDATE public.pipe_bundles
    SET current_quantity = v_new_qty
    WHERE id = v_bundle.id
    RETURNING * INTO v_bundle;

    -- Insert audit history record
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
        p_qty_removed,
        v_new_qty,
        p_performed_by,
        p_notes
    );

    v_is_low_stock := (v_new_qty <= v_bundle.minimum_quantity);

    RETURN jsonb_build_object(
        'success', true,
        'bundle_id', v_bundle.bundle_id,
        'tag_id', v_bundle.tag_id,
        'pipe_type', v_bundle.pipe_type,
        'previous_quantity', v_bundle.current_quantity + p_qty_removed,
        'qty_removed', p_qty_removed,
        'remaining_quantity', v_new_qty,
        'minimum_quantity', v_bundle.minimum_quantity,
        'status', v_bundle.status,
        'is_low_stock', v_is_low_stock
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Enable Row Level Security (RLS) & Policies
ALTER TABLE public.pipe_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view pipe_bundles" ON public.pipe_bundles;
CREATE POLICY "Public can view pipe_bundles" ON public.pipe_bundles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert pipe_bundles" ON public.pipe_bundles;
CREATE POLICY "Public can insert pipe_bundles" ON public.pipe_bundles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update pipe_bundles" ON public.pipe_bundles;
CREATE POLICY "Public can update pipe_bundles" ON public.pipe_bundles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public can view inventory_history" ON public.inventory_history;
CREATE POLICY "Public can view inventory_history" ON public.inventory_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert inventory_history" ON public.inventory_history;
CREATE POLICY "Public can insert inventory_history" ON public.inventory_history FOR INSERT WITH CHECK (true);

-- 6. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE public.pipe_bundles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_history;

-- 7. Seed Initial Inventory (Example from Project Specification)
INSERT INTO public.pipe_bundles (bundle_id, tag_id, pipe_type, starting_quantity, current_quantity, minimum_quantity, location, status)
VALUES
    ('PIPE-B001', 'EPC-PIPE-001', 'PVC Pipe 4"', 10, 10, 3, 'Store Room A', 'Available'),
    ('PIPE-B002', 'EPC-PIPE-002', 'PVC Pipe 4"', 10, 10, 3, 'Store Room A', 'Available'),
    ('PIPE-B003', 'EPC-PIPE-003', 'GI Pipe 2"', 15, 3, 3, 'Site Yard Section 2', 'Low Stock'),
    ('PIPE-B004', 'EPC-PIPE-004', 'HDPE Conduit 1"', 20, 0, 4, 'Store Room B', 'Out of Stock')
ON CONFLICT (bundle_id) DO NOTHING;

-- Initial history entry for seeded bundles
INSERT INTO public.inventory_history (bundle_id, tag_id, action, qty_removed, remaining_quantity, performed_by, notes)
VALUES
    ('PIPE-B001', 'EPC-PIPE-001', 'Initial', 0, 10, 'System Seed', 'Initial stock received'),
    ('PIPE-B002', 'EPC-PIPE-002', 'Initial', 0, 10, 'System Seed', 'Initial stock received'),
    ('PIPE-B003', 'EPC-PIPE-003', 'Initial', 0, 15, 'System Seed', 'Initial stock received'),
    ('PIPE-B003', 'EPC-PIPE-003', 'Removed', 12, 3, 'Site Crew A', 'Plumbing installation phase 1'),
    ('PIPE-B004', 'EPC-PIPE-004', 'Initial', 0, 20, 'System Seed', 'Initial stock received'),
    ('PIPE-B004', 'EPC-PIPE-004', 'Removed', 20, 0, 'Electrical Crew', 'Underground trench conduit')
ON CONFLICT DO NOTHING;
