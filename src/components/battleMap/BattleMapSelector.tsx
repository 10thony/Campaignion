import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "../ui/button";
import { useBattleMapUI } from "../../lib/battleMapStore";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../ui/select";

type Map = {
  _id: Id<"battleMaps">;
  name: string;
};

export function BattleMapSelector({
  maps,
  value,
  onChange,
}: {
  maps: Map[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const { setShowNewMap } = useBattleMapUI();

  return (
    <div className="flex items-center gap-2">
      <Select
        value={value ?? ""}
        onValueChange={(v) => onChange(v || null)}
      >
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select a map" />
        </SelectTrigger>
        <SelectContent>
          {maps.map((m) => (
            <SelectItem key={m._id} value={m._id}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={() => setShowNewMap(true)}>New Map</Button>
    </div>
  );
}
