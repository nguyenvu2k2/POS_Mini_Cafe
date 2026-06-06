import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="inline-flex items-center gap-2 text-sm font-medium text-primary">
      <span
        class="inline-block rounded-full border-2 border-blue-100 border-t-primary animate-spin"
        [class.h-4]="size === 'sm'"
        [class.w-4]="size === 'sm'"
        [class.h-6]="size === 'md'"
        [class.w-6]="size === 'md'"
        [class.h-8]="size === 'lg'"
        [class.w-8]="size === 'lg'"
      ></span>
      <span *ngIf="label">{{ label }}</span>
    </div>
  `
})
export class LoadingSpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() label = '';
}
