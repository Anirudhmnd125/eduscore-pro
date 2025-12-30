import { cn } from "@/lib/utils";

interface ScoreDisplayProps {
  score: number;
  maxScore: number;
  size?: "sm" | "md" | "lg";
  showPercentage?: boolean;
  className?: string;
}

function getScoreLevel(score: number, maxScore: number): "high" | "medium" | "low" {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 70) return "high";
  if (percentage >= 40) return "medium";
  return "low";
}

const sizeClasses = {
  sm: "text-lg font-semibold",
  md: "text-2xl font-bold",
  lg: "text-4xl font-bold",
};

export function ScoreDisplay({ 
  score, 
  maxScore, 
  size = "md", 
  showPercentage = false,
  className 
}: ScoreDisplayProps) {
  const level = getScoreLevel(score, maxScore);
  const percentage = Math.round((score / maxScore) * 100);
  
  const colorClass = {
    high: "text-score-high",
    medium: "text-score-medium",
    low: "text-score-low",
  }[level];

  return (
    <div className={cn("flex items-baseline gap-1", className)}>
      <span className={cn(sizeClasses[size], colorClass)}>
        {score}
      </span>
      <span className="text-muted-foreground text-sm">/ {maxScore}</span>
      {showPercentage && (
        <span className={cn("text-sm font-medium ml-2", colorClass)}>
          ({percentage}%)
        </span>
      )}
    </div>
  );
}

interface ScoreCircleProps {
  score: number;
  maxScore: number;
  size?: number;
  className?: string;
}

export function ScoreCircle({ score, maxScore, size = 80, className }: ScoreCircleProps) {
  const percentage = (score / maxScore) * 100;
  const level = getScoreLevel(score, maxScore);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (percentage / 100) * circumference;

  const colorClass = {
    high: "stroke-score-high",
    medium: "stroke-score-medium",
    low: "stroke-score-low",
  }[level];

  const textColorClass = {
    high: "text-score-high",
    medium: "text-score-medium",
    low: "text-score-low",
  }[level];

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size} viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r="36"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          className="text-secondary"
        />
        <circle
          cx="40"
          cy="40"
          r="36"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          className={cn(colorClass, "transition-all duration-500")}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-lg font-bold", textColorClass)}>{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}
