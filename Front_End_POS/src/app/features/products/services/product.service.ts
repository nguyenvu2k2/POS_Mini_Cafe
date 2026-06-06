import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { ApiService } from '../../../core/services/api.service';
import {
  Category,
  CreateProductDto,
  Product,
  ProductRecipe,
  ProductRecipeDto,
  ProductVariant,
  ProductVariantDto,
  UpdateProductDto
} from '../../../core/models/product.model';

export interface ProductQuery {
  categoryId?: number;
  includeRecipes?: boolean;
  isActive?: boolean;
  search?: string;
}

interface ApiProductImage {
  url: string;
  is_primary?: boolean;
  sort_order?: number;
}

interface ApiProductVariant {
  id: number;
  product_id: number;
  name: string;
  price: string | number;
  is_available: boolean;
  recipes?: ApiRecipe[];
}

interface ApiRecipe {
  id?: number;
  variant_id: number;
  ingredient_id: number;
  quantity_required: string | number;
  ingredient?: ProductRecipe['ingredient'];
}

interface ApiProduct {
  id: number;
  name: string;
  description?: string | null;
  category_id: number;
  category?: Category;
  image_url?: string;
  images?: ApiProductImage[];
  is_active: boolean;
  variants?: ApiProductVariant[];
  created_at: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly apiUrl = `${environment.apiUrl}/products`;
  private readonly fallbackImage = 'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=640&q=80';

  constructor(private readonly api: ApiService) {}

  async getCategories(): Promise<Category[]> {
    return this.api.get<Category[]>(`${environment.apiUrl}/categories`, { is_active: true });
  }

  async getAll(params: ProductQuery = {}): Promise<Product[]> {
    const products = await this.api.get<ApiProduct[]>(this.apiUrl, {
      include: params.includeRecipes ? 'variants,images,recipes' : 'variants,images',
      category_id: params.categoryId,
      is_active: params.isActive
    });

    const search = params.search?.trim().toLowerCase();
    const normalizedProducts = products.map((product) => this.toProduct(product));

    if (!search) {
      return normalizedProducts;
    }

    return normalizedProducts.filter((product) => product.name.toLowerCase().includes(search));
  }

  async getById(id: number): Promise<Product | null> {
    try {
      return this.toProduct(await this.api.get<ApiProduct>(`${this.apiUrl}/${id}`));
    } catch {
      return null;
    }
  }

  async create(payload: CreateProductDto): Promise<Product> {
    const product = await this.api.post<ApiProduct, CreateProductDto>(this.apiUrl, payload);
    return this.toProduct(product);
  }

  async update(id: number, payload: UpdateProductDto): Promise<Product> {
    const productPayload = {
      category_id: payload.category_id,
      name: payload.name,
      description: payload.description,
      is_active: payload.is_active
    };

    await this.api.put<ApiProduct, typeof productPayload>(`${this.apiUrl}/${id}`, productPayload);
    await this.syncVariants(id, payload.variants);

    const product = await this.getById(id);
    if (!product) {
      throw new Error('Khong tim thay san pham.');
    }

    return product;
  }

  async toggleActive(id: number): Promise<Product> {
    const product = await this.getById(id);
    if (!product) {
      throw new Error('Khong tim thay san pham.');
    }

    return this.update(id, { is_active: !product.is_active });
  }

  async getVariantRecipe(productId: number, variantId: number): Promise<ProductRecipe[]> {
    const recipes = await this.api.get<ApiRecipe[]>(`${this.apiUrl}/${productId}/variants/${variantId}/recipe`);
    return recipes.map((recipe) => this.toRecipe(recipe));
  }

  async updateVariantRecipe(productId: number, variantId: number, recipes: ProductRecipeDto[]): Promise<ProductRecipe[]> {
    const updatedRecipes = await this.api.put<ApiRecipe[], { ingredients: ProductRecipeDto[] }>(
      `${this.apiUrl}/${productId}/variants/${variantId}/recipe`,
      { ingredients: recipes.map((recipe) => ({
        ingredient_id: Number(recipe.ingredient_id),
        quantity_required: Number(recipe.quantity_required)
      })) }
    );

    return updatedRecipes.map((recipe) => this.toRecipe(recipe));
  }

  private async syncVariants(productId: number, variants?: ProductVariantDto[]): Promise<void> {
    if (!variants?.length) {
      return;
    }

    for (const variant of variants) {
      const savedVariant = variant.id
        ? await this.api.put<ApiProductVariant, Partial<ProductVariantDto>>(
            `${this.apiUrl}/${productId}/variants/${variant.id}`,
            {
              name: variant.name,
              price: Number(variant.price),
              is_available: variant.is_available
            }
          )
        : await this.api.post<ApiProductVariant, ProductVariantDto>(
            `${this.apiUrl}/${productId}/variants`,
            {
              name: variant.name,
              price: Number(variant.price),
              is_available: variant.is_available,
              recipes: variant.recipes ?? []
            }
          );

      await this.updateVariantRecipe(productId, savedVariant.id, variant.recipes ?? []);
    }
  }

  private toProduct(product: ApiProduct): Product {
    const variants = (product.variants ?? []).map((variant) => this.toVariant(variant));
    const primaryImage = product.images?.find((image) => image.is_primary) ?? product.images?.[0];

    return {
      id: product.id,
      name: product.name,
      description: product.description ?? '',
      category_id: product.category_id,
      category: product.category,
      image_url: product.image_url ?? primaryImage?.url ?? this.fallbackImage,
      is_active: product.is_active,
      is_out_of_stock: variants.length === 0 || variants.every((variant) => !variant.is_available),
      variants,
      created_at: product.created_at,
      updated_at: product.updated_at
    };
  }

  private toVariant(variant: ApiProductVariant): ProductVariant {
    return {
      id: variant.id,
      product_id: variant.product_id,
      name: variant.name,
      price: Number(variant.price),
      is_available: variant.is_available,
      recipes: (variant.recipes ?? []).map((recipe) => this.toRecipe(recipe))
    };
  }

  private toRecipe(recipe: ApiRecipe): ProductRecipe {
    return {
      id: recipe.id,
      variant_id: recipe.variant_id,
      ingredient_id: recipe.ingredient_id,
      quantity_required: Number(recipe.quantity_required),
      ingredient: recipe.ingredient
    };
  }
}
