export type IngredientLogType = 'import' | 'adjust' | 'export';

export interface IngredientStockLog {
  id: number;
  ingredient_id: number;
  type: IngredientLogType;
  quantity: number;
  note: string;
  created_at: string;
}

export interface Ingredient {
  id: number;
  name: string;
  unit: string;
  stock: number;
  min_stock: number;
  is_active: boolean;
  logs: IngredientStockLog[];
}

export interface CreateIngredientDto {
  name: string;
  unit: string;
  stock_quantity?: number;
  min_stock?: number;
}

export interface UpdateIngredientDto {
  name?: string;
  unit?: string;
  stock_quantity?: number;
  min_stock?: number;
  is_active?: boolean;
}
