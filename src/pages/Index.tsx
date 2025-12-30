import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, CheckCircle, Sparkles, FileText, Users, ArrowRight } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl text-foreground">ExamAI Pro</span>
          </div>
          <Link to="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 hero-gradient text-primary-foreground">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Evaluation</span>
          </div>
          <h1 className="font-heading text-4xl md:text-6xl font-bold max-w-4xl mx-auto leading-tight animate-slide-up">
            Transform Exam Evaluation with Artificial Intelligence
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mt-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Reduce manual correction, ensure fair grading, and provide meaningful feedback to students automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Link to="/login">
              <Button variant="accent" size="xl" className="gap-2">
                Get Started <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="hero-outline" size="xl">Learn More</Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <h2 className="font-heading text-3xl font-bold text-center text-foreground mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <FileText className="w-8 h-8" />, title: "Upload Answer Sheets", desc: "Upload scanned PDFs or images of student answer booklets along with the marking rubric." },
              { icon: <Sparkles className="w-8 h-8" />, title: "AI Evaluation", desc: "Our AI extracts text via OCR and evaluates answers based on your rubric with detailed feedback." },
              { icon: <CheckCircle className="w-8 h-8" />, title: "Review & Approve", desc: "Faculty can review AI scores, make adjustments, and approve final evaluations." },
            ].map((feature, i) => (
              <div key={i} className="academic-card-hover text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
                  {feature.icon}
                </div>
                <h3 className="font-heading font-semibold text-xl text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground mb-4">Ready to Transform Your Evaluation Process?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Join colleges using AI-powered evaluation to save time and improve student outcomes.</p>
          <Link to="/login">
            <Button size="xl" className="gap-2">
              Start Evaluating <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-background">
        <div className="container mx-auto px-6 text-center text-muted-foreground text-sm">
          © 2024 ExamAI Pro. AI-Powered Exam Evaluation System.
        </div>
      </footer>
    </div>
  );
}
