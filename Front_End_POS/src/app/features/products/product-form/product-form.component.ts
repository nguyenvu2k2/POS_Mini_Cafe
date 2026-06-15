import { NgFor, NgIf } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Ingredient } from '../../../core/models/ingredient.model';
import { Category, CreateProductDto, ProductRecipeDto, ProductVariantDto } from '../../../core/models/product.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { IngredientService } from '../../ingredients/services/ingredient.service';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [NgFor, NgIf, ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './product-form.component.html'
})
export class ProductFormComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);

  categories: Category[] = [];
  ingredients: Ingredient[] = [];
  productId: number | null = null;
  previewUrl = '';
  isLoading = false;
  isSaving = false;
  private selectedImageFile: File | null = null;
  private objectPreviewUrl: string | null = null;

  readonly form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    category_id: [1, Validators.required],
    image_url: [''],
    is_active: [true],
    variants: this.fb.array([])
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productService: ProductService,
    private readonly ingredientService: IngredientService,
    private readonly toast: ToastService
  ) {}

  get variants(): FormArray {
    return this.form.get('variants') as FormArray;
  }

  async ngOnInit(): Promise<void> {
    this.productId = Number(this.route.snapshot.paramMap.get('id')) || null;
    [this.categories, this.ingredients] = await Promise.all([
      this.productService.getCategories(),
      this.ingredientService.getAll(false)
    ]);

    if (this.productId) {
      await this.loadProduct(this.productId);
    } else {
      this.addVariant();
    }
  }

  ngOnDestroy(): void {
    this.revokeObjectPreviewUrl();
  }

  variantControl(index: number, key: string): AbstractControl | null {
    return this.variants.at(index).get(key);
  }

  variantRecipes(index: number): FormArray {
    return this.variants.at(index).get('recipes') as FormArray;
  }

  recipeControl(variantIndex: number, recipeIndex: number, key: string): AbstractControl | null {
    return this.variantRecipes(variantIndex).at(recipeIndex).get(key);
  }

  get activeIngredients(): Ingredient[] {
    return this.ingredients.filter((ingredient) => ingredient.is_active);
  }

  selectedRecipeIngredient(variantIndex: number, recipeIndex: number): Ingredient | null {
    const ingredientId = Number(this.recipeControl(variantIndex, recipeIndex, 'ingredient_id')?.value);
    return this.ingredients.find((ingredient) => ingredient.id === ingredientId) ?? null;
  }

  isRecipeIngredientHidden(variantIndex: number, recipeIndex: number): boolean {
    const ingredient = this.selectedRecipeIngredient(variantIndex, recipeIndex);
    return Boolean(ingredient && !ingredient.is_active);
  }

  addVariant(variant?: ProductVariantDto, recipes: ProductRecipeDto[] = variant?.recipes ?? []): void {
    this.variants.push(
      this.fb.group({
        id: [variant?.id ?? null],
        name: [variant?.name ?? 'M', Validators.required],
        price: [variant?.price ?? 30000, [Validators.required, Validators.min(1)]],
        is_available: [variant?.is_available ?? true],
        recipes: this.fb.array(
          recipes.map((recipe) => this.createRecipeGroup(recipe))
        )
      })
    );
  }

  addRecipe(variantIndex: number): void {
    this.variantRecipes(variantIndex).push(this.createRecipeGroup());
  }

  removeRecipe(variantIndex: number, recipeIndex: number): void {
    this.variantRecipes(variantIndex).removeAt(recipeIndex);
  }

  ingredientUnit(ingredientId: number | string | null | undefined): string {
    const id = Number(ingredientId);
    return this.ingredients.find((ingredient) => ingredient.id === id)?.unit ?? '';
  }

  removeVariant(index: number): void {
    if (this.variants.length <= 1) {
      this.toast.warning('Sản phẩm cần ít nhất một biến thể.');
      return;
    }

    this.variants.removeAt(index);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    if (!file) {
      return;
    }

    if (!allowedImageTypes.has(file.type)) {
      this.toast.warning('File upload phai la anh.');
      this.selectedImageFile = null;
      this.revokeObjectPreviewUrl();
      this.previewUrl = this.form.value.image_url ?? '';
      input.value = '';
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      this.toast.warning('Anh san pham khong duoc vuot qua 3MB.');
      this.selectedImageFile = null;
      this.revokeObjectPreviewUrl();
      this.previewUrl = this.form.value.image_url ?? '';
      input.value = '';
      return;
    }

    this.selectedImageFile = file;
    this.revokeObjectPreviewUrl();
    this.objectPreviewUrl = URL.createObjectURL(file);
    this.previewUrl = this.objectPreviewUrl;
  }

  onPreviewImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    const fallbackUrl = this.productService.getDefaultImageForName(this.form.value.name ?? '');

    if (image.getAttribute('src') === fallbackUrl) {
      return;
    }

    this.previewUrl = fallbackUrl;
    image.src = fallbackUrl;
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Vui lòng kiểm tra lại thông tin sản phẩm.');
      return;
    }

    if (!this.hasValidRecipes()) {
      this.toast.warning('Mỗi biến thể đang bán cần có công thức nguyên liệu.');
      return;
    }

    if (!this.hasOnlyActiveRecipeIngredients()) {
      this.toast.warning('Công thức chỉ được chọn nguyên liệu đang hiện.');
      return;
    }

    this.isSaving = true;
    try {
      const payload = this.toPayload();
      if (this.productId) {
        const product = await this.productService.update(this.productId, payload);
        await this.uploadSelectedImage(product.id);
        this.toast.success('Đã cập nhật sản phẩm.');
      } else {
        const product = await this.productService.create(payload);
        this.productId = product.id;
        await this.uploadSelectedImage(product.id);
        this.toast.success('Đã thêm sản phẩm.');
      }

      await this.router.navigate(['/products']);
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Không thể lưu sản phẩm.');
    } finally {
      this.isSaving = false;
    }
  }

  private async loadProduct(id: number): Promise<void> {
    this.isLoading = true;
    try {
      const product = await this.productService.getById(id);
      if (!product) {
        this.toast.error('Không tìm thấy sản phẩm.');
        await this.router.navigate(['/products']);
        return;
      }

      this.form.patchValue({
        name: product.name,
        description: product.description,
        category_id: product.category_id,
        image_url: product.image_url,
        is_active: product.is_active
      });
      this.previewUrl = product.image_url;
      this.selectedImageFile = null;
      this.revokeObjectPreviewUrl();
      this.variants.clear();
      const recipesByVariant = await Promise.all(
        product.variants.map((variant) =>
          this.productService.getVariantRecipe(product.id, variant.id)
        )
      );
      product.variants.forEach((variant, index) => this.addVariant(variant, recipesByVariant[index]));
    } finally {
      this.isLoading = false;
    }
  }

  private createRecipeGroup(recipe?: ProductRecipeDto) {
    return this.fb.group({
      ingredient_id: [recipe?.ingredient_id ?? null, [Validators.required, Validators.min(1)]],
      quantity_required: [recipe?.quantity_required ?? 0, [Validators.required, Validators.min(0.001)]]
    });
  }

  private hasValidRecipes(): boolean {
    return (this.form.getRawValue().variants as ProductVariantDto[]).every((variant) => {
      if (!variant.is_available) {
        return true;
      }

      return (variant.recipes ?? []).some((recipe) =>
        Number(recipe.ingredient_id) > 0 && Number(recipe.quantity_required) > 0
      );
    });
  }

  private hasOnlyActiveRecipeIngredients(): boolean {
    const activeIngredientIds = new Set(this.activeIngredients.map((ingredient) => ingredient.id));

    return (this.form.getRawValue().variants as ProductVariantDto[]).every((variant) =>
      (variant.recipes ?? []).every((recipe) => {
        const ingredientId = Number(recipe.ingredient_id);
        return !ingredientId || activeIngredientIds.has(ingredientId);
      })
    );
  }

  private async uploadSelectedImage(productId: number): Promise<void> {
    if (!this.selectedImageFile) {
      return;
    }

    await this.productService.uploadProductImage(productId, this.selectedImageFile);
    this.selectedImageFile = null;
    this.revokeObjectPreviewUrl();
  }

  private revokeObjectPreviewUrl(): void {
    if (!this.objectPreviewUrl) {
      return;
    }

    URL.revokeObjectURL(this.objectPreviewUrl);
    this.objectPreviewUrl = null;
  }

  private toPayload(): CreateProductDto {
    const raw = this.form.getRawValue();
    const variants = (raw.variants as ProductVariantDto[]).map((variant) => ({
      ...variant,
      price: Number(variant.price),
      is_available: Boolean(variant.is_available),
      recipes: (variant.recipes ?? []).map((recipe) => ({
        ingredient_id: Number(recipe.ingredient_id),
        quantity_required: Number(recipe.quantity_required)
      }))
    }));

    return {
      name: raw.name ?? '',
      description: raw.description ?? '',
      category_id: Number(raw.category_id),
      is_active: Boolean(raw.is_active),
      variants
    };
  }
}
