import React from "react";
import { Id } from "../../../convex/_generated/dataModel";
import { MapPreview } from "./MapPreview";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Calendar, Ruler } from "lucide-react";
import { cn } from "../../lib/utils";

interface MapCardProps {
  map: {
    _id: Id<"maps">;
    name: string;
    width: number;
    height: number;
    cells: { x: number; y: number; state: "inbounds" | "outbounds" | "occupied"; }[];
    createdAt: number;
    updatedAt: number;
  };
  isSelected?: boolean;
  onSelect?: (mapId: Id<"maps">) => void;
  compact?: boolean;
  className?: string;
}

export const MapCard: React.FC<MapCardProps> = ({
  map,
  isSelected = false,
  onSelect,
  compact = false,
  className
}) => {
  const handleClick = () => {
    if (onSelect) {
      onSelect(map._id);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200 cursor-pointer border-2",
        isSelected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border hover:border-primary/50 hover:shadow-sm",
        compact ? "p-3" : "p-4",
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-pressed={isSelected}
      aria-label={`Select map: ${map.name}`}
    >
      <CardContent className={cn("p-0", compact ? "space-y-2" : "space-y-3")}>
        {/* Map Preview */}
        <div className={cn(
          "flex justify-center items-center overflow-hidden rounded-md",
          compact ? "h-24" : "h-32"
        )}>
          <div className="bg-white dark:bg-gray-800 rounded p-2 w-full max-w-full">
            <MapPreview 
              map={map} 
              cellSize={compact ? 8 : 12}
            />
          </div>
        </div>

        {/* Map Information */}
        <div className="space-y-2">
          <h3 className={cn(
            "font-semibold text-foreground truncate",
            compact ? "text-sm" : "text-base"
          )}>
            {map.name}
          </h3>

          <div className={cn(
            "flex items-center gap-2 text-muted-foreground",
            compact ? "text-xs" : "text-sm"
          )}>
            <Ruler className="h-3 w-3" />
            <span>{map.width} × {map.height}</span>
          </div>

          <div className={cn(
            "flex items-center gap-2 text-muted-foreground",
            compact ? "text-xs" : "text-sm"
          )}>
            <Calendar className="h-3 w-3" />
            <span>Created {formatDate(map.createdAt)}</span>
          </div>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="flex justify-center">
            <Badge variant="default" className="text-xs">
              Selected
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 