import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useUser } from "@clerk/clerk-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  AlertCircle, 
  ArrowLeft, 
  Calendar,
  Target
} from "lucide-react";

interface TimelineEventCreationFormProps {
  onSubmitSuccess: () => void;
  onCancel: () => void;
  editingTimelineEventId?: Id<"timelineEvents"> | null;
}

const TimelineEventCreationForm: React.FC<TimelineEventCreationFormProps> = ({
  onSubmitSuccess,
  onCancel,
  editingTimelineEventId,
}) => {
  const { user } = useUser();
  const createTimelineEvent = useMutation(api.timelineEvents.createTimelineEvent);
  const updateTimelineEvent = useMutation(api.timelineEvents.updateTimelineEvent);
  const timelineEvent = useQuery(
    api.timelineEvents.getTimelineEventById,
    editingTimelineEventId ? { id: editingTimelineEventId } : "skip"
  );
  const campaigns = useQuery(api.campaigns.getAllCampaigns, { clerkId: user?.id });

  const [formData, setFormData] = useState({
    campaignId: "",
    title: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    type: "Custom" as "Battle" | "Alliance" | "Discovery" | "Disaster" | "Political" | "Cultural" | "Custom",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (timelineEvent) {
      setFormData({
        campaignId: timelineEvent.campaignId,
        title: timelineEvent.title,
        description: timelineEvent.description,
        date: new Date(timelineEvent.date).toISOString().split('T')[0],
        type: timelineEvent.type || "Custom",
      });
    }
  }, [timelineEvent]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.campaignId) {
      newErrors.campaignId = "Campaign is required";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user) {
      setErrors({ general: "User not authenticated" });
      return;
    }

    setIsSubmitting(true);

    try {
      const timelineEventData = {
        campaignId: formData.campaignId as Id<"campaigns">,
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: new Date(formData.date).getTime(),
        type: formData.type,
      };

      if (editingTimelineEventId) {
        await updateTimelineEvent({
          id: editingTimelineEventId,
          ...timelineEventData,
        });
      } else {
        await createTimelineEvent({
          ...timelineEventData,
          clerkId: user.id,
        });
      }

      onSubmitSuccess();
    } catch (error) {
      console.error("Error saving timeline event:", error);
      setErrors({ general: "Failed to save timeline event. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "Battle": return "⚔️";
      case "Alliance": return "🤝";
      case "Discovery": return "🔍";
      case "Disaster": return "💥";
      case "Political": return "👑";
      case "Cultural": return "🎭";
      default: return "📅";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {editingTimelineEventId ? "Edit Timeline Event" : "Create New Timeline Event"}
            </h1>
            <p className="text-muted-foreground">
              {editingTimelineEventId ? "Update timeline event details" : "Add a new event to your campaign timeline"}
            </p>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {errors.general && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Event Information
            </CardTitle>
            <CardDescription>
              Basic details about the timeline event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter event title"
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Event Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => handleInputChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Custom">
                      <div className="flex items-center gap-2">
                        <span>📅</span>
                        <span>Custom</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Battle">
                      <div className="flex items-center gap-2">
                        <span>⚔️</span>
                        <span>Battle</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Alliance">
                      <div className="flex items-center gap-2">
                        <span>🤝</span>
                        <span>Alliance</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Discovery">
                      <div className="flex items-center gap-2">
                        <span>🔍</span>
                        <span>Discovery</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Disaster">
                      <div className="flex items-center gap-2">
                        <span>💥</span>
                        <span>Disaster</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Political">
                      <div className="flex items-center gap-2">
                        <span>👑</span>
                        <span>Political</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Cultural">
                      <div className="flex items-center gap-2">
                        <span>🎭</span>
                        <span>Cultural</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Event Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className={errors.date ? "border-destructive" : ""}
                />
                {errors.date && (
                  <p className="text-sm text-destructive">{errors.date}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaignId">Campaign *</Label>
              <Select 
                value={formData.campaignId} 
                onValueChange={(value) => handleInputChange("campaignId", value)}
              >
                <SelectTrigger className={errors.campaignId ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns?.map((campaign) => (
                    <SelectItem key={campaign._id} value={campaign._id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.campaignId && (
                <p className="text-sm text-destructive">{errors.campaignId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe the timeline event..."
                rows={4}
                className={errors.description ? "border-destructive" : ""}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Event Type Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Event Preview
            </CardTitle>
            <CardDescription>
              How this event will appear in your timeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-l-4 border-l-primary pl-4 py-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getEventTypeIcon(formData.type)}</span>
                <h4 className="font-semibold">{formData.title || "Event Title"}</h4>
                <Badge variant="outline">{formData.type}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {formData.date ? new Date(formData.date).toLocaleDateString() : "Date"}
              </p>
              <p className="text-sm">
                {formData.description || "Event description will appear here..."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : (editingTimelineEventId ? "Save Changes" : "Create Event")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TimelineEventCreationForm; 