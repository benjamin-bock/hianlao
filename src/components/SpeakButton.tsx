// 🔊 button — plays the native/generated Lao audio for a vocab entry.
'use client';

import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { speakItem } from '@/lib/speech';
import type { VocabEntry } from '@/data/types';

export function SpeakButton({ item, className = '' }: { item: VocabEntry; className?: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <button
      className={`icon-btn speak-btn ${playing ? 'playing' : ''} ${className}`}
      title="Listen"
      aria-label="Listen"
      onClick={async () => {
        setPlaying(true);
        await speakItem(item);
        setPlaying(false);
      }}
    >
      <Volume2 />
    </button>
  );
}
