"use client";

import { useEffect, useState } from "react";

type Props = {
  text: string;
  className?: string;
};

export default function SpeakButton({ text, className = "" }: Props) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported("speechSynthesis" in window);
  }, []);

  function speak() {
    const clean = text.trim();
    if (!clean) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={speak}
      disabled={!text.trim()}
      aria-label={`Pronounce ${text}`}
      title="Pronounce"
      className={`rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 ${className}`}
    >
      {speaking ? "🔊..." : "🔊"}
    </button>
  );
}
