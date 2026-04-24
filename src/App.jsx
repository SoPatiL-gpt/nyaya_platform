import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import ClientLogin from "./pages/ClientLogin";
import AdvocateLogin from "./pages/AdvocateLogin";
import Register from "./pages/Register";
import AdvocateRegister from "./pages/AdvocateRegister";
import ClientDashboard from "./pages/ClientDashboard";
import AdvocateDashboard from "./pages/AdvocateDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import NewCase from "./pages/NewCase";
import Hearing from "./pages/Hearing";
import CaseView from "./pages/CaseView";
import Chat from "./pages/Chat";
import AiChat from "./pages/AiChat";
import UploadDocs from "./pages/UploadDocs";
import Schedule from "./pages/Schedule";

import Profile from "./pages/Profile";

const maintenanceRoutesEnabled =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_MAINTENANCE_ROUTES === "true";

const MigrateDB = maintenanceRoutesEnabled ? lazy(() => import("./pages/MigrateDB")) : null;
const SeedDB = maintenanceRoutesEnabled ? lazy(() => import("./pages/SeedDB")) : null;

function MaintenanceRoute({ Component }) {
  if (!maintenanceRoutesEnabled) {
    return <Landing />;
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-darkBg text-white p-8">Loading...</div>}>
      <Component />
    </Suspense>
  );
}

function App() {
  return (
    <Routes>
      {maintenanceRoutesEnabled ? (
        <>
          <Route path="/migrate" element={<MaintenanceRoute Component={MigrateDB} />} />
          <Route path="/seed" element={<MaintenanceRoute Component={SeedDB} />} />
        </>
      ) : (
        <>
          <Route path="/migrate" element={<Landing />} />
          <Route path="/seed" element={<Landing />} />
        </>
      )}
      <Route path="/" element={<Landing />} />
      <Route path="/client-login" element={<ClientLogin />} />
      <Route path="/advocate-login" element={<AdvocateLogin />} />
      <Route path="/register" element={<Register />} />
      <Route path="/advocate-register" element={<AdvocateRegister />} />
      <Route path="/client-dashboard" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
      <Route path="/advocate-dashboard" element={<ProtectedRoute><AdvocateDashboard /></ProtectedRoute>} />
      <Route path="/new-case" element={<ProtectedRoute><NewCase /></ProtectedRoute>} />
      <Route path="/hearing" element={<ProtectedRoute><Hearing /></ProtectedRoute>} />
      <Route path="/case-view" element={<ProtectedRoute><CaseView /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/ai-chat" element={<ProtectedRoute><AiChat /></ProtectedRoute>} />
      <Route path="/upload" element={<ProtectedRoute><UploadDocs /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
