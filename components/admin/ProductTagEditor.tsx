"use client";

import { useState } from "react";
import type { Keyword } from "@/lib/keywords";

export default function ProductTagEditor({
  productKeywordIds,
  allKeywords,
  onChange,
}: {
  productKeywordIds: string[];
  allKeywords: Keyword[];
  onChange: (keywordIds: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);

  const assigned = allKeywords.filter((k) => productKeywordIds.includes(k.id));
  const available = allKeywords.filter((k) => !productKeywordIds.includes(k.id));

  async function addKeyword(id: string) {
    if (!id) return;
    setBusy(true);
    await onChange([...productKeywordIds, id]);
    setBusy(false);
  }

  async function removeKeyword(id: string) {
    setBusy(true);
    await onChange(productKeywordIds.filter((k) => k !== id));
    setBusy(false);
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {assigned.map((keyword) => (
        <button
          key={keyword.id}
          onClick={() => removeKeyword(keyword.id)}
          disabled={busy}
          className="border border-ink/20 px-2 py-1 font-sans text-[10px] uppercase tracking-widest text-ink/60 hover:border-ink/40 hover:text-ink disabled:opacity-40"
        >
          {keyword.label} ×
        </button>
      ))}
      {available.length > 0 ? (
        <select
          value=""
          disabled={busy}
          onChange={(e) => addKeyword(e.target.value)}
          className="border-0 border-b border-ink/20 bg-transparent font-sans text-[10px] uppercase tracking-widest text-ink/40 outline-none focus:border-ink"
        >
          <option value="">+ mot-clé</option>
          {available.map((keyword) => (
            <option key={keyword.id} value={keyword.id}>
              {keyword.label}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
