import React from "react";
import { FormSection } from "../../shared";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select";
import { Badge } from "../../../ui/badge";
import { Button } from "../../../ui/button";
import { ErrorDisplay } from "../../shared";
import { MonsterFormProps } from "../types/monsterForm";
import { useMonsterForm } from "../hooks/useMonsterForm";
import { Zap, BookOpen, Plus, X } from "lucide-react";

const BasicInfoTab: React.FC<MonsterFormProps> = ({
  formData,
  setField,
  // setNestedField,
  errors,
  isReadOnly = false,
}) => {
  const { newTag, setNewTag, addTag, removeTag } = useMonsterForm();

  const alignmentOptions = [
    "Lawful good", "Lawful neutral", "Lawful evil",
    "Neutral good", "True neutral", "Neutral evil",
    "Chaotic good", "Chaotic neutral", "Chaotic evil",
    "Unaligned", "Any alignment"
  ];

  const sizeOptions = [
    "Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"
  ];

  const typeOptions = [
    "Aberration", "Beast", "Celestial", "Construct", "Dragon", "Elemental",
    "Fey", "Fiend", "Giant", "Humanoid", "Monstrosity", "Ooze",
    "Plant", "Undead"
  ];

  const challengeRatings = [
    "0", "1/8", "1/4", "1/2", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23",
    "24", "25", "26", "27", "28", "29", "30"
  ];

  const renderField = (fieldName: string, value: any, type: "text" | "number" = "text", options?: string[]) => {
    if (isReadOnly) {
      return (
        <div className="p-3 bg-muted rounded-md border">
          <span className="text-sm font-medium text-muted-foreground">{fieldName}:</span>
          <span className="ml-2">{value || "Not specified"}</span>
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

    return (
      <Input
        type={type}
        value={value}
        onChange={(e) => setField(fieldName as any, type === "number" ? parseInt(e.target.value) || 0 : e.target.value)}
        placeholder={`Enter ${fieldName.toLowerCase()}`}
        className={errors[fieldName] ? "border-destructive" : ""}
        min={type === "number" ? "0" : undefined}
      />
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-6">
      <FormSection
        title="Basic Information"
        description="Core details about the monster including name, type, and classification"
        icon={<Zap className="h-5 w-5" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            {renderField("name", formData.name)}
            <ErrorDisplay errors={errors} field="name" variant="inline" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            {renderField("type", formData.type, "text", typeOptions)}
            <ErrorDisplay errors={errors} field="type" variant="inline" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="size">Size</Label>
            {renderField("size", formData.size, "text", sizeOptions)}
          </div>

          <div className="space-y-2">
            <Label htmlFor="alignment">Alignment *</Label>
            {renderField("alignment", formData.alignment, "text", alignmentOptions)}
            <ErrorDisplay errors={errors} field="alignment" variant="inline" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="challengeRating">Challenge Rating</Label>
            {renderField("challengeRating", formData.challengeRating, "text", challengeRatings)}
          </div>

          <div className="space-y-2">
            <Label htmlFor="experiencePoints">Experience Points</Label>
            {renderField("experiencePoints", formData.experiencePoints, "number")}
            <ErrorDisplay errors={errors} field="experiencePoints" variant="inline" />
          </div>
        </div>

        {/* Tags Section */}
        {!isReadOnly && (
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={handleKeyPress}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Read-only tags display */}
        {isReadOnly && formData.tags.length > 0 && (
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </div>
        )}
      </FormSection>

      <FormSection
        title="Source Information"
        description="Publication details and reference information"
        icon={<BookOpen className="h-5 w-5" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="source">Source Book</Label>
            {renderField("source", formData.source)}
            <ErrorDisplay errors={errors} field="source" variant="inline" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="page">Page</Label>
            {renderField("page", formData.page)}
            <ErrorDisplay errors={errors} field="page" variant="inline" />
          </div>
        </div>
      </FormSection>
    </div>
  );
};

export default BasicInfoTab; 