import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Plus,
  Search,
  MessageSquare,
  Share2,
  Trash2,
  Edit2,
  Check,
  ChevronRight,
  Settings,
  LogOut,
  LogIn,
  User as UserIcon,
  PanelLeftClose,
  PanelLeft,
  X,
} from "lucide-react";
import { Chat, UserProfile } from "../types";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onShareChat: (chat: Chat) => void;
  user: UserProfile | null;
  onOpenSettings: () => void;
  onSignOut: () => void;
  onOpenAuth?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onShareChat,
  user,
  onOpenSettings,
  onSignOut,
  onOpenAuth,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  const handleStartRename = (e: React.MouseEvent, chat: Chat) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const handleSaveRename = (e: React.MouseEvent | React.FormEvent, chatId: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameChat(chatId, editTitle.trim());
    }
    setEditingChatId(null);
  };

  const handleNewChatClick = () => {
    setIsSpinning(true);
    setTimeout(() => setIsSpinning(false), 500);
    onNewChat();
  };

  // Filter and group chats by date
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter((c) => c.title.toLowerCase().includes(q));
  }, [chats, searchQuery]);

  const groupedChats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const sevenDaysAgo = today - 86400000 * 7;

    const groups: { [key: string]: Chat[] } = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      Older: [],
    };

    filteredChats.forEach((chat) => {
      const time = chat.updatedAt || chat.createdAt;
      if (time >= today) {
        groups["Today"].push(chat);
      } else if (time >= yesterday) {
        groups["Yesterday"].push(chat);
      } else if (time >= sevenDaysAgo) {
        groups["Previous 7 Days"].push(chat);
      } else {
        groups["Older"].push(chat);
      }
    });

    return groups;
  }, [filteredChats]);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-[#080e1c]/90 backdrop-blur-2xl border-r border-sky-400/20 flex flex-col transition-transform duration-300 ease-out shadow-[10px_0_30px_rgba(0,0,0,0.5)] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.35)]">
              <Sparkles className="w-4 h-4 text-sky-300" />
            </div>
            <span className="font-headline font-bold text-base tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-200 to-sky-400">
              LIGHT AI
            </span>
          </div>

          <button
            id="sidebar-toggle-btn"
            onClick={onToggle}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="p-3 space-y-3">
          {/* New Chat Button */}
          <button
            id="new-chat-btn"
            onClick={handleNewChatClick}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-slate-950 font-mono-code font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(14,165,233,0.35)] hover:shadow-[0_0_30px_rgba(14,165,233,0.6)] transition-all duration-300 active:scale-95 cursor-pointer group"
          >
            <Plus
              className={`w-4 h-4 stroke-[3] transition-transform duration-500 ${
                isSpinning ? "rotate-180" : "group-hover:rotate-90"
              }`}
            />
            <span>New Chat</span>
          </button>

          {/* Search Input */}
          <div className="relative group">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-400 transition-colors" />
            <input
              id="sidebar-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your chats..."
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-sky-400/60 rounded-xl py-2 pl-9 pr-7 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-400/40 transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 custom-scrollbar">
          {filteredChats.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-10 h-10 rounded-full bg-sky-950/40 border border-sky-400/20 flex items-center justify-center mx-auto mb-3 text-sky-400/60">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {searchQuery ? "No matching chats found" : "Your private chats appear here"}
              </p>
              <p className="text-[11px] text-slate-600 mt-1">
                {searchQuery ? "Try another search keyword" : "Start a new conversation"}
              </p>
            </div>
          ) : (
            Object.entries(groupedChats).map(([groupTitle, groupItems]) => {
              if (groupItems.length === 0) return null;
              return (
                <div key={groupTitle} className="space-y-1">
                  <div className="px-2 text-[10px] font-mono-code text-slate-500 uppercase tracking-wider font-semibold">
                    {groupTitle}
                  </div>
                  {groupItems.map((chat) => {
                    const isActive = chat.id === activeChatId;
                    const isEditing = editingChatId === chat.id;

                    return (
                      <div
                        key={chat.id}
                        onClick={() => onSelectChat(chat.id)}
                        className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "bg-slate-800/80 text-white font-medium shadow-sm border-l-2 border-sky-400 pl-2.5"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                        }`}
                      >
                        {isEditing ? (
                          <div
                            className="flex items-center gap-1.5 w-full"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveRename(e, chat.id);
                                if (e.key === "Escape") setEditingChatId(null);
                              }}
                              autoFocus
                              className="w-full bg-slate-950 border border-sky-400 rounded px-2 py-1 text-xs text-white focus:outline-none"
                            />
                            <button
                              onClick={(e) => handleSaveRename(e, chat.id)}
                              className="p-1 hover:text-emerald-400 text-slate-400"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingChatId(null)}
                              className="p-1 hover:text-rose-400 text-slate-400"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="truncate pr-2 select-none flex-1">
                              {chat.title}
                            </span>

                            {/* Hover Actions Toolbar */}
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                              <button
                                onClick={(e) => handleStartRename(e, chat)}
                                className="p-1 text-slate-400 hover:text-sky-300 hover:bg-slate-800 rounded transition-colors"
                                title="Rename chat"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onShareChat(chat);
                                }}
                                className="p-1 text-slate-400 hover:text-sky-300 hover:bg-slate-800 rounded transition-colors"
                                title="Share chat"
                              >
                                <Share2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteChat(chat.id);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                                title="Delete chat"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-white/5 relative">
          {/* Profile Dropdown Popover */}
          {showProfileMenu && (
            <div className="absolute bottom-16 left-3 right-3 bg-slate-900/95 backdrop-blur-2xl border border-sky-400/30 rounded-2xl p-2 shadow-[0_10px_30px_rgba(0,0,0,0.6)] space-y-1 z-50 animate-in fade-in slide-in-from-bottom-2">
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onOpenSettings();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
              >
                <Settings className="w-4 h-4 text-sky-400" />
                <span>Settings & Preferences</span>
              </button>
              <div className="h-px bg-white/5 my-1" />
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onSignOut();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          {/* User Profile Trigger Bar or Sign In */}
          {user && !user.isGuest ? (
            <div
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-sky-400/20 hover:border-sky-400/40 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={
                    user.avatarUrl ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || user.email)}&backgroundColor=0284c7`
                  }
                  alt={user.name || "User Avatar"}
                  className="w-8 h-8 rounded-full object-cover border border-sky-400/50 shadow-sm shrink-0 bg-slate-800"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || user.email)}&backgroundColor=0284c7`;
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white truncate">
                    {user.name || user.email?.split("@")[0] || "User"}
                  </div>
                  <div className="text-[10px] text-sky-400 truncate font-mono-code">
                    {user.email || user.tier || "Connected"}
                  </div>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                  showProfileMenu ? "rotate-90 text-sky-400" : ""
                }`}
              />
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-sky-950/60 to-slate-900/80 hover:from-sky-900/60 hover:to-slate-800 border border-sky-500/30 hover:border-sky-400/60 transition-all duration-200 text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                  <LogIn className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white group-hover:text-sky-300">
                    Sign In / Connect
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono-code">
                    Google or Supabase
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
