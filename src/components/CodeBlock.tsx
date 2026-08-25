import React, { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = "plaintext" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  // Simple token highlighter for code
  const renderHighlightedCode = (raw: string, lang: string) => {
    const lines = raw.split("\n");
    return lines.map((line, lineIdx) => {
      // Basic token recognition
      const words = line.split(/(\b|[{}\[\](),;.<>+\-*\/=:'"`\s])/g);
      return (
        <div key={lineIdx} className="table-row">
          <span className="table-cell pr-4 text-right select-none text-slate-600 text-[11px] font-mono-code">
            {lineIdx + 1}
          </span>
          <span className="table-cell whitespace-pre">
            {words.map((token, tokenIdx) => {
              if (/^(import|export|from|const|let|var|function|return|if|else|switch|case|break|class|interface|type|extends|implements|async|await|try|catch|new|for|while|default|public|private|static)$/.test(token)) {
                return (
                  <span key={tokenIdx} className="code-token-keyword">
                    {token}
                  </span>
                );
              }
              if (/^(['"`].*?['"`])$/.test(token)) {
                return (
                  <span key={tokenIdx} className="code-token-string">
                    {token}
                  </span>
                );
              }
              if (/^(string|number|boolean|any|void|null|undefined|Promise|Record|Array|object|true|false)$/.test(token)) {
                return (
                  <span key={tokenIdx} className="code-token-type">
                    {token}
                  </span>
                );
              }
              if (/^\d+(\.\d+)?$/.test(token)) {
                return (
                  <span key={tokenIdx} className="code-token-number">
                    {token}
                  </span>
                );
              }
              if (token.startsWith("//") || token.startsWith("/*") || token.startsWith("#")) {
                return (
                  <span key={tokenIdx} className="code-token-comment">
                    {token}
                  </span>
                );
              }
              return token;
            })}
          </span>
        </div>
      );
    });
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-sky-400/20 bg-[#080d1a] shadow-[0_4px_20px_rgba(0,0,0,0.4)] group">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950/80 border-b border-white/5 text-xs text-slate-400 font-mono-code select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-sky-300 font-medium lowercase">{language || "code"}</span>
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono-code transition-all duration-200 cursor-pointer ${
            copied
              ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
              : "hover:bg-slate-800 text-slate-300 border border-transparent hover:border-slate-700"
          }`}
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-4 overflow-x-auto custom-scrollbar font-mono-code text-xs text-slate-200 leading-relaxed">
        <div className="table w-full">
          {renderHighlightedCode(code, language)}
        </div>
      </div>
    </div>
  );
};
