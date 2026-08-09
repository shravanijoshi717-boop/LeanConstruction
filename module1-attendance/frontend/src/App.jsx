import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import ContractorDash from "./pages/ContractorDash";
import SupervisorDash from "./pages/SupervisorDash";
import WorkerDash from "./pages/WorkerDash";

function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) setUserProfile(data);
    if (error) console.error("Failed to fetch profile:", error);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loader" />
      </div>
    );
  }

  // Not logged in → show login page
  if (!session) {
    return <Login />;
  }

  // Logged in → show role-based dashboard
  const renderDashboard = () => {
    switch (userProfile?.role) {
      case "contractor":
        return <ContractorDash userProfile={userProfile} />;
      case "supervisor":
        return <SupervisorDash userProfile={userProfile} />;
      case "worker":
        return <WorkerDash user={session.user} />;
      default:
        return (
          <div style={{ color: "#fff", textAlign: "center", padding: "2rem" }}>
            <h2>Unknown Role</h2>
            <p>Your account role is not recognized. Contact an administrator.</p>
          </div>
        );
    }
  };

  return (
    <Layout user={session.user} userProfile={userProfile}>
      {renderDashboard()}
    </Layout>
  );
}

export default App;
