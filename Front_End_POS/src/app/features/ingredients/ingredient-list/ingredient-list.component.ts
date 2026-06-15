import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateIngredientDto, Ingredient } from '../../../core/models/ingredient.model';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { IngredientService } from '../services/ingredient.service';

type StockAction = 'import' | 'adjust';

@Component({
  selector: 'app-ingredient-list',
  standalone: true,
  imports: [NgClass, NgFor, NgIf, FormsModule, ReactiveFormsModule, BadgeComponent, EmptyStateComponent, LoadingSpinnerComponent, ModalComponent],
  templateUrl: './ingredient-list.component.html'
})
export class IngredientListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  ingredients: Ingredient[] = [];
  lowOnly = false;
  isLoading = false;
  isSaving = false;
  isCreating = false;
  isSavingVisibility = false;
  activeForm = false;
  hidingIngredient: Ingredient | null = null;
  showingIngredient: Ingredient | null = null;

  selectedIngredient: Ingredient | null = null;
  action: StockAction | null = null;
  quantity = 0;
  unit = '';
  note = '';

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    unit: ['', Validators.required],
    stock_quantity: [0, [Validators.required, Validators.min(0)]],
    min_stock: [0, [Validators.required, Validators.min(0)]]
  });

  readonly hideConfirmForm = this.fb.nonNullable.group({});
  readonly showConfirmForm = this.fb.nonNullable.group({});

  constructor(
    readonly ingredientService: IngredientService,
    private readonly toast: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadIngredients();
  }

  async loadIngredients(): Promise<void> {
    this.isLoading = true;
    try {
      this.ingredients = await this.ingredientService.getAll(this.lowOnly);
    } finally {
      this.isLoading = false;
    }
  }

  rowClass(ingredient: Ingredient): string {
    if (!ingredient.is_active) {
      return 'bg-slate-50 text-slate-500 hover:bg-slate-100';
    }

    if (ingredient.stock <= ingredient.min_stock) {
      return 'bg-red-50 hover:bg-red-100';
    }

    if (this.ingredientService.isLowStock(ingredient)) {
      return 'bg-amber-50 hover:bg-amber-100';
    }

    return 'hover:bg-slate-50';
  }

  openAction(action: StockAction, ingredient: Ingredient): void {
    if (!ingredient.is_active) {
      this.toast.warning('Nguyên liệu đã ẩn, không thể nhập kho hoặc điều chỉnh.');
      return;
    }

    this.action = action;
    this.selectedIngredient = ingredient;
    this.quantity = action === 'adjust' ? ingredient.stock : 0;
    this.unit = ingredient.unit;
    this.note = '';
  }

  openCreateForm(): void {
    this.activeForm = true;
  }

  cancelCreateIngredient(): void {
    this.resetCreateForm();
    this.activeForm = false;
  }

  async createIngredient(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: CreateIngredientDto = {
      name: value.name.trim(),
      unit: value.unit.trim(),
      stock_quantity: value.stock_quantity,
      min_stock: value.min_stock
    };

    if (!payload.name || !payload.unit) {
      this.toast.warning('Vui lòng nhập tên nguyên liệu và đơn vị.');
      return;
    }

    this.isCreating = true;
    try {
      await this.ingredientService.create(payload);
      this.toast.success('Đã thêm nguyên liệu.');
      this.resetCreateForm();
      this.activeForm = false;
      await this.loadIngredients();
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Không thể thêm nguyên liệu.');
    } finally {
      this.isCreating = false;
    }
  }

  closeAction(): void {
    this.action = null;
    this.selectedIngredient = null;
    this.quantity = 0;
    this.unit = '';
    this.note = '';
  }

  async submitAction(): Promise<void> {
    if (!this.selectedIngredient || !this.action || this.quantity < 0) {
      return;
    }

    if (!this.selectedIngredient.is_active) {
      this.toast.warning('Nguyên liệu đã ẩn, không thể nhập kho hoặc điều chỉnh.');
      this.closeAction();
      return;
    }

    const unit = this.unit.trim();
    if (this.action === 'adjust' && !unit) {
      this.toast.warning('Vui lòng nhập đơn vị tính.');
      return;
    }

    this.isSaving = true;
    try {
      if (this.action === 'import') {
        await this.ingredientService.importStock(this.selectedIngredient.id, this.quantity, this.note || 'Nhập kho');
        this.toast.success('Đã nhập kho nguyên liệu.');
      } else {
        await this.ingredientService.adjustStock(this.selectedIngredient.id, this.quantity, this.note || 'Điều chỉnh kiểm kê', unit);
        this.toast.success('Đã điều chỉnh tồn kho.');
      }

      this.closeAction();
      await this.loadIngredients();
    } finally {
      this.isSaving = false;
    }
  }

  handleVisibilityClick(ingredient: Ingredient): void {
    if (ingredient.is_active) {
      this.openHideConfirm(ingredient);
      return;
    }

    this.openShowConfirm(ingredient);
  }

  openHideConfirm(ingredient: Ingredient): void {
    this.showingIngredient = null;
    this.hidingIngredient = ingredient;
  }

  closeHideConfirm(): void {
    if (this.isSavingVisibility) {
      return;
    }

    this.hidingIngredient = null;
  }

  async confirmHideIngredient(): Promise<void> {
    if (!this.hidingIngredient || this.isSavingVisibility) {
      return;
    }

    this.isSavingVisibility = true;
    try {
      await this.ingredientService.toggleActive(this.hidingIngredient);
      this.toast.success('Đã ẩn nguyên liệu.');
      this.hidingIngredient = null;
      await this.loadIngredients();
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Không thể ẩn nguyên liệu.');
    } finally {
      this.isSavingVisibility = false;
    }
  }

  openShowConfirm(ingredient: Ingredient): void {
    this.hidingIngredient = null;
    this.showingIngredient = ingredient;
  }

  closeShowConfirm(): void {
    if (this.isSavingVisibility) {
      return;
    }

    this.showingIngredient = null;
  }

  async confirmShowIngredient(): Promise<void> {
    if (!this.showingIngredient || this.isSavingVisibility) {
      return;
    }

    this.isSavingVisibility = true;
    try {
      await this.ingredientService.toggleActive(this.showingIngredient);
      this.toast.success('Đã hiển thị nguyên liệu.');
      this.showingIngredient = null;
      await this.loadIngredients();
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Không thể hiển thị nguyên liệu.');
    } finally {
      this.isSavingVisibility = false;
    }
  }

  private resetCreateForm(): void {
    this.form.reset({ name: '', unit: '', stock_quantity: 0, min_stock: 0 });
  }
}
