import { useState } from "react";
import { ArrowRight, Check, RotateCcw, Volume2, VolumeX } from "lucide-react";
import type { AssistantMode } from "../types";
import { playCyberTap } from "../utils/soundEngine";
import { BlueFlameBackdrop } from "./BlueFlameBackdrop";
import { PhoenixLogo } from "./PhoenixLogo";

interface WelcomeViewProps {
  onStartChat: (options?: { initialPrompt?: string; mode?: AssistantMode }) => void;
  onReplayIntro: () => void;
  introActive?: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function WelcomeView({
  onStartChat,
  onReplayIntro,
  introActive = false,
  soundEnabled,
  onToggleSound,
}: WelcomeViewProps) {
  const [discordCopied, setDiscordCopied] = useState(false);

  const handleDiscordClick = async () => {
    playCyberTap();
    try {
      await navigator.clipboard.writeText("dev_x_niz");
      setDiscordCopied(true);
      window.setTimeout(() => setDiscordCopied(false), 2600);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = "dev_x_niz";
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        setDiscordCopied(true);
        window.setTimeout(() => setDiscordCopied(false), 2600);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col text-slate-100">
      {/* Continuous pure CSS/SVG blue-flame layer at z-index: 1 above #03060c body */}
      <BlueFlameBackdrop variant="welcome" />

      {/* Clean Minimal Top Bar at z-index: 20 */}
      <header
        style={{ zIndex: 20 }}
        className="sticky top-0 w-full border-b border-[#00f0ff]/15 bg-[#03060c]/60 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          {/* Top-left prominent glowing '▶ Play Intro' + clean mute/unmute speaker toggle */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                playCyberTap();
                window.scrollTo({ top: 0, behavior: "smooth" });
                onReplayIntro();
              }}
              className="inline-flex min-h-[38px] items-center gap-2 rounded-full border border-[#00f0ff]/65 bg-gradient-to-r from-[#00f0ff]/20 via-[#2563eb]/30 to-[#a855f7]/30 px-4 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(0,240,255,0.35),0_0_16px_rgba(168,85,247,0.22)] transition-all duration-150 hover:scale-[1.03] hover:border-[#00f0ff] hover:shadow-[0_0_28px_rgba(0,240,255,0.6),0_0_22px_rgba(168,85,247,0.4)] focus-visible:outline-2 focus-visible:outline-[#00f0ff] whitespace-nowrap shrink-0"
            >
              <span>▶ Play Intro</span>
            </button>

            <button
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? "Mute sound effects" : "Unmute sound effects"}
              title={soundEnabled ? "Sound ON — Click to mute" : "Sound OFF — Click to unmute"}
              className={`ferix-glass ferix-glass-interactive inline-flex h-[38px] w-[38px] items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-[#00f0ff] shrink-0 ${
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

          {/* Top-right: Small glowing blue-flame Ferix Phoenix logo + Powered by Ferix Engine */}
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <PhoenixLogo size="sm" showAmbient={false} />
            <span className="text-xs font-medium tracking-wide text-slate-300 sm:text-sm">
              Powered by{" "}
              <span className="bg-gradient-to-r from-[#e0faff] to-[#00f0ff] bg-clip-text font-semibold text-transparent">
                Ferix Engine
              </span>
            </span>
          </div>
        </div>
      </header>

      {/* Main UI Content at z-index: 10 with semi-transparent glass cards so blue flames glow behind them */}
      <main
        style={{ zIndex: 10 }}
        className={`relative flex flex-1 flex-col items-center justify-center gap-6 px-5 py-10 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          introActive
            ? "translate-y-3 opacity-0"
            : "translate-y-0 opacity-100"
        }`}
      >
        <div className="ferix-glass w-full max-w-2xl rounded-3xl px-7 py-10 text-center shadow-[0_24px_60px_rgba(0,0,0,0.55)] sm:px-12 sm:py-12">
          <PhoenixLogo size="hero" className="mb-5" />

          <p className="mb-3 text-xs font-semibold tracking-[0.22em] text-[#00f0ff]">
            NEXT-GEN INTELLIGENCE ENGINE
          </p>

          <h1 className="text-balance font-[family-name:var(--font-display)] text-[clamp(2.25rem,5vw,3.65rem)] font-bold leading-[1.12] tracking-tight text-white">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-white via-[#00f0ff] to-[#3b82f6] bg-clip-text text-transparent">
              Ferix AI
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-300 md:text-lg">
            Architect cleaner code, surface verified web intelligence, and
            execute ambitious ideas at lightspeed. Built for builders who refuse
            to settle for average.
          </p>

          {/* Single bold glowing primary CTA button defaulting to Plan mode */}
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => {
                playCyberTap();
                onStartChat({ mode: "ideas" });
              }}
              className="group inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full border border-[#00f0ff]/75 bg-gradient-to-r from-[#00c8ff] via-[#0284c7] to-[#1d4ed8] px-8 py-3.5 text-base font-semibold text-white shadow-[0_0_32px_rgba(0,240,255,0.45)] transition-all duration-200 hover:scale-[1.02] hover:border-[#00f0ff] hover:shadow-[0_0_44px_rgba(0,240,255,0.68)] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-[#00f0ff] whitespace-nowrap shrink-0"
            >
              <span>Chat with Ferix</span>
              <ArrowRight className="h-4.5 w-4.5 transition-transform duration-150 group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Sleek Frosted-Glass Info Card directly underneath 'Chat with Ferix' */}
        <section
          aria-labelledby="about-ferix-heading"
          className="ferix-glass-neon w-full max-w-2xl rounded-2xl px-7 py-6 text-center sm:px-10"
        >
          <h2
            id="about-ferix-heading"
            className="ferix-neon-title font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.16em] sm:text-base"
          >
            ABOUT FERIX INTELLIGENCE:
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-200 sm:text-[15px]">
            This AI has been created by Ferix Engine. Running on Version
            2.34.57 architecture, Ferix Intelligence is engineered to handle
            anything—combining global knowledge and real-time web intelligence
            to deliver 100% authentic advice, verified insights, and actionable
            suggestions.
          </p>
        </section>

        {/* First New Card: PRIVACY & SECURITY */}
        <section
          aria-labelledby="privacy-security-heading"
          className="ferix-glass-neon w-full max-w-2xl rounded-2xl px-7 py-7 text-left sm:px-10"
        >
          <h2
            id="privacy-security-heading"
            className="ferix-neon-title text-center font-[family-name:var(--font-display)] text-lg font-extrabold tracking-[0.12em] sm:text-xl"
          >
            PRIVACY &amp; SECURITY
          </h2>

          <ul className="mt-5 space-y-3.5 text-sm leading-relaxed text-slate-200 sm:text-[15px]">
            <li className="rounded-xl border border-[#00f0ff]/15 bg-[#03060c]/45 px-4 py-3">
              <span className="font-semibold text-[#00f0ff]">
                100% Private Storage:
              </span>{" "}
              Your conversations are fully private and isolated on Ferix Engine
              servers—zero third parties or outsiders can ever access your
              sessions.
            </li>
            <li className="rounded-xl border border-[#3b82f6]/20 bg-[#03060c]/45 px-4 py-3">
              <span className="font-semibold text-[#38bdf8]">
                Zero-Tracking Security:
              </span>{" "}
              Ferix AI is built with strict privacy protection and never
              tracks, profiles, or sells your personal details. Clearing your
              chat permanently erases your session data.
            </li>
            <li className="rounded-xl border border-[#a855f7]/25 bg-[#03060c]/45 px-4 py-3">
              <span className="font-semibold text-[#c084fc]">
                Important Guarantee:
              </span>{" "}
              Even if you keep your chat history saved, your data remains
              completely locked down with zero security loopholes or data leaks.
            </li>
          </ul>
        </section>

        {/* Second New Card: CUSTOM OS, EMULATORS & SYSTEM OPTIMIZERS */}
        <section
          aria-labelledby="custom-os-heading"
          className="ferix-glass-neon w-full max-w-2xl rounded-2xl px-7 py-7 text-center sm:px-10"
        >
          <h2
            id="custom-os-heading"
            className="ferix-neon-title font-[family-name:var(--font-display)] text-lg font-extrabold tracking-[0.1em] sm:text-xl"
          >
            CUSTOM OS, EMULATORS &amp; SYSTEM OPTIMIZERS
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-slate-200 sm:text-[15px]">
            Want custom OS builds, high-FPS emulators, or PC/mobile system
            optimizers? Chat directly with dev_x_niz on Discord — consulting and
            chatting are 100% FREE.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDiscordClick}
              className="inline-flex min-h-[42px] items-center justify-center gap-2.5 rounded-full border border-[#00f0ff]/65 bg-gradient-to-r from-[#0284c7]/45 via-[#2563eb]/55 to-[#a855f7]/55 px-6 py-2 text-xs font-semibold text-white shadow-[0_0_24px_rgba(0,240,255,0.28),0_0_20px_rgba(168,85,247,0.28)] transition-all duration-150 hover:scale-[1.02] hover:border-[#00f0ff] hover:shadow-[0_0_32px_rgba(0,240,255,0.45),0_0_28px_rgba(168,85,247,0.42)] focus-visible:outline-2 focus-visible:outline-[#00f0ff] sm:text-sm whitespace-nowrap shrink-0"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                className="shrink-0 text-[#c7d2fe]"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span>Message dev_x_niz on Discord</span>
            </a>

            {discordCopied && (
              <span
                role="status"
                aria-live="polite"
                className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Copied dev_x_niz!</span>
              </span>
            )}
          </div>

          <div className="mt-5 rounded-xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed font-medium text-amber-200 sm:text-[13px]">
            NOTICE: Consultation and chatting are completely free, however
            purchasing custom OS builds, emulators, or optimizers is strictly
            PAID.
          </div>
        </section>
      </main>

      <footer
        style={{ zIndex: 10 }}
        className="relative border-t border-[#00f0ff]/15 bg-[#03060c]/60 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-5 text-xs text-slate-400 lg:flex-row">
          <div className="flex items-center gap-2.5 text-slate-200">
            <PhoenixLogo size="sm" showAmbient={false} />
            <span className="bg-gradient-to-r from-white to-[#00f0ff] bg-clip-text font-[family-name:var(--font-display)] font-semibold text-transparent">
              Ferix AI
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-300">
              High-velocity intelligence for builders and problem solvers.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <span>
              Want to complain or send bug reports? Contact me on Discord:
            </span>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDiscordClick}
              className="ferix-glass ferix-glass-interactive inline-flex min-h-[36px] items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-indigo-100 hover:text-white focus-visible:outline-2 focus-visible:outline-[#00f0ff] whitespace-nowrap shrink-0"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                className="shrink-0 text-[#8ea1e1]"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span>Discord: dev_x_niz</span>
            </a>
            {discordCopied && (
              <span
                role="status"
                aria-live="polite"
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Copied!</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                playCyberTap();
                onReplayIntro();
              }}
              className="ferix-glass ferix-glass-interactive inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white focus-visible:outline-2 focus-visible:outline-[#00f0ff] whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#00f0ff]" />
              <span>Replay Intro</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
