import React from "react";
import { Alert, AlertDescription } from "../../ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from "../../../lib/utils";

interface ErrorDisplayProps {
  errors: Record<string, string>;
  field?: string;
  className?: string;
  variant?: "default" | "destructive" | "inline";
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  errors,
  field,
  className = "",
  variant = "default",
}) => {
  if (!errors || Object.keys(errors).length === 0) return null;

  // If a specific field is requested, show only that field's error
  if (field) {
    const fieldError = errors[field];
    if (!fieldError) return null;

    if (variant === "inline") {
      return (
        <p className={cn("text-sm text-destructive mt-1", className)}>
          {fieldError}
        </p>
      );
    }

    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{fieldError}</AlertDescription>
      </Alert>
    );
  }

  // Show all errors
  const errorMessages = Object.values(errors).filter(Boolean);

  if (errorMessages.length === 0) return null;

  if (variant === "inline") {
    return (
      <div className={cn("space-y-1", className)}>
        {errorMessages.map((error, index) => (
          <p key={index} className="text-sm text-destructive">
            {error}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {errorMessages.map((error, index) => (
        <Alert key={index} variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

export default ErrorDisplay; 