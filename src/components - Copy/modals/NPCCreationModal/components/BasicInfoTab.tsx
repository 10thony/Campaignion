import React from "react";
import { FormSection } from "../../shared";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select";
import { ErrorDisplay } from "../../shared";
import { CharacterFormProps } from "../types/npcForm";
import { User, Users, } from "lucide-react";

const BasicInfoTab: React.FC<CharacterFormProps> = ({
  formData,
  setField,
  // setNestedField,
  errors,
  isReadOnly = false,
  characterType,
}) => {
  const alignmentOptions = [
    "Lawful Good", "Neutral Good", "Chaotic Good",
    "Lawful Neutral", "Neutral", "Chaotic Neutral",
    "Lawful Evil", "Neutral Evil", "Chaotic Evil"
  ];

  const raceOptions = [
    "Human", "Elf", "Dwarf", "Halfling", "Dragonborn", "Tiefling",
    "Half-Elf", "Half-Orc", "Gnome", "Aarakocra", "Genasi", "Goliath",
    "Aasimar", "Firbolg", "Kenku", "Lizardfolk", "Tabaxi", "Triton",
    "Bugbear", "Goblin", "Hobgoblin", "Kobold", "Orc", "Yuan-ti Pureblood"
  ];

  const classOptions = [
    "Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk",
    "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard",
    "Artificer", "Blood Hunter"
  ];

  const backgroundOptions = [
    "Acolyte", "Criminal", "Folk Hero", "Noble", "Sage", "Soldier",
    "Anthropologist", "Archaeologist", "City Watch", "Clan Crafter",
    "Cloistered Scholar", "Courtier", "Criminal", "Entertainer",
    "Faction Agent", "Far Traveler", "Gladiator", "Guild Artisan",
    "Guild Merchant", "Hermit", "Inheritor", "Investigator",
    "Knight of the Order", "Mercenary Veteran", "Outlander",
    "Pirate", "Sage", "Sailor", "Soldier", "Spy", "Urban Bounty Hunter",
    "Urchin", "Uthgardt Tribe Member", "Waterdhavian Noble"
  ];

  const renderField = (fieldName: string, value: any, type: "text" | "number" = "text", options?: string[]) => {
    if (isReadOnly) {
      return (
        <div className="p-3 bg-muted rounded-md border">
          <span className="text-sm font-medium text-muted-foreground">{fieldName}:</span>
          <span className="ml-2">{fieldName === "speed" && value ? `${value} ft` : value || "Not specified"}</span>
        </div>
      );
    }

    if (options) {
      return (
        <Select value={value} onValueChange={(val) => setField(fieldName as any, val)}>
          <SelectTrigger className={errors[fieldName] ? "border-destructive" : ""}>
            <SelectValue placeholder={`Select ${fieldName.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {options.map(option => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Special handling for speed field
    if (fieldName === "speed") {
      const numericValue = typeof value === "string" ? value.replace(" ft", "") : value;
      return (
        <Input
          type="number"
          value={numericValue}
          onChange={(e) => {
            const numValue = parseInt(e.target.value) || 0;
            setField(fieldName as any, numValue.toString());
          }}
          placeholder="Enter speed"
          className={errors[fieldName] ? "border-destructive" : ""}
          min="0"
          max="200"
        />
      );
    }

    return (
      <Input
        type={type}
        value={value}
        onChange={(e) => setField(fieldName as any, type === "number" ? parseInt(e.target.value) || 0 : e.target.value)}
        placeholder={`Enter ${fieldName.toLowerCase()}`}
        className={errors[fieldName] ? "border-destructive" : ""}
        min={type === "number" ? "1" : undefined}
        max={type === "number" ? fieldName === "level" ? "20" : fieldName === "proficiencyBonus" ? "9" : undefined : undefined}
      />
    );
  };

  return (
    <div className="space-y-6">
      <FormSection
        title="Basic Information"
        description={`Core details about the ${characterType === "PlayerCharacter" ? "player character" : "NPC"}`}
        icon={<User className="h-5 w-5" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            {renderField("name", formData.name)}
            <ErrorDisplay errors={errors} field="name" variant="inline" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="race">Race *</Label>
            {renderField("race", formData.race, "text", raceOptions)}
            <ErrorDisplay errors={errors} field="race" variant="inline" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="class">Class *</Label>
            {renderField("class", formData.class, "text", classOptions)}
            <ErrorDisplay errors={errors} field="class" variant="inline" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="background">Background *</Label>
            {renderField("background", formData.background, "text", backgroundOptions)}
            <ErrorDisplay errors={errors} field="background" variant="inline" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alignment">Alignment</Label>
            {renderField("alignment", formData.alignment, "text", alignmentOptions)}
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Character Details"
        description="Additional character information"
        icon={<Users className="h-5 w-5" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="level">Level</Label>
            {renderField("level", formData.level, "number")}
            <ErrorDisplay errors={errors} field="level" variant="inline" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proficiencyBonus">Proficiency Bonus</Label>
            {renderField("proficiencyBonus", formData.proficiencyBonus, "number")}
            <ErrorDisplay errors={errors} field="proficiencyBonus" variant="inline" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="speed">Speed (ft)</Label>
            {renderField("speed", formData.speed, "number")}
            <ErrorDisplay errors={errors} field="speed" variant="inline" />
          </div>
        </div>
      </FormSection>
    </div>
  );
};

export default BasicInfoTab; 