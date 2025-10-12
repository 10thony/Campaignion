import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@clerk/clerk-react";
import { useRoleAccess } from "../hooks/useRoleAccess";
import LocationForm from "./LocationForm";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import "./LocationForm.css";

export default function LocationList() {
  const [searchParams] = useSearchParams();
  const [isCreating, setIsCreating] = useState(false);
  const { userId } = useAuth();
  const { isAdmin } = useRoleAccess();
  const navigate = useNavigate();
  const locations = useQuery(api.locations.list) || [];
  const maps = useQuery(api.maps.getUserMaps, userId ? { clerkId: userId } : "skip") || [];

  // Check if we should show creation form based on query parameter
  useEffect(() => {
    const shouldCreate = searchParams.get('create') === 'true';
    if (shouldCreate) {
      setIsCreating(true);
    }
  }, [searchParams]);

  const handleCancel = () => {
    const returnTo = searchParams.get('returnTo');
    if (returnTo === 'campaign-form') {
      // General user flow - return to campaign creation with refresh parameter
      navigate("/campaigns/new?refresh=true");
    } else {
      setIsCreating(false);
      // Clear the create query parameter if it exists
      if (searchParams.get('create') === 'true') {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('create');
        window.history.replaceState(null, '', `?${newSearchParams.toString()}`);
      }
    }
  };

  const handleSubmitSuccess = () => {
    const returnTo = searchParams.get('returnTo');
    if (returnTo === 'campaign-form') {
      // General user flow - return to campaign creation with refresh parameter
      navigate("/campaigns/new?refresh=true");
    } else if (isAdmin) {
      // Admin flow - stay on locations list
      setIsCreating(false);
      // Clear the create query parameter if it exists
      if (searchParams.get('create') === 'true') {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('create');
        window.history.replaceState(null, '', `?${newSearchParams.toString()}`);
      }
    } else {
      // General user flow - return to locations list
      setIsCreating(false);
      // Clear the create query parameter if it exists
      if (searchParams.get('create') === 'true') {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('create');
        window.history.replaceState(null, '', `?${newSearchParams.toString()}`);
      }
    }
  };

  const getMapName = (mapId: string) => {
    const map = maps.find(m => m._id === mapId);
    return map ? map.name : "Unknown Map";
  };

  if (isCreating) {
    const returnTo = searchParams.get('returnTo');
    return (
      <div className="location-container">
        <div className="location-list-header">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="back-button"
          >
            {returnTo === 'campaign-form' ? "← Back to Campaign Form" : "← Back to Locations"}
          </Button>
        </div>
        <LocationForm 
          onSubmitSuccess={handleSubmitSuccess}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="location-container">
      <div className="location-list-header">
        <h2 className="location-list-title">Locations</h2>
        <Button
          onClick={() => setIsCreating(true)}
          className="location-create-btn"
        >
          Create New Location
        </Button>
      </div>
      <div className="location-grid">
        {locations.map((location) => (
          <div key={location._id} className="location-card-link-wrapper">
            <Link
              to={`/locations/${location._id}`}
              className="location-card-link"
              aria-label={`View details for ${location.name}`}
            >
              <Card className="clickable-card location-card">
                <CardHeader className="location-card-header">
                  <div className="location-title-section">
                    <CardTitle className="location-name">{location.name}</CardTitle>
                    <Badge variant="secondary" className="location-type-badge">
                      {location.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="location-card-content">
                  <p className="location-description">{location.description}</p>
                  
                  <Separator className="my-2" />
                  
                  <div className="location-details">
                    {location.mapId && (
                      <div className="location-detail-item">
                        <span className="location-detail-label">Map:</span>
                        <Badge variant="outline" className="location-detail-value">
                          {getMapName(location.mapId)}
                        </Badge>
                      </div>
                    )}
                    {location.notableNpcIds.length > 0 && (
                      <div className="location-detail-item">
                        <span className="location-detail-label">NPCs:</span>
                        <div className="location-npcs-list">
                          {location.notableNpcIds.map((npcId) => (
                            <Badge key={npcId} variant="outline" className="location-npc-item">
                              {npcId} {/* Replace with actual NPC name when available */}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {location.secrets && (
                      <div className="location-detail-item">
                        <span className="location-detail-label">Secrets:</span>
                        <span className="location-detail-value">{location.secrets}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
} 