import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

// .env.local-г гараар уншина
try {
  const env = readFileSync('.env.local', 'utf8');
  for (const line of env.split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  }
} catch { /* ignore */ }

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const BUCKET = 'reports';
const REPORTS_DIR = join(fileURLToPath(import.meta.url), '../../public/reports');

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name.endsWith('.pdf')) yield full;
  }
}

function isValidPdf(buffer) {
  return buffer.slice(0, 5).toString('ascii') === '%PDF-';
}

async function main() {
  console.log('📤 Supabase Storage руу PDF оруулж байна...\n');

  for await (const filePath of walk(REPORTS_DIR)) {
    const rel = relative(REPORTS_DIR, filePath).replace(/\\/g, '/');
    const buffer = await readFile(filePath);

    if (!isValidPdf(buffer)) {
      console.log(`⚠️  Алгасав (гэмтсэн файл): ${rel}`);
      continue;
    }

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(rel, buffer, { contentType: 'application/pdf', upsert: true });

    if (error) {
      console.error(`❌ Алдаа: ${rel} — ${error.message}`);
    } else {
      console.log(`✅ Оруулав: ${rel}`);
    }
  }

  console.log('\nДуусав!');
}

main().catch(console.error);
