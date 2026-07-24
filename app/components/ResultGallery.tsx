'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import supabase from '@/utils/supabase';
import { resolveFullSeasonName } from '@/utils/reportPdfs';

interface Props {
  /** Full 12-season name, e.g. "Light Spring" — exactly what AnalysisResult shows the user. */
  seasonName: string;
}

/**
 * Shows the admin-uploaded gallery images for the user's resolved season,
 * right under their result. Silently renders nothing if the season name
 * doesn't resolve or no images have been uploaded for it yet — this is a
 * bonus visual, not a required part of the result.
 */
export default function ResultGallery({ seasonName }: Props) {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    const resolved = resolveFullSeasonName(seasonName);
    if (!resolved) return;

    (async () => {
      const { data } = await supabase.storage
        .from('reports')
        .list(`${resolved.season}/${resolved.subtype}/gallery`);
      if (cancelled || !data) return;
      const imageUrls = data
        .filter((f) => f.name !== '.emptyFolderPlaceholder')
        .map((f) => supabase.storage
          .from('reports')
          .getPublicUrl(`${resolved.season}/${resolved.subtype}/gallery/${f.name}`).data.publicUrl);
      setUrls(imageUrls);
    })();

    return () => { cancelled = true; };
  }, [seasonName]);

  if (urls.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="grid grid-cols-3 gap-2"
    >
      {urls.map((url) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={url}
          src={url}
          alt={seasonName}
          className="aspect-square w-full rounded-xl border border-violet-100 object-cover"
        />
      ))}
    </motion.div>
  );
}
