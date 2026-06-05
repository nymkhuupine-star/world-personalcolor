// Bonum PSP — https://merchant.bonum.mn
// Auth: GET /bonum-gateway/ecommerce/auth/create
// Token expires in 1800s (30 min). Docs say: re-fetch at most once per 25 min.

const BONUM_API        = (process.env.BONUM_API        ?? '').trim();
const BONUM_TERMINAL   = (process.env.BONUM_TERMINAL_ID ?? '').trim();
const BONUM_APP_SECRET = (process.env.BONUM_APP_SECRET  ?? '').trim();

const CALLBACK_BASE = 'https://www.personalcolor.mn/payment/success';

// Module-level cache — survives across warm serverless invocations on the same instance.
// Prevents hitting Bonum's rate limit (max 1 token request per ~25 min).
let _cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  // Return cached token if still valid with a 5-minute safety buffer
  if (_cachedToken && Date.now() < _cachedToken.expiresAt - 5 * 60 * 1000) {
    return _cachedToken.value;
  }

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

    // 429: rate limited — fall back to the stale cached token if available
    if (res.status === 429 && _cachedToken) {
      console.warn('Bonum auth rate-limited (429) — using stale cached token');
      return _cachedToken.value;
    }

    throw new Error(`Bonum auth error ${res.status}: ${text}`);
  }

  const data = await res.json() as Record<string, unknown>;

  // Docs response: { accessToken, tokenType, expiresIn, refreshToken, ... }
  const token =
    (data.accessToken  as string | undefined) ??
    (data.access_token as string | undefined) ??
    (data.token        as string | undefined);

  if (!token)
    throw new Error(`Bonum auth: accessToken missing. Response: ${JSON.stringify(data)}`);

  // Cache for 25 minutes (token valid for 30 min per docs)
  _cachedToken = { value: token, expiresAt: Date.now() + 25 * 60 * 1000 };

  return token;
}

export type BonumInvoice = {
  invoiceId:    string;
  followUpLink: string;
};

// POST /bonum-gateway/ecommerce/invoices
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
    // 401 may mean token is stale — clear cache so next call re-authenticates
    if (res.status === 401) _cachedToken = null;
    throw new Error(`Bonum invoice error ${res.status}: ${text}`);
  }

  const data = await res.json() as Record<string, unknown>;

  // Docs: { invoiceId, followUpLink } at root
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
// Note: Bonum docs mark this endpoint as test-only. Used only as a short-window fallback.
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
    if (res.status === 401) _cachedToken = null;
    throw new Error(`Bonum invoice status error ${res.status}: ${text}`);
  }

  const raw  = await res.json() as Record<string, unknown>;
  const body = (raw.data as Record<string, unknown> | undefined) ?? raw;

  const statusStr = String(
    (body.status as string | undefined) ??
    (raw.status  as string | undefined) ??
    '',
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
