import { useRef, useState, useCallback, useEffect, ReactNode } from "react";
import { usePanelLayout, PanelId } from "../../lib/panelLayoutStore";
import { X, Minimize2, Maximize2, GripVertical, Pin, PinOff } from "lucide-react";
import { cn } from "../../lib/utils";

interface DraggablePanelProps {
  id: PanelId;
  title: string;
  children: ReactNode;
  className?: string;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  /** Anchor point for positioning: where the panel attaches to */
  anchor?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "free";
  /** Whether to show the minimize button */
  showMinimize?: boolean;
  /** Whether the panel can be closed (hidden) */
  closable?: boolean;
  /** Optional icon for the panel header */
  icon?: ReactNode;
  /** Content to show when minimized */
  minimizedContent?: ReactNode;
}

export function DraggablePanel({
  id,
  title,
  children,
  className,
  defaultWidth = 280,
  minWidth = 200,
  maxWidth = 600,
  anchor = "free",
  showMinimize = true,
  closable = true,
  icon,
  minimizedContent,
}: DraggablePanelProps) {
  const {
    panels,
    updatePanelPosition,
    togglePanelMinimized,
    hidePanel,
    bringToFront,
  } = usePanelLayout();

  const panel = panels[id];
  const panelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPinned, setIsPinned] = useState(false);
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);

  // Calculate actual position based on anchor
  const getPositionStyle = useCallback(() => {
    const pos = panel.position;
    const style: React.CSSProperties = {
      zIndex: panel.zIndex,
    };

    switch (anchor) {
      case "top-left":
        style.left = pos.x;
        style.top = pos.y;
        break;
      case "top-right":
        style.right = Math.abs(pos.x);
        style.top = pos.y;
        break;
      case "bottom-left":
        style.left = pos.x;
        style.bottom = Math.abs(pos.y);
        break;
      case "bottom-right":
        style.right = Math.abs(pos.x);
        style.bottom = Math.abs(pos.y);
        break;
      case "free":
      default:
        style.left = pos.x;
        style.top = pos.y;
        break;
    }

    return style;
  }, [anchor, panel.position, panel.zIndex]);

  // Drag handlers
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isPinned) return;

      e.preventDefault();
      e.stopPropagation();
      bringToFront(id);
      setIsDragging(true);

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      if (panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect();
        setDragOffset({
          x: clientX - rect.left,
          y: clientY - rect.top,
        });
      }
    },
    [isPinned, bringToFront, id]
  );

  const handleDragMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !panelRef.current) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const container = panelRef.current.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const panelRect = panelRef.current.getBoundingClientRect();

      // Calculate new position
      let newX = clientX - containerRect.left - dragOffset.x;
      let newY = clientY - containerRect.top - dragOffset.y;

      // Constrain to container bounds
      newX = Math.max(0, Math.min(newX, containerRect.width - panelRect.width));
      newY = Math.max(0, Math.min(newY, containerRect.height - panelRect.height));

      // For anchored panels, convert position based on anchor
      switch (anchor) {
        case "top-right":
          newX = -(containerRect.width - newX - panelRect.width);
          break;
        case "bottom-left":
          newY = -(containerRect.height - newY - panelRect.height);
          break;
        case "bottom-right":
          newX = -(containerRect.width - newX - panelRect.width);
          newY = -(containerRect.height - newY - panelRect.height);
          break;
      }

      updatePanelPosition(id, { x: newX, y: newY });
    },
    [isDragging, dragOffset, anchor, id, updatePanelPosition]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Resize handlers
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
    },
    []
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      const rect = panelRef.current.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      setWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    },
    [isResizing, minWidth, maxWidth]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add and remove event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDragMove);
      window.addEventListener("touchend", handleDragEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleResizeEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleResizeMove);
      window.removeEventListener("mouseup", handleResizeEnd);
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  if (!panel.isVisible) return null;

  return (
    <div
      ref={panelRef}
      className={cn(
        "absolute bg-card/95 backdrop-blur-sm border rounded-lg shadow-xl pointer-events-auto",
        "transition-shadow duration-200",
        isDragging && "shadow-2xl ring-2 ring-primary/30 cursor-grabbing",
        isResizing && "select-none",
        className
      )}
      style={{
        ...getPositionStyle(),
        width: panel.isMinimized ? "auto" : width,
      }}
      onClick={() => bringToFront(id)}
    >
      {/* Header / Drag Handle */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 border-b rounded-t-lg",
          "bg-gradient-to-r from-muted/50 to-transparent",
          !isPinned && "cursor-grab hover:bg-muted/70",
          isDragging && "cursor-grabbing"
        )}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        {/* Drag indicator */}
        <GripVertical
          className={cn(
            "h-4 w-4 text-muted-foreground/60 flex-shrink-0",
            isPinned && "opacity-30"
          )}
        />

        {/* Icon */}
        {icon && <span className="flex-shrink-0">{icon}</span>}

        {/* Title */}
        <span className="font-semibold text-sm text-foreground flex-1 truncate select-none">
          {title}
        </span>

        {/* Action buttons */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {/* Pin button */}
          <button
            className={cn(
              "p-1 rounded hover:bg-muted transition-colors",
              isPinned && "text-primary"
            )}
            onClick={() => setIsPinned(!isPinned)}
            title={isPinned ? "Unpin panel" : "Pin panel in place"}
          >
            {isPinned ? (
              <Pin className="h-3 w-3" />
            ) : (
              <PinOff className="h-3 w-3" />
            )}
          </button>

          {/* Minimize button */}
          {showMinimize && (
            <button
              className="p-1 rounded hover:bg-muted transition-colors"
              onClick={() => togglePanelMinimized(id)}
              title={panel.isMinimized ? "Expand panel" : "Minimize panel"}
            >
              {panel.isMinimized ? (
                <Maximize2 className="h-3 w-3" />
              ) : (
                <Minimize2 className="h-3 w-3" />
              )}
            </button>
          )}

          {/* Close button */}
          {closable && (
            <button
              className="p-1 rounded hover:bg-destructive/20 hover:text-destructive transition-colors"
              onClick={() => hidePanel(id)}
              title="Hide panel"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!panel.isMinimized ? (
        <div className="relative">
          {children}

          {/* Resize handle */}
          <div
            className={cn(
              "absolute bottom-0 right-0 w-3 h-3 cursor-se-resize",
              "hover:bg-primary/20 rounded-br-lg transition-colors"
            )}
            onMouseDown={handleResizeStart}
            style={{
              borderRight: "2px solid var(--border)",
              borderBottom: "2px solid var(--border)",
            }}
          />
        </div>
      ) : (
        minimizedContent && (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            {minimizedContent}
          </div>
        )
      )}
    </div>
  );
}

