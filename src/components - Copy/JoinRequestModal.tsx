import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import Modal from "./Modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import "./JoinRequestModal.css";

interface JoinRequestModalProps {
  campaignId: string;
  campaignName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const JoinRequestModal: React.FC<JoinRequestModalProps> = ({
  campaignId,
  campaignName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useUser();
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user's database ID
  const userRecord = useQuery(api.users.getUserByClerkId, 
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Get user's characters
  const userCharacters = useQuery(
    api.characters.getCharactersByUserId,
    userRecord?._id ? { userId: userRecord._id } : "skip"
  );

  // Get user's existing join requests for this campaign
  const existingRequests = useQuery(
    api.joinRequests.getJoinRequestsByUser,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const createJoinRequest = useMutation(api.joinRequests.createJoinRequest);

  // Check if user already has a pending or approved request for this campaign
  const hasExistingRequest = existingRequests?.some(
    request => request.campaignId === campaignId && 
    (request.status === "PENDING" || request.status === "APPROVED")
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCharacterId) {
      setError("Please select a character");
      return;
    }

    if (!user?.id || !userRecord?._id) {
      setError("User information not available");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await createJoinRequest({
        campaignId: campaignId as any,
        requesterUserClerkId: user.id,
        requesterUserId: userRecord._id,
        playerCharacterId: selectedCharacterId as any,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create join request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      setSelectedCharacterId("");
      onClose();
    }
  };

  // Don't render if user already has a request
  if (hasExistingRequest) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Request to Join: ${campaignName}`}
      description="Choose which character you'd like to play in this campaign."
    >
      <div className="join-request-modal">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-section">
            {userCharacters && userCharacters.length > 0 ? (
              <div className="space-y-3">
                {userCharacters.map((character) => (
                  <Card
                    key={character._id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedCharacterId === character._id && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedCharacterId(character._id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {character.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{character.name}</h4>
                            <Badge variant="outline">
                              Level {character.level}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="secondary">{character.race}</Badge>
                            <Badge variant="secondary">{character.class}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            HP: {character.hitPoints} | AC: {character.armorClass}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="character"
                            value={character._id}
                            checked={selectedCharacterId === character._id}
                            onChange={() => setSelectedCharacterId(character._id)}
                            className="h-4 w-4 text-primary focus:ring-primary"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">👤</div>
                <h3 className="text-lg font-medium mb-2">No Characters Available</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any characters yet.
                </p>
                <Button
                  type="button"
                  onClick={() => {
                    // Navigate to character creation with return parameter
                    window.location.href = "/characters?create=true&returnTo=join-request";
                  }}
                >
                  Create a Character
                </Button>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !selectedCharacterId}
            >
              {isLoading ? "Sending Request..." : "Send Join Request"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default JoinRequestModal; 