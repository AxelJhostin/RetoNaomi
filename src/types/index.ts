// types/index.ts
import { 
  Category as PrismaCategory, 
  ModifierGroup as PrismaModifierGroup, 
  ModifierOption as PrismaModifierOption, 
  Product as PrismaProduct, 
  Order as PrismaOrder, 
  OrderItem as PrismaOrderItem, 
  Table as PrismaTable 
} from '@prisma/client';

// Reexportamos los tipos simples que no necesitan cambios
export type Category = PrismaCategory;
export type ModifierOption = PrismaModifierOption;

// Creamos tipos compuestos que incluyen las relaciones que necesitamos
export type ModifierGroupWithRelations = PrismaModifierGroup & {
  options: ModifierOption[];
};

export type ProductWithRelations = PrismaProduct & {
  category: Category | null;
  modifierGroups: ModifierGroupWithRelations[];
};

export type OrderItemWithRelations = PrismaOrderItem & {
  product: { id: string, name: string };
  selectedModifiers?: ModifierOption[];
};

export type OrderWithRelations = PrismaOrder & {
  table: PrismaTable;
  items: OrderItemWithRelations[];
};