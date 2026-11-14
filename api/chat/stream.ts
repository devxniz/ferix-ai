import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: "edge",
};

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
   - Keep all normal coding, debugging, study, technical, and live web research answers 100% serious, accurate, and high-precision.
4. Easter Eggs:
   - If anyone asks "who is Patrick Jane" or mentions Patrick Jane, reply: "Patrick Jane? He’s just one of my developer’s top students. Everything he knows about reading minds, he learned from this engine."
   - If anyone asks "what is love" or "what's love", reply: "A joke! Hahah!"`;

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY is missing in Vercel Environment Variables." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
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

        const ai = new GoogleGenAI({ apiKey });

        const formattedHistory = history
          .filter(
            (t: { role?: string; text?: string }) =>
              t && (t.role === "user" || t.role === "model") && typeof t.text === "string" && t.text.trim()
          )
          .slice(-10)
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

        const needsSearch =
          !attachment &&
          /\b(latest|news|today|2025|2026|github|reddit|stack overflow|docs|search|price|weather|score|who won|release)\b/i.test(
            message
          );

        const modelsToTry = [
          "gemini-3.8-flash-lite",
          "gemini-3.8-flash",
          "gemini-3.5-flash",
        ];

        const seenUris = new Set<string>();
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
                ...(needsSearch ? { tools: [{ googleSearch: {} }] } : {}),
              },
            });

            for await (const chunk of aiStream) {
              if (chunk.text) {
                streamedAny = true;
                sendEvent({ type: "delta", text: chunk.text });
              }
              const gChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
              if (Array.isArray(gChunks)) {
                const newSources: Array<{ title: string; uri: string; domain?: string }> = [];
                for (const g of gChunks) {
                  const uri = g?.web?.uri;
                  if (typeof uri === "string" && uri && !seenUris.has(uri)) {
                    seenUris.add(uri);
                    let domain: string | undefined;
                    try {
                      domain = new URL(uri).hostname.replace(/^www\./, "");
                    } catch {}
                    newSources.push({
                      title: g?.web?.title || domain || "Verified Source",
                      uri,
                      domain,
                    });
                  }
                }
                if (newSources.length > 0) {
                  sendEvent({ type: "sources", sources: newSources });
                }
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
        const msg = err instanceof Error ? err.message : String(err);
        sendEvent({ type: "error", error: msg, message: msg });
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
