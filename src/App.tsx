import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          
          {/* Faculty Routes */}
          <Route element={<DashboardLayout role="faculty" />}>
            <Route path="/faculty" element={<FacultyDashboard />} />
            <Route path="/faculty/upload" element={<UploadExam />} />
            <Route path="/faculty/evaluations" element={<FacultyEvaluations />} />
            <Route path="/faculty/evaluations/:id" element={<EvaluationDetails />} />
            <Route path="/faculty/evaluation-result" element={<EvaluationResult />} />
            <Route path="/faculty/sheets" element={<FacultyEvaluations />} />
            <Route path="/faculty/reports" element={<FacultyDashboard />} />
          </Route>

          {/* Student Routes */}
          <Route element={<DashboardLayout role="student" />}>
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/results" element={<StudentDashboard />} />
            <Route path="/student/feedback" element={<StudentDashboard />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<DashboardLayout role="admin" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/faculty" element={<AdminDashboard />} />
            <Route path="/admin/students" element={<AdminDashboard />} />
            <Route path="/admin/evaluations" element={<AdminDashboard />} />
            <Route path="/admin/reports" element={<AdminDashboard />} />
            <Route path="/admin/settings" element={<AdminDashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
