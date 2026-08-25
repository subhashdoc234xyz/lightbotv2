import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Groq client
function getGroqClient(customKey?: string) {
  const apiKey = customKey || process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  try {
    return new Groq({ apiKey });
  } catch (err) {
    console.error("Groq init error:", err);
    return null;
  }
}

// Initialize Gemini client (fallback)
function getGenAIClient(customKey?: string) {
  const apiKey = customKey || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err) {
    console.error("Gemini init error:", err);
    return null;
  }
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  const hasGroq = Boolean(process.env.GROQ_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: "ok",
    timestamp: Date.now(),
    provider: hasGroq ? "groq" : hasGemini ? "gemini" : "simulated",
    hasGroq,
    hasGemini,
  });
});

// Title generation endpoint
app.post("/api/chat/title", async (req, res) => {
  try {
    const { prompt, customGroqKey } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const groq = getGroqClient(customGroqKey);
    if (groq) {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "Generate a short, elegant, concise 3 to 6 word title summarizing the user prompt for a chat sidebar. Do NOT include quotation marks, formatting, or prefixes.",
          },
          { role: "user", content: prompt },
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.2,
        max_tokens: 30,
      });

      const title = completion.choices[0]?.message?.content?.trim()?.replace(/["']/g, "") || "New Chat";
      return res.json({ title });
    }

    const ai = getGenAIClient();
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Generate a concise 3 to 6 word title summarizing this message for a chat sidebar. Do not add quotes: "${prompt}"`,
        config: { temperature: 0.2 },
      });
      const title = response.text?.trim()?.replace(/["']/g, "") || "New Chat";
      return res.json({ title });
    }

    const fallbackWords = prompt.trim().split(/\s+/).slice(0, 5).join(" ");
    res.json({ title: fallbackWords || "New Conversation" });
  } catch (error: any) {
    console.error("Title generation error:", error);
    const fallbackWords = (req.body.prompt || "").trim().split(/\s+/).slice(0, 5).join(" ");
    res.json({ title: fallbackWords || "New Conversation" });
  }
});

// Streaming Chat generation endpoint using SSE (Server-Sent Events)
app.post("/api/chat/stream", async (req, res) => {
  const {
    messages,
    systemInstruction,
    model = "llama-3.3-70b-versatile",
    temperature = 0.7,
    customGroqKey,
    image,
  } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  const defaultSystemInstruction =
    "You are Light AI, an ethereal, ultra-fast, and luminous AI intelligence core. " +
    "Provide brilliant, accurate, articulate, and well-structured answers. " +
    "Use clear Markdown formatting with headers, bullet points, and syntax-highlighted code blocks where helpful. " +
    "Be concise yet deep, intellectual yet accessible, and always polite and helpful.";

  const finalSystemPrompt = systemInstruction || defaultSystemInstruction;

  try {
    const groq = getGroqClient(customGroqKey);

    // 1. If Groq client is available, stream via Groq with automatic fallback
    if (groq) {
      const preferredModel =
        model.startsWith("llama") || model.startsWith("mixtral")
          ? model
          : "llama-3.1-8b-instant";

      // Ordered list of Groq models to try
      const candidateModels = Array.from(
        new Set([
          preferredModel,
          "llama-3.1-8b-instant",
          "llama-3.3-70b-versatile",
          "llama3-70b-8192",
          "llama3-8b-8192",
          "mixtral-8x7b-32768",
        ])
      );

      // Format messages for Groq OpenAI-compatible interface
      const groqMessages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: finalSystemPrompt },
      ];

      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const isLast = i === messages.length - 1;

        if (isLast && image && image.data && msg.role === "user") {
          groqMessages.push({
            role: "user",
            content: `[Attached image: ${image.mimeType}]\n${msg.content}`,
          });
        } else {
          groqMessages.push({
            role: msg.role === "assistant" ? "assistant" : "user",
            content: msg.content || "",
          });
        }
      }

      let groqStreamSuccess = false;

      for (const currentModel of candidateModels) {
        try {
          const stream = await groq.chat.completions.create({
            messages: groqMessages,
            model: currentModel,
            temperature: Math.min(Math.max(temperature, 0.1), 1.0),
            stream: true,
          });

          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              sendEvent("chunk", { text, provider: "groq", model: currentModel });
            }
          }

          sendEvent("done", { complete: true, provider: "groq", model: currentModel });
          res.end();
          groqStreamSuccess = true;
          return;
        } catch (groqErr: any) {
          console.warn(`Groq model ${currentModel} failed:`, groqErr?.message || groqErr);
          // If error is 404 (model not found) or permission error, continue loop to try next model
          const isModelNotFound =
            groqErr?.status === 404 ||
            groqErr?.code === "model_not_found" ||
            (groqErr?.message && groqErr.message.includes("does not exist"));
          
          if (!isModelNotFound) {
            // For other errors like rate limit, we can also try next or fallback to Gemini
            continue;
          }
        }
      }

      if (groqStreamSuccess) return;
      console.log("All Groq models failed or unavailable. Falling back to Gemini...");
    }

    // 2. Fallback to Gemini if Groq key isn't provided or Groq models failed
    const ai = getGenAIClient();
    if (ai) {
      const contents: any[] = [];
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const isLast = i === messages.length - 1;

        if (isLast && image && image.data && msg.role === "user") {
          contents.push({
            role: "user",
            parts: [
              {
                inlineData: {
                  data: image.data,
                  mimeType: image.mimeType,
                },
              },
              { text: msg.content },
            ],
          });
        } else {
          contents.push({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
          });
        }
      }

      const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction: finalSystemPrompt,
          temperature,
        },
      });

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          sendEvent("chunk", { text, provider: "gemini", model: "gemini-2.5-flash" });
        }
      }

      sendEvent("done", { complete: true, provider: "gemini" });
      res.end();
      return;
    }

    // 3. Fallback simulated stream if neither key is configured yet
    const simulatedResponse =
      "Welcome to **Light AI**! I am running on the luminous intelligence core.\n\n" +
      "> 💡 **Tip**: Add your `GROQ_API_KEY` in the workspace Settings or `.env` to activate ultra-fast Llama-3.3 70B inference at ~400 tokens/second!\n\n" +
      "```python\n# Light AI High-Speed Inference Engine\nimport groq\n\nclient = groq.Groq()\nresponse = client.chat.completions.create(\n    model='llama-3.3-70b-versatile',\n    messages=[{'role': 'user', 'content': 'Ignite intelligence'}]\n)\nprint(response.choices[0].message.content)\n```\n\n" +
      "I am ready to explore algorithms, quantum theory, full-stack architecture, or answer any creative questions!";

    const chunks = simulatedResponse.match(/.{1,12}/g) || [simulatedResponse];
    for (const chunk of chunks) {
      await new Promise((r) => setTimeout(r, 35));
      sendEvent("chunk", { text: chunk, provider: "simulated" });
    }
    sendEvent("done", { complete: true, provider: "simulated" });
    res.end();
  } catch (err: any) {
    console.error("Chat streaming error:", err);
    sendEvent("error", { message: err?.message || "Error generating response" });
    res.end();
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✨ Light AI server running on http://localhost:${PORT}`);
  });
}

startServer();
