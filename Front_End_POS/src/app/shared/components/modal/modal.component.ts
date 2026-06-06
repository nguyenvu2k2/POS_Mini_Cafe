import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [NgIf],
  template: `
    <div *ngIf="open" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <div class="w-full max-w-xl overflow-hidden rounded-lg bg-white shadow-xl">
        <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 class="text-base font-semibold text-slate-900">{{ title }}</h2>
          <button
            *ngIf="showClose"
            type="button"
            class="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Đóng"
            (click)="close.emit()"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="px-5 py-5">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `
})
export class ModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() showClose = true;
  @Output() close = new EventEmitter<void>();
}
