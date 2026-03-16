"use client";

import React from "react";
import type { Source } from "@/types";

const C = { primary: "#00D4AA" };

interface CitedTextProps {
  text: string;
  sources: Source[];
  style?: React.CSSProperties;
}

export function CitedText({ text, sources, style }: CitedTextProps) {
  const parts: React.ReactNode[] = [];
  const regex = /\[(\d+(?:\s*[,\s]\s*\d+)*)\]/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(text.substring(lastIdx, match.index));

    const refs = match[1]
      .split(/[,\s]+/)
      .map((n) => parseInt(n.trim()))
      .filter((n) => !isNaN(n));

    refs.forEach((ref, ri) => {
      const src = sources[ref - 1];
      parts.push(
        <span
          key={`ref-${match!.index}-${ri}`}
          onClick={src?.url ? () => window.open(src.url!, "_blank") : undefined}
          title={src ? `${src.title} (${src.authors}, ${src.year})` : `Source ${ref}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 18,
            height: 18,
            padding: "0 5px",
            borderRadius: 9,
            background: `${C.primary}18`,
            color: C.primary,
            fontSize: 10,
            fontWeight: 700,
            cursor: src?.url ? "pointer" : "default",
            marginLeft: ri === 0 ? 2 : 1,
            marginRight: ri === refs.length - 1 ? 2 : 1,
            verticalAlign: "middle",
            lineHeight: 1,
          }}
        >
          {ref}
        </span>
      );
    });

    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) parts.push(text.substring(lastIdx));

  return <span style={style}>{parts}</span>;
}
