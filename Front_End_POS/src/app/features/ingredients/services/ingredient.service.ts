import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CreateIngredientDto, Ingredient, IngredientStockLog, IngredientLogType, UpdateIngredientDto } from '../../../core/models/ingredient.model';
import { ApiService } from '../../../core/services/api.service';

interface ApiIngredient {
  id: number;
  name: string;
  unit: string;
  stock_quantity: string | number;
  min_stock: string | number;
  is_active?: boolean;
  logs?: IngredientStockLog[];
}

@Injectable({ providedIn: 'root' })
export class IngredientService {
  private readonly apiUrl = `${environment.apiUrl}/ingredients`;

  constructor(private readonly api: ApiService) {}

  async getAll(lowOnly = false, isActive?: boolean): Promise<Ingredient[]> {
    const ingredients = await this.api.get<ApiIngredient[]>(this.apiUrl, {
      low_stock: lowOnly || undefined,
      is_active: isActive
    });
    return ingredients.map((ingredient) => this.toIngredient(ingredient));
  }

  async create(payload: CreateIngredientDto): Promise<Ingredient> {
    const ingredient = await this.api.post<ApiIngredient, CreateIngredientDto>(this.apiUrl, {
      name: payload.name.trim(),
      unit: payload.unit.trim(),
      stock_quantity: Math.max(0, Number(payload.stock_quantity ?? 0)),
      min_stock: Math.max(0, Number(payload.min_stock ?? 0))
    });

    return this.toIngredient(ingredient);
  }

  async update(id: number, payload: UpdateIngredientDto): Promise<Ingredient> {
    const ingredient = await this.api.put<ApiIngredient, UpdateIngredientDto>(`${this.apiUrl}/${id}`, payload);
    return this.toIngredient(ingredient);
  }

  async toggleActive(ingredient: Ingredient): Promise<Ingredient> {
    return this.update(ingredient.id, { is_active: !ingredient.is_active });
  }

  async importStock(id: number, quantity: number, note: string): Promise<Ingredient> {
    const ingredient = await this.api.post<ApiIngredient, { quantity: number; note: string }>(
      `${this.apiUrl}/${id}/import`,
      { quantity: Math.abs(quantity), note }
    );

    return this.toIngredient(ingredient);
  }

  async adjustStock(id: number, actualStock: number, note: string, unit: string): Promise<Ingredient> {
    const ingredient = await this.api.post<ApiIngredient, { actual_quantity: number; note: string; unit: string }>(
      `${this.apiUrl}/${id}/adjust`,
      { actual_quantity: actualStock, note: note || 'Dieu chinh kiem ke', unit: unit.trim() }
    );

    return this.toIngredient(ingredient);
  }

  isLowStock(ingredient: Ingredient): boolean {
    return ingredient.stock <= ingredient.min_stock * 1.2;
  }

  private toIngredient(ingredient: ApiIngredient): Ingredient {
    return {
      id: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
      stock: Number(ingredient.stock_quantity),
      min_stock: Number(ingredient.min_stock),
      is_active: ingredient.is_active ?? true,
      logs: (ingredient.logs ?? []).map((log) => ({
        ...log,
        type: this.toLogType(log.type)
      }))
    };
  }

  private toLogType(type: string): IngredientLogType {
    const map: Record<string, IngredientLogType> = {
      import: 'import',
      adjustment: 'adjust',
      export_sale: 'export',
      export_waste: 'export'
    };

    return map[type] ?? 'adjust';
  }
}
