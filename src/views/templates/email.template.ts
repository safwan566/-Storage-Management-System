export interface WelcomeEmailData {
  name: string;
  email: string;
}

export const welcomeEmailTemplate = (data: WelcomeEmailData): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Welcome to Storage Management System</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4A90E2;">Welcome to Storage Management System!</h1>
          <p>Hello ${data.name},</p>
          <p>Thank you for registering with us. Your account has been successfully created.</p>
          <p>Email: <strong>${data.email}</strong></p>
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Best regards,<br>Storage Management System Team</p>
        </div>
      </body>
    </html>
  `;
};

export interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
}

export const orderConfirmationTemplate = (data: OrderConfirmationData): string => {
  const itemsHtml = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">$${item.price.toFixed(2)}</td>
        </tr>
      `
    )
    .join('');
    
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4A90E2;">Order Confirmation</h1>
          <p>Hello ${data.customerName},</p>
          <p>Thank you for your order! Your order has been confirmed.</p>
          <p><strong>Order Number:</strong> ${data.orderNumber}</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f4f4f4;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Quantity</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <p><strong>Total: $${data.total.toFixed(2)}</strong></p>
          <p>We'll send you another email when your order ships.</p>
          <p>Best regards,<br>Storage Management System Team</p>
        </div>
      </body>
    </html>
  `;
};

