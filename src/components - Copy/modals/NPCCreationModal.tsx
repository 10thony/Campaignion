import React, { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { BaseModal, FormTabs, LoadingSpinner, ErrorDisplay } from "./shared";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { 
  User,
  Shield,
  Zap,
  Award,
  Package,
  FileText,
  Loader2,
  Save,
  // Eye,
  Edit,
  Calculator
} from "lucide-react";
import { CharacterFormData, CharacterType } from "./NPCCreationModal/types/npcForm";
import { useCharacterForm } from "./NPCCreationModal/hooks/useNPCForm";
import { useCharacterValidation } from "./NPCCreationModal/hooks/useNPCValidation";
import BasicInfoTab from "./NPCCreationModal/components/BasicInfoTab";
import StatsCombatTab from "./NPCCreationModal/components/StatsCombatTab";
import AbilityScoresTab from "./NPCCreationModal/components/AbilityScoresTab";
import SkillsProficienciesTab from "./NPCCreationModal/components/SkillsProficienciesTab";
import TraitsEquipmentTab from "./NPCCreationModal/components/TraitsEquipmentTab";
import DescriptionTab from "./NPCCreationModal/components/DescriptionTab";
import ActionsTab from "./NPCCreationModal/components/ActionsTab";
import { 
  calculateHitPoints,
  calculateArmorClass,
  getProficiencyBonus,
  getClassSavingThrows,
  getClassSkills,
  getBackgroundSkills,
  getRacialBonuses
} from "../../types/dndRules";
import { AbilityScores } from "../../types/character";

interface CharacterCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (characterId: Id<"npcs"> | Id<"playerCharacters">) => void;
  characterType?: CharacterType;
  isReadOnly?: boolean;
  initialData?: Partial<CharacterFormData>;
  title?: string;
  description?: string;
  characterId?: Id<"npcs"> | Id<"playerCharacters">;
  campaignId?: Id<"campaigns">;
}

