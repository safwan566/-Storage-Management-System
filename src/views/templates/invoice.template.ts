export interface InvoiceData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  orderDate: string;
}

export const invoiceTemplate = (data: InvoiceData): string => {
  const itemsHtml = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.sku}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.subtotal.toFixed(2)}</td>
        </tr>
      `
    )
    .join('');
    
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4A90E2; text-align: center;">INVOICE</h1>
          <div style="margin: 20px 0;">
            <p><strong>Order Number:</strong> ${data.orderNumber}</p>
            <p><strong>Order Date:</strong> ${data.orderDate}</p>
          </div>
          <div style="margin: 20px 0;">
            <h3>Bill To:</h3>
            <p>${data.customerName}</p>
            <p>${data.customerEmail}</p>
            <p>${data.customerAddress.street}</p>
            <p>${data.customerAddress.city}, ${data.customerAddress.state} ${data.customerAddress.zipCode}</p>
            <p>${data.customerAddress.country}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #4A90E2; color: white;">
                <th style="padding: 10px; text-align: left;">Item</th>
                <th style="padding: 10px; text-align: left;">SKU</th>
                <th style="padding: 10px; text-align: center;">Qty</th>
                <th style="padding: 10px; text-align: right;">Price</th>
                <th style="padding: 10px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div style="margin: 20px 0; text-align: right;">
            <p><strong>Subtotal:</strong> $${data.subtotal.toFixed(2)}</p>
            ${data.discount > 0 ? `<p><strong>Discount:</strong> -$${data.discount.toFixed(2)}</p>` : ''}
            <p><strong>Tax:</strong> $${data.tax.toFixed(2)}</p>
            <p><strong>Shipping:</strong> $${data.shippingCost.toFixed(2)}</p>
            <hr style="border: 1px solid #333;">
            <h2><strong>Total:</strong> $${data.total.toFixed(2)}</h2>
          </div>
          <div style="margin-top: 40px; text-align: center; color: #666;">
            <p>Thank you for your business!</p>
            <p>Storage Management System</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

