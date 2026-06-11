// Bonum PSP — https://merchant.bonum.mn
// Auth: GET /bonum-gateway/ecommerce/auth/create
// Token expires 1800s (30 min). Bonum rate-limits to ~1 request per 300s.
//
// Token caching strategy (two layers):
//   1. Module-level memory  — survives warm serverless invocations (fast, free)
//   2. Supabase app_config  — survives cold starts & shared across all instances

import { createClient } from '@supabase/supabase-js';

const BONUM_API        = (process.env.BONUM_API        ?? '').trim();
const BONUM_TERMINAL   = (process.env.BONUM_TERMINAL_ID ?? '').trim();
const BONUM_APP_SECRET = (process.env.BONUM_APP_SECRET  ?? '').trim();

const CALLBACK_BASE   = 'https://www.personalcolor.mn/payment/success';
const DB_TOKEN_KEY    = 'bonum_access_token';
const TOKEN_TTL_MS    = 25 * 60 * 1000; // 25 min (token valid 30 min per docs)

// Layer 1 — module-level memory cache
let _mem: { value: string; expiresAt: number } | null = null;

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/** Try to read a fresh-enough token from the DB (shared across all instances). */
async function dbGetToken(): Promise<string | null> {
  try {
    const { data } = await adminClient()
      .from('app_config')
      .select('value, updated_at')
      .eq('key', DB_TOKEN_KEY)
      .single();

    if (!data?.value || !data.updated_at) return null;
    const age = Date.now() - new Date(data.updated_at).getTime();
    return age < TOKEN_TTL_MS ? data.value : null;
  } catch {
    return null;
  }
}

/** Persist a fresh token to the DB so other instances can reuse it. */
async function dbSaveToken(token: string): Promise<void> {
  try {
    await adminClient()
      .from('app_config')
      .upsert({ key: DB_TOKEN_KEY, value: token, updated_at: new Date().toISOString() });
  } catch (err) {
    console.error('bonum: failed to save token to DB:', err);
  }
}

async function getToken(): Promise<string> {
  // Layer 1: memory cache (fastest — no network/DB)
  if (_mem && Date.now() < _mem.expiresAt - 5 * 60 * 1000) {
    return _mem.value;
  }

  // Layer 2: DB cache (survives cold starts)
  const dbToken = await dbGetToken();
  if (dbToken) {
    _mem = { value: dbToken, expiresAt: Date.now() + TOKEN_TTL_MS };
    return dbToken;
  }

  // Layer 3: fetch a fresh token from Bonum
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

    // 429 rate-limited: another instance may have just saved a fresh token — retry DB once
    if (res.status === 429) {
      const retryToken = await dbGetToken();
      if (retryToken) {
        console.warn('bonum: 429 — reusing DB token saved by another instance');
        _mem = { value: retryToken, expiresAt: Date.now() + TOKEN_TTL_MS };
        return retryToken;
      }
      // Absolute last resort: stale memory token
      if (_mem) {
        console.warn('bonum: 429 — using stale memory token (last resort)');
        return _mem.value;
      }
    }

    throw new Error(`Bonum auth error ${res.status}: ${text}`);
  }

  const data  = await res.json() as Record<string, unknown>;
  const token =
    (data.accessToken  as string | undefined) ??
    (data.access_token as string | undefined) ??
    (data.token        as string | undefined);

  if (!token)
    throw new Error(`Bonum auth: accessToken missing. Response: ${JSON.stringify(data)}`);

  // Save to both caches
  _mem = { value: token, expiresAt: Date.now() + TOKEN_TTL_MS };
  void dbSaveToken(token); // fire-and-forget (non-blocking)

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
    // 401 means token is invalid — clear caches so next call re-authenticates
    if (res.status === 401) {
      _mem = null;
      await adminClient().from('app_config').delete().eq('key', DB_TOKEN_KEY).then(() => {}, () => {});
    }
    throw new Error(`Bonum invoice error ${res.status}: ${text}`);
  }

  const data = await res.json() as Record<string, unknown>;

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
// Docs note this as test-only; used as a fallback in /api/payment/verify.
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
    if (res.status === 401) {
      _mem = null;
      await adminClient().from('app_config').delete().eq('key', DB_TOKEN_KEY).then(() => {}, () => {});
    }
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
