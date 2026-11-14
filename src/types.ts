export type AssistantMode = "general" | "code" | "research" | "ideas";
export type ResponseDepth = "concise" | "detailed";

export interface GroundingSource {
  title: string;
  uri: string;
  domain?: string;
}

export interface ImageAttachment {
  name: string;
  mimeType: string;
  data: string; // base64 without data URL prefix
  previewUrl: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  createdAt: number;
  attachmentPreview?: string;
  attachmentName?: string;
  generatedImageUrl?: string;
  generatedImagePrompt?: string;
  sources?: GroundingSource[];
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  mode: AssistantMode;
  depth: ResponseDepth;
  messages: ChatMessage[];
  followUpSuggestions: string[];
  updatedAt: number;
}

export interface ModeDefinition {
  id: AssistantMode;
  label: string;
  shortLabel: string;
  shortDesc: string;
  starterPrompts: Array<{
    title: string;
    prompt: string;
  }>;
}

export const ASSISTANT_MODES: ModeDefinition[] = [
  {
    id: "general",
    label: "All-Rounder AI",
    shortLabel: "All-Rounder AI",
    shortDesc:
      "Versatile coding, live web-grounded research, and clear step-by-step answers.",
    starterPrompts: [
      {
        title: "Explain & solve fast",
        prompt:
          "Explain how OAuth 2.0 PKCE works step by step and show a clean JavaScript example.",
      },
      {
        title: "Compare tech stacks",
        prompt:
          "Compare Vite, Next.js, and Astro in 2026 for building fast full-stack web apps.",
      },
      {
        title: "Plan a focused week",
        prompt:
          "Help me structure a realistic 5-day deep work schedule for shipping a software project.",
      },
      {
        title: "Debug tricky behavior",
        prompt:
          "Why do React useEffect cleanup functions run before re-renders, and how do I avoid race conditions?",
      },
    ],
  },
  {
    id: "code",
    label: "Pro Coder & Debugger",
    shortLabel: "Pro Coder & Debugger",
    shortDesc:
      "Clean HTML, JavaScript, TypeScript, and Python with syntax-highlighted code blocks and root-cause fixes.",
    starterPrompts: [
      {
        title: "Build responsive HTML/JS UI",
        prompt:
          "Write clean HTML, CSS, and vanilla JavaScript for an accessible modal dialog with keyboard trap and Escape close.",
      },
      {
        title: "Python async pipeline",
        prompt:
          "Write a clean Python asyncio script with aiohttp and bounded semaphore concurrency plus error retries.",
      },
      {
        title: "Fix React state bugs",
        prompt:
          "Show me how to prevent stale closures and race conditions in a React live-search hook using AbortController.",
      },
      {
        title: "Express middleware pattern",
        prompt:
          "Write a TypeScript Express rate-limiter middleware using a sliding window and clear error responses.",
      },
    ],
  },
  {
    id: "research",
    label: "GitHub & Web Researcher",
    shortLabel: "GitHub & Web Researcher",
    shortDesc:
      "Pulls live solutions, libraries, and discussions from GitHub, Reddit, Stack Overflow, and docs with clickable sources.",
    starterPrompts: [
      {
        title: "Research best libraries",
        prompt:
          "Search GitHub and developer discussions for the best lightweight TypeScript validation libraries right now.",
      },
      {
        title: "Find real Stack Overflow fixes",
        prompt:
          "Find common causes and community-verified fixes for CORS preflight failures in Express + Vite.",
      },
      {
        title: "Compare community consensus",
        prompt:
          "Summarize what Reddit and GitHub maintainers recommend for SQLite vs PostgreSQL in small production apps.",
      },
      {
        title: "Check latest framework docs",
        prompt:
          "Look up the latest Tailwind CSS v4 theme configuration patterns and CSS variable best practices.",
      },
    ],
  },
  {
    id: "ideas",
    label: "Smart Idea & Suggestions",
    shortLabel: "Smart Idea & Suggestions",
    shortDesc:
      "Brainstorms step-by-step plans, product angles, and architectural roadmaps like an expert mentor.",
    starterPrompts: [
      {
        title: "Architect a side project",
        prompt:
          "Mentor me through a step-by-step MVP roadmap for an AI developer productivity tool I can ship in 2 weeks.",
      },
      {
        title: "Brainstorm portfolio builds",
        prompt:
          "Suggest 5 original full-stack engineering project ideas that stand out on GitHub with concrete technical depth.",
      },
      {
        title: "Level up code quality",
        prompt:
          "Give me an actionable checklist to turn a working prototype repo into a clean, portfolio-ready codebase.",
      },
      {
        title: "Refine product positioning",
        prompt:
          "Brainstorm 4 sharp feature improvements and user onboarding hooks for a distraction-free AI workspace.",
      },
    ],
  },
];

export const LANDING_CAPABILITIES = [
  {
    number: "01.",
    title: "Precision Code & Debugging",
    description:
      "Generate production-ready code, squash complex bugs, and refactor architectures with zero fluff and one-click copyable blocks.",
    mode: "code" as AssistantMode,
    actionLabel: "Launch Pro Coder & Debugger",
  },
  {
    number: "02.",
    title: "Real-Time GitHub & Web Intel",
    description:
      "Extract live documentation, battle-tested libraries, and verified fixes directly from GitHub, Reddit, and Stack Overflow.",
    mode: "research" as AssistantMode,
    actionLabel: "Launch GitHub & Web Researcher",
  },
  {
    number: "03.",
    title: "Strategic Architecture & Ideation",
    description:
      "Transform raw concepts into actionable roadmaps, system designs, and high-leverage execution plans.",
    mode: "ideas" as AssistantMode,
    actionLabel: "Launch Smart Idea & Suggestions",
  },
];
