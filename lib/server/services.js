import Stripe from 'stripe';

export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not configured.');
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function sendEmail({ to, subject, html, text, idempotencyKey }) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    throw new Error('RESEND_API_KEY and EMAIL_FROM must be configured.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [to],
      subject,
      html,
      text
    })
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Email delivery failed (${response.status}): ${detail}`);
  }
}
