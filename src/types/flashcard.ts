

import type { SRSData } from "@/lib/srs";


export interface FlashcardData {
    russian: string;
    russianWithStress?: string; // e.g. семья́
    english: string;

    // v1.2 Transliteration Split
    translit_spelling?: string; // e.g. "zovut" (Written mapping)
    pronunciation_hint?: string; // e.g. "za-VOOT" (Spoken cue)
    transliteration?: string; // DEPRECATED: Legacy field (keep for backward compat)

    context: string;
    contextEnglish?: string;

    // Audio Metadata (v1.1 Guidelines)
    audio_text_ru?: string;
    audio_type?: 'word' | 'sentence' | 'dialogue_line' | 'instruction';
    audio_scope?: 'click_only' | 'auto_narrate_optional';
    audio_note?: string; // e.g. "stress on YA"

    // Phase 3: SRS Metadata
    srs?: SRSData;
}

