import React from "react";
import { CodeBlock } from "./CodeBlock";

interface FormattedContentProps {
  content: string;
  isStreaming?: boolean;
}

export const FormattedContent: React.FC<FormattedContentProps> = ({
  content,
  isStreaming = false,
}) => {
  // Parse code blocks with regex
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore) {
      parts.push(renderTextMarkdown(textBefore, `text-${lastIndex}`));
    }

    const language = match[1] || "typescript";
    const code = match[2].trimEnd();
    parts.push(<CodeBlock key={`code-${match.index}`} code={code} language={language} />);

    lastIndex = match.index + match[0].length;
  }

  const textRemaining = content.substring(lastIndex);
  if (textRemaining) {
    parts.push(renderTextMarkdown(textRemaining, `text-${lastIndex}`));
  }

  return (
    <div className="space-y-3 font-body text-slate-100 text-sm leading-relaxed">
      {parts}
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-sky-400 animate-pulse rounded-sm align-middle shadow-[0_0_8px_#38bdf8]" />
      )}
    </div>
  );
};

function renderTextMarkdown(text: string, keyPrefix: string) {
  const paragraphs = text.split(/\n\n+/);

  return (
    <div key={keyPrefix} className="space-y-3">
      {paragraphs.map((para, pIdx) => {
        if (!para.trim()) return null;

        // Check for Markdown headers
        if (para.startsWith("### ")) {
          return (
            <h3 key={pIdx} className="font-headline text-base font-semibold text-sky-200 mt-4 mb-2">
              {formatInlineText(para.replace("### ", ""))}
            </h3>
          );
        }
        if (para.startsWith("## ")) {
          return (
            <h2 key={pIdx} className="font-headline text-lg font-bold text-white mt-5 mb-2 border-b border-white/10 pb-1">
              {formatInlineText(para.replace("## ", ""))}
            </h2>
          );
        }
        if (para.startsWith("# ")) {
          return (
            <h1 key={pIdx} className="font-headline text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-200 to-sky-400 mt-6 mb-3">
              {formatInlineText(para.replace("# ", ""))}
            </h1>
          );
        }

        // Check for list items
        if (para.includes("\n* ") || para.includes("\n- ") || para.startsWith("* ") || para.startsWith("- ")) {
          const lines = para.split("\n");
          return (
            <ul key={pIdx} className="space-y-1.5 list-disc list-inside text-slate-200 pl-1 my-2">
              {lines.map((line, lIdx) => {
                const cleaned = line.replace(/^[\*\-]\s+/, "");
                return (
                  <li key={lIdx} className="leading-relaxed">
                    {formatInlineText(cleaned)}
                  </li>
                );
              })}
            </ul>
          );
        }

        // Check for numbered list
        if (/^\d+\.\s+/.test(para)) {
          const lines = para.split("\n");
          return (
            <ol key={pIdx} className="space-y-1.5 list-decimal list-inside text-slate-200 pl-1 my-2">
              {lines.map((line, lIdx) => {
                const cleaned = line.replace(/^\d+\.\s+/, "");
                return (
                  <li key={lIdx} className="leading-relaxed">
                    {formatInlineText(cleaned)}
                  </li>
                );
              })}
            </ol>
          );
        }

        // Check for blockquote
        if (para.startsWith("> ")) {
          return (
            <blockquote key={pIdx} className="border-l-2 border-sky-400/60 bg-sky-950/20 pl-4 py-2 my-2 rounded-r-lg text-slate-300 italic text-xs">
              {formatInlineText(para.replace(/^>\s+/, ""))}
            </blockquote>
          );
        }

        return (
          <p key={pIdx} className="leading-relaxed">
            {formatInlineText(para)}
          </p>
        );
      })}
    </div>
  );
}

function formatInlineText(text: string): React.ReactNode {
  // Format bold **text**, inline `code`, italic *text*
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);

  return tokens.map((token, idx) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return (
        <strong key={idx} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith("`") && token.endsWith("`")) {
      return (
        <code key={idx} className="font-mono-code text-xs px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-500/30">
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith("*") && token.endsWith("*")) {
      return (
        <em key={idx} className="italic text-slate-300">
          {token.slice(1, -1)}
        </em>
      );
    }
    return token;
  });
}
