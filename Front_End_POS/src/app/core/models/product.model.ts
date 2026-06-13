import { Ingredient } from './ingredient.model';

export interface Category {
  id: number;
  name: string;
}

export interface ProductRecipe {
  id?: number;
  variant_id: number;
  ingredient_id: number;
  quantity_required: number;
  ingredient?: Ingredient;
}

export interface ProductRecipeDto {
  ingredient_id: number;
  quantity_required: number;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  name: string;
  price: number;
  is_available: boolean;
  recipes?: ProductRecipe[];
}

export interface Product {
  id: number;
  name: string;
  description: string;
  category_id: number;
  category?: Category;
  image_url: string;
  is_active: boolean;
  is_out_of_stock: boolean;
  variants: ProductVariant[];
  created_at: string;
  updated_at?: string;
}

export interface ProductVariantDto {
  id?: number;
  name: string;
  price: number;
  is_available: boolean;
  recipes?: ProductRecipeDto[];
}

export interface CreateProductDto {
  name: string;
  description: string;
  category_id: number;
  is_active: boolean;
  variants: ProductVariantDto[];
}

export type UpdateProductDto = Partial<CreateProductDto>;
