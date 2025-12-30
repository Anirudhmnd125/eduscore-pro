import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AcademicCard } from "@/components/ui/academic-card";
import { GraduationCap, Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";

type UserRole = "admin" | "faculty" | "student";

export default function Login() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole>("faculty");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login - in production this would use Supabase Auth
    setTimeout(() => {
      setIsLoading(false);
      toast.success(`Welcome! Logged in as ${selectedRole}`);
      navigate(`/${selectedRole}`);
    }, 1000);
  };

  const roleOptions: { value: UserRole; label: string; description: string }[] = [
    { value: "admin", label: "Admin", description: "College management" },
    { value: "faculty", label: "Faculty", description: "Evaluate & review" },
    { value: "student", label: "Student", description: "View results" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
        
        <div className="relative z-10 flex flex-col justify-center p-12 text-primary-foreground">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-accent-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold">ExamAI Pro</h1>
                <p className="text-primary-foreground/70 text-sm">Evaluation System</p>
              </div>
            </div>

            <h2 className="font-heading text-4xl font-bold leading-tight mb-6 animate-slide-up">
              AI-Powered Exam Evaluation for Modern Education
            </h2>
            
            <p className="text-lg text-primary-foreground/80 mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Reduce manual correction effort, ensure fair evaluation, and provide learning-oriented feedback to students.
            </p>

            <div className="space-y-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              {[
                "OCR-powered text extraction from answer sheets",
                "AI evaluation with rubric-based scoring",
                "Detailed feedback for every question",
                "Faculty review and override capabilities",
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                  </div>
                  <span className="text-primary-foreground/90">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold text-foreground">ExamAI Pro</h1>
              <p className="text-muted-foreground text-xs">Evaluation System</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-2">Sign in to your account to continue</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {roleOptions.map((role) => (
              <button
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                  selectedRole === role.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30 hover:bg-secondary/50"
                }`}
              >
                <p className={`font-medium text-sm ${selectedRole === role.value ? "text-primary" : "text-foreground"}`}>
                  {role.label}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
              </button>
            ))}
          </div>

          <AcademicCard>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button type="button" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign in as {selectedRole}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          </AcademicCard>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <button className="text-primary font-medium hover:underline">
              Contact your administrator
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
