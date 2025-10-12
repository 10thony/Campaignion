import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import ItemCard from "./ItemCard";
import ItemCreationFormEnhanced from "./ItemCreationFormEnhanced";
import BulkItemGenerator from "./BulkItemGenerator";
import { Button } from "./ui/button";
import "./ItemList.css";

const ItemList: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const items = useQuery(api.items.getItems);

  const handleCancel = () => {
    setIsCreating(false);
  };

  const handleSubmitSuccess = () => {
    setIsCreating(false);
  };

  const handleGenerationComplete = () => {
    // The items will automatically refresh due to Convex's reactive queries
  };

  if (isCreating) {
    return (
      <div className="item-list">
        <div className="item-list-header">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="back-button"
          >
            ← Back to Items
          </Button>
        </div>
        <ItemCreationFormEnhanced 
          onSubmitSuccess={handleSubmitSuccess}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  if (!items) {
    return <div className="loading">Loading items...</div>;
  }

  return (
    <div className="item-list">
      <div className="item-list-header">
        <h2>Items</h2>
        <Button
          onClick={() => setIsCreating(true)}
          className="create-button"
        >
          Create New Item
        </Button>
      </div>
      
      {items.length === 0 && (
        <BulkItemGenerator onGenerationComplete={handleGenerationComplete} />
      )}
      
      <div className="item-grid">
        {items.map((item) => (
          <ItemCard key={item._id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default ItemList; 