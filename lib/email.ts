import { Resend } from "resend";

type EmailOrderItem = {
  name: string;
  price: number;
  quantity: number;
};

type EmailOrder = {
  id: string;
  fullName: string;
  addressLine: string;
  city: string;
  postalCode: string;
  totalAmount: number;
  items: EmailOrderItem[];
};

type EmailData = {
  recipientEmail: string;
  recipientName: string;
  order: EmailOrder;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildOrderEmailHtml(recipientName: string, order: EmailOrder): string {
  const safeName = escapeHtml(recipientName || "Customer");
  const itemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.name)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;">$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`,
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827;max-width:640px;margin:0 auto;padding:16px;">
      <h2 style="margin:0 0 8px;">Thanks for your order, ${safeName}</h2>
      <p style="margin:0 0 16px;color:#374151;">Your order has been placed successfully.</p>

      <div style="padding:12px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:16px;">
        <p style="margin:0 0 4px;"><strong>Order ID:</strong> ${order.id}</p>
        <p style="margin:0 0 4px;"><strong>Total:</strong> $${order.totalAmount.toFixed(2)}</p>
        <p style="margin:0;"><strong>Shipping:</strong> ${escapeHtml(order.fullName)}, ${escapeHtml(order.addressLine)}, ${escapeHtml(order.city)} ${escapeHtml(order.postalCode)}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb;">Item</th>
            <th style="text-align:center;padding:8px;border-bottom:1px solid #e5e7eb;">Qty</th>
            <th style="text-align:right;padding:8px;border-bottom:1px solid #e5e7eb;">Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <p style="margin-top:16px;color:#4b5563;">We will email you again when your order ships.</p>
      <p style="margin-top:8px;color:#6b7280;font-size:12px;">Battle Store</p>
    </div>
  `.trim();
}

/**
 * Send order confirmation email
 * In production, use Resend, SendGrid, or Nodemailer
 * For now, logs to console in development
 */
export async function sendOrderConfirmationEmail(data: EmailData): Promise<boolean> {
  try {
    const { recipientEmail, recipientName, order } = data;

    const resendApiKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.EMAIL_FROM || "Battle Store <onboarding@resend.dev>";

    if (!resendApiKey) {
      console.warn("RESEND_API_KEY is missing. Falling back to console email output.");
    }

    const itemsList = order.items
      .map((item: EmailOrderItem) => `- ${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`)
      .join("\n");

    const emailContent = `
Hi ${recipientName || "Customer"},

Thank you for your order! Here are your order details:

Order ID: ${order.id}
Total: $${order.totalAmount.toFixed(2)}

Shipping Address:
${order.fullName}
${order.addressLine}
${order.city}, ${order.postalCode}

Items:
${itemsList}

Your order will be processed shortly and you'll receive shipping confirmation email soon.

Best regards,
Battle Store
    `.trim();

    if (!resendApiKey) {
      console.log("📧 Order Confirmation Email:");
      console.log(`To: ${recipientEmail}`);
      console.log(`Subject: Order Confirmation - ${order.id}`);
      console.log("---");
      console.log(emailContent);
      console.log("---\n");
      return true;
    }

    const resend = new Resend(resendApiKey);
    const response = await resend.emails.send({
      from: emailFrom,
      to: recipientEmail,
      subject: `Order Confirmation - ${order.id}`,
      text: emailContent,
      html: buildOrderEmailHtml(recipientName || "Customer", order),
    });

    if (response.error) {
      console.error("Resend email send failed:", response.error);
      return false;
    }

    return Boolean(response.data?.id);
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
}
