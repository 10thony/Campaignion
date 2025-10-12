import React from "react";
import { useNavigate } from "react-router-dom";
import "./BackToCampaign.css";

interface BackToCampaignProps {
  campaignId: string;
  className?: string;
}

const BackToCampaign: React.FC<BackToCampaignProps> = ({ 
  campaignId, 
  className = "" 
}) => {
  const navigate = useNavigate();

  const handleBackToCampaign = () => {
    navigate(`/campaigns/${campaignId}`);
  };

  return (
    <button 
      className={`back-to-campaign-button ${className}`}
      onClick={handleBackToCampaign}
      title="Back to Campaign"
    >
      ← Back to Campaign
    </button>
  );
};

export default BackToCampaign; 