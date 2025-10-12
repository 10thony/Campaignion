import React from "react";
import type { Item } from "../types/item";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import "./ItemCard.css";

interface ItemCardProps {
  item: Item;
  onClick?: (item: Item) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(item);
    }
  };

  const getRarityVariant = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case "common":
        return "secondary";
      case "uncommon":
        return "default";
      case "rare":
        return "default";
      case "very rare":
        return "default";
      case "legendary":
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <div className="item-card-link-wrapper">
      <Link 
        to={`/items/${item._id}`} 
        className="item-card-link"
        aria-label={`View details for ${item.name}`}
        onClick={handleClick}
      >
        <Card className="clickable-card item-card">
          <CardHeader className="item-card-header">
            <div className="item-title-section">
              <CardTitle className="item-card-name">{item.name}</CardTitle>
              <Badge 
                variant={getRarityVariant(item.rarity)} 
                className={`item-card-rarity rarity-${item.rarity.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {item.rarity}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="item-card-body">
            <Badge variant="outline" className="item-card-type">
              {item.type}
            </Badge>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
};

export default ItemCard;
