import React from "react";
import { FormSection } from "../../shared";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Button } from "../../../ui/button";
import { Badge } from "../../../ui/badge";
import { Progress } from "../../../ui/progress";
import { ErrorDisplay } from "../../shared";
import { MonsterFormProps, getAbilityModifier, formatAbilityModifier, rollAbilityScore } from "../types/monsterForm";
import { Dice6, Zap, RotateCcw } from "lucide-react";

const AbilityScoresTab: React.FC<MonsterFormProps> = ({
  formData,
  setField,
  setNestedField,
  errors,
  isReadOnly = false,
}) => {
  const abilities = [
    { key: "strength", label: "Strength", abbr: "STR" },
    { key: "dexterity", label: "Dexterity", abbr: "DEX" },
    { key: "constitution", label: "Constitution", abbr: "CON" },
    { key: "intelligence", label: "Intelligence", abbr: "INT" },
    { key: "wisdom", label: "Wisdom", abbr: "WIS" },
    { key: "charisma", label: "Charisma", abbr: "CHA" },
  ] as const;

  const getScoreColor = (score: number): string => {
    if (score >= 18) return "text-green-600";
    if (score >= 14) return "text-blue-600";
    if (score >= 10) return "text-gray-600";
    if (score >= 6) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreProgress = (score: number): number => {
    return Math.min((score / 20) * 100, 100);
  };

  const rollSingleAbilityScore = (ability: string) => {
    if (isReadOnly || !setNestedField) return;
    const newScore = rollAbilityScore();
    setNestedField("abilityScores" as any, ability as any, newScore);
  };

  const rollAllAbilityScores = () => {
    if (isReadOnly || !setNestedField) return;
    abilities.forEach(({ key }) => {
      const newScore = rollAbilityScore();
      setNestedField("abilityScores" as any, key as any, newScore);
    });
  };

  const resetAbilityScores = () => {
    if (isReadOnly || !setNestedField) return;
    abilities.forEach(({ key }) => {
      setNestedField("abilityScores" as any, key as any, 10);
    });
  };

  const calculateTotalPoints = (): number => {
    return Object.values(formData.abilityScores).reduce((sum, score) => sum + score, 0);
  };

  const renderAbilityScore = (ability: { key: keyof typeof formData.abilityScores; label: string; abbr: string }) => {
    const score = formData.abilityScores[ability.key];
    const modifier = getAbilityModifier(score);
    const modifierText = formatAbilityModifier(score);

    if (isReadOnly) {
      return (
        <div key={ability.key} className="p-4 border rounded-lg bg-muted/20">
          <div className="text-center space-y-2">
            <div className="text-sm font-medium text-muted-foreground">{ability.abbr}</div>
            <div className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</div>
            <div className="text-sm text-muted-foreground">
              {modifierText}
            </div>
            <Progress value={getScoreProgress(score)} className="w-full h-2" />
          </div>
        </div>
      );
    }

    return (
      <div key={ability.key} className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor={ability.key} className="text-sm font-medium">
            {ability.label} ({ability.abbr})
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => rollSingleAbilityScore(ability.key)}
            className="h-6 w-6 p-0"
            title="Roll 4d6 drop lowest"
          >
            <Dice6 className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="relative">
          <Input
            id={ability.key}
            type="number"
            value={score}
            onChange={(e) => {
              const newScore = parseInt(e.target.value) || 0;
              if (setNestedField) setNestedField("abilityScores" as any, ability.key as any, newScore);
            }}
            min="1"
            max="30"
            className={`text-center font-bold ${errors[`abilityScores.${ability.key}`] ? "border-destructive" : ""}`}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <Badge variant="outline" className={`text-xs ${getScoreColor(score)}`}>
              {modifierText}
            </Badge>
          </div>
        </div>
        
        <Progress value={getScoreProgress(score)} className="w-full h-2" />
        
        <ErrorDisplay errors={errors} field={`abilityScores.${ability.key}`} variant="inline" />
      </div>
    );
  };

  const totalPoints = calculateTotalPoints();
  const averageScore = totalPoints / 6;

  return (
    <div className="space-y-6">
      <FormSection
        title="Ability Scores"
        description="The six core ability scores that define the monster's capabilities"
        icon={<Zap className="h-5 w-5" />}
      >
        {/* Action buttons for non-readonly mode */}
        {!isReadOnly && (
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={rollAllAbilityScores}
              className="flex items-center gap-2"
            >
              <Dice6 className="h-4 w-4" />
              Roll All Scores
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetAbilityScores}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to 10
            </Button>
          </div>
        )}

        {/* Ability score grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {abilities.map(renderAbilityScore)}
        </div>

        {/* Total validation error */}
        <ErrorDisplay errors={errors} field="abilityScores.total" variant="inline" />
      </FormSection>

      {/* Score Analysis */}
      <FormSection
        title="Score Analysis"
        description="Statistical overview of ability score distribution"
        icon={<Zap className="h-5 w-5" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalPoints}</div>
            <div className="text-sm text-muted-foreground">Total Points</div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalPoints < 60 ? "Low" : totalPoints > 90 ? "High" : "Average"}
            </div>
          </div>
          
          <div className="text-center p-4 bg-muted/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{averageScore.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Average Score</div>
            <div className="text-xs text-muted-foreground mt-1">
              {averageScore < 10 ? "Below Average" : averageScore > 15 ? "Above Average" : "Typical"}
            </div>
          </div>
          
          <div className="text-center p-4 bg-muted/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {Math.max(...Object.values(formData.abilityScores))}
            </div>
            <div className="text-sm text-muted-foreground">Highest Score</div>
            <div className="text-xs text-muted-foreground mt-1">
              Primary Ability
            </div>
          </div>
        </div>

        {/* Score distribution visualization */}
        <div className="mt-4">
          <div className="text-sm font-medium mb-2">Score Distribution</div>
          <div className="flex gap-1 h-8">
            {Object.entries(formData.abilityScores).map(([ability, score]) => (
              <div
                key={ability}
                className="flex-1 bg-gradient-to-t from-blue-100 to-blue-500 rounded"
                style={{ height: `${(score / 20) * 100}%` }}
                title={`${ability}: ${score}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            {abilities.map(({ abbr }) => (
              <span key={abbr}>{abbr}</span>
            ))}
          </div>
        </div>
      </FormSection>
    </div>
  );
};

export default AbilityScoresTab; 