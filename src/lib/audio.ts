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
        lang?: string; // explicit language request
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
    const effectiveSpeed = options.speed ?? audioSettings.speed ?? 1.0; // Use specific option, then global setting, then default

    // 1. OpenAI TTS Provider
    if (audioSettings.provider === 'openai' && apiKey) {
        try {
            const buffer = await generateSpeech(
                apiKey,
                cleanText, // Use cleaned text
                audioSettings.openaiVoice || 'alloy',
                effectiveSpeed
            );

            const blob = new Blob([buffer], { type: 'audio/mpeg' });
            const url = URL.createObjectURL(blob);

            const audio = new Audio(url);
            currentAudio = audio;

            // OpenAI returns a file with the speed already baked in if possible? 
            // Actually OpenAI's speed parameter does change the duration of the audio file generated.
            // But HTMLAudioElement.playbackRate can ALSO change it. 
            // We should rely on OpenAI generation speed, and set playbackRate to 1.0 roughly, 
            // OR generate normal and use playbackRate. 
            // OpenAI API `speed` param: 0.25 to 4.0. We should use that.

            // Note: If we use the API speed param, we don't need to set audio.playbackRate unless we want EXTRA speed control.
            // taking a safe bet: API speed is better quality.

            audio.onended = () => {
                if (options.onEnd) options.onEnd();
                URL.revokeObjectURL(url);
                currentAudio = null;
            };
            audio.onerror = () => {
                if (options.onError) options.onError();
                URL.revokeObjectURL(url);
                currentAudio = null;
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
    utterance.rate = effectiveSpeed; // Browser range 0.1 to 10
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Select voice: an explicit one, else the saved preference (a Russian voice, so only for Russian text)
    const targetLang = options.lang || 'ru';
    const preferredURI = options.voiceURI ?? (targetLang === 'ru' ? audioSettings.voiceURI : null);
    const preferred = preferredURI ? window.speechSynthesis.getVoices().find(v => v.voiceURI === preferredURI) : undefined;
    utterance.lang = targetLang === 'ru' ? 'ru-RU' : targetLang;
    if (preferred) {
        utterance.voice = preferred;
    } else {
        // Auto-select based on requested lang
        const voices = window.speechSynthesis.getVoices();
        // Try to find a voice that matches the lang
        // Prefer "Google" voices if available on Chrome as they are often better quality
        const voice = voices.find(v => v.lang.toLowerCase().includes(targetLang.toLowerCase()) && v.name.includes('Google'))
            || voices.find(v => v.lang.toLowerCase().includes(targetLang.toLowerCase()));

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
