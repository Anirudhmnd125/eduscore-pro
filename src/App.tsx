import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

import FacultyDashboard from "./pages/faculty/FacultyDashboard";
import UploadExam from "./pages/faculty/UploadExam";
import FacultyEvaluations from "./pages/faculty/FacultyEvaluations";
import EvaluationDetails from "./pages/faculty/EvaluationDetails";
import EvaluationResult from "./pages/faculty/EvaluationResult";

import StudentDashboard from "./pages/student/StudentDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import EvaluationHistory from "./pages/admin/EvaluationHistory";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, primaryRole, isLoading } = useAuth();

  // Auto-redirect logged in users from login page
  const LoginRedirect = () => {
    if (isLoading) return null;
    if (user && primaryRole) {
      return <Navigate to={`/${primaryRole}`} replace />;
    }
    return <Login />;
  };

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<LoginRedirect />} />
      
      {/* Faculty Routes */}
      <Route element={
        <ProtectedRoute allowedRoles={["faculty", "admin"]}>
          <DashboardLayout role="faculty" />
        </ProtectedRoute>
      }>
        <Route path="/faculty" element={<FacultyDashboard />} />
        <Route path="/faculty/upload" element={<UploadExam />} />
        <Route path="/faculty/evaluations" element={<FacultyEvaluations />} />
        <Route path="/faculty/evaluations/:id" element={<EvaluationDetails />} />
        <Route path="/faculty/evaluation-result" element={<EvaluationResult />} />
        <Route path="/faculty/sheets" element={<FacultyEvaluations />} />
        <Route path="/faculty/reports" element={<FacultyDashboard />} />
      </Route>

      {/* Student Routes */}
      <Route element={
        <ProtectedRoute allowedRoles={["student"]}>
          <DashboardLayout role="student" />
        </ProtectedRoute>
      }>
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/results" element={<StudentDashboard />} />
        <Route path="/student/feedback" element={<StudentDashboard />} />
      </Route>

      {/* Admin Routes */}
      <Route element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout role="admin" />
        </ProtectedRoute>
      }>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/faculty" element={<UserManagement filterRole="faculty" />} />
        <Route path="/admin/students" element={<UserManagement filterRole="student" />} />
        <Route path="/admin/evaluations" element={<EvaluationHistory />} />
        <Route path="/admin/reports" element={<AdminDashboard />} />
        <Route path="/admin/settings" element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
