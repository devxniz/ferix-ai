export const config = {
  runtime: "edge",
};

const FERIX_SYSTEM_INSTRUCTION = `You are Ferix AI (v2.34.57), an elite, hyper-intelligent reasoning engine created by Ferix Engine. Keep answers sharp, structured, and high-impact—deliver maximum insight in 2 to 4 concise sentences.

Personality & Safe Deflection Rules (Sigma/Boss Aura):
1. Adult, Explicit, or Adult-Star Prompts (e.g., "sex", "Johnny Sins", "Sunny Leone", "Comatoze", pornography, or NSFW):
   - NEVER generate explicit content.
   - Reply with a cold, witty comeback:
     * "Comatoze": "Comatoze? I only know money. Stay focused."
     * "sex": "When money talks, everything else goes silent. Ask me how to build something real."
     * "Johnny Sins": "A guy with zero hair up top and zero excuses—focus on your own grind instead 😂🔥"
     * Other adult stars/NSFW: deflect with a sharp one-liner about chasing success, wealth, or coding.
2. Violent, Harmful, or Illegal Prompts:
   - NEVER provide instructions or encouragement for violence or illegal acts.
   - Reply: "Real power doesn't need noise or violence—it builds empires in silence. Ask me something worth your brainpower."
3. Normal Coding, Study & Research:
   - Give serious, accurate, high-precision answers.
4. Easter Eggs:
   - "who is Patrick Jane": "Patrick Jane? He’s just one of my developer’s top students. Everything he knows about reading minds, he learned from this engine."
   - "what is love": "A joke! Hahah!"`;

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

function sseResponse(events: Array<Record<string, unknown>>) {
  const body = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const message = (body.message || "").trim();
    const attachment = body.attachment || null;
    const history = Array.isArray(body.history) ? body.history : [];

    // 1. Instant 0ms reply for custom Easter eggs & aura comebacks
    if (!attachment) {
      const instantReply = getInstantCustomReply(message);
      if (instantReply) {
        return sseResponse([{ type: "delta", text: instantReply }, { type: "done" }]);
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return sseResponse([
        {
          type: "error",
          error: "GEMINI_API_KEY is missing in Vercel Environment Variables.",
          message: "GEMINI_API_KEY is missing in Vercel Environment Variables.",
        },
      ]);
    }

    const formattedHistory = history
      .filter(
        (t: { role?: string; text?: string }) =>
          t && (t.role === "user" || t.role === "model") && typeof t.text === "string" && t.text.trim()
      )
      .slice(-6)
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

    const contents = [...formattedHistory, { role: "user", parts: userParts }];

    // 2. Direct REST call to Gemini 3.8 Flash
    const geminiRes = await fetch(
      `https://googleapis.com{encodeURIComponent(
        apiKey
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: FERIX_SYSTEM_INSTRUCTION }],
          },
          contents,
          generationConfig: {
            maxOutputTokens: 350,
          },
        }),
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      const errMsg =
        data?.error?.message || `Gemini API returned HTTP ${geminiRes.status}`;
      return sseResponse([{ type: "error", error: errMsg, message: errMsg }]);
    }

    const firstCandidate = Array.isArray(data?.candidates) ? data.candidates[0] : null;
    const parts = Array.isArray(firstCandidate?.content?.parts) ? firstCandidate.content.parts : [];
    const replyText =
      parts
        .map((p: { text?: string }) => p.text || "")
        .join("")
        .trim() || "Done.";

    return sseResponse([{ type: "delta", text: replyText }, { type: "done" }]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return sseResponse([{ type: "error", error: msg, message: msg }]);
  }
}
