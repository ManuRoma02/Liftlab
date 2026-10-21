/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface OtaNotesViewProps {
  notes?: string;
  className?: string;
}

/**
 * Renders concise OTA update logs with highlighted bold keywords.
 * Parses markdown bold (**word**) and HTML bold (<b>word</b>).
 */
export function OtaNotesView({ notes, className = "" }: OtaNotesViewProps) {
  if (!notes || !notes.trim()) return null;

  const lines = notes
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return (
    <div className={`flex flex-col gap-1 text-[11px] leading-relaxed ${className}`}>
      {lines.map((line, lineIdx) => {
        // Split by **text** or <b>text</b>
        const parts = line.split(/(\*\*.*?\*\*|<b>.*?<\/b>)/g);
        return (
          <div key={lineIdx} className="flex items-start gap-1.5">
            <span className="text-[#30D158] shrink-0 select-none">•</span>
            <div className="flex-1 text-[#8E8E93]">
              {parts.map((part, partIdx) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return (
                    <strong key={partIdx} className="font-bold text-white tracking-tight">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                if (part.startsWith("<b>") && part.endsWith("</b>")) {
                  return (
                    <strong key={partIdx} className="font-bold text-white tracking-tight">
                      {part.slice(3, -4)}
                    </strong>
                  );
                }
                // Strip leading bullet if already typed by user
                const cleaned = part.replace(/^[•\-\*]\s*/, "");
                return <span key={partIdx}>{cleaned}</span>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
