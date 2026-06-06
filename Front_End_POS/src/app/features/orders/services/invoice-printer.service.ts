import { Injectable } from '@angular/core';

export interface InvoicePrintItem {
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface InvoicePrintData {
  storeName: string;
  printedAt: Date;
  orderCode?: string;
  customerName?: string;
  items: InvoicePrintItem[];
  totalAmount: number;
}

@Injectable({ providedIn: 'root' })
export class InvoicePrinterService {
  openPrintWindow(): Window | null {
    const printWindow = window.open('', '_blank', 'width=420,height=720');
    if (!printWindow) {
      return null;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html lang="vi">
        <head>
          <meta charset="utf-8">
          <title>Đang chuẩn bị hóa đơn</title>
        </head>
        <body>Đang chuẩn bị hóa đơn...</body>
      </html>
    `);
    printWindow.document.close();

    return printWindow;
  }

  print(data: InvoicePrintData, printWindow: Window | null): boolean {
    if (!printWindow) {
      return false;
    }

    printWindow.document.open();
    printWindow.document.write(this.buildInvoiceHtml(data));
    printWindow.document.close();
    printWindow.focus();
    printWindow.setTimeout(() => printWindow.print(), 250);

    return true;
  }

  close(printWindow: Window | null): void {
    if (printWindow && !printWindow.closed) {
      printWindow.close();
    }
  }

  private buildInvoiceHtml(data: InvoicePrintData): string {
    const orderCode = data.orderCode
      ? `<div class="meta-row"><span>Mã hóa đơn</span><strong>${this.escapeHtml(data.orderCode)}</strong></div>`
      : '';
    const customer = data.customerName
      ? `<div class="meta-row"><span>Khách hàng</span><strong>${this.escapeHtml(data.customerName)}</strong></div>`
      : '';
    const rows = data.items
      .map(
        (item) => `
          <tr>
            <td>
              <strong>${this.escapeHtml(item.productName)}</strong>
              <small>${this.escapeHtml(item.variantName)}</small>
            </td>
            <td class="center">${item.quantity}</td>
            <td class="right">${this.formatCurrency(item.unitPrice)}</td>
            <td class="right">${this.formatCurrency(item.subtotal)}</td>
          </tr>
        `
      )
      .join('');

    return `
      <!doctype html>
      <html lang="vi">
        <head>
          <meta charset="utf-8">
          <title>Hoa don</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              background: #ffffff;
              color: #0f172a;
              font-family: Arial, sans-serif;
              font-size: 13px;
            }

            .invoice {
              width: 80mm;
              margin: 0 auto;
              padding: 16px 12px;
            }

            h1 {
              margin: 0 0 10px;
              text-align: center;
              font-size: 20px;
              letter-spacing: 0;
              text-transform: uppercase;
            }

            .meta {
              border-top: 1px dashed #94a3b8;
              border-bottom: 1px dashed #94a3b8;
              padding: 8px 0;
            }

            .meta-row,
            .total-row {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              margin: 4px 0;
            }

            table {
              width: 100%;
              margin-top: 10px;
              border-collapse: collapse;
            }

            th {
              border-bottom: 1px solid #cbd5e1;
              padding: 6px 2px;
              font-size: 11px;
              text-align: left;
              text-transform: uppercase;
            }

            td {
              border-bottom: 1px dashed #e2e8f0;
              padding: 7px 2px;
              vertical-align: top;
            }

            small {
              display: block;
              margin-top: 2px;
              color: #475569;
            }

            .center {
              text-align: center;
            }

            .right {
              text-align: right;
              white-space: nowrap;
            }

            .total {
              margin-top: 10px;
              border-top: 1px solid #0f172a;
              padding-top: 8px;
              font-size: 15px;
            }

            .thanks {
              margin-top: 14px;
              text-align: center;
              font-weight: 700;
            }

            @media print {
              @page {
                margin: 0;
                size: 80mm auto;
              }

              .invoice {
                width: 80mm;
              }
            }
          </style>
        </head>
        <body>
          <main class="invoice">
            <h1>${this.escapeHtml(data.storeName)}</h1>
            <section class="meta">
              ${orderCode}
              <div class="meta-row"><span>Ngày in</span><strong>${this.formatDate(data.printedAt)}</strong></div>
              ${customer}
            </section>
            <table>
              <thead>
                <tr>
                  <th>Sản phẩm / Loại</th>
                  <th class="center">SL</th>
                  <th class="right">Giá</th>
                  <th class="right">Tiền</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <section class="total">
              <div class="total-row"><span>Tổng tiền</span><strong>${this.formatCurrency(data.totalAmount)}</strong></div>
            </section>
            <p class="thanks">Cảm ơn quý khách đã đến cửa hàng!</p>
          </main>
        </body>
      </html>
    `;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(value);
  }

  private formatDate(value: Date): string {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(value);
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
