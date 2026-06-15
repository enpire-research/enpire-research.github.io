"use client";

import { Code2, X } from "lucide-react";
import { useState } from "react";
import { highlightPythonLine } from "@/lib/pythonHighlight";
import type { ResetCode } from "@/data/resetCode";

// A <> toggle button + floating code window for a reset routine, mirroring the
// zip-tie reward panel's HCI: the button lives in the reset controls row, and
// clicking it reveals the pusht-code-float dialog (titlebar + meta + code).
export default function ResetCodePopover({ filename, code, label, caseLabel, method }: ResetCode) {
  const [isCodeOpen, setIsCodeOpen] = useState(false);
  const lines = code.split("\n");

  return (
    <>
      <button
        aria-label="View the reset routine code"
        aria-pressed={isCodeOpen}
        className="pusht-code-toggle pusht-reset-case__code-toggle"
        data-open={isCodeOpen}
        onClick={() => setIsCodeOpen((open) => !open)}
        type="button"
      >
        <Code2 size={15} strokeWidth={1.8} />
      </button>
      {isCodeOpen ? (
        <div className="pusht-code-float" role="dialog" aria-label={`${filename} source`}>
          <div className="pusht-code-window">
            <div className="pusht-code-titlebar">
              <div className="pusht-code-tab">
                <Code2 size={13} strokeWidth={1.8} />
                <span>{filename}</span>
              </div>
              <button
                aria-label="Close reset code"
                className="pusht-icon pusht-icon--compact"
                onClick={() => setIsCodeOpen(false)}
                type="button"
              >
                <X size={15} strokeWidth={1.8} />
              </button>
            </div>
            <div className="pusht-code-meta">
              <strong>{label}</strong>
              <span>{caseLabel}</span>
              <span>{method}</span>
            </div>
            <div className="pusht-code-block">
              <code>
                {lines.map((line, index) => (
                  <span className="pusht-code-line" key={`reset-code-${index}`}>
                    <span className="pusht-code-line-number">{index + 1}</span>
                    <span className="pusht-code-line-text">{highlightPythonLine(line)}</span>
                  </span>
                ))}
              </code>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