const CharacterCreationModal: React.FC<CharacterCreationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  characterType = "NonPlayerCharacter",
  isReadOnly = false,
  initialData,
  title,
  description,
  characterId,
  campaignId,
}) => {
  const { user } = useUser();
  const createNPC = useMutation(api.npcs.createNpc);
  const createPlayerCharacter = useMutation(api.characters.createPlayerCharacter);
  
  // Get character data if viewing an existing character
  const character = useQuery(
    api.characters.getCharacterOrNpcById,
    characterId ? { id: characterId } : "skip"
  );
  
  // Get campaign data for ownership checks
  const campaign = useQuery(
    api.campaigns.getCampaignById,
    campaignId ? { id: campaignId, clerkId: user?.id } : "skip"
  );
  
  // Get user role for admin checks
  const userRole = useQuery(
    api.users.getUserRole,
    user?.id ? { clerkId: user.id } : "skip"
  );
  

  
  const {
    formData,
    setField,
    setNestedField,
    reset,
    isSubmitting,
    setIsSubmitting,
    populateForm,
    selectedActions,
    setSelectedActions,
    racialBonusesApplied,
    setRacialBonusesApplied,
    appliedRace,
    setAppliedRace,
    error,
    setError
  } = useCharacterForm();

  const {
    errors,
    validateForm,
    clearErrors,
    setErrors,
    hasErrors,
    getFieldError
  } = useCharacterValidation(formData);

  // Check if user can edit this character
  const canEditCharacter = () => {
    if (!user?.id) return false;
    
    // Admins can edit everything
    if (userRole === "admin") return true;
    
    // If we have character data, check if user is the creator
    // For now, we'll allow DM to edit any character in their campaign
    if (character && campaign && campaign.dmId === user.id) {
      return true;
    }
    
    return false;
  };

  // Calculate final ability scores with racial bonuses
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

  // Auto-calculate D&D stats when class/race/background changes
  const handleAutoCalculateStats = () => {
    if (!formData.class || !formData.race) return;

    const finalAbilityScores = calculateFinalAbilityScores();
    
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

    setField("hitPoints", autoHitPoints);
    setField("armorClass", autoArmorClass);
    setField("proficiencyBonus", autoProficiencyBonus);
    setField("savingThrows", autoSavingThrows);
    setField("skills", autoSkills);
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      clearErrors();
      setError(null);
    }
  }, [isOpen, reset, clearErrors, setError]);

  // Populate form with character data when viewing existing character
  useEffect(() => {
    if (isOpen && character && isReadOnly) {
      // Type guard to ensure we have a character object with the expected properties
      if (character && typeof character === 'object' && 'name' in character && 'race' in character && 'class' in character) {
        const characterData: Partial<CharacterFormData> = {
          name: character.name as string,
          race: character.race as string,
          class: character.class as string,
          background: character.background as string,
          alignment: character.alignment as string || "",
          level: character.level as number,
          hitPoints: character.hitPoints as number,
          armorClass: character.armorClass as number,
          proficiencyBonus: character.proficiencyBonus as number,
          speed: character.speed ? (character.speed as string).replace(" ft", "") : "",
          abilityScores: character.abilityScores as any,
          skills: character.skills as string[],
          savingThrows: character.savingThrows as string[],
          proficiencies: character.proficiencies as string[],
          traits: character.traits as string[] || [],
          languages: character.languages as string[] || [],
          equipment: character.equipment as string[] || [],
        };
        populateForm(characterData);
        
        // Update character type based on the actual character data
        if (character._table) {
          // The character type is determined by which table it came from
          // This is handled by the parent component passing the correct characterType
        }
      }
    }
  }, [isOpen, character, isReadOnly, populateForm]);

  // Populate form with initial data when provided
  useEffect(() => {
    if (isOpen && initialData && !character) {
      populateForm(initialData);
    }
  }, [isOpen, initialData, character, populateForm]);

  // Auto-calculate stats when relevant fields change
  useEffect(() => {
    if (!isReadOnly && formData.class && formData.race && formData.background) {
      // Only auto-calculate if we don't have manually set values or if this is a new character
      const shouldAutoCalculate = !characterId || 
        (formData.hitPoints === 10 && formData.armorClass === 10 && formData.proficiencyBonus === 2);
      
      if (shouldAutoCalculate) {
        handleAutoCalculateStats();
      }
    }
  }, [formData.class, formData.race, formData.background, formData.level, isReadOnly, characterId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isReadOnly || !validateForm() || !user) {
      if (hasErrors) {
        setError("Please fix the form errors before submitting.");
      }
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const finalAbilityScores = calculateFinalAbilityScores();
      
      const characterData = {
        name: formData.name.trim(),
        race: formData.race.trim(),
        class: formData.class.trim(),
        background: formData.background.trim(),
        alignment: formData.alignment.trim(),
        characterType,
        level: formData.level,
        experiencePoints: 0,
        hitPoints: formData.hitPoints,
        armorClass: formData.armorClass,
        proficiencyBonus: formData.proficiencyBonus,
        speed: formData.speed ? `${formData.speed} ft` : undefined,
        abilityScores: finalAbilityScores,
        skills: formData.skills,
        savingThrows: formData.savingThrows,
        proficiencies: formData.proficiencies,
        traits: formData.traits,
        languages: formData.languages,
        equipment: formData.equipment,
        actions: selectedActions,
        clerkId: user.id,
      };

      let characterId: Id<"npcs"> | Id<"playerCharacters">;
      
      if (characterType === "NonPlayerCharacter") {
        characterId = await createNPC(characterData);
      } else {
        characterId = await createPlayerCharacter(characterData);
      }
      
      onSuccess(characterId);
      onClose();
    } catch (error) {
      console.error("Error creating character:", error);
      setError("Failed to create character. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleEdit = () => {
    // Switch to edit mode by closing and reopening in edit mode
    onClose();
    // The parent component should handle reopening in edit mode
    // For now, we'll just close and let the parent handle it
  };

  if (!user) {
    return null;
  }

  const getModalTitle = () => {
    if (title) return title;
    if (isReadOnly) return `View ${characterType === "PlayerCharacter" ? "Player Character" : "NPC"}`;
    return `Create New ${characterType === "PlayerCharacter" ? "Player Character" : "NPC"}`;
  };

  const getModalDescription = () => {
    if (description) return description;
    if (isReadOnly) return `View details for ${characterType === "PlayerCharacter" ? "this player character" : "this NPC"}`;
    return `Define a new ${characterType === "PlayerCharacter" ? "player character" : "non-player character"} with comprehensive D&D 5e stats and background`;
  };

  const tabs = [
    {
      value: "basic",
      label: "Basic Info",
      icon: <User className="h-4 w-4" />,
      content: (
        <BasicInfoTab
          formData={formData}
          setField={setField}
          setNestedField={setNestedField}
          errors={errors}
          isReadOnly={isReadOnly}
          characterType={characterType}
        />
      ),
    },
    {
      value: "abilities",
      label: "Ability Scores",
      icon: <Zap className="h-4 w-4" />,
      content: (
        <AbilityScoresTab
          formData={formData}
          setField={setField}
          setNestedField={setNestedField}
          errors={errors}
          isReadOnly={isReadOnly}
          characterType={characterType}
        />
      ),
    },
    {
      value: "stats",
      label: "Stats & Combat",
      icon: <Shield className="h-4 w-4" />,
      content: (
        <StatsCombatTab
          formData={formData}
          setField={setField}
          setNestedField={setNestedField}
          errors={errors}
          isReadOnly={isReadOnly}
          characterType={characterType}
        />
      ),
    },
    {
      value: "skills",
      label: "Skills & Proficiencies",
      icon: <Award className="h-4 w-4" />,
      content: (
        <SkillsProficienciesTab
          formData={formData}
          setField={setField}
          setNestedField={setNestedField}
          errors={errors}
          isReadOnly={isReadOnly}
          characterType={characterType}
        />
      ),
    },
    {
      value: "actions",
      label: "Actions",
      icon: <Zap className="h-4 w-4" />,
      content: (
        <ActionsTab
          formData={formData}
          setField={setField}
          setNestedField={setNestedField}
          errors={errors}
          isReadOnly={isReadOnly}
          characterType={characterType}
        />
      ),
    },
    {
      value: "traits",
      label: "Traits & Equipment",
      icon: <Package className="h-4 w-4" />,
      content: (
        <TraitsEquipmentTab
          formData={formData}
          setField={setField}
          setNestedField={setNestedField}
          errors={errors}
          isReadOnly={isReadOnly}
          characterType={characterType}
        />
      ),
    },
    {
      value: "description",
      label: "Description",
      icon: <FileText className="h-4 w-4" />,
      content: (
        <DescriptionTab
          formData={formData}
          setField={setField}
          setNestedField={setNestedField}
          errors={errors}
          isReadOnly={isReadOnly}
          characterType={characterType}
        />
      ),
    },
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      description={getModalDescription()}
      size="5xl"
      maxHeight="90vh"
    >
      <LoadingSpinner isLoading={isSubmitting} overlay text={isReadOnly ? "Loading..." : "Creating character..."} />

      {/* Enhanced Error Display */}
      {(error || hasErrors) && (
        <div className="mb-4 space-y-2">
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
              <div className="flex items-center gap-2">
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            </div>
          )}
          {hasErrors && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
              <div className="flex items-center gap-2">
                <span className="font-medium">Form Validation:</span>
                <span>Please correct the highlighted fields before submitting.</span>
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormTabs tabs={tabs} defaultValue="basic" />

        <Separator />

        {/* Action Bar */}
        <div className="flex justify-between items-center gap-3">
          <div className="flex gap-2">
            {!isReadOnly && formData.class && formData.race && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAutoCalculateStats}
                className="flex items-center gap-2"
                title="Auto-calculate HP, AC, proficiency bonus, and skills based on D&D 5e rules"
              >
                <Calculator className="h-4 w-4" />
                Auto-Calculate D&D Stats
              </Button>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {isReadOnly ? "Close" : "Cancel"}
            </Button>
            {isReadOnly && canEditCharacter() && (
              <Button
                type="button"
                variant="outline"
                onClick={handleEdit}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
            {!isReadOnly && (
              <Button
                type="submit"
                disabled={isSubmitting || hasErrors}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Create {characterType === "PlayerCharacter" ? "Player Character" : "NPC"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </BaseModal>
  );
};

// Legacy export for backward compatibility
const NPCCreationModal: React.FC<Omit<CharacterCreationModalProps, 'characterType'> & { characterType?: CharacterType }> = (props) => {
  return <CharacterCreationModal {...props} characterType={props.characterType || "NonPlayerCharacter"} />;
};

export default CharacterCreationModal;
export { NPCCreationModal }; 