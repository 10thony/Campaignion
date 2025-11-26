import { usePanelLayout, PanelId } from "../../lib/panelLayoutStore";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "../ui/dropdown-menu";
import {
  Layout,
  Eye,
  EyeOff,
  RotateCcw,
  Info,
  Map,
  Swords,
  ZoomIn,
  Layers,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface PanelInfo {
  id: PanelId;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const panelInfo: PanelInfo[] = [
  {
    id: "controls",
    label: "Controls",
    icon: <Info className="h-4 w-4" />,
    description: "Pan, zoom, and navigation help",
  },
  {
    id: "terrain",
    label: "Terrain Types",
    icon: <Layers className="h-4 w-4" />,
    description: "Terrain legend and effects",
  },
  {
    id: "initiative",
    label: "Initiative Tracker",
    icon: <Swords className="h-4 w-4" />,
    description: "Combat turn order",
  },
  {
    id: "combat",
    label: "Combat Actions",
    icon: <Map className="h-4 w-4" />,
    description: "Attack and ability selector",
  },
  {
    id: "zoom",
    label: "Zoom Controls",
    icon: <ZoomIn className="h-4 w-4" />,
    description: "Map zoom in/out",
  },
];

export function PanelDock() {
  const { panels, showPanel, hidePanel, resetLayout, setAllPanelsVisible } =
    usePanelLayout();

  const hiddenPanels = panelInfo.filter((p) => !panels[p.id].isVisible);
  const visiblePanels = panelInfo.filter((p) => panels[p.id].isVisible);
  const allVisible = hiddenPanels.length === 0;
  const allHidden = visiblePanels.length === 0;

  return (
    <div className="flex items-center gap-2">
      {/* Main Panel Manager Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-2",
              hiddenPanels.length > 0 && "ring-2 ring-primary/30"
            )}
          >
            <Layout className="h-4 w-4" />
            Panels
            {hiddenPanels.length > 0 && (
              <span className="bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                {hiddenPanels.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Panel Visibility
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Quick Actions */}
          <div className="px-2 py-1.5 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => setAllPanelsVisible(true)}
              disabled={allVisible}
            >
              <Eye className="h-3 w-3 mr-1" />
              Show All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={() => setAllPanelsVisible(false)}
              disabled={allHidden}
            >
              <EyeOff className="h-3 w-3 mr-1" />
              Hide All
            </Button>
          </div>

          <DropdownMenuSeparator />

          {/* Individual Panel Toggles */}
          {panelInfo.map((info) => {
            const panel = panels[info.id];
            return (
              <DropdownMenuCheckboxItem
                key={info.id}
                checked={panel.isVisible}
                onCheckedChange={(checked) =>
                  checked ? showPanel(info.id) : hidePanel(info.id)
                }
                className="gap-2"
              >
                <span className="flex items-center gap-2 flex-1">
                  {info.icon}
                  <span className="flex-1">{info.label}</span>
                </span>
              </DropdownMenuCheckboxItem>
            );
          })}

          <DropdownMenuSeparator />

          {/* Reset Layout */}
          <DropdownMenuItem
            onClick={resetLayout}
            className="gap-2 text-muted-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            Reset All Panels
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Quick Restore Buttons for Hidden Panels */}
      {hiddenPanels.length > 0 && hiddenPanels.length <= 3 && (
        <div className="flex items-center gap-1 border-l pl-2 ml-1">
          {hiddenPanels.map((info) => (
            <Button
              key={info.id}
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => showPanel(info.id)}
              title={`Show ${info.label}`}
            >
              {info.icon}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

// Floating restore dock that appears when panels are hidden
export function FloatingPanelDock() {
  const { panels, showPanel, resetLayout } = usePanelLayout();

  const hiddenPanels = panelInfo.filter((p) => !panels[p.id].isVisible);

  if (hiddenPanels.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
        "bg-card/95 backdrop-blur-md border rounded-full shadow-xl",
        "flex items-center gap-2 px-4 py-2",
        "animate-in slide-in-from-bottom-4 duration-300"
      )}
    >
      <span className="text-xs text-muted-foreground mr-2">
        {hiddenPanels.length} hidden panel{hiddenPanels.length !== 1 ? "s" : ""}
      </span>

      {hiddenPanels.map((info) => (
        <Button
          key={info.id}
          variant="ghost"
          size="sm"
          className="h-8 gap-2"
          onClick={() => showPanel(info.id)}
          title={info.description}
        >
          {info.icon}
          <span className="text-xs">{info.label}</span>
        </Button>
      ))}

      <div className="border-l pl-2 ml-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={resetLayout}
          title="Reset all panels"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

