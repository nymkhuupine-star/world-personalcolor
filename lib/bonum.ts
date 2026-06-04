const BONUM_API        = process.env.BONUM_API!;
const BONUM_TERMINAL   = process.env.BONUM_TERMINAL_ID!;
const BONUM_APP_SECRET = process.env.BONUM_APP_SECRET!;

const CALLBACK_URL = 'https://www.personalcolor.mn/payment/success';

async function getToken(): Promise<string> {
  const res = await fetch(`${BONUM_API}/bonum-gateway/ecommerce/auth/create`, {
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
  const nested = data.data as Record<string, unknown> | undefined;

  const token =
    (data.token        as string | undefined) ??
    (data.accessToken  as string | undefined) ??
    (nested?.token     as string | undefined) ??
    (nested?.accessToken as string | undefined);

  if (!token)
    throw new Error(`Bonum auth: token missing. Response: ${JSON.stringify(data)}`);

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
      callback:      CALLBACK_URL,
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
  const invoiceId    = data.invoiceId    as string | undefined;
  const followUpLink = data.followUpLink as string | undefined;

  if (!invoiceId || !followUpLink)
    throw new Error(`Bonum invoice: missing invoiceId or followUpLink. Response: ${JSON.stringify(data)}`);

  return { invoiceId, followUpLink };
}
