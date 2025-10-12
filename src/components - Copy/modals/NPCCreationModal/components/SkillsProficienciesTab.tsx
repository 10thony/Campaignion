import React from "react";
import { FormSection } from "../../shared";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { CharacterFormProps } from "../types/npcForm";
import { Award, Shield, BookOpen } from "lucide-react";

const SkillsProficienciesTab: React.FC<CharacterFormProps> = ({
  formData,
  setField,
  // setNestedField,
  // errors,
  isReadOnly = false,
}) => {
  const skillOptions = [
    "Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception",
    "History", "Insight", "Intimidation", "Investigation", "Medicine",
    "Nature", "Perception", "Performance", "Persuasion", "Religion",
    "Sleight of Hand", "Stealth", "Survival"
  ];

  const savingThrowOptions = [
    "Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"
  ];

  const renderArrayField = (fieldName: string, value: string[], placeholder: string, helpText: string) => {
    if (isReadOnly) {
      return (
        <div className="p-3 bg-muted rounded-md border">
          <span className="text-sm font-medium text-muted-foreground">{fieldName}:</span>
          <div className="mt-1">
            {value.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {value.map((item, index) => (
                  <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">None specified</span>
            )}
          </div>
        </div>
      );
    }

    return (
      <>
        <Input
          value={value.join(", ")}
          onChange={(e) => setField(fieldName as any, e.target.value.split(", ").filter(item => item.trim()))}
          placeholder={placeholder}
        />
        <p className="text-sm text-muted-foreground">{helpText}</p>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <FormSection
        title="Skills"
        description="Skill proficiencies for this character"
        icon={<Award className="h-5 w-5" />}
      >
        <div className="space-y-2">
          <Label htmlFor="skills">Skill Proficiencies</Label>
          {renderArrayField(
            "skills",
            formData.skills,
            "e.g., Athletics, Stealth, Persuasion",
            `Enter skills separated by commas. Available skills: ${skillOptions.join(", ")}`
          )}
        </div>
      </FormSection>

      <FormSection
        title="Saving Throws"
        description="Saving throw proficiencies"
        icon={<Shield className="h-5 w-5" />}
      >
        <div className="space-y-2">
          <Label htmlFor="savingThrows">Saving Throw Proficiencies</Label>
          {renderArrayField(
            "savingThrows",
            formData.savingThrows,
            "e.g., Strength, Constitution",
            `Enter saving throws separated by commas. Available: ${savingThrowOptions.join(", ")}`
          )}
        </div>
      </FormSection>

      <FormSection
        title="Other Proficiencies"
        description="Weapon, armor, and tool proficiencies"
        icon={<BookOpen className="h-5 w-5" />}
      >
        <div className="space-y-2">
          <Label htmlFor="proficiencies">Proficiencies</Label>
          {renderArrayField(
            "proficiencies",
            formData.proficiencies,
            "e.g., Longsword, Light Armor, Thieves' Tools",
            "Enter weapon, armor, and tool proficiencies separated by commas"
          )}
        </div>
      </FormSection>
    </div>
  );
};

export default SkillsProficienciesTab; 