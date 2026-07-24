export type Section = 'overview' | 'registrations' | 'payments' | 'gallery' | 'pdfs';

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
  analysis_result: { seasonName: string } | null;
  admin_confirmed: boolean | null;
  email_sent_at: string | null;
  pdf_downloaded_at: string | null;
};

export type PdfStatuses = Record<string, boolean>;

/** reportId → image file extension currently stored ("jpg"/"png"/"webp"), or null if none. */
export type ImageStatuses = Record<string, string | null>;

export type GalleryImage = { name: string; url: string };

/** reportId → the season's uploaded gallery images (unbounded count, unlike the single ImageStatuses slot). */
export type GalleryStatuses = Record<string, GalleryImage[]>;
