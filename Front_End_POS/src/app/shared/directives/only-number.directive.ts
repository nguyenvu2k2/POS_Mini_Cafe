import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[appOnlyNumber]',
  standalone: true
})
export class OnlyNumberDirective {
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Home', 'End'];

    if (allowedKeys.includes(event.key) || /^\d$/.test(event.key)) {
      return;
    }

    event.preventDefault();
  }
}
