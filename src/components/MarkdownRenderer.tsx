import { useMemo, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import hljs from "highlight.js/lib/common";
import { Check, Copy } from "lucide-react";
import { playCyberTap } from "../utils/soundEngine";

interface CodeBlockProps {
  language: string;
  value: string;
}

function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const highlighted = useMemo(() => {
    try {
      const normalized = language.toLowerCase();
      if (normalized && hljs.getLanguage(normalized)) {
        return hljs.highlight(value, {
          language: normalized,
          ignoreIllegals: true,
        }).value;
      }
      return hljs.highlightAuto(value).value;
    } catch {
      return null;
    }
  }, [language, value]);

  const handleCopy = async () => {
    playCyberTap();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback ignored if blocked
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-[#00f0ff]/25 bg-[#04070d]/90 transition-colors hover:border-[#00f0ff]/45">
      <div className="flex items-center justify-between border-b border-[#00f0ff]/15 bg-[#0a1220]/90 px-4 py-2 text-xs text-slate-400">
        <span className="font-mono font-medium text-[#00f0ff]/90">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#00f0ff]/25 bg-[#0a1220] px-2.5 py-1 text-xs font-medium text-slate-200 transition-colors hover:border-[#00f0ff]/60 hover:bg-[#0284c7]/20 hover:text-white focus-visible:outline-2 focus-visible:outline-[#00f0ff] whitespace-nowrap shrink-0"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-300">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-slate-200">
        {highlighted ? (
          <code
            className="hljs"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        ) : (
          <code>{value}</code>
        )}
      </pre>
    </div>
  );
}

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="space-y-3 text-[15px] leading-[1.65] text-slate-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }: { children?: ReactNode }) => (
            <h1 className="mt-5 mb-2 font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-white">
              {children}
            </h1>
          ),
          h2: ({ children }: { children?: ReactNode }) => (
            <h2 className="mt-5 mb-2 font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-white">
              {children}
            </h2>
          ),
          h3: ({ children }: { children?: ReactNode }) => (
            <h3 className="mt-4 mb-1.5 font-[family-name:var(--font-display)] text-base font-semibold text-white">
              {children}
            </h3>
          ),
          p: ({ children }: { children?: ReactNode }) => (
            <p className="text-[15px] leading-[1.68] text-slate-200">{children}</p>
          ),
          ul: ({ children }: { children?: ReactNode }) => (
            <ul className="my-2.5 ml-5 list-disc space-y-1.5 text-slate-200 marker:text-blue-400">
              {children}
            </ul>
          ),
          ol: ({ children }: { children?: ReactNode }) => (
            <ol className="my-2.5 ml-5 list-decimal space-y-1.5 text-slate-200 marker:text-blue-400">
              {children}
            </ol>
          ),
          li: ({ children }: { children?: ReactNode }) => (
            <li className="pl-1 leading-[1.6]">{children}</li>
          ),
          strong: ({ children }: { children?: ReactNode }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          a: ({ href, children }: { href?: string; children?: ReactNode }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline decoration-blue-400/40 underline-offset-4 transition-colors hover:text-blue-300"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }: { children?: ReactNode }) => (
            <blockquote className="my-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-slate-300">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-5 border-white/[0.08]" />,
          table: ({ children }: { children?: ReactNode }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-white/[0.08]">
              <table className="w-full border-collapse text-left text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }: { children?: ReactNode }) => (
            <thead className="border-b border-white/[0.08] bg-white/[0.03] text-xs font-semibold text-slate-300">
              {children}
            </thead>
          ),
          th: ({ children }: { children?: ReactNode }) => (
            <th className="px-4 py-2.5">{children}</th>
          ),
          td: ({ children }: { children?: ReactNode }) => (
            <td className="border-t border-white/[0.06] px-4 py-2.5 text-slate-300 tabular-nums">
              {children}
            </td>
          ),
          code: ({ className, children }: { className?: string; children?: ReactNode }) => {
            const match = /language-([\w-]+)/.exec(className || "");
            const rawText = String(children ?? "").replace(/\n$/, "");
            const isBlock = Boolean(match) || rawText.includes("\n");

            if (isBlock) {
              return <CodeBlock language={match?.[1] || ""} value={rawText} />;
            }

            return (
              <code className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[13px] text-blue-200">
                {children}
              </code>
            );
          },
          pre: ({ children }: { children?: ReactNode }) => <>{children}</>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
