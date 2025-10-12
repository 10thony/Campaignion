import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CharacterForm from "./CharacterForm";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ArrowLeft, Users } from "lucide-react";

const NPCCreationForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const handleCancel = () => {
    if (returnTo === 'campaign-form') {
      navigate("/campaigns/new");
    } else {
      navigate("/npcs");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {returnTo === 'campaign-form' ? "Back to Campaign Form" : "Back to NPCs"}
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New NPC</h1>
            <p className="text-muted-foreground">
              Define a new non-player character for your campaign
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            NPC Information
          </CardTitle>
          <CardDescription>
            Fill out the character details below to create your NPC
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CharacterForm defaultCharacterType="NonPlayerCharacter" />
        </CardContent>
      </Card>
    </div>
  );
};

export default NPCCreationForm; 