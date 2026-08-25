import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Paperclip, Square, X, Sparkles } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (text: string, attachment?: { data: string; mimeType: string; previewUrl?: string }) => void;
  isGenerating: boolean;
  onStopGenerating: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isGenerating,
  onStopGenerating,
}) => {
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<{
    data: string;
    mimeType: string;
    previewUrl: string;
    name: string;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const nextHeight = Math.min(textareaRef.current.scrollHeight, 180);
      textareaRef.current.style.height = `${nextHeight}px`;
    }
  };

  useEffect(() => {
    autoResize();
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (isGenerating) {
      onStopGenerating();
      return;
    }

    const trimmed = input.trim();
    if (!trimmed && !attachment) return;

    onSendMessage(trimmed || (attachment ? "Analyze this attached file." : ""), attachment || undefined);
    setInput("");
    setAttachment(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(",")[1];
      setAttachment({
        data: base64Data,
        mimeType: file.type || "image/png",
        previewUrl: result,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
    // Reset file input value
    e.target.value = "";
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-[#05070f] via-[#05070f]/90 to-transparent pt-10 z-30 pointer-events-auto">
      <div className="max-w-4xl mx-auto relative group">
        {/* Ambient neon backdrop glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/20 via-cyan-400/20 to-indigo-500/20 rounded-2xl blur-lg opacity-40 group-focus-within:opacity-75 transition-opacity duration-500 pointer-events-none" />

        {/* Attachment preview if selected */}
        {attachment && (
          <div className="mb-2 flex items-center gap-2 p-2 bg-slate-900/90 border border-sky-400/30 rounded-xl backdrop-blur-md w-fit animate-in fade-in slide-in-from-bottom-2">
            <img
              src={attachment.previewUrl}
              alt="attachment"
              className="w-10 h-10 object-cover rounded-lg border border-white/10"
            />
            <span className="text-xs text-slate-200 max-w-[180px] truncate font-mono-code">
              {attachment.name}
            </span>
            <button
              onClick={() => setAttachment(null)}
              className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input container */}
        <div className="relative flex items-end bg-[#0f172a]/90 backdrop-blur-2xl rounded-2xl border border-sky-400/25 focus-within:border-sky-400/70 focus-within:shadow-[0_0_30px_rgba(14,165,233,0.3)] shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-300 p-2">
          {/* File Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.pdf,.txt,.json,.js,.ts,.py"
            className="hidden"
          />
          <button
            id="chat-attach-btn"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-sky-300 hover:bg-white/5 rounded-xl transition-all duration-200 h-12 flex items-center justify-center shrink-0 cursor-pointer"
            title="Attach image or file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Textarea */}
          <textarea
            id="chat-message-textarea"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Light AI..."
            rows={1}
            className="w-full bg-transparent border-none text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-0 resize-none font-body text-sm py-3 px-2 min-h-[48px] max-h-[180px] custom-scrollbar"
          />

          {/* Send / Stop button */}
          <button
            id="chat-send-btn"
            type="button"
            onClick={handleSend}
            disabled={!isGenerating && !input.trim() && !attachment}
            className={`w-10 h-10 m-1 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 active:scale-90 cursor-pointer ${
              isGenerating
                ? "bg-rose-500/80 text-white hover:bg-rose-600 shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                : !input.trim() && !attachment
                ? "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50"
                : "bg-gradient-to-tr from-sky-500 to-cyan-400 text-slate-950 hover:brightness-110 shadow-[0_0_20px_rgba(14,165,233,0.45)] hover:shadow-[0_0_30px_rgba(14,165,233,0.7)]"
            }`}
            title={isGenerating ? "Stop generating" : "Send message"}
          >
            {isGenerating ? (
              <Square className="w-4 h-4 fill-current animate-pulse" />
            ) : (
              <ArrowUp className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>
        </div>

        {/* Disclaimer subtext */}
        <div className="text-center mt-2.5">
          <p className="text-[11px] font-mono-code text-slate-500">
            Light AI can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
};
