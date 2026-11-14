let introVoiceSpoken = false;

function selectPreferredVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  const englishVoices = voices.filter((v) =>
    v.lang.toLowerCase().startsWith("en")
  );
  const pool = englishVoices.length > 0 ? englishVoices : voices;

  // Prefer deeper / neural-sounding English voice names when available
  const preferredKeywords = [
    "daniel",
    "david",
    "mark",
    "guy",
    "alex",
    "aria",
    "google us english",
    "google uk english male",
    "natural",
  ];
  for (const keyword of preferredKeywords) {
    const match = pool.find((v) => v.name.toLowerCase().includes(keyword));
    if (match) return match;
  }
  return pool[0] || null;
}

export function hasSpokenFerixIntro(): boolean {
  return introVoiceSpoken;
}

export function speakFerixIntro(options?: { force?: boolean }): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  const force = options?.force ?? false;
  if (!force && introVoiceSpoken) {
    return;
  }

  try {
    const synth = window.speechSynthesis;
    if (force) {
      synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance("Ferix AI... Represent.");
    utterance.pitch = 0.72;
    utterance.rate = 0.88;
    utterance.volume = 1;

    const voice = selectPreferredVoice(synth.getVoices());
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      introVoiceSpoken = true;
    };
    utterance.onend = () => {
      introVoiceSpoken = true;
    };
    utterance.onerror = () => {
      // Blocked by autoplay policy or interrupted; keep fallback active if not forced
    };

    if (force) {
      introVoiceSpoken = true;
    }

    synth.speak(utterance);
  } catch {
    // Web Speech API unavailable in current runtime
  }
}
