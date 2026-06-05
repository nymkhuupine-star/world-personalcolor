const BONUM_API        = (process.env.BONUM_API        ?? '').trim();
const BONUM_TERMINAL   = (process.env.BONUM_TERMINAL_ID ?? '').trim();
const BONUM_APP_SECRET = (process.env.BONUM_APP_SECRET  ?? '').trim();

const CALLBACK_BASE = 'https://www.personalcolor.mn/payment/success';

async function getToken(): Promise<string> {
  const res = await fetch(`${BONUM_API}/bonum-gateway/ecommerce/auth/create`, {
    method: 'POST',
    headers: {
      Authorization:   `AppSecret ${BONUM_APP_SECRET}`,
      'X-TERMINAL-ID': BONUM_TERMINAL,
      'Content-Type':  'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Bonum auth error ${res.status}: ${text}`);
  }

  const raw  = await res.json() as Record<string, unknown>;
  // Bonum may nest the token under a "data" key
  const data   = (raw.data as Record<string, unknown> | undefined) ?? raw;

  const token =
    (data.token        as string | undefined) ??
    (data.accessToken  as string | undefined) ??
    (data.access_token as string | undefined) ??
    (raw.token         as string | undefined) ??
    (raw.accessToken   as string | undefined) ??
    (raw.access_token  as string | undefined);

  if (!token)
    throw new Error(`Bonum auth: token missing. Response: ${JSON.stringify(raw)}`);

  return token;
}

export type BonumInvoice = {
  invoiceId:    string;
  followUpLink: string;
};

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

  const raw  = await res.json() as Record<string, unknown>;
  const data = (raw.data as Record<string, unknown> | undefined) ?? raw;

  const invoiceId =
    (data.invoiceId    as string | undefined) ??
    (data.invoice_id   as string | undefined) ??
    (raw.invoiceId     as string | undefined) ??
    (raw.invoice_id    as string | undefined);

  const followUpLink =
    (data.followUpLink  as string | undefined) ??
    (data.follow_up_link as string | undefined) ??
    (data.paymentUrl    as string | undefined) ??
    (data.payment_url   as string | undefined) ??
    (raw.followUpLink   as string | undefined) ??
    (raw.follow_up_link as string | undefined) ??
    (raw.paymentUrl     as string | undefined);

  if (!invoiceId || !followUpLink)
    throw new Error(`Bonum invoice: missing fields. Response: ${JSON.stringify(raw)}`);

  return { invoiceId, followUpLink };
}

export type BonumInvoiceStatus = {
  paid:      boolean;
  status:    string;
  invoiceId: string;
};

export async function getBonumInvoiceStatus(invoiceId: string): Promise<BonumInvoiceStatus> {
  const token = await getToken();

  const res = await fetch(
    `${BONUM_API}/bonum-gateway/ecommerce/invoices/${encodeURIComponent(invoiceId)}`,
    {
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
  // Bonum may return {"status":"PAID"} or {"data":{"status":"PAID"}}
  const data = (raw.data as Record<string, unknown> | undefined) ?? raw;

  const statusStr = String(
    (data.status as string | undefined) ??
    (raw.status  as string | undefined) ??
    '',
  ).toUpperCase();

  const paid =
    statusStr === 'PAID' ||
    statusStr === 'SUCCESS' ||
    statusStr === 'COMPLETED' ||
    statusStr === 'APPROVED' ||
    data.paid === true ||
    raw.paid  === true;

  console.log('getBonumInvoiceStatus | invoiceId:', invoiceId, '| status:', statusStr, '| paid:', paid);

  return { paid, status: statusStr, invoiceId };
}
