import React from "react";
import type { Item } from "../types/item";
import "./ItemDetails.css";

interface ItemDetailsProps {
  item: Item;
  onEdit?: (item: Item) => void;
  onDelete?: (itemId: string) => void;
}

const ItemDetails: React.FC<ItemDetailsProps> = ({
  item,
  onEdit,
  onDelete,
}) => {

  const handleDelete = () => {
    if (onDelete && item._id) {
      if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
        onDelete(item._id);
      }
    }
  };

  const getRarityColor = (rarity: string) => {
    const rarityColors = {
      common: "bg-gray-500",
      uncommon: "bg-blue-500",
      rare: "bg-purple-500",
      "very-rare": "bg-purple-600",
      legendary: "bg-orange-500",
      artifact: "bg-red-600",
      unique: "bg-yellow-500"
    };
    return rarityColors[rarity.toLowerCase().replace(/\s+/g, "-") as keyof typeof rarityColors] || "bg-gray-500";
  };

  return (
    <div className="item-details-container">
      <div className="item-details-card">
        {/* Header Section */}
        <div className="item-details-header">
          <div className="item-details-title-section">
            <h1 className="item-details-name">{item.name}</h1>
            <div className="item-details-meta">
              <span className="item-details-type">{item.type}</span>
              <span className={`item-details-rarity ${getRarityColor(item.rarity)}`}>
                {item.rarity}
              </span>
              {item.attunement && (
                <span className="item-details-attunement">
                  <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Requires Attunement
                </span>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          {(onEdit || onDelete) && (
            <div className="item-details-actions">
              {onEdit && (
                <button 
                  className="btn btn-primary"
                  onClick={() => onEdit(item)}
                  title="Edit Item"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              )}
              {onDelete && (
                <button 
                  className="btn btn-danger"
                  onClick={handleDelete}
                  title="Delete Item"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Properties Grid */}
        <div className="item-details-properties">
          {item.weight !== undefined && (
            <div className="property-item">
              <span className="property-label">Weight</span>
              <span className="property-value">{item.weight} lbs</span>
            </div>
          )}
          {item.cost !== undefined && (
            <div className="property-item">
              <span className="property-label">Cost</span>
              <span className="property-value">{item.cost} cp</span>
            </div>
          )}
        </div>

        {/* Description Section */}
        <div className="item-details-section">
          <h3 className="section-title">
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Description
          </h3>
          <div className="item-details-description">
            {item.description}
          </div>
        </div>

        {/* Effects Section */}
        {item.effects && (
          <div className="item-details-section">
            <h3 className="section-title">
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Effects
            </h3>
            <div className="item-details-effects">
              {item.effects}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemDetails;
