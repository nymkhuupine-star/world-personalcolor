// Bonum PSP — https://merchant.bonum.mn
// Docs: auth GET, invoice POST, webhook body.invoiceId / body.transactionId

const BONUM_API        = (process.env.BONUM_API        ?? '').trim();
const BONUM_TERMINAL   = (process.env.BONUM_TERMINAL_ID ?? '').trim();
const BONUM_APP_SECRET = (process.env.BONUM_APP_SECRET  ?? '').trim();

const CALLBACK_BASE = 'https://www.personalcolor.mn/payment/success';

// GET /bonum-gateway/ecommerce/auth/create
// Returns: { accessToken, tokenType, expiresIn, refreshToken, ... }
async function getToken(): Promise<string> {
  const res = await fetch(`${BONUM_API}/bonum-gateway/ecommerce/auth/create`, {
    method: 'GET',
    headers: {
      Authorization:   `AppSecret ${BONUM_APP_SECRET}`,
      'X-TERMINAL-ID': BONUM_TERMINAL,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Bonum auth error ${res.status}: ${text}`);
  }

  const data = await res.json() as Record<string, unknown>;

  // Docs: accessToken at root level
  const token =
    (data.accessToken  as string | undefined) ??
    (data.access_token as string | undefined) ??
    (data.token        as string | undefined);

  if (!token)
    throw new Error(`Bonum auth: accessToken missing. Response: ${JSON.stringify(data)}`);

  return token;
}

export type BonumInvoice = {
  invoiceId:    string;
  followUpLink: string;
};

// POST /bonum-gateway/ecommerce/invoices
// Returns: { invoiceId, followUpLink } at root
export async function createBonumInvoice(
  transactionId: string,
  amount: number,
): Promise<BonumInvoice> {
  const token = await getToken();

  const res = await fetch(`${BONUM_API}/bonum-gateway/ecommerce/invoices`, {
    method: 'POST',
    headers: {
      Authorization:     `Bearer ${token}`,
      'X-TERMINAL-ID':   BONUM_TERMINAL,
      'Content-Type':    'application/json',
      'Accept-Language': 'mn',
    },
    body: JSON.stringify({
      amount,
      callback:      `${CALLBACK_BASE}?orderId=${transactionId}`,
      transactionId,
      expiresIn:     3600,
      providers:     ['QPAY'],
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Bonum invoice error ${res.status}: ${text}`);
  }

  const data = await res.json() as Record<string, unknown>;

  // Docs: invoiceId and followUpLink at root
  const invoiceId    = data.invoiceId    as string | undefined;
  const followUpLink = data.followUpLink as string | undefined;

  if (!invoiceId || !followUpLink)
    throw new Error(`Bonum invoice: missing fields. Response: ${JSON.stringify(data)}`);

  return { invoiceId, followUpLink };
}

export type BonumInvoiceStatus = {
  paid:      boolean;
  status:    string;
  invoiceId: string;
};

// GET /bonum-gateway/ecommerce/invoices/{invoiceId}
// NOTE: Bonum docs mark this as test-only. In production the webhook is the
// reliable source of truth. This is used only as a short-window fallback.
export async function getBonumInvoiceStatus(invoiceId: string): Promise<BonumInvoiceStatus> {
  const token = await getToken();

  const res = await fetch(
    `${BONUM_API}/bonum-gateway/ecommerce/invoices/${encodeURIComponent(invoiceId)}`,
    {
      method: 'GET',
      headers: {
        Authorization:   `Bearer ${token}`,
        'X-TERMINAL-ID': BONUM_TERMINAL,
      },
      cache: 'no-store',
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Bonum invoice status error ${res.status}: ${text}`);
  }

  const raw  = await res.json() as Record<string, unknown>;
  // Handle both flat and nested { data: { status } } shapes
  const body = (raw.data as Record<string, unknown> | undefined) ?? raw;

  const statusStr = String(
    (body.status as string | undefined) ?? (raw.status as string | undefined) ?? '',
  ).toUpperCase();

  const paid =
    statusStr === 'PAID'      ||
    statusStr === 'SUCCESS'   ||
    statusStr === 'COMPLETED' ||
    statusStr === 'APPROVED'  ||
    body.paid === true        ||
    raw.paid  === true;

  return { paid, status: statusStr, invoiceId };
}
