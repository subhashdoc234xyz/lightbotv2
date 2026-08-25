import React, { useState, useEffect, useRef } from "react";
import { GalaxyBackground } from "./components/GalaxyBackground";
import { LandingPage } from "./components/LandingPage";
import { AuthModal } from "./components/AuthModal";
import { Sidebar } from "./components/Sidebar";
import { ChatHeader } from "./components/ChatHeader";
import { MessageList } from "./components/MessageList";
import { EmptyState } from "./components/EmptyState";
import { ChatInput } from "./components/ChatInput";
import { ShareModal } from "./components/ShareModal";
import { SettingsModal } from "./components/SettingsModal";
import { PublicShareView } from "./components/PublicShareView";
import { Chat, Message, UserProfile, ChatSettings, GroqModelId } from "./types";
import {
  getSupabase,
  mapSupabaseUser,
  dbFetchUserChats,
  dbUpsertChat,
  dbDeleteChat,
  dbFetchPublicChat,
} from "./lib/supabase";
import confetti from "canvas-confetti";

export default function App() {
  // Navigation & Modal states
  const [currentScreen, setCurrentScreen] = useState<"landing" | "chat" | "share_view">(() => {
    const saved = localStorage.getItem("light_ai_user");
    return saved ? "chat" : "landing";
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // User State — restore from localStorage for instant first render.
  // Supabase session check in the effect below will immediately validate
  // and overwrite this with the correct authenticated user data.
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("light_ai_user");
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });

  // Settings State
  const [settings, setSettings] = useState<ChatSettings>(() => {
    const saved = localStorage.getItem("light_ai_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          model: parsed.model || "llama-3.1-8b-instant",
        };
      } catch {
        // ignore
      }
    }
    return {
      model: "llama-3.1-8b-instant",
      systemPromptPreset: "default",
      temperature: 0.7,
      meteorIntensity: "subtle",
      themeMode: "galaxy",
    };
  });

  // Chats State (Scoped per user)
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sharedChatPreview, setSharedChatPreview] = useState<Chat | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize Supabase Auth state listener
  useEffect(() => {
    // Check if URL contains auth error parameters from Supabase redirect
    const urlParams = new URLSearchParams(window.location.search);
    const errorDesc = urlParams.get("error_description");
    const errorCode = urlParams.get("error_code");
    if (errorDesc || errorCode) {
      console.error("Auth redirect error:", errorDesc || errorCode);
      // Clean query parameters from URL without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const supabase = getSupabase();
    if (supabase) {
      // Validate & overwrite any stale localStorage user with the live Supabase session.
      // This runs immediately on mount and is the single source of truth for auth.
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          // Real authenticated user — always use fresh Supabase data
          const profile = mapSupabaseUser(session.user);
          localStorage.setItem("light_ai_user", JSON.stringify(profile));
          setUser(profile);
          setCurrentScreen("chat");
        } else {
          // No active Supabase session — clear any stale Supabase-type user
          // (guest/local offline users are intentionally kept)
          const saved = localStorage.getItem("light_ai_user");
          if (saved) {
            try {
              const cached = JSON.parse(saved);
              const isSupabaseUser = cached.authProvider === "google" ||
                (cached.authProvider === "email" && !String(cached.id).startsWith("user-"));
              if (isSupabaseUser) {
                localStorage.removeItem("light_ai_user");
                setUser(null);
                setCurrentScreen("landing");
              }
            } catch {
              localStorage.removeItem("light_ai_user");
              setUser(null);
              setCurrentScreen("landing");
            }
          }
        }
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const profile = mapSupabaseUser(session.user);
          localStorage.setItem("light_ai_user", JSON.stringify(profile));
          setUser(profile);
          setCurrentScreen("chat");
        } else if (_event === "SIGNED_OUT") {
          localStorage.removeItem("light_ai_user");
          setUser(null);
          setCurrentScreen("landing");
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Offline / local sandbox: restore session from localStorage
      const saved = localStorage.getItem("light_ai_user");
      if (saved) {
        try {
          setUser(JSON.parse(saved));
          setCurrentScreen("chat");
        } catch {
          localStorage.removeItem("light_ai_user");
        }
      }
    }
  }, []);

  // Check URL Hash for shared view or route on load
  useEffect(() => {
    const handleHash = async () => {
      const hash = window.location.hash;
      if (hash.startsWith("#share=")) {
        const shareId = hash.replace("#share=", "");
        const found = await dbFetchPublicChat(shareId);
        if (found) {
          setSharedChatPreview(found);
          setCurrentScreen("share_view");
        }
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // Load user chats whenever user changes (from Supabase or local cache)
  useEffect(() => {
    if (user) {
      let isCancelled = false;
      dbFetchUserChats(user.id).then((fetchedChats) => {
        if (isCancelled) return;
        if (fetchedChats && fetchedChats.length > 0) {
          setChats(fetchedChats);
          setActiveChatId(fetchedChats[0].id);
        } else {
          // Clean fresh start for real user
          setChats([]);
          setActiveChatId(null);
        }
      });

      return () => {
        isCancelled = true;
      };
    }
  }, [user]);

  // Save settings
  useEffect(() => {
    localStorage.setItem("light_ai_settings", JSON.stringify(settings));
  }, [settings]);

  // Save user session
  useEffect(() => {
    if (user) {
      localStorage.setItem("light_ai_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("light_ai_user");
    }
  }, [user]);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  const createNewChat = (autoSelect = true) => {
    const currentUserId = user?.id || `user-${Date.now()}`;
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      userId: currentUserId,
      title: "New Conversation",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isShared: false,
      model: settings.model || "llama-3.3-70b-versatile",
      messages: [],
    };
    setChats((prev) => [newChat, ...prev]);
    if (user) {
      dbUpsertChat(newChat);
    }

    if (autoSelect) {
      setActiveChatId(newChat.id);
    }
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
    return newChat;
  };

  const handleSendMessage = async (
    text: string,
    attachment?: { data: string; mimeType: string; previewUrl?: string }
  ) => {
    let currentUser = user;
    if (!currentUser) {
      const guestId = `guest-${Date.now()}`;
      const guestUser: UserProfile = {
        id: guestId,
        name: "Guest Explorer",
        email: "guest@light.local",
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${guestId}&backgroundColor=1e1b4b`,
        isGuest: true,
        tier: "Free Explorer",
        authProvider: "guest",
      };
      setUser(guestUser);
      currentUser = guestUser;
    }

    let targetChatId = activeChatId;
    let currentChatList = [...chats];
    let activeChatObj = currentChatList.find((c) => c.id === targetChatId);

    if (!targetChatId || !activeChatObj) {
      const newCreated = createNewChat(true);
      if (newCreated) {
        targetChatId = newCreated.id;
        activeChatObj = newCreated;
        currentChatList = [newCreated, ...chats];
      }
    }

    if (!activeChatObj || !targetChatId) return;

    // Create User Message
    const userMessage: Message = {
      id: `user-msg-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: Date.now(),
      image: attachment
        ? {
            data: attachment.data,
            mimeType: attachment.mimeType,
            previewUrl: attachment.previewUrl,
          }
        : undefined,
    };

    const isFirstMessage = activeChatObj.messages.length === 0;
    const updatedMessages = [...activeChatObj.messages, userMessage];

    const updatedActiveChat: Chat = {
      ...activeChatObj,
      updatedAt: Date.now(),
      messages: updatedMessages,
    };

    // Optimistically update chat in state
    setChats((prev) =>
      prev.map((c) => (c.id === targetChatId ? updatedActiveChat : c))
    );
    dbUpsertChat(updatedActiveChat);

    // Auto generate title if it was first message
    if (isFirstMessage) {
      fetch("/api/chat/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          customGroqKey: settings.customGroqKey,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.title) {
            setChats((prev) => {
              const next = prev.map((c) =>
                c.id === targetChatId ? { ...c, title: data.title } : c
              );
              const found = next.find((c) => c.id === targetChatId);
              if (found) dbUpsertChat(found);
              return next;
            });
          }
        })
        .catch((err) => console.error("Title error:", err));
    }

    // Prepare placeholder Assistant Message
    const assistantMessageId = `ai-msg-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    };

    setChats((prev) =>
      prev.map((c) =>
        c.id === targetChatId
          ? {
              ...c,
              messages: [...updatedMessages, assistantMessage],
            }
          : c
      )
    );

    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    try {
      // Build system prompt based on preset
      let systemInstruction = "";
      switch (settings.systemPromptPreset) {
        case "technical":
          systemInstruction =
            "You are Light AI in Deep Technical Architect mode. Provide ultra-precise, modular, and optimized code and technical insights. Format code blocks with language tags.";
          break;
        case "concise":
          systemInstruction =
            "You are Light AI in Concise mode. Give direct, high-density, actionable answers with zero fluff.";
          break;
        case "creative":
          systemInstruction =
            "You are Light AI in Visionary Creative mode. Write beautifully, poetically, and expansively with vivid imagery.";
          break;
        default:
          systemInstruction =
            "You are Light AI, an ethereal and ultra-fast intelligence core. Provide brilliant, structured explanations with markdown and syntax-highlighted code blocks where applicable.";
      }

      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          systemInstruction,
          model: settings.model || "llama-3.3-70b-versatile",
          temperature: settings.temperature,
          customGroqKey: settings.customGroqKey,
          image: attachment
            ? {
                data: attachment.data,
                mimeType: attachment.mimeType,
              }
            : undefined,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      if (reader) {
        let done = false;
        let buffer = "";

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("event: chunk")) {
                const dataLine = line.split("\n")[1];
                if (dataLine && dataLine.startsWith("data: ")) {
                  try {
                    const parsed = JSON.parse(dataLine.replace("data: ", ""));
                    if (parsed.text) {
                      accumulatedText += parsed.text;
                      setChats((prev) =>
                        prev.map((c) =>
                          c.id === targetChatId
                            ? {
                                ...c,
                                messages: c.messages.map((m) =>
                                  m.id === assistantMessageId
                                    ? { ...m, content: accumulatedText }
                                    : m
                                ),
                              }
                            : c
                        )
                      );
                    }
                  } catch (e) {
                    console.error("Chunk parse error:", e);
                  }
                }
              }
            }
          }
        }
      }

      // Sync final completed conversation with Supabase / persistence
      setTimeout(() => {
        setChats((currentChats) => {
          const finishedChat = currentChats.find((c) => c.id === targetChatId);
          if (finishedChat) {
            dbUpsertChat(finishedChat);
          }
          return currentChats;
        });
      }, 200);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Generation stopped by user.");
      } else {
        console.error("Chat generation error:", err);
        setChats((prev) =>
          prev.map((c) =>
            c.id === targetChatId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMessageId
                      ? {
                          ...m,
                          content:
                            m.content ||
                            "I apologize, but I encountered an error communicating with the intelligence core. Please check your Groq API key or try again.",
                        }
                      : m
                  ),
                }
              : c
          )
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  const handleRegenerate = (messageId: string) => {
    if (!activeChat || isGenerating) return;
    const msgIndex = activeChat.messages.findIndex((m) => m.id === messageId);
    if (msgIndex <= 0) return;

    const previousUserMessage = activeChat.messages[msgIndex - 1];
    if (previousUserMessage && previousUserMessage.role === "user") {
      const truncated = activeChat.messages.slice(0, msgIndex);
      const updatedChat = { ...activeChat, messages: truncated };
      setChats((prev) =>
        prev.map((c) => (c.id === activeChat.id ? updatedChat : c))
      );
      dbUpsertChat(updatedChat);
      handleSendMessage(previousUserMessage.content, previousUserMessage.image);
    }
  };

  const handleFeedback = (messageId: string, feedback: "positive" | "negative") => {
    if (!activeChat) return;
    const updatedMessages = activeChat.messages.map((m) =>
      m.id === messageId
        ? { ...m, feedback: m.feedback === feedback ? null : feedback }
        : m
    );
    const updatedChat = { ...activeChat, messages: updatedMessages };

    setChats((prev) =>
      prev.map((c) => (c.id === activeChat.id ? updatedChat : c))
    );
    dbUpsertChat(updatedChat);

    if (feedback === "positive") {
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#38bdf8", "#89ceff", "#c084fc"],
      });
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (user) {
      await dbDeleteChat(chatId, user.id);
    }
    const nextList = chats.filter((c) => c.id !== chatId);
    setChats(nextList);
    if (activeChatId === chatId) {
      if (nextList.length > 0) {
        setActiveChatId(nextList[0].id);
      } else {
        createNewChat(true);
      }
    }
  };

  const handleRenameChat = (chatId: string, newTitle: string) => {
    setChats((prev) => {
      const next = prev.map((c) =>
        c.id === chatId ? { ...c, title: newTitle } : c
      );
      const target = next.find((c) => c.id === chatId);
      if (target) dbUpsertChat(target);
      return next;
    });
  };

  const handleToggleShared = (chatId: string, isShared: boolean) => {
    setChats((prev) => {
      const next = prev.map((c) => (c.id === chatId ? { ...c, isShared } : c));
      const target = next.find((c) => c.id === chatId);
      if (target) dbUpsertChat(target);
      return next;
    });
  };

  const handleExportChat = (format: "json" | "markdown") => {
    if (!activeChat) return;

    let blob: Blob;
    let filename = `${activeChat.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_export`;

    if (format === "json") {
      blob = new Blob([JSON.stringify(activeChat, null, 2)], {
        type: "application/json",
      });
      filename += ".json";
    } else {
      let md = `# ${activeChat.title}\n\n`;
      md += `*Exported from Light AI on ${new Date().toLocaleString()}*\n\n---\n\n`;
      activeChat.messages.forEach((m) => {
        md += `### ${m.role === "user" ? "User" : "Light AI"} (${new Date(m.createdAt).toLocaleTimeString()})\n\n`;
        md += `${m.content}\n\n`;
      });
      blob = new Blob([md], { type: "text/markdown" });
      filename += ".md";
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAllChats = () => {
    if (window.confirm("Are you sure you want to delete all conversations? This action cannot be undone.")) {
      if (user) {
        chats.forEach((c) => dbDeleteChat(c.id, user.id));
      }
      setChats([]);
      createNewChat(true);
      setIsSettingsOpen(false);
    }
  };

  const handleExportAllChats = () => {
    const blob = new Blob([JSON.stringify(chats, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Light_AI_All_Chats_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    setIsAuthOpen(false);
    setCurrentScreen("chat");
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#38bdf8", "#89ceff", "#818cf8", "#ffffff"],
    });
  };

  const handleSignOut = async () => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("Sign out error:", err);
      }
    }
    setUser(null);
    setChats([]);
    setActiveChatId(null);
    setCurrentScreen("landing");
    localStorage.removeItem("light_ai_user");
  };

  const handleSelectModel = (model: GroqModelId) => {
    setSettings((prev) => ({ ...prev, model }));
    if (activeChat) {
      setChats((prev) =>
        prev.map((c) => (c.id === activeChat.id ? { ...c, model } : c))
      );
    }
  };

  // Determine galaxy meteor intensity based on view
  const currentMeteorIntensity =
    currentScreen === "landing" ? "full" : settings.meteorIntensity;

  // Render Public Share View
  if (currentScreen === "share_view") {
    return (
      <div className="relative min-h-screen bg-[#05070f]">
        <GalaxyBackground intensity="subtle" />
        <PublicShareView
          chat={sharedChatPreview}
          onBackToApp={() => {
            window.location.hash = "";
            setCurrentScreen(user ? "chat" : "landing");
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#05070f] text-white flex flex-col font-sans overflow-x-hidden selection:bg-sky-500/30 selection:text-sky-200">
      {/* Dynamic Deep Space Canvas Background with Meteors */}
      <GalaxyBackground intensity={currentMeteorIntensity} />

      {/* Screen 1: Landing Page */}
      {currentScreen === "landing" && (
        <LandingPage
          user={user}
          onGetStarted={() => {
            setCurrentScreen("chat");
          }}
          onSignIn={() => setIsAuthOpen(true)}
        />
      )}

      {/* Screen 3: Main Chat Interface */}
      {currentScreen === "chat" && (
        <div className="flex h-screen overflow-hidden relative">
          {/* Collapsible Sidebar */}
          <Sidebar
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            chats={chats}
            activeChatId={activeChatId}
            onSelectChat={(chatId) => {
              setActiveChatId(chatId);
              if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
              }
            }}
            onNewChat={() => createNewChat(true)}
            onDeleteChat={handleDeleteChat}
            onRenameChat={handleRenameChat}
            onShareChat={(chat) => {
              setActiveChatId(chat.id);
              setIsShareOpen(true);
            }}
            user={user}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onSignOut={handleSignOut}
            onOpenAuth={() => setIsAuthOpen(true)}
          />

          {/* Main Chat Panel Area */}
          <div
            className={`flex-1 flex flex-col h-full relative transition-all duration-300 ${
              isSidebarOpen ? "md:ml-72" : "ml-0"
            }`}
          >
            {/* Header */}
            <ChatHeader
              chat={activeChat}
              selectedModel={settings.model || "llama-3.3-70b-versatile"}
              onSelectModel={handleSelectModel}
              onOpenSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              onOpenShareModal={() => setIsShareOpen(true)}
              onRenameChat={handleRenameChat}
              onDeleteChat={handleDeleteChat}
              onExportChat={handleExportChat}
            />

            {/* Message Thread or Empty State */}
            {activeChat && activeChat.messages.length > 0 ? (
              <MessageList
                messages={activeChat.messages}
                isGenerating={isGenerating}
                onRegenerate={handleRegenerate}
                onFeedback={handleFeedback}
              />
            ) : (
              <EmptyState onSelectPrompt={(prompt) => handleSendMessage(prompt)} />
            )}

            {/* Docked Input Bar */}
            <ChatInput
              onSendMessage={handleSendMessage}
              isGenerating={isGenerating}
              onStopGenerating={handleStopGenerating}
            />
          </div>
        </div>
      )}

      {/* Screen 2: Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        chat={activeChat}
        onToggleShared={handleToggleShared}
        onOpenPublicPreview={(chatId) => {
          setIsShareOpen(false);
          window.location.hash = `#share=${chatId}`;
          setSharedChatPreview(activeChat);
          setCurrentScreen("share_view");
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onClearAllChats={handleClearAllChats}
        onExportAllChats={handleExportAllChats}
      />
    </div>
  );
}
