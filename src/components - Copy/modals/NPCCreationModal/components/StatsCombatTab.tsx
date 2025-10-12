import React from "react";
import { FormSection } from "../../shared";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Badge } from "../../../ui/badge";
import { Button } from "../../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { Separator } from "../../../ui/separator";
import { ErrorDisplay } from "../../shared";
import { CharacterFormProps } from "../types/npcForm";
import { Shield, Heart, Award, Sword, Zap } from "lucide-react";
import { 
  calculateHitPoints,
  calculateArmorClass,
  getProficiencyBonus,
  getClassSavingThrows,
  getClassSkills,
  getBackgroundSkills,
  getRacialBonuses,
  getAbilityModifier
} from "../../../../types/dndRules";
import { AbilityScores } from "../../../../types/character";

const StatsCombatTab: React.FC<CharacterFormProps> = ({
  formData,
  setField,
  setNestedField,
  errors,
  isReadOnly = false,
}) => {
  const calculateFinalAbilityScores = (): AbilityScores => {
    const racialBonuses = getRacialBonuses(formData.race);
    const finalScores: AbilityScores = { ...formData.abilityScores };

    Object.entries(racialBonuses).forEach(([ability, bonus]) => {
      if (bonus) {
        finalScores[ability as keyof AbilityScores] += bonus;
      }
    });

    return finalScores;
  };

  const finalAbilityScores = calculateFinalAbilityScores();

  const calculateAutomaticStats = () => {
    if (!formData.class || !formData.race) {
      return {
        hitPoints: formData.hitPoints || 10,
        armorClass: formData.armorClass || 10,
        proficiencyBonus: formData.proficiencyBonus || 2,
        savingThrows: formData.savingThrows || [],
        skills: formData.skills || [],
      };
    }

    const autoHitPoints = calculateHitPoints(formData.class, finalAbilityScores.constitution);
    const autoArmorClass = calculateArmorClass(finalAbilityScores.dexterity);
    const autoProficiencyBonus = getProficiencyBonus(formData.level);
    const autoSavingThrows = getClassSavingThrows(formData.class);
    const autoSkills = [
      ...new Set([
        ...getClassSkills(formData.class),
        ...getBackgroundSkills(formData.background),
      ]),
    ];

    return {
      hitPoints: autoHitPoints,
      armorClass: autoArmorClass,
      proficiencyBonus: autoProficiencyBonus,
      savingThrows: autoSavingThrows,
      skills: autoSkills,
    };
  };

  const autoStats = calculateAutomaticStats();

  const handleApplyAutomaticStats = () => {
    setField("hitPoints", autoStats.hitPoints);
    setField("armorClass", autoStats.armorClass);
    setField("proficiencyBonus", autoStats.proficiencyBonus);
    setField("savingThrows", autoStats.savingThrows);
    setField("skills", autoStats.skills);
  };

  const handleLevelChange = (newLevel: number) => {
    const level = Math.max(1, Math.min(20, newLevel));
    setField("level", level);
    
    // Update proficiency bonus when level changes
    const newProficiencyBonus = getProficiencyBonus(level);
    setField("proficiencyBonus", newProficiencyBonus);
  };

  const renderStatField = (
    key: "level" | "hitPoints" | "armorClass" | "proficiencyBonus",
    label: string,
    type: "number" | "text" = "number",
    min?: number,
    max?: number,
    autoValue?: number,
    icon?: React.ReactNode
  ) => {
    const value = formData[key] as number;
    const hasAutoValue = autoValue !== undefined;
    const isDifferent = hasAutoValue && value !== autoValue;

    if (isReadOnly) {
      return (
        <div className="p-3 bg-muted rounded-md border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {icon}
              {label}:
            </span>
            <span className="font-semibold">{value}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Label htmlFor={key} className="flex items-center gap-2">
          {icon}
          {label}
          {hasAutoValue && isDifferent && (
            <Badge variant="outline" className="text-xs">
              Auto: {autoValue}
            </Badge>
          )}
        </Label>
        <div className="flex gap-2">
          <Input
            type={type}
            id={key}
            value={value}
            onChange={(e) => {
              const newValue = type === "number" ? parseInt(e.target.value) || 0 : e.target.value;
              if (type === "number" && min !== undefined && max !== undefined) {
                setField(key, Math.max(min, Math.min(max, newValue as number)));
              } else {
                setField(key, newValue);
              }
            }}
            min={min}
            max={max}
            className={errors[key] ? "border-destructive" : ""}
          />
          {hasAutoValue && isDifferent && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setField(key, autoValue)}
              title={`Use calculated value: ${autoValue}`}
            >
              Auto
            </Button>
          )}
        </div>
        <ErrorDisplay errors={errors} field={key} variant="inline" />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <FormSection
        title="Combat Statistics"
        description="Core combat-related character statistics"
        icon={<Sword className="h-5 w-5" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderStatField(
            "level",
            "Level",
            "number",
            1,
            20,
            undefined,
            <Award className="h-4 w-4" />
          )}
          {renderStatField(
            "hitPoints",
            "Hit Points",
            "number",
            1,
            999,
            autoStats.hitPoints,
            <Heart className="h-4 w-4" />
          )}
          {renderStatField(
            "armorClass",
            "Armor Class",
            "number",
            1,
            30,
            autoStats.armorClass,
            <Shield className="h-4 w-4" />
          )}
          {renderStatField(
            "proficiencyBonus",
            "Proficiency Bonus",
            "number",
            1,
            6,
            autoStats.proficiencyBonus,
            <Zap className="h-4 w-4" />
          )}
        </div>

        {!isReadOnly && formData.class && formData.race && (
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleApplyAutomaticStats}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Apply D&D 5e Calculations
            </Button>
            <div className="text-sm text-muted-foreground mt-2">
              💡 <strong>Auto-calculate:</strong> HP from class hit die + CON modifier, AC from DEX modifier, 
              proficiency bonus from level, and class/background skills.
            </div>
          </div>
        )}
      </FormSection>

      {formData.class && formData.background && (
        <FormSection
          title="Character Preview"
          description="Calculated statistics based on class, race, and background"
          icon={<Award className="h-5 w-5" />}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {formData.name || "Unnamed Character"} - Level {formData.level} {formData.race} {formData.class}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-sm">
                  <strong>Hit Points:</strong> {autoStats.hitPoints}
                  <div className="text-xs text-muted-foreground">
                    ({formData.class} d{(() => {
                      const hitDie: Record<string, number> = {
                        Barbarian: 12, Fighter: 10, Paladin: 10, Ranger: 10,
                        Bard: 8, Cleric: 8, Druid: 8, Monk: 8, Rogue: 8, Warlock: 8,
                        Sorcerer: 6, Wizard: 6,
                      };
                      return hitDie[formData.class] || 8;
                    })()} + {getAbilityModifier(finalAbilityScores.constitution)} CON)
                  </div>
                </div>
                <div className="text-sm">
                  <strong>Armor Class:</strong> {autoStats.armorClass}
                  <div className="text-xs text-muted-foreground">
                    (10 + {getAbilityModifier(finalAbilityScores.dexterity)} DEX)
                  </div>
                </div>
                <div className="text-sm">
                  <strong>Proficiency Bonus:</strong> +{autoStats.proficiencyBonus}
                </div>
                <div className="text-sm">
                  <strong>Experience Points:</strong> 0
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Saving Throws:</strong>{" "}
                  {autoStats.savingThrows.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {autoStats.savingThrows.map((save) => (
                        <Badge key={save} variant="secondary" className="text-xs">
                          {save} +{autoStats.proficiencyBonus + getAbilityModifier(
                            finalAbilityScores[save.toLowerCase() as keyof AbilityScores] || 10
                          )}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    "None"
                  )}
                </div>
                
                <div className="text-sm">
                  <strong>Skills:</strong>{" "}
                  {autoStats.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {autoStats.skills.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    "None"
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </FormSection>
      )}

      <FormSection
        title="Manual Overrides"
        description="Manually set values that override automatic calculations"
        icon={<Zap className="h-5 w-5" />}
      >
        <div className="text-sm text-muted-foreground mb-4">
          💡 <strong>Note:</strong> You can manually override any calculated values. 
          Use the "Auto" buttons to restore calculated values, or "Apply D&D 5e Calculations" to update all at once.
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Current Values vs Calculated</Label>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Hit Points:</span>
                <span>{formData.hitPoints} {formData.hitPoints !== autoStats.hitPoints && `(auto: ${autoStats.hitPoints})`}</span>
              </div>
              <div className="flex justify-between">
                <span>Armor Class:</span>
                <span>{formData.armorClass} {formData.armorClass !== autoStats.armorClass && `(auto: ${autoStats.armorClass})`}</span>
              </div>
              <div className="flex justify-between">
                <span>Proficiency Bonus:</span>
                <span>+{formData.proficiencyBonus} {formData.proficiencyBonus !== autoStats.proficiencyBonus && `(auto: +${autoStats.proficiencyBonus})`}</span>
              </div>
            </div>
          </div>
        </div>
      </FormSection>
    </div>
  );
};

export default StatsCombatTab; 