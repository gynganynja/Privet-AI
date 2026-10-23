import OpenAI from 'openai';
import { OPENAI_CHAT_MODEL, TTS_MODEL, TRANSCRIBE_MODEL } from '@/config';

export const getOpenAIClient = (apiKey: string) => {
    return new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // The app is browser-only; each learner uses their own key
    });
};

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export const openaiComplete = async (
    apiKey: string,
    messages: ChatMessage[],
    options: { json?: boolean; maxTokens?: number } = {}
): Promise<string> => {
    const response = await getOpenAIClient(apiKey).chat.completions.create({
        model: OPENAI_CHAT_MODEL,
        messages,
        ...(options.maxTokens && { max_tokens: options.maxTokens }),
        ...(options.json && { response_format: { type: "json_object" as const } }),
    });
    return response.choices[0].message.content ?? "";
};

export const generateSpeech = async (
    apiKey: string,
    input: string,
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy',
    speed: number = 1.0
) => {
    if (!apiKey) throw new Error("API Key is required");

    const client = getOpenAIClient(apiKey);

    try {
        const mp3 = await client.audio.speech.create({
            model: TTS_MODEL,
            voice: voice,
            input: input,
            speed: speed,
            response_format: "mp3",
        });

        return mp3.arrayBuffer();
    } catch (error) {
        console.error("OpenAI TTS Error:", error);
        throw error;
    }
};

export const transcribeAudio = async (apiKey: string, audioBlob: Blob, language: string = "ru") => {
    if (!apiKey) throw new Error("API Key is required");

    const client = getOpenAIClient(apiKey);

    // Convert Blob to File required by OpenAI SDK
    const file = new File([audioBlob], "audio.webm", { type: audioBlob.type });

    try {
        const transcription = await client.audio.transcriptions.create({
            file: file,
            model: TRANSCRIBE_MODEL,
            language: language,
            prompt: "Russian language exercise answer.", // Updated prompt to be more relevant
        });

        const text = transcription.text.trim();

        // ---------------------------------------------------------
        // HALLUCINATION GUARD
        // Whisper often outputs subtitle credits when fed silence.
        // We filter these known bad phrases.
        // ---------------------------------------------------------
        const HALLUCINATIONS = [
            "Редактор субтитров",
            "Корректор",
            "Субтитры",
            "Продолжение следует",
            "Перевод",
            "Озвучено",
        ];

        const isHallucination = HALLUCINATIONS.some(phrase =>
            text.includes(phrase) ||
            (text.length < 5 && /^[А-Яа-я]\./.test(text)) // Matches "А." initials often found in credits
        );

        if (isHallucination) {
            console.warn("Filtered Whisper Hallucination:", text);
            return ""; // Treat as silence
        }

        return text;
    } catch (error) {
        console.error("OpenAI Whisper Error:", error);
        throw error;
    }
};
