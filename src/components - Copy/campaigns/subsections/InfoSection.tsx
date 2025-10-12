import React, { useState } from "react";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import "./InfoSection.css";

interface InfoSectionProps {
  campaignId: Id<"campaigns">;
  name: string;
  description?: string;
  worldSetting?: string;
  isPublic: boolean;
  onUpdate: () => void;
  canEdit?: boolean;
}

const InfoSection: React.FC<InfoSectionProps> = ({
  campaignId,
  name,
  description,
  worldSetting,
  isPublic,
  onUpdate,
  canEdit = false,
}) => {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: name || "",
    description: description || "",
    worldSetting: worldSetting || "",
    isPublic: isPublic,
  });
  const [errors, setErrors] = useState<string[]>([]);

  const updateCampaign = useMutation(api.campaigns.updateCampaign);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    if (!formData.name.trim()) {
      newErrors.push("Campaign name is required");
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !user?.id) return;

    try {
      await updateCampaign({
        id: campaignId,
        clerkId: user.id,
        name: formData.name,
        description: formData.description || undefined,
        worldSetting: formData.worldSetting || undefined,
        isPublic: formData.isPublic,
      });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating campaign:", error);
      setErrors(["Failed to update campaign. Please try again."]);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: name || "",
      description: description || "",
      worldSetting: worldSetting || "",
      isPublic: isPublic,
    });
    setErrors([]);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="info-section">
        <div className="section-header">
          <h3 className="section-title">📋 Campaign Info</h3>
          <div className="header-actions">
            <button className="save-button" onClick={handleSave}>
              💾 Save
            </button>
            <button className="cancel-button" onClick={handleCancel}>
              ❌ Cancel
            </button>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="form-errors">
            {errors.map((error, index) => (
              <div key={index} className="error-message">{error}</div>
            ))}
          </div>
        )}

        <div className="form-content">
          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Campaign Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter campaign name"
              />
            </div>
            <div className="form-col">
              <label className="form-label">Visibility</label>
              <div className="toggle-container">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    className="toggle-input"
                    checked={formData.isPublic}
                    onChange={(e) => handleInputChange("isPublic", e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-text">
                    {formData.isPublic ? "Public" : "Private"}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter campaign description"
                rows={3}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-col">
              <label className="form-label">World Setting</label>
              <input
                type="text"
                className="form-input"
                value={formData.worldSetting}
                onChange={(e) => handleInputChange("worldSetting", e.target.value)}
                placeholder="Enter world setting"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="info-section">
      <div className="section-header">
        <h3 className="section-title">📋 Campaign Info</h3>
        <div className="header-actions">
          {canEdit && (
            <button className="edit-button" onClick={() => setIsEditing(true)}>
              ✏️ Edit
            </button>
          )}
        </div>
      </div>

      <div className="info-content">
        <div className="info-row">
          <div className="info-label">Campaign Name:</div>
          <div className="info-value">{name || "Not set"}</div>
        </div>

        <div className="info-row">
          <div className="info-label">Visibility:</div>
          <div className="info-value">
            <span className={`visibility-badge ${isPublic ? 'public' : 'private'}`}>
              {isPublic ? '🌐 Public' : '🔒 Private'}
            </span>
          </div>
        </div>

        {description && (
          <div className="info-row">
            <div className="info-label">Description:</div>
            <div className="info-value">{description}</div>
          </div>
        )}

        {worldSetting && (
          <div className="info-row">
            <div className="info-label">World Setting:</div>
            <div className="info-value">{worldSetting}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoSection; 