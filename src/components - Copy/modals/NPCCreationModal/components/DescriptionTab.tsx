import React from "react";
import { FormSection } from "../../shared";
import { Textarea } from "../../../ui/textarea";
import { Label } from "../../../ui/label";
import { CharacterFormProps } from "../types/npcForm";
import { FileText } from "lucide-react";

const DescriptionTab: React.FC<CharacterFormProps> = ({
  formData,
  setField,
  // setNestedField,
  // errors,
  isReadOnly = false,
}) => {
  const renderDescriptionField = () => {
    if (isReadOnly) {
      return (
        <div className="p-3 bg-muted rounded-md border min-h-[200px]">
          <span className="text-sm font-medium text-muted-foreground">Description:</span>
          <div className="mt-2 whitespace-pre-wrap">
            {formData.description || "No description provided"}
          </div>
        </div>
      );
    }

    return (
      <>
        <Textarea
          value={formData.description}
          onChange={(e) => setField("description", e.target.value)}
          placeholder="Describe the character's appearance, personality, background, and any other relevant details..."
          rows={8}
          className="min-h-[200px]"
        />
        <p className="text-sm text-muted-foreground">
          Include physical description, personality traits, background story, motivations, and any other details that would help bring this character to life.
        </p>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <FormSection
        title="Character Description"
        description="Physical description and personality of the character"
        icon={<FileText className="h-5 w-5" />}
      >
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          {renderDescriptionField()}
        </div>
      </FormSection>

      {!isReadOnly && (
        <FormSection
          title="Description Guidelines"
          description="Tips for creating compelling character descriptions"
          icon={<FileText className="h-5 w-5" />}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Physical Description:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Height, build, and distinctive features</li>
                <li>• Clothing and equipment style</li>
                <li>• Age and apparent health</li>
                <li>• Unique markings or scars</li>
                <li>• Race-specific characteristics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Personality & Background:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Personality traits and quirks</li>
                <li>• Motivations and goals</li>
                <li>• Background story and experiences</li>
                <li>• Relationships and connections</li>
                <li>• Role in the campaign world</li>
              </ul>
            </div>
          </div>
        </FormSection>
      )}
    </div>
  );
};

export default DescriptionTab; 