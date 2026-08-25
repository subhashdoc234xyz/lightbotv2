import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { Chat, Message, UserProfile } from "../types";

// Check environment variables or local storage overrides
const envUrl = import.meta.env.VITE_SUPABASE_URL || "https://ghumvuoqrdnhmemtbhsu.supabase.co";
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  const localUrl = localStorage.getItem("light_ai_supabase_url") || envUrl;
  const localKey = localStorage.getItem("light_ai_supabase_key") || envKey;
  const isConfigured = Boolean(localUrl && localKey && localUrl.startsWith("http"));
  return { url: localUrl, anonKey: localKey, isConfigured };
}

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.warn("Could not create Supabase client:", err);
      return null;
    }
  }
  return supabaseInstance;
}

export function resetSupabaseClient() {
  supabaseInstance = null;
}

// Convert Supabase User to UserProfile
export function mapSupabaseUser(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email || "user@light.ai",
    name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Light Pioneer",
    avatarUrl:
      user.user_metadata?.avatar_url ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}&backgroundColor=0f172a`,
    tier: "Supabase Cloud",
    authProvider: (user.app_metadata?.provider as any) || "email",
  };
}

// ----------------- DATABASE HELPERS -----------------

// Fetch all chats for a specific user
export async function dbFetchUserChats(userId: string): Promise<Chat[]> {
  const supabase = getSupabase();
  if (!supabase) {
    // Fallback to localStorage
    const saved = localStorage.getItem(`light_ai_chats_${userId}`);
    return saved ? JSON.parse(saved) : [];
  }

  try {
    const { data: chatsData, error: chatsError } = await supabase
      .from("chats")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (chatsError) {
      console.warn("Supabase chats fetch error, falling back to localStorage:", chatsError);
      const saved = localStorage.getItem(`light_ai_chats_${userId}`);
      return saved ? JSON.parse(saved) : [];
    }

    if (!chatsData || chatsData.length === 0) {
      const saved = localStorage.getItem(`light_ai_chats_${userId}`);
      return saved ? JSON.parse(saved) : [];
    }

    // Fetch messages for each chat
    const chatIds = chatsData.map((c) => c.id);
    const { data: messagesData } = await supabase
      .from("messages")
      .select("*")
      .in("chat_id", chatIds)
      .order("created_at", { ascending: true });

    const messagesByChatId: Record<string, Message[]> = {};
    (messagesData || []).forEach((m: any) => {
      if (!messagesByChatId[m.chat_id]) {
        messagesByChatId[m.chat_id] = [];
      }
      messagesByChatId[m.chat_id].push({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: Number(m.created_at),
        feedback: m.feedback,
        image: m.image_data
          ? {
              data: m.image_data,
              mimeType: m.image_mime || "image/png",
              previewUrl: `data:${m.image_mime || "image/png"};base64,${m.image_data}`,
            }
          : undefined,
      });
    });

    return chatsData.map((c: any) => ({
      id: c.id,
      userId: c.user_id,
      title: c.title,
      createdAt: Number(c.created_at),
      updatedAt: Number(c.updated_at),
      isShared: Boolean(c.is_shared),
      messages: messagesByChatId[c.id] || [],
    }));
  } catch (err) {
    console.error("Database fetch error:", err);
    const saved = localStorage.getItem(`light_ai_chats_${userId}`);
    return saved ? JSON.parse(saved) : [];
  }
}

// Save or sync chat to database
export async function dbUpsertChat(chat: Chat): Promise<void> {
  // Always update local cache
  const localKey = `light_ai_chats_${chat.userId}`;
  try {
    const existing: Chat[] = JSON.parse(localStorage.getItem(localKey) || "[]");
    const idx = existing.findIndex((c) => c.id === chat.id);
    if (idx >= 0) {
      existing[idx] = chat;
    } else {
      existing.unshift(chat);
    }
    localStorage.setItem(localKey, JSON.stringify(existing));
  } catch (e) {
    console.error(e);
  }

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    // Upsert chat
    await supabase.from("chats").upsert({
      id: chat.id,
      user_id: chat.userId,
      title: chat.title,
      created_at: chat.createdAt,
      updated_at: chat.updatedAt,
      is_shared: chat.isShared || false,
    });

    // Upsert messages
    if (chat.messages && chat.messages.length > 0) {
      const messageRows = chat.messages.map((m) => ({
        id: m.id,
        chat_id: chat.id,
        role: m.role,
        content: m.content,
        created_at: m.createdAt,
        feedback: m.feedback || null,
        image_data: m.image?.data || null,
        image_mime: m.image?.mimeType || null,
      }));

      await supabase.from("messages").upsert(messageRows);
    }
  } catch (err) {
    console.warn("Supabase upsert error:", err);
  }
}

// Delete chat
export async function dbDeleteChat(chatId: string, userId: string): Promise<void> {
  const localKey = `light_ai_chats_${userId}`;
  try {
    const existing: Chat[] = JSON.parse(localStorage.getItem(localKey) || "[]");
    const filtered = existing.filter((c) => c.id !== chatId);
    localStorage.setItem(localKey, JSON.stringify(filtered));
  } catch (e) {
    console.error(e);
  }

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from("messages").delete().eq("chat_id", chatId);
    await supabase.from("chats").delete().eq("id", chatId);
  } catch (err) {
    console.warn("Supabase delete error:", err);
  }
}

// Fetch single shared chat by ID (public access)
export async function dbFetchPublicChat(chatId: string): Promise<Chat | null> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: chatData } = await supabase
        .from("chats")
        .select("*")
        .eq("id", chatId)
        .single();

      if (chatData && chatData.is_shared) {
        const { data: messagesData } = await supabase
          .from("messages")
          .select("*")
          .eq("chat_id", chatId)
          .order("created_at", { ascending: true });

        return {
          id: chatData.id,
          userId: chatData.user_id,
          title: chatData.title,
          createdAt: Number(chatData.created_at),
          updatedAt: Number(chatData.updated_at),
          isShared: true,
          messages: (messagesData || []).map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: Number(m.created_at),
            feedback: m.feedback,
            image: m.image_data
              ? {
                  data: m.image_data,
                  mimeType: m.image_mime || "image/png",
                  previewUrl: `data:${m.image_mime || "image/png"};base64,${m.image_data}`,
                }
              : undefined,
          })),
        };
      }
    } catch (err) {
      console.warn("Error fetching public chat from Supabase:", err);
    }
  }

  // Fallback to local storage search across users
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("light_ai_chats_")) {
      try {
        const list: Chat[] = JSON.parse(localStorage.getItem(key) || "[]");
        const found = list.find((c) => c.id === chatId && c.isShared);
        if (found) return found;
      } catch (e) {
        console.error(e);
      }
    }
  }
  return null;
}
