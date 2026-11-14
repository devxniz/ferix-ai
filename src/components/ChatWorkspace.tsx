import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUp,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileCode2,
  Globe,
  Plus,
  RotateCcw,
  Square,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type {
  ChatMessage,
  Conversation,
  GroundingSource,
  ImageAttachment,
} from "../types";
import {
  playCyberTap,
  playMessageWhoosh,
  playReplyChime,
} from "../utils/soundEngine";
import { BlueFlameBackdrop } from "./BlueFlameBackdrop";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { PhoenixLogo } from "./PhoenixLogo";

interface ChatWorkspaceProps {
  activeConversation: Conversation;
  onUpdateConversation: (
    id: string,
    updater: (prev: Conversation) => Conversation
  ) => void;
  onBackHome: () => void;
  pendingAutoPrompt: { conversationId: string; text: string } | null;
  onClearPendingAutoPrompt: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-2 py-2"
      role="status"
      aria-label="Ferix AI is generating a response"
    >
      <div className="flex items-center gap-1.5">
        <span
          className="typing-dot h-2 w-2 rounded-full bg-[#00f0ff]"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="typing-dot h-2 w-2 rounded-full bg-[#38bdf8]"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="typing-dot h-2 w-2 rounded-full bg-[#1d4ed8]"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <span className="text-xs text-slate-400">
        Synthesizing response...
      </span>
    </div>
  );
}

type PendingAttachment =
  | { kind: "image"; image: ImageAttachment }
  | { kind: "text"; name: string; content: string; ext: string };

function extractImageGenerationPrompt(rawText: string): string | null {
  const trimmed = rawText.trim();
  const explicitMatch =
    trimmed.match(
      /^(?:please\s+)?(?:can\s+you\s+)?(?:generate|create|make|render|paint|sketch)\s+(?:me\s+)?(?:an?\s+)?(?:image|picture|photo|illustration|art|artwork|wallpaper|logo|drawing)(?:\s+(?:of|for|showing|depicting|with))?\s+(.+)$/i
    ) ||
    trimmed.match(
      /^(?:please\s+)?(?:can\s+you\s+)?draw\s+(?:me\s+)?(?:an?\s+(?:image|picture)\s+(?:of\s+)?)?(.+)$/i
    );

  if (explicitMatch && explicitMatch[1]?.trim()) {
    return explicitMatch[1].trim();
  }
  return null;
}

