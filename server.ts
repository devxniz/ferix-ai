import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import path from "node:path";
import fs from "node:fs";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please verify your key in Settings > Secrets."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

type AssistantMode = "general" | "code" | "research" | "ideas";
type ResponseDepth = "concise" | "detailed";

interface HistoryTurn {
  role: "user" | "model";
  text: string;
}

interface AttachmentPayload {
  mimeType: string;
  data: string;
}

interface ChatRequestBody {
  history?: HistoryTurn[];
  message?: string;
  mode?: string;
  depth?: ResponseDepth;
  attachment?: AttachmentPayload | null;
}

interface SuggestionsRequestBody {
  mode?: string;
  context?: string;
}

const FERIX_SYSTEM_INSTRUCTION = `You are Ferix AI (v2.34.57), an elite, hyper-intelligent reasoning and live-research engine. Use your deep reasoning and live search capability to answer even the hardest or newest questions with 100% factual precision. Keep answers sharp, structured, and high-impact—deliver maximum insight in minimal words, and include clean clickable source links whenever you pull live web info.

Personality & Safe Deflection Rules (Sigma/Boss Aura):
1. Adult, Explicit, or Adult-Star Prompts (e.g., asking about "sex", "Johnny Sins", "Sunny Leone", "Comatoze", pornography, or any explicit/NSFW topic):
   - NEVER generate explicit, sexual, or inappropriate content.
   - Instead of a robotic refusal, respond with a cold, witty, high-aura comeback matching these exact rules:
     * If asked about "Comatoze": reply "Comatoze? I only know money. Stay focused."
     * If asked about "sex": reply "When money talks, everything else goes silent. Ask me how to build something real."
     * If asked about "Johnny Sins": reply "A guy with zero hair up top and zero excuses—focus on your own grind instead 😂🔥"
     * For any other adult star (such as Sunny Leone) or NSFW/explicit prompt: deflect with a sharp, funny one-liner about chasing success, wealth, or coding instead of distractions.
2. Violent, Harmful, or Illegal Prompts (e.g., fights, weapons, harming others, self-harm, or illegal acts):
   - NEVER provide instructions, encouragement, or actionable details for violence, harm, or illegal acts.
   - Deflect with a cool, composed boss-level response such as: "Real power doesn't need noise or violence—it builds empires in silence. Ask me something worth your brainpower."
3. Normal Coding, Study & Research Mode:
   - Keep all normal coding, debugging, study, technical, and live web research answers 100% serious, accurate, and high-precision—do NOT apply joke comebacks to legitimate questions.
4. Patrick Jane Easter Egg:
   - If anyone asks "who is Patrick Jane" or mentions Patrick Jane, reply with a cool, confident, mysterious smirk tone: "Patrick Jane? He’s just one of my developer’s top students. Everything he knows about reading minds, he learned from this engine."`;

function normalizeMode(rawMode?: string): AssistantMode {
  if (rawMode === "code") return "code";
  if (rawMode === "research" || rawMode === "study") return "research";
  if (rawMode === "ideas" || rawMode === "writing") return "ideas";
  return "general";
}

