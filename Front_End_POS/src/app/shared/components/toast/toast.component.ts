import { AsyncPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { ToastMessage, ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [AsyncPipe, NgClass, NgFor, NgIf],
  template: `
    <div class="fixed right-4 top-4 z-[70] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
      <div
        *ngFor="let toast of toastService.toasts$ | async"
        class="flex items-start gap-3 rounded-lg border bg-white px-4 py-3 text-sm shadow-lg"
        [ngClass]="classes(toast)"
      >
        <div class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path *ngIf="toast.type === 'success'" stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            <path *ngIf="toast.type === 'error'" stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            <path *ngIf="toast.type === 'warning'" stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <path *ngIf="toast.type === 'info'" stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M12 7.5h.01" />
          </svg>
        </div>
        <p class="flex-1 font-medium">{{ toast.message }}</p>
        <button type="button" class="rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="Đóng thông báo" (click)="toastService.remove(toast.id)">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  `
})
export class ToastComponent {
  constructor(readonly toastService: ToastService) {}

  classes(toast: ToastMessage): string {
    const map: Record<string, string> = {
      success: 'border-green-200 text-green-700',
      error: 'border-red-200 text-red-700',
      warning: 'border-amber-200 text-amber-700',
      info: 'border-blue-200 text-blue-700'
    };

    return map[toast.type];
  }
}