export function ChatWorkspace({
  activeConversation,
  onUpdateConversation,
  onBackHome,
  pendingAutoPrompt,
  onClearPendingAutoPrompt,
  soundEnabled,
  onToggleSound,
}: ChatWorkspaceProps) {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingAttachment, setPendingAttachment] =
    useState<PendingAttachment | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const autoPromptTriggeredRef = useRef<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [activeConversation.messages.length, isStreaming]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const readImageFile = (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      setAttachError("Image must be under 8 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      const commaIdx = dataUrl.indexOf(",");
      if (!dataUrl || commaIdx === -1) {
        setAttachError("Could not read image file.");
        return;
      }
      const base64 = dataUrl.slice(commaIdx + 1);
      setAttachError(null);
      setPendingAttachment({
        kind: "image",
        image: {
          name: file.name || "screenshot.png",
          mimeType: file.type || "image/png",
          data: base64,
          previewUrl: dataUrl,
        },
      });
    };
    reader.onerror = () => {
      setAttachError("Failed to read selected image.");
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    playCyberTap();
    setAttachError(null);

    if (
      file.type === "image/png" ||
      file.type === "image/jpeg" ||
      file.type === "image/webp"
    ) {
      readImageFile(file);
      return;
    }

    if (file.size > 512 * 1024) {
      setAttachError("Text/code files must be under 512 KB.");
      return;
    }

    try {
      const content = (await file.text()).slice(0, 30000);
      const ext = file.name.includes(".")
        ? file.name.split(".").pop()?.toLowerCase() || "txt"
        : "txt";
      setPendingAttachment({
        kind: "text",
        name: file.name,
        content,
        ext,
      });
    } catch {
      setAttachError("Unable to read this file as text or image.");
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (
        item.type === "image/png" ||
        item.type === "image/jpeg" ||
        item.type === "image/webp"
      ) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          readImageFile(file);
          return;
        }
      }
    }
  };

  const sendMessage = async (
    overrideText?: string,
    targetConv?: Conversation
  ) => {
    const conv = targetConv || activeConversation;
    const activeAttachment = overrideText ? null : pendingAttachment;
    const rawText = (overrideText ?? input).trim();
    if ((!rawText && !activeAttachment) || isStreaming) return;

    const displayUserText =
      rawText ||
      (activeAttachment?.kind === "image"
        ? "Analyze this image and help me solve or improve it."
        : "Inspect this attached file.");

    const apiMessageText =
      activeAttachment?.kind === "text"
        ? `${displayUserText}\n\nAttached file \`${activeAttachment.name}\`:\n\`\`\`${activeAttachment.ext}\n${activeAttachment.content}\n\`\`\``
        : displayUserText;

    const imagePayload =
      activeAttachment?.kind === "image"
        ? {
            mimeType: activeAttachment.image.mimeType,
            data: activeAttachment.image.data,
          }
        : null;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: displayUserText,
      createdAt: Date.now(),
      ...(activeAttachment?.kind === "image"
        ? {
            attachmentPreview: activeAttachment.image.previewUrl,
            attachmentName: activeAttachment.image.name,
          }
        : activeAttachment?.kind === "text"
          ? { attachmentName: activeAttachment.name }
          : {}),
    };

    const assistantMessageId = crypto.randomUUID();
    const assistantPlaceholder: ChatMessage = {
      id: assistantMessageId,
      role: "model",
      text: "",
      createdAt: Date.now(),
    };

    const nextTitle =
      conv.messages.length === 0
        ? displayUserText.slice(0, 48) + (displayUserText.length > 48 ? "..." : "")
        : conv.title;

    const historyForApi = conv.messages
      .filter((m) => !m.error && m.text.trim().length > 0)
      .slice(-10)
      .map((m) => ({
        role: m.role,
        text: m.text,
      }));

    onUpdateConversation(conv.id, (prev) => ({
      ...prev,
      title: nextTitle,
      updatedAt: Date.now(),
      followUpSuggestions: [],
      messages: [...prev.messages, userMessage, assistantPlaceholder],
    }));

    if (!overrideText) {
      setInput("");
      setPendingAttachment(null);
      setAttachError(null);
    }
    setIsStreaming(true);
    playMessageWhoosh();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 15000);

    let accumulated = "";
    let collectedSources: GroundingSource[] = [];
    let streamHadError = false;

    const imageGenPrompt =
      !activeAttachment ? extractImageGenerationPrompt(displayUserText) : null;

    try {
      if (imageGenPrompt) {
        const imgRes = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ prompt: imageGenPrompt }),
        });

        const imgData = (await imgRes.json()) as {
          imageUrl?: string;
          prompt?: string;
          error?: string;
        };

        if (!imgRes.ok || !imgData.imageUrl) {
          throw new Error(imgData.error || "Unable to generate image right now.");
        }

        onUpdateConversation(conv.id, (prev) => ({
          ...prev,
          updatedAt: Date.now(),
          messages: prev.messages.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  text: `Generated image for: **${imgData.prompt || imageGenPrompt}**`,
                  generatedImageUrl: imgData.imageUrl,
                  generatedImagePrompt: imgData.prompt || imageGenPrompt,
                }
              : m
          ),
        }));
        playReplyChime();
        return;
      }

      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: apiMessageText,
          history: historyForApi,
          mode: conv.mode,
          depth: conv.depth,
          attachment: imagePayload,
        }),
      });

      if (!response.ok || !response.body) {
        let errMessage = `Ferix AI request failed (HTTP ${response.status}).`;
        try {
          const parsed = (await response.json()) as { error?: string; message?: string };
          if (parsed.error || parsed.message) {
            errMessage = parsed.error || parsed.message || errMessage;
          }
        } catch {
          // Ignore non-JSON error
        }
        throw new Error(errMessage);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let streamDone = false;

      while (!streamDone) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const lines = event.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);
            if (!payload) continue;

            try {
              const parsed = JSON.parse(payload) as {
                type: "delta" | "chunk" | "sources" | "done" | "error";
                text?: string;
                sources?: GroundingSource[];
                error?: string;
                message?: string;
              };

              if ((parsed.type === "delta" || parsed.type === "chunk") && parsed.text) {
                accumulated += parsed.text;
                onUpdateConversation(conv.id, (prev) => ({
                  ...prev,
                  updatedAt: Date.now(),
                  messages: prev.messages.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, text: accumulated }
                      : m
                  ),
                }));
              } else if (parsed.type === "sources" && parsed.sources) {
                const seen = new Set(collectedSources.map((s) => s.uri));
                const nextSources = [...collectedSources];
                for (const src of parsed.sources) {
                  if (src.uri && !seen.has(src.uri)) {
                    seen.add(src.uri);
                    nextSources.push(src);
                  }
                }
                collectedSources = nextSources;
                onUpdateConversation(conv.id, (prev) => ({
                  ...prev,
                  messages: prev.messages.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, sources: collectedSources }
                      : m
                  ),
                }));
              } else if (parsed.type === "done") {
                streamDone = true;
              } else if (parsed.type === "error") {
                streamHadError = true;
                streamDone = true;
                const exactError =
                  parsed.error ||
                  parsed.message ||
                  "Ferix AI encountered an interruption.";
                onUpdateConversation(conv.id, (prev) => ({
                  ...prev,
                  messages: prev.messages.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, error: exactError }
                      : m
                  ),
                }));
              }
            } catch {
              // Ignore partial SSE JSON frame
            }
          }
        }
      }

      if (streamDone) {
        void reader.cancel().catch(() => {});
      }
      setIsStreaming(false);

      if (!streamHadError && accumulated.trim().length > 0) {
        playReplyChime();
      } else if (!streamHadError && accumulated.trim().length === 0) {
        onUpdateConversation(conv.id, (prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  error: "No response received from Gemini API. Please try again.",
                }
              : m
          ),
        }));
      }
    } catch (err) {
      if (timedOut) {
        onUpdateConversation(conv.id, (prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  error:
                    "Request timed out after 15 seconds. Please check your Gemini API connection and try again.",
                }
              : m
          ),
        }));
      } else if ((err as Error).name === "AbortError") {
        if (!accumulated.trim()) {
          onUpdateConversation(conv.id, (prev) => ({
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === assistantMessageId
                ? { ...m, text: "Generation stopped." }
                : m
            ),
          }));
        }
      } else {
        const msg =
          err instanceof Error
            ? err.message
            : "Something went wrong connecting to Ferix AI.";
        onUpdateConversation(conv.id, (prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === assistantMessageId ? { ...m, error: msg } : m
          ),
        }));
      }
    } finally {
      window.clearTimeout(timeoutId);
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    if (
      pendingAutoPrompt &&
      pendingAutoPrompt.conversationId === activeConversation.id &&
      autoPromptTriggeredRef.current !== pendingAutoPrompt.conversationId
    ) {
      autoPromptTriggeredRef.current = pendingAutoPrompt.conversationId;
      const text = pendingAutoPrompt.text;
      onClearPendingAutoPrompt();
      void sendMessage(text, activeConversation);
    }
  });

  const handleStopStreaming = () => {
    playCyberTap();
    abortControllerRef.current?.abort();
  };

  const handleRegenerateLast = () => {
    if (isStreaming) return;
    playCyberTap();
    const msgs = activeConversation.messages;
    const lastUserIndex = [...msgs].reverse().findIndex((m) => m.role === "user");
    if (lastUserIndex === -1) return;
    const actualUserIndex = msgs.length - 1 - lastUserIndex;
    const lastUserMessage = msgs[actualUserIndex];

    const trimmedMessages = msgs.slice(0, actualUserIndex);
    const updatedConv: Conversation = {
      ...activeConversation,
      messages: trimmedMessages,
      followUpSuggestions: [],
    };
    onUpdateConversation(activeConversation.id, () => updatedConv);
    void sendMessage(lastUserMessage.text, updatedConv);
  };

  const handleCopyMessage = async (id: string, text: string) => {
    playCyberTap();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Clipboard unavailable
    }
  };

  const handleDownloadImage = async (
    id: string,
    imageUrl: string,
    promptText?: string
  ) => {
    playCyberTap();
    setDownloadingId(id);
    const safeSlug = (promptText || "ferix-ai-image")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    const filename = `${safeSlug || "ferix-ai-image"}.png`;

    try {
      if (imageUrl.startsWith("data:")) {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        return;
      }

      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    } catch {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = filename;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendMessage();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden text-slate-100">
      {/* Pure CSS blue-flame waves + rising cyan ember dots at z-index: 1 above #03060c body */}
      <BlueFlameBackdrop variant="chat" />

      {/* Ultra-Clean Chat UI Layer at z-index: 10 */}
      <div
        style={{ zIndex: 10 }}
        className="relative flex min-h-0 flex-1 flex-col"
      >
        {/* Clean Top Bar with Back button & subtle sound mute toggle (no heavy blur) */}
        <header className="flex items-center justify-between border-b border-[#00f0ff]/15 bg-[#03060c]/92 px-4 py-3.5 sm:px-8">
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                playCyberTap();
                onBackHome();
              }}
              className="ferix-chat-surface inline-flex min-h-[38px] items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-slate-200 hover:text-white focus-visible:outline-2 focus-visible:outline-[#00f0ff] whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-[#00f0ff]" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? "Mute sound effects" : "Unmute sound effects"}
              title={soundEnabled ? "Sound ON — Click to mute" : "Sound OFF — Click to unmute"}
              className={`ferix-chat-surface inline-flex h-[38px] w-[38px] items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-[#00f0ff] shrink-0 ${
                soundEnabled ? "text-[#00f0ff]" : "text-slate-400"
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <PhoenixLogo size="sm" showAmbient={false} />
            <span className="bg-gradient-to-r from-[#e0faff] via-[#00f0ff] to-[#3b82f6] bg-clip-text font-[family-name:var(--font-display)] text-sm font-bold text-transparent">
              Ferix AI
            </span>
          </div>
        </header>

        {/* Message Conversation Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <div className="mx-auto flex min-h-full max-w-3xl flex-col">
            {activeConversation.messages.length === 0 ? (
              <div className="my-auto flex flex-col items-center justify-center py-12 text-center">
                <PhoenixLogo size="hero" className="mb-5" />
                <h2 className="bg-gradient-to-r from-white via-[#00f0ff] to-[#3b82f6] bg-clip-text font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-transparent">
                  Ferix AI
                </h2>
              </div>
            ) : (
              <div className="space-y-6 pb-6">
                {activeConversation.messages.map((msg, idx) => {
                  const isUser = msg.role === "user";
                  const isLatestModel =
                    !isUser && idx === activeConversation.messages.length - 1;

                  if (isUser) {
                    return (
                      <div key={msg.id} className="flex justify-end">
                        <div className="max-w-[82%] space-y-2.5 rounded-2xl rounded-br-md border border-[#00f0ff]/35 bg-gradient-to-br from-[#0284c7] via-[#1d4ed8] to-[#2563eb] px-5 py-3.5 text-[15px] leading-relaxed text-white shadow-[0_8px_28px_rgba(2,132,199,0.28)]">
                          {msg.attachmentPreview && (
                            <div className="overflow-hidden rounded-xl border border-white/25 bg-[#03060c]/40">
                              <img
                                src={msg.attachmentPreview}
                                alt={msg.attachmentName || "Uploaded image"}
                                className="max-h-60 w-auto rounded-xl object-contain"
                              />
                            </div>
                          )}
                          {!msg.attachmentPreview && msg.attachmentName && (
                            <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-2.5 py-1 text-xs font-medium text-cyan-50">
                              <FileCode2 className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate max-w-[220px]">{msg.attachmentName}</span>
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className="flex items-start gap-3.5">
                      {/* Glowing Phoenix Avatar */}
                      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#00f0ff]/35 bg-[#0a1220]/80 shadow-[0_0_18px_rgba(0,240,255,0.2)]">
                        <PhoenixLogo size="sm" showAmbient={false} />
                      </div>

                      {/* Semi-transparent Dark-Glass Ferix AI Reply Card */}
                      <div className="ferix-chat-bubble min-w-0 flex-1 rounded-2xl rounded-tl-md p-5">
                        <div className="mb-3 flex items-center gap-2 border-b border-[#00f0ff]/15 pb-2.5">
                          <span className="bg-gradient-to-r from-white to-[#00f0ff] bg-clip-text font-[family-name:var(--font-display)] text-xs font-semibold text-transparent">
                            Ferix AI
                          </span>
                          <span aria-hidden="true" className="text-slate-600">
                            ·
                          </span>
                          <span className="text-xs text-slate-400 tabular-nums">
                            {formatTime(msg.createdAt)}
                          </span>
                        </div>

                        {msg.error ? (
                          <div
                            role="alert"
                            className="mt-1 flex flex-col gap-3 rounded-xl border-2 border-red-500/80 bg-red-950/55 p-4 text-sm text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.22)]"
                          >
                            <div className="flex items-start gap-2.5">
                              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                              <span className="break-words">{msg.error}</span>
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={handleRegenerateLast}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/50 bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-100 hover:bg-red-500/30"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>Retry</span>
                              </button>
                            </div>
                          </div>
                        ) : msg.text ? (
                          <>
                            <MarkdownRenderer content={msg.text} />
                            {msg.generatedImageUrl && (
                              <div className="mt-4 space-y-3">
                                <div className="overflow-hidden rounded-xl border border-[#00f0ff]/30 bg-[#03060c]">
                                  <img
                                    src={msg.generatedImageUrl}
                                    alt={msg.generatedImagePrompt || "Generated by Ferix AI"}
                                    className="max-h-[420px] w-full object-contain"
                                  />
                                </div>
                                <button
                                  type="button"
                                  disabled={downloadingId === msg.id}
                                  onClick={() =>
                                    void handleDownloadImage(
                                      msg.id,
                                      msg.generatedImageUrl!,
                                      msg.generatedImagePrompt
                                    )
                                  }
                                  className="inline-flex items-center gap-2 rounded-full border border-[#00f0ff]/45 bg-[#0a1220] px-4 py-1.5 text-xs font-semibold text-[#e0faff] transition-colors hover:border-[#00f0ff] hover:bg-[#0284c7]/25 disabled:opacity-50"
                                >
                                  <Download className="h-3.5 w-3.5 text-[#00f0ff]" />
                                  <span>
                                    {downloadingId === msg.id
                                      ? "Downloading..."
                                      : "Download Image"}
                                  </span>
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <TypingIndicator />
                        )}

                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-4 border-t border-[#00f0ff]/15 pt-3.5">
                            <div className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-[#00f0ff]">
                              <Globe className="h-3.5 w-3.5" />
                              <span>Verified Sources</span>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {msg.sources.map((src) => (
                                <a
                                  key={src.uri}
                                  href={src.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ferix-chat-surface group flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate text-xs font-medium text-slate-100 group-hover:text-white">
                                      {src.title}
                                    </div>
                                    {src.domain && (
                                      <div className="truncate text-[11px] text-[#00f0ff]/75">
                                        {src.domain}
                                      </div>
                                    )}
                                  </div>
                                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-colors group-hover:text-[#00f0ff]" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {!msg.error && msg.text && !(isLatestModel && isStreaming) && (
                          <div className="mt-4 flex items-center gap-2 border-t border-[#00f0ff]/10 pt-3">
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(msg.id, msg.text)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-white/[0.07] hover:text-white"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                  <span className="text-emerald-300">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span>Copy Reply</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </main>

        {/* Single Sleek Text Input Bar with + Attachment & Send Button */}
        <footer className="px-4 pt-2 pb-5 sm:px-8">
          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp,.txt,.md,.js,.jsx,.ts,.tsx,.py,.html,.css,.json,.csv,.log,.yml,.yaml,.sh,.sql,.java,.cpp,.c,.go,.rs,.php,.xml"
              onChange={(e) => void handleFileChange(e)}
              className="hidden"
              aria-hidden="true"
            />

            {attachError && (
              <div className="mb-2 flex items-center justify-between rounded-xl border border-red-500/60 bg-red-950/70 px-3.5 py-2 text-xs text-red-200">
                <span>{attachError}</span>
                <button
                  type="button"
                  onClick={() => setAttachError(null)}
                  className="ml-2 text-red-300 hover:text-white"
                  aria-label="Dismiss attachment error"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {pendingAttachment && (
              <div className="mb-2.5 flex items-center">
                <div className="ferix-chat-surface inline-flex items-center gap-2.5 rounded-2xl px-3 py-2 text-xs text-slate-200">
                  {pendingAttachment.kind === "image" ? (
                    <>
                      <img
                        src={pendingAttachment.image.previewUrl}
                        alt={pendingAttachment.image.name}
                        className="h-10 w-10 rounded-lg border border-[#00f0ff]/35 object-cover"
                      />
                      <span className="max-w-[200px] truncate font-medium text-white">
                        {pendingAttachment.image.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <FileCode2 className="h-4 w-4 shrink-0 text-[#00f0ff]" />
                      <span className="max-w-[200px] truncate font-medium text-white">
                        {pendingAttachment.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        ({pendingAttachment.content.length} chars)
                      </span>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      playCyberTap();
                      setPendingAttachment(null);
                    }}
                    aria-label="Remove attached file"
                    className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div className="ferix-chat-surface flex items-end gap-2.5 rounded-full py-2 pr-2 pl-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.55)]">
              <button
                type="button"
                disabled={isStreaming}
                onClick={() => {
                  playCyberTap();
                  fileInputRef.current?.click();
                }}
                aria-label="Attach image or file"
                title="Attach image (PNG, JPG, WEBP) or code/text file"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#00f0ff]/25 bg-[#0a1220] text-[#00f0ff] transition-colors hover:border-[#00f0ff]/70 hover:bg-[#0284c7]/25 hover:text-white disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="Message Ferix AI..."
                aria-label="Message Ferix AI"
                className="max-h-[160px] min-h-[40px] flex-1 resize-none bg-transparent py-2 text-[15px] leading-relaxed text-white placeholder:text-slate-400 focus:outline-none"
              />

              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleStopStreaming}
                  aria-label="Stop generating"
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-slate-700 px-5 text-xs font-semibold text-white transition-colors hover:bg-slate-600 whitespace-nowrap"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim() && !pendingAttachment}
                  aria-label="Send message"
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-[#00c8ff] via-[#0284c7] to-[#1d4ed8] px-5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(0,240,255,0.35)] transition-all hover:shadow-[0_0_26px_rgba(0,240,255,0.55)] disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
                >
                  <span>Send</span>
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </form>
        </footer>
      </div>
    </div>
  );
}
