import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
      <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632A2.25 2.25 0 0117.38 20.25H6.62a2.25 2.25 0 01-2.245-2.118L3.75 7.5M9 11.25h6M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      </div>
      <p class="text-sm font-semibold text-slate-800">{{ title }}</p>
      <p class="mt-1 max-w-sm text-sm text-slate-500">{{ message }}</p>
    </div>
  `
})
export class EmptyStateComponent {
  @Input() title = 'Chưa có dữ liệu';
  @Input() message = 'Danh sách hiện đang trống.';
}
