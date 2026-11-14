import { useCallback, useEffect, useState } from "react";
import { ChatWorkspace } from "./components/ChatWorkspace";
import { FlameIntroOverlay } from "./components/FlameIntroOverlay";
import { WelcomeView } from "./components/WelcomeView";
import type { AssistantMode, Conversation } from "./types";
import {
  isSoundEnabled,
  playCyberTap,
  setSoundEnabled,
} from "./utils/soundEngine";

const STORAGE_KEY = "ferix_ai_conversations_v1";

function createConversation(mode: AssistantMode = "ideas"): Conversation {
  return {
    id: crypto.randomUUID(),
    title: "New Conversation",
    mode,
    depth: "detailed",
    messages: [],
    followUpSuggestions: [],
    updatedAt: Date.now(),
  };
}

function normalizeSavedMode(mode: string): AssistantMode {
  if (mode === "code") return "code";
  if (mode === "research" || mode === "study") return "research";
  if (mode === "ideas" || mode === "writing") return "ideas";
  return "general";
}

function loadInitialConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [createConversation("ideas")];
    const parsed = JSON.parse(raw) as Array<Omit<Conversation, "mode"> & { mode: string }>;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [createConversation("ideas")];
    }
    return parsed.map((conv) => ({
      ...conv,
      mode: normalizeSavedMode(conv.mode),
    }));
  } catch {
    return [createConversation("ideas")];
  }
}

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(
    loadInitialConversations
  );
  const [activeId, setActiveId] = useState<string>(() => conversations[0]?.id || "");
  const [view, setView] = useState<"welcome" | "chat">("welcome");
  const [pendingAutoPrompt, setPendingAutoPrompt] = useState<{
    conversationId: string;
    text: string;
  } | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [introKey, setIntroKey] = useState(1);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(isSoundEnabled);

  const handleToggleSound = useCallback(() => {
    setSoundEnabledState((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      if (next) {
        playCyberTap();
      }
      return next;
    });
  }, []);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  const handleReplayIntro = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Ferix AI... Represent.");
        utterance.pitch = 0.72;
        utterance.rate = 0.88;
        window.speechSynthesis.speak(utterance);
      } catch {
        // Ignore speech synthesis errors in restricted environments
      }
    }
    setIntroKey((k) => k + 1);
    setShowIntro(true);
  }, []);

  useEffect(() => {
    try {
      const serializable = conversations.slice(0, 30).map((conv) => ({
        ...conv,
        messages: conv.messages.map((m) => ({
          ...m,
          attachmentPreview: undefined,
          generatedImageUrl: m.generatedImageUrl?.startsWith("data:")
            ? undefined
            : m.generatedImageUrl,
        })),
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    } catch {
      // Ignore storage quota errors
    }
  }, [conversations]);

  const activeConversation =
    conversations.find((c) => c.id === activeId) ||
    conversations[0] ||
    createConversation("ideas");

  const handleNewConversation = (mode: AssistantMode = "ideas"): string => {
    const next = createConversation(mode);
    setConversations((prev) => [next, ...prev]);
    setActiveId(next.id);
    return next.id;
  };

  const handleStartChat = (options?: {
    initialPrompt?: string;
    mode?: AssistantMode;
  }) => {
    const targetMode = options?.mode || "ideas";
    const prompt = options?.initialPrompt?.trim();

    if (prompt) {
      const emptyCurrent =
        activeConversation.messages.length === 0 ? activeConversation : null;
      if (emptyCurrent) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === emptyCurrent.id ? { ...c, mode: targetMode } : c
          )
        );
        setActiveId(emptyCurrent.id);
        setPendingAutoPrompt({ conversationId: emptyCurrent.id, text: prompt });
      } else {
        const newId = handleNewConversation(targetMode);
        setPendingAutoPrompt({ conversationId: newId, text: prompt });
      }
    } else if (options?.mode) {
      if (activeConversation.messages.length === 0) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversation.id ? { ...c, mode: targetMode } : c
          )
        );
      } else {
        handleNewConversation(targetMode);
      }
    }

    setView("chat");
  };

  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        const fresh = createConversation("ideas");
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) {
        setActiveId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleUpdateConversation = (
    id: string,
    updater: (prev: Conversation) => Conversation
  ) => {
    setConversations((prev) =>
      prev.map((conv) => (conv.id === id ? updater(conv) : conv))
    );
  };

  return (
    <>
      {showIntro && (
        <FlameIntroOverlay
          key={introKey}
          onComplete={handleIntroComplete}
        />
      )}

      {view === "welcome" ? (
        <WelcomeView
          onStartChat={handleStartChat}
          onReplayIntro={handleReplayIntro}
          introActive={showIntro}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />
      ) : (
        <ChatWorkspace
          activeConversation={activeConversation}
          onUpdateConversation={handleUpdateConversation}
          onBackHome={() => setView("welcome")}
          pendingAutoPrompt={pendingAutoPrompt}
          onClearPendingAutoPrompt={() => setPendingAutoPrompt(null)}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />
      )}
    </>
  );
}
