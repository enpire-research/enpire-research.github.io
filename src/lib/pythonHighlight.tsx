import type { ReactNode } from "react";

// Lightweight Python tokenizer shared by the code popovers (PushT policy
// panel, zip-tie reward panel). Token classes map to `pusht-code-token--*`
// styles in globals.css.
const pythonTokenPattern =
  /("""[^"]*"""|'''[^']*'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[^\n]*|@[A-Za-z_]\w*|\b(?:and|as|assert|break|class|continue|dataclass|def|elif|else|except|False|finally|for|from|if|import|in|is|lambda|None|not|or|pass|return|self|True|try|while|with|yield)\b|\b\d+(?:\.\d+)?\b)/g;

function pythonTokenClass(token: string) {
  if (token.startsWith("#")) return "comment";
  if (token.startsWith("\"") || token.startsWith("'")) return "string";
  if (token.startsWith("@")) return "decorator";
  if (/^\d/.test(token)) return "number";
  return "keyword";
}

export function highlightPythonLine(line: string) {
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of line.matchAll(pythonTokenPattern)) {
    const token = match[0];
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push(line.slice(lastIndex, index));
    }
    parts.push(
      <span className={`pusht-code-token pusht-code-token--${pythonTokenClass(token)}`} key={`${index}-${token}`}>
        {token}
      </span>,
    );
    lastIndex = index + token.length;
  }

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return parts.length > 0 ? parts : " ";
}
