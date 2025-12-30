import { cn } from "@/lib/utils";

interface AcademicCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function AcademicCard({ children, className, hover = false }: AcademicCardProps) {
  return (
    <div className={cn(hover ? "academic-card-hover" : "academic-card", className)}>
      {children}
    </div>
  );
}

interface AcademicCardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function AcademicCardHeader({ title, description, action, className }: AcademicCardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between mb-4", className)}>
      <div>
        <h3 className="font-heading font-semibold text-lg text-foreground">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-sm mt-0.5">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <AcademicCard className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          <p className="text-3xl font-heading font-bold text-foreground mt-1">{value}</p>
          {trend && (
            <p className={cn(
              "text-sm font-medium mt-2 flex items-center gap-1",
              trend.isPositive ? "text-score-high" : "text-score-low"
            )}>
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              {Math.abs(trend.value)}% from last month
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
    </AcademicCard>
  );
}