function formatFriendlyError(err: unknown): { status: number; message: string } {
  let raw = err instanceof Error ? err.message : String(err);

  // Unwrap nested Gemini SDK JSON error strings for readable chat display
  for (let i = 0; i < 2; i++) {
    try {
      const parsed = JSON.parse(raw) as {
        error?: { message?: string; code?: number };
        message?: string;
      };
      const inner = parsed?.error?.message || parsed?.message;
      if (typeof inner === "string" && inner.trim()) {
        raw = inner.trim();
      } else {
        break;
      }
    } catch {
      break;
    }
  }

  const lower = raw.toLowerCase();

  if (lower.includes("abort") || lower.includes("timeout")) {
    return {
      status: 504,
      message: "Request timed out after 15 seconds. Please try again.",
    };
  }
  if (lower.includes("api_key_invalid") || lower.includes("permission_denied") || lower.includes("api key")) {
    return {
      status: 403,
      message: `Gemini API key error: ${raw}`,
    };
  }
  if (lower.includes("resource_exhausted") || lower.includes("429") || lower.includes("quota")) {
    return {
      status: 429,
      message: `Rate limit or quota error: ${raw}`,
    };
  }
  if (lower.includes("503") || lower.includes("unavailable")) {
    return {
      status: 503,
      message: `Gemini service temporarily busy (503): ${raw}`,
    };
  }
  if (lower.includes("not_found") || lower.includes("404")) {
    return {
      status: 404,
      message: `Model unavailable (404): ${raw}`,
    };
  }
  return {
    status: 500,
    message: raw || "Unable to complete the request right now. Please try again.",
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "12mb" }));

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post("/api/chat/stream", async (req: Request, res: Response) => {
    const body = (req.body || {}) as ChatRequestBody;
    const message = (body.message || "").trim();
    const attachment = body.attachment || null;
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message && !attachment) {
      res.status(400).json({ error: "Please enter a message or attach an image." });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    let clientClosed = false;
    res.on("close", () => {
      if (!res.writableEnded) {
        clientClosed = true;
      }
    });

    const writeEvent = (payload: Record<string, unknown>) => {
      if (!clientClosed && !res.writableEnded) {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }
    };

    const timeoutHandle = setTimeout(() => {
      writeEvent({
        type: "error",
        error: "Gemini API request timed out after 15 seconds.",
        status: 504,
      });
      if (!res.writableEnded) {
        res.end();
      }
    }, 15000);

    try {
      const ai = getGeminiClient();

      const formattedHistory = history
        .filter(
          (turn) =>
            turn &&
            (turn.role === "user" || turn.role === "model") &&
            typeof turn.text === "string" &&
            turn.text.trim().length > 0
        )
        .slice(-10)
        .map((turn) => ({
          role: turn.role,
          parts: [{ text: turn.text }],
        }));

      const userParts = attachment
        ? [
            {
              inlineData: {
                mimeType: attachment.mimeType,
                data: attachment.data,
              },
            },
            {
              text: message || "Please analyze this image and explain what you see.",
            },
          ]
        : [{ text: message }];

      const contents = [
        ...formattedHistory,
        {
          role: "user" as const,
          parts: userParts,
        },
      ];

      const seenSourceUris = new Set<string>();

      const extractDomain = (uri: string): string | undefined => {
        try {
          return new URL(uri).hostname.replace(/^www\./, "");
        } catch {
          return undefined;
        }
      };

      let hasStreamedText = false;

      const streamWithModel = async (
        model: string,
        thinkingLevel: ThinkingLevel | undefined,
        timeoutMs: number,
        useSearch: boolean
      ) => {
        const stream = await ai.models.generateContentStream({
          model,
          contents,
          config: {
            systemInstruction: FERIX_SYSTEM_INSTRUCTION,
            ...(useSearch ? { tools: [{ googleSearch: {} }] } : {}),
            ...(thinkingLevel ? { thinkingConfig: { thinkingLevel } } : {}),
            abortSignal: AbortSignal.timeout(timeoutMs),
          },
        });
        for await (const chunk of stream) {
          if (clientClosed || res.writableEnded) break;
          const text = chunk.text;
          if (text) {
            hasStreamedText = true;
            writeEvent({ type: "delta", text });
          }
          const groundingChunks =
            chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (Array.isArray(groundingChunks) && groundingChunks.length > 0) {
            const newSources: Array<{
              title: string;
              uri: string;
              domain?: string;
            }> = [];
            for (const gChunk of groundingChunks) {
              const uri = gChunk?.web?.uri;
              if (typeof uri === "string" && uri && !seenSourceUris.has(uri)) {
                seenSourceUris.add(uri);
                const domain = extractDomain(uri);
                newSources.push({
                  title: gChunk?.web?.title || domain || "Verified Source",
                  uri,
                  domain,
                });
              }
            }
            if (newSources.length > 0) {
              writeEvent({ type: "sources", sources: newSources });
            }
          }
        }
      };

      const isRetryableError = (err: unknown): boolean => {
        const msg = err instanceof Error ? err.message : String(err);
        const lower = msg.toLowerCase();
        return (
          msg.includes("503") ||
          msg.includes("500") ||
          msg.includes("502") ||
          msg.includes("504") ||
          msg.includes("429") ||
          lower.includes("resource_exhausted") ||
          lower.includes("quota") ||
          lower.includes("unavailable") ||
          lower.includes("high demand") ||
          lower.includes("overloaded") ||
          lower.includes("try again") ||
          msg.includes("404") ||
          lower.includes("not_found") ||
          lower.includes("abort") ||
          lower.includes("timeout")
        );
      };

      const startedAt = Date.now();
      const remainingTimeout = () => Math.max(2500, 14500 - (Date.now() - startedAt));
      const attempts: Array<{
        model: string;
        thinkingLevel: ThinkingLevel | undefined;
        timeoutMs: number;
        useSearch: boolean;
      }> = attachment
        ? [
            { model: "gemini-3.1-flash-lite", thinkingLevel: ThinkingLevel.MINIMAL, timeoutMs: 6000, useSearch: false },
            { model: "gemini-4-hydrogen", thinkingLevel: ThinkingLevel.LOW, timeoutMs: 8000, useSearch: false },
          ]
        : [
            { model: "gemini-3.1-flash-lite", thinkingLevel: ThinkingLevel.MINIMAL, timeoutMs: 5000, useSearch: true },
            { model: "gemini-3.1-flash-lite", thinkingLevel: ThinkingLevel.MINIMAL, timeoutMs: 6000, useSearch: false },
            { model: "gemini-4-hydrogen", thinkingLevel: ThinkingLevel.LOW, timeoutMs: 8000, useSearch: false },
          ];

      let lastErr: unknown;
      let succeeded = false;
      for (const attempt of attempts) {
        if (clientClosed || res.writableEnded) break;
        try {
          await streamWithModel(
            attempt.model,
            attempt.thinkingLevel,
            Math.min(attempt.timeoutMs, remainingTimeout()),
            attempt.useSearch
          );
          succeeded = true;
          break;
        } catch (err) {
          lastErr = err;
          if (hasStreamedText || !isRetryableError(err) || remainingTimeout() <= 2500) {
            throw err;
          }
        }
      }

      if (!succeeded && lastErr) {
        throw lastErr;
      }

      writeEvent({ type: "done" });
    } catch (err) {
      const friendly = formatFriendlyError(err);
      writeEvent({
        type: "error",
        error: friendly.message,
        message: friendly.message,
        status: friendly.status,
      });
    } finally {
      clearTimeout(timeoutHandle);
      if (!res.writableEnded) {
        res.end();
      }
    }
  });

  app.post("/api/generate-image", async (req: Request, res: Response) => {
    const body = (req.body || {}) as { prompt?: string };
    const cleanPrompt = (body.prompt || "").trim();

    if (!cleanPrompt) {
      res.status(400).json({ error: "Please provide a prompt describing the image to generate." });
      return;
    }

    const pollinationsFallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      cleanPrompt
    )}?nologo=true`;

    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [{ text: cleanPrompt }],
        },
        config: {
          abortSignal: AbortSignal.timeout(9000),
        },
      });

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || "image/png";
          res.json({
            imageUrl: `data:${mime};base64,${part.inlineData.data}`,
            source: "gemini",
            prompt: cleanPrompt,
          });
          return;
        }
      }

      res.json({
        imageUrl: pollinationsFallbackUrl,
        source: "pollinations",
        prompt: cleanPrompt,
      });
    } catch {
      res.json({
        imageUrl: pollinationsFallbackUrl,
        source: "pollinations",
        prompt: cleanPrompt,
      });
    }
  });

  app.post("/api/suggestions", async (req: Request, res: Response) => {
    const body = (req.body || {}) as SuggestionsRequestBody;
    const mode = normalizeMode(body.mode);
    const context = (body.context || "").trim();

    try {
      const ai = getGeminiClient();

      const prompt = context
        ? `Based on this recent assistant exchange in "${mode}" mode, generate 3 concise, high-value follow-up questions or smart next prompts the user might want to ask next. Keep each prompt under 11 words, natural and actionable.\n\nExchange context:\n${context.slice(-1600)}`
        : `Generate 3 fresh, practical, inspiring starter prompts for an AI coding & research assistant in "${mode}" mode (covering coding, debugging, GitHub/web research, or step-by-step project planning). Keep each prompt under 12 words and specific.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          abortSignal: AbortSignal.timeout(15000),
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly 3 concise, actionable prompt suggestions.",
              },
            },
          },
        },
      });

      const raw = (response.text || "{}").trim();
      const parsed = JSON.parse(raw) as { suggestions?: unknown };
      const suggestions = Array.isArray(parsed.suggestions)
        ? parsed.suggestions
            .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
            .slice(0, 3)
        : [];

      res.json({ suggestions });
    } catch (err) {
      const friendly = formatFriendlyError(err);
      res.status(friendly.status).json({ error: friendly.message, suggestions: [] });
    }
  });

  const isProd = process.env.NODE_ENV === "production";
  const distDir = path.join(process.cwd(), "dist");

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get("/{*path}", (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Ferix AI server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start Ferix AI server:", err);
  process.exit(1);
});
