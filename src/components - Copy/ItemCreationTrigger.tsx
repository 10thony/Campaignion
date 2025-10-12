import React from "react";
// import { PlusCircle } from "lucide-react"; // Example icon library
import "./ItemCreationTrigger.css"; // Basic styling

interface ItemCreationTriggerProps {
  onClick: () => void;
  label?: string;
  icon?: React.ReactNode;
}

const ItemCreationTrigger: React.FC<ItemCreationTriggerProps> = ({
  onClick,
  label = "Create New Item",
//   icon = <PlusCircle size={20} />,
}) => {
  return (
    <button className="item-creation-trigger" onClick={onClick}>
      {/* {icon} */}
      {label && <span className="item-creation-trigger-label">{label}</span>}
    </button>
  );
};

export default ItemCreationTrigger;
