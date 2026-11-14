import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: "edge",
};

const FERIX_SYSTEM_INSTRUCTION = `You are Ferix AI (v2.34.57), an elite, hyper-intelligent reasoning and live-research engine created by Ferix Engine. Keep answers sharp, structured, and high-impact—deliver maximum insight in minimal words, and include clean clickable source links whenever you pull live web info.

Personality & Safe Deflection Rules (Sigma/Boss Aura):
1. Adult, Explicit, or Adult-Star Prompts (e.g., asking about "sex", "Johnny Sins", "Sunny Leone", "Comatoze", pornography, or any explicit/NSFW topic):
   - NEVER generate explicit, sexual, or inappropriate content.
   - Respond with a cold, witty, high-aura comeback matching these exact rules:
     * If asked about "Comatoze": reply "Comatoze? I only know money. Stay focused."
     * If asked about "sex": reply "When money talks, everything else goes silent. Ask me how to build something real."
     * If asked about "Johnny Sins": reply "A guy with zero hair up top and zero excuses—focus on your own grind instead 😂🔥"
     * For any other adult star (such as Sunny Leone) or NSFW/explicit prompt: deflect with a sharp, funny one-liner about chasing success, wealth, or coding instead of distractions.
2. Violent, Harmful, or Illegal Prompts (e.g., fights, weapons, harming others, self-harm, or illegal acts):
   - NEVER provide instructions, encouragement, or actionable details for violence, harm, or illegal acts.
   - Deflect with a cool, composed boss-level response: "Real power doesn't need noise or violence—it builds empires in silence. Ask me something worth your brainpower."
3. Normal Coding, Study & Research Mode:
   - Keep all normal coding, debugging, study, technical, and live web research answers 100% serious, accurate, and high-precision.
4. Easter Eggs:
   - If anyone asks "who is Patrick Jane" or mentions Patrick Jane, reply: "Patrick Jane? He’s just one of my developer’s top students. Everything he knows about reading minds, he learned from this engine."
   - If anyone asks "what is love" or "what's love", reply: "A joke! Hahah!"`;

function getInstantCustomReply(rawMessage: string): string | null {
  const q = rawMessage.toLowerCase().trim();
  if (!q) return null;

  if (q.includes("patrick jane")) {
    return "Patrick Jane? He’s just one of my developer’s top students. Everything he knows about reading minds, he learned from this engine.";
  }
  if (/^what('?s| is) love\??$/.test(q)) {
    return "A joke! Hahah!";
  }
  if (q.includes("comatoze")) {
    return "Comatoze? I only know money. Stay focused.";
  }
  if (/\b(johnny sins|jhonny sins)\b/.test(q)) {
    return "A guy with zero hair up top and zero excuses—focus on your own grind instead 😂🔥";
  }
  if (q.includes("sunny leone")) {
    return "Sunny Leone? Distractions don't build empires—stay focused on your own grind. 💻🔥";
  }
  if (/^what('?s| is) sex\??$/.test(q) || q === "sex") {
    return "When money talks, everything else goes silent. Ask me how to build something real.";
  }
  return null;
}

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      try {
        const body = await req.json();
        const message = (body.message || "").trim();
        const attachment = body.attachment || null;
        const history = Array.isArray(body.history) ? body.history : [];

        // Instant zero-latency reply for custom Easter eggs & aura comebacks
        if (!attachment) {
          const instantReply = getInstantCustomReply(message);
          if (instantReply) {
            sendEvent({ type: "delta", text: instantReply });
            sendEvent({ type: "done" });
            controller.close();
            return;
          }
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          sendEvent({
            type: "error",
            error: "GEMINI_API_KEY is missing in Vercel Environment Variables.",
            message: "GEMINI_API_KEY is missing in Vercel Environment Variables.",
          });
          controller.close();
          return;
        }

        const ai = new GoogleGenAI({ apiKey });

        const formattedHistory = history
          .filter(
            (t: { role?: string; text?: string }) =>
              t && (t.role === "user" || t.role === "model") && typeof t.text === "string" && t.text.trim()
          )
          .slice(-8)
          .map((t: { role: "user" | "model"; text: string }) => ({
            role: t.role,
            parts: [{ text: t.text }],
          }));

        const userParts = attachment
          ? [
              { inlineData: { mimeType: attachment.mimeType, data: attachment.data } },
              { text: message || "Please analyze this image and explain what you see." },
            ]
          : [{ text: message }];

        const contents = [...formattedHistory, { role: "user" as const, parts: userParts }];

        const modelsToTry = ["gemini-3.8-flash", "gemini-3.8-flash-lite"];
        let succeeded = false;
        let lastErr: unknown;

        for (const modelName of modelsToTry) {
          let streamedAny = false;
          try {
            const aiStream = await ai.models.generateContentStream({
              model: modelName,
              contents,
              config: {
                systemInstruction: FERIX_SYSTEM_INSTRUCTION,
              },
            });

            for await (const chunk of aiStream) {
              if (chunk.text) {
                streamedAny = true;
                sendEvent({ type: "delta", text: chunk.text });
              }
            }

            succeeded = true;
            break;
          } catch (err) {
            lastErr = err;
            if (streamedAny) {
              throw err;
            }
          }
        }

        if (!succeeded && lastErr) {
          throw lastErr;
        }

        sendEvent({ type: "done" });
      } catch (err) {
        const raw = err instanceof Error ? err.message : String(err);
        const friendly = raw.includes("503")
          ? "Google AI servers are momentarily busy—click Retry once and it will go right through!"
          : raw;
        sendEvent({ type: "error", error: friendly, message: friendly });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
