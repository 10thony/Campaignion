export const ItemTypes = {
  TOKEN: "TOKEN",
} as const;

export type DragItem = {
  id: string;
  type: typeof ItemTypes.TOKEN;
  offsetX: number;
  offsetY: number;
};
