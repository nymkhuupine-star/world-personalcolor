/**
 * Call from any client component to kick off a Bonum payment.
 * Redirects the user to the Bonum/QPay payment page on success.
 *
 * Example:
 *   await startPayment({ email: 'user@example.com', analysisResult: result, amount: 8900 });
 */
export async function startPayment(params: {
  email:          string;
  analysisResult: unknown;
  amount:         number;
}): Promise<void> {
  const res = await fetch('/api/payment/create', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(params),
  });

  const data = await res.json().catch(() => null) as { followUpLink?: string; error?: string } | null;

  if (!res.ok) {
    throw new Error(data?.error ?? 'Төлбөр үүсгэхэд алдаа гарлаа.');
  }

  if (!data?.followUpLink) {
    throw new Error('Төлбөрийн холбоос ирсэнгүй.');
  }

  window.location.href = data.followUpLink;
}
