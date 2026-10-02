import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./lib/supabase";
import Header from "./components/Header";
import KpiCards from "./components/KpiCards";
import LowStockBanner from "./components/LowStockBanner";
import RfidSimulatorWidget from "./components/RfidSimulatorWidget";
import PipeBundleTable from "./components/PipeBundleTable";
import InventoryHistoryTable from "./components/InventoryHistoryTable";
import AddBundleModal from "./components/AddBundleModal";
import RemovalModal from "./components/RemovalModal";
import RestockModal from "./components/RestockModal";
import SqlSchemaModal from "./components/SqlSchemaModal";
import Login from "./pages/Login";
import "./App.css";

export default function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Pure Supabase data state (NO local storage)
  const [bundles, setBundles] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dbError, setDbError] = useState(null);
  const [isConnectedToDb, setIsConnectedToDb] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [removalBundle, setRemovalBundle] = useState(null);
  const [restockBundle, setRestockBundle] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = "info") => {
    setToastMessage({ msg, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.id === Date.now() ? null : prev));
    }, 4500);
  };

  // Auth session check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setUserProfile(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
      if (data) setUserProfile(data);
    } catch (e) {
      console.info("Profile lookup:", e);
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
  };

  const handleDemoLogin = (demoProfile) => {
    setSession({ user: { email: demoProfile.email, id: demoProfile.id } });
    setUserProfile(demoProfile);
    setAuthLoading(false);
  };

  // Fetch exclusively from Supabase
  const loadSupabaseData = useCallback(async () => {
    setLoadingData(true);
    try {
      const { data: bData, error: bError } = await supabase
        .from("material_bundles")
        .select("*")
        .order("bundle_id", { ascending: true });

      if (bError) {
        setIsConnectedToDb(false);
        setDbError(bError.message || "Table 'material_bundles' not found in Supabase schema");
        setBundles([]);
        setLoadingData(false);
        return;
      }

      setBundles(bData || []);
      setIsConnectedToDb(true);
      setDbError(null);

      const { data: hData, error: hError } = await supabase
        .from("inventory_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (!hError && hData) {
        setHistory(hData);
      }
    } catch (err) {
      setIsConnectedToDb(false);
      setDbError(err.message || "Failed to communicate with Supabase");
    } finally {
      setLoadingData(false);
    }
  }, []);

  // Set up Supabase fetch & realtime channels
  useEffect(() => {
    if (!session) return;

    loadSupabaseData();

    // Subscribe to Supabase Postgres changes for sub-second updates
    const channel = supabase
      .channel("material_inventory_supabase_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "material_bundles" },
        () => {
          loadSupabaseData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory_history" },
        () => {
          loadSupabaseData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, loadSupabaseData]);

  // Compute bundles that triggered low stock or out of stock directly from Supabase data
  const lowStockBundles = useMemo(() => {
    return bundles.filter((b) => b.current_quantity <= b.minimum_quantity);
  }, [bundles]);

  // 1. Record Pipe Removal -> Directly in Supabase
  const handleRecordRemoval = async ({ tag_id, bundle_id, qty_removed, performed_by, notes }) => {
    const target = bundles.find((b) => b.tag_id === tag_id || b.bundle_id === bundle_id);
    if (!target) return null;

    const previousQty = target.current_quantity;
    const newQty = Math.max(0, previousQty - qty_removed);

    let status = "Available";
    let isLowStock = false;
    if (newQty === 0) {
      status = "Out of Stock";
      isLowStock = true;
    } else if (newQty <= target.minimum_quantity) {
      status = "Low Stock";
      isLowStock = true;
    }

    // Try PostgreSQL Stored Procedure first
    try {
      let rpcResult = null;
      const { data: rpcData, error: rpcError } = await supabase.rpc("record_material_removal", {
        p_tag_id: target.tag_id,
        p_qty: qty_removed,
        p_operator: performed_by || "Field Lead",
        p_notes: notes || "Direct table removal entry",
      });

      if (!rpcError && rpcData && rpcData.success) {
        rpcResult = rpcData;
      } else {
        // Fallback to legacy name if needed
        const { data: legacyData, error: legacyError } = await supabase.rpc("record_pipe_removal", {
          p_tag_id: target.tag_id,
          p_qty: qty_removed,
          p_operator: performed_by || "Field Lead",
          p_notes: notes || "Direct table removal entry",
        });
        if (!legacyError && legacyData && legacyData.success) {
          rpcResult = legacyData;
        }
      }

      if (rpcResult) {
        showToast(
          `Supabase Synced: ${rpcResult.bundle_id} reduced to ${rpcResult.remaining_quantity} units (${rpcResult.status})`,
          rpcResult.low_stock_triggered ? "warning" : "success"
        );
        await loadSupabaseData();
        return rpcResult;
      }
    } catch (e) {
      console.warn("RPC failed, falling back to direct table update:", e);
    }

    // Direct Supabase table update if RPC not applied
    try {
      const { error: updateError } = await supabase
        .from("material_bundles")
        .update({
          current_quantity: newQty,
          status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("bundle_id", target.bundle_id);

      if (updateError) throw updateError;

      const { error: histError } = await supabase.from("inventory_history").insert([
        {
          bundle_id: target.bundle_id,
          tag_id: target.tag_id,
          action: "Removed",
          qty_removed: qty_removed,
          remaining_quantity: newQty,
          performed_by: performed_by || "Field Operator",
          notes: notes || "Direct removal transaction",
        },
      ]);

      if (histError) console.warn("Failed to insert history in Supabase:", histError);

      if (newQty === 0) {
        showToast(`🚨 OUT OF STOCK: Bundle ${target.bundle_id} is depleted!`, "danger");
      } else if (isLowStock) {
        showToast(
          `⚠️ LOW STOCK ALERT: ${target.bundle_id} at ${newQty} units (Min: ${target.minimum_quantity})!`,
          "warning"
        );
      } else {
        showToast(`✓ Removed ${qty_removed} units from ${target.bundle_id}. Balance: ${newQty}`, "success");
      }

      await loadSupabaseData();

      return {
        success: true,
        bundle_id: target.bundle_id,
        tag_id: target.tag_id,
        material_type: target.material_type || target.pipe_type,
        previous_quantity: previousQty,
        qty_removed: qty_removed,
        remaining_quantity: newQty,
        minimum_quantity: target.minimum_quantity,
        status: status,
        is_low_stock: isLowStock,
      };
    } catch (err) {
      showToast(`Supabase Error: ${err.message}`, "danger");
      return null;
    }
  };

  // 2. Add New Bundle -> Directly in Supabase
  const handleAddBundle = async (bundleData) => {
    try {
      const payload = {
        bundle_id: bundleData.bundle_id,
        tag_id: bundleData.tag_id,
        material_type: bundleData.material_type || bundleData.pipe_type,
        starting_quantity: bundleData.starting_quantity,
        current_quantity: bundleData.current_quantity,
        minimum_quantity: bundleData.minimum_quantity,
        location: bundleData.location,
        status: bundleData.status || "Available"
      };

      const { error: insertError } = await supabase.from("material_bundles").insert([payload]);
      if (insertError) throw insertError;

      const initialHistory = {
        bundle_id: bundleData.bundle_id,
        tag_id: bundleData.tag_id,
        action: "Initial",
        qty_removed: 0,
        remaining_quantity: bundleData.starting_quantity,
        performed_by: "System Registration",
        notes: "Initial inventory batch load",
      };

      await supabase.from("inventory_history").insert([initialHistory]);
      showToast(`✓ Bundle ${bundleData.bundle_id} saved to Supabase!`, "success");
      await loadSupabaseData();
    } catch (err) {
      showToast(`Supabase insert failed: ${err.message}`, "danger");
    }
  };

  // 3. Restock Items -> Directly in Supabase
  const handleRestock = async ({ tag_id, bundle_id, qty_added, performed_by, notes }) => {
    const target = bundles.find((b) => b.tag_id === tag_id || b.bundle_id === bundle_id);
    if (!target) return;

    const newQty = target.current_quantity + qty_added;
    let status = "Available";
    if (newQty <= target.minimum_quantity) {
      status = "Low Stock";
    }

    try {
      const { error: updateError } = await supabase
        .from("material_bundles")
        .update({
          current_quantity: newQty,
          status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("bundle_id", target.bundle_id);

      if (updateError) throw updateError;

      await supabase.from("inventory_history").insert([
        {
          bundle_id: target.bundle_id,
          tag_id: target.tag_id,
          action: "Restocked",
          qty_removed: 0,
          remaining_quantity: newQty,
          performed_by: performed_by || "Store Manager",
          notes: notes || `Restocked ${qty_added} units`,
        },
      ]);

      showToast(`✓ Restocked ${qty_added} units in Supabase. New balance: ${newQty}`, "success");
      await loadSupabaseData();
    } catch (err) {
      showToast(`Supabase restock failed: ${err.message}`, "danger");
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa" }}>
        <div style={{ width: 28, height: 28, border: "2px solid #e4e4e7", borderTopColor: "#09090b", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
      </div>
    );
  }

  // If not logged in -> Show Login Page
  if (!session) {
    return <Login onDemoLogin={handleDemoLogin} />;
  }

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`app-toast ${toastMessage.type}`}>
          <span className="toast-icon">
            {toastMessage.type === "danger" ? "🚨" : toastMessage.type === "warning" ? "⚠️" : "✓"}
          </span>
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Main Top Header with Authenticated Profile */}
      <Header
        user={session.user}
        userProfile={userProfile}
        onLogout={handleLogout}
        isConnectedToDb={isConnectedToDb}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
      />

      {/* Content Area */}
      <main className="content-container">
        {/* If Supabase tables are not created yet, show migration banner */}
        {!isConnectedToDb && (
          <div style={{
            background: "#ffffff",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "1.25rem 1.5rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1.5rem",
            flexWrap: "wrap",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#dc2626", fontWeight: 600, fontSize: "0.95rem" }}>
                <span>⚠️ Supabase Database Setup Required</span>
              </div>
              <p style={{ fontSize: "0.825rem", color: "#71717a", marginTop: "0.25rem", maxWidth: "600px" }}>
                The tables <code>public.material_bundles</code> and <code>public.inventory_history</code> have not been created yet in your Supabase project (<code>lngeqgisidwrimcyxwyv</code>). Run the migration SQL in Supabase to start live cloud tracking.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.65rem" }}>
              <button
                onClick={() => setIsSqlModalOpen(true)}
                style={{
                  background: "#09090b",
                  color: "#ffffff",
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                Copy Supabase SQL Script
              </button>
              <button
                onClick={loadSupabaseData}
                style={{
                  background: "#ffffff",
                  color: "#09090b",
                  border: "1px solid #e4e4e7",
                  padding: "0.5rem 0.85rem",
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                {loadingData ? "Connecting..." : "Re-Check Supabase"}
              </button>
            </div>
          </div>
        )}

        {/* Low-Stock Notification Banner (appears when bundles <= min quantity) */}
        <LowStockBanner
          lowStockBundles={lowStockBundles}
          onRestockClick={(bundle) => setRestockBundle(bundle)}
        />

        {/* High-Level Metric Cards */}
        <KpiCards bundles={bundles} history={history} />

        {/* Interactive RFID Reader & Removal Scanner Widget */}
        <RfidSimulatorWidget
          bundles={bundles}
          onRecordRemoval={handleRecordRemoval}
        />

        {/* Pipe Bundle Master Inventory Table */}
        <PipeBundleTable
          bundles={bundles}
          onOpenRemovalModal={(b) => setRemovalBundle(b)}
          onOpenRestockModal={(b) => setRestockBundle(b)}
        />

        {/* Chronological Inventory History Audit Trail */}
        <InventoryHistoryTable history={history} />
      </main>

      {/* Modals */}
      <AddBundleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddBundle={handleAddBundle}
      />

      <RemovalModal
        isOpen={Boolean(removalBundle)}
        bundle={removalBundle}
        onClose={() => setRemovalBundle(null)}
        onConfirmRemoval={handleRecordRemoval}
      />

      <RestockModal
        isOpen={Boolean(restockBundle)}
        bundle={restockBundle}
        onClose={() => setRestockBundle(null)}
        onConfirmRestock={handleRestock}
      />

      <SqlSchemaModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />
    </div>
  );
}
