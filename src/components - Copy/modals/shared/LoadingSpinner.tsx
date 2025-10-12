import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../../lib/utils";

interface LoadingSpinnerProps {
  isLoading: boolean;
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  overlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  isLoading,
  text = "Loading...",
  size = "md",
  className = "",
  overlay = false,
}) => {
  if (!isLoading) return null;

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const spinner = (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner; 