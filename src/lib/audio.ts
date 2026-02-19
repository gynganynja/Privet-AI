/**
 * Audio Service for Text-to-Speech (TTS)
 * Uses the browser's SpeechSynthesis API.
 */

export interface VoiceOption {
    uri: string;
    name: string;
    lang: string;
}

export const getAvailableVoices = (): VoiceOption[] => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];

    const voices = window.speechSynthesis.getVoices();
    return voices.map(v => ({
        uri: v.voiceURI,
        name: v.name,
        lang: v.lang
    }));
};

// Filter for Russian-capable voices
export const getRussianVoices = (): VoiceOption[] => {
    const all = getAvailableVoices();
    return all.filter(v => v.lang.toLowerCase().includes('ru'));
};

import { useAppStore } from "@/store";
import { generateSpeech } from "@/lib/openai";

let currentAudio: HTMLAudioElement | null = null;

// Helper to strip stress marks and ensure clean text for TTS
const cleanTextForTTS = (text: string): string => {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove combining diacritics (stress marks)
        .replace(/^[a-zA-Z\s]+$/, "") // Safety: If text is ONLY Latin (wrongly passed), maybe don't play? Or let it play but warn. For now, just strip stress.
        .normalize("NFC");
};

export const playText = async (
    text: string,
    options: {
        voiceURI?: string | null;
        speed?: number;
        lang?: string; // New: explicit language request
        onEnd?: () => void;
        onError?: () => void;
    } = {}
) => {
    if (typeof window === 'undefined') return;

    // Stop previous audio
    stopAudio();

    if (!text) return;

    // Sanitize text
    const cleanText = cleanTextForTTS(text);

    const { audioSettings, apiKey } = useAppStore.getState();

    // 1. OpenAI TTS Provider
    if (audioSettings.provider === 'openai' && apiKey) {
        try {
            const buffer = await generateSpeech(
                apiKey,
                cleanText, // Use cleaned text
                audioSettings.openaiVoice || 'alloy',
                options.speed || audioSettings.speed || 1.0
            );

            const blob = new Blob([buffer], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);

            const audio = new Audio(url);
            currentAudio = audio;

            audio.playbackRate = options.speed || audioSettings.speed || 1.0;
            audio.onended = () => {
                if (options.onEnd) options.onEnd();
                URL.revokeObjectURL(url);
            };
            audio.onerror = () => {
                if (options.onError) options.onError();
                URL.revokeObjectURL(url);
            };

            await audio.play();
            return;
        } catch (err) {
            console.error("OpenAI TTS Failed, falling back to browser.", err);
            // Fallback to browser execution below
        }
    }

    // 2. Browser TTS Provider (Fallback or Default)
    if (!window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(cleanText); // Use cleaned text

    // Defaults
    utterance.rate = options.speed || audioSettings.speed || 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Select Voice
    if (options.voiceURI) {
        const voices = window.speechSynthesis.getVoices();
        const selected = voices.find(v => v.voiceURI === options.voiceURI);
        if (selected) utterance.voice = selected;
    } else {
        // Auto-select based on requested lang (default to RU)
        const targetLang = options.lang || 'ru';
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang.toLowerCase().includes(targetLang.toLowerCase()));
        if (voice) utterance.voice = voice;
    }

    // Events
    if (options.onEnd) utterance.onend = options.onEnd;
    if (options.onError) utterance.onerror = options.onError;

    window.speechSynthesis.speak(utterance);
};

export const stopAudio = () => {
    if (typeof window !== 'undefined') {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
    }
};
