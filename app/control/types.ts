export type Section = 'overview' | 'registrations' | 'payments' | 'pdfs';

export type Analysis = {
  id: string;
  email: string;
  image_path: string;
  season: string;
  sub_type: string;
  email_sent: boolean;
  paid: boolean;
  created_at: string;
};

export type Order = {
  id: string;
  email: string;
  invoice_id: string | null;
  transaction_id: string | null;
  amount: number;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
  // Only seasonName is fetched — not the full JSON blob
  analysis_result: { seasonName: string } | null;
  admin_confirmed: boolean | null;
};

export type PdfStatuses = Record<string, boolean>;
