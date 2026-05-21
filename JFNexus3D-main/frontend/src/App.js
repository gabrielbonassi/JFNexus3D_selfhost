import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";
import Dashboard from "@/pages/Dashboard";
import ProjectDetail from "@/pages/ProjectDetail";
import Favorites from "@/pages/Favorites";
import Suggestions from "@/pages/Suggestions";
import Upload from "@/pages/Upload";
import Payments from "@/pages/Payments";
import ProtectedRoute from "@/components/ProtectedRoute";
import Register from "@/pages/Register";
import Admin from "./pages/Admin";

function AppRouter() {
  if (window.location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/project/:id" element={<ProjectDetail />} />
      <Route path="/favorites" element={<ProtectedRoute requireAuth><Favorites /></ProtectedRoute>} />
      <Route path="/suggestions" element={<ProtectedRoute requireAuth><Suggestions /></ProtectedRoute>} />
      <Route path="/upload" element={<ProtectedRoute requireAdmin><Upload /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute requireAuth><Payments /></ProtectedRoute>} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
