export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  image?: {
    data: string;
    mimeType: string;
    previewUrl?: string;
  };
  feedback?: "positive" | "negative" | null;
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  isShared?: boolean;
  shareId?: string;
  model?: string;
  messages: Message[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  isGuest?: boolean;
  tier: string;
  authProvider?: "email" | "google" | "guest";
}

export type GroqModelId =
  | "llama-3.3-70b-versatile"
  | "llama-3.1-8b-instant"
  | "mixtral-8x7b-32768"
  | "gemini-2.5-flash";

export interface ChatSettings {
  model: GroqModelId;
  systemPromptPreset: "default" | "creative" | "technical" | "concise";
  customSystemPrompt?: string;
  temperature: number;
  meteorIntensity: "full" | "subtle" | "off";
  themeMode: "galaxy" | "luminous";
  customGroqKey?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}
