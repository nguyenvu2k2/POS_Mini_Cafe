import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyVn',
  standalone: true
})
export class CurrencyVnPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    const amount = value ?? 0;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  }
}
