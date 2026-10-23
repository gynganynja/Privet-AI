import OpenAI from 'openai';
import { CHAT_MODEL, TTS_MODEL, TRANSCRIBE_MODEL } from '@/config';

// This function will be used to get the client with the user's API key
export const getOpenAIClient = (apiKey: string) => {
    return new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Required for client-side usage
    });
};

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export const generateResponse = async (apiKey: string, messages: ChatMessage[], options: { json?: boolean } = {}) => {
    if (!apiKey) throw new Error("API Key is required");

    const client = getOpenAIClient(apiKey);

    try {
        const response = await client.chat.completions.create({
            model: CHAT_MODEL,
            messages: messages,
            ...(options.json && { response_format: { type: "json_object" as const } }),
        });
        return response.choices[0].message;
    } catch (error) {
        console.error("OpenAI API Error:", error);
        throw error;
    }
};

export const translateWord = async (apiKey: string, word: string, context: string) => {
    if (!apiKey) throw new Error("API Key is required");

    const client = getOpenAIClient(apiKey);

    try {
        const response = await client.chat.completions.create({
            model: CHAT_MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are a translator. Translate the given word or phrase into English based on the provided context. Return ONLY the translation, no extra text. If the word has multiple meanings, provide the most relevant one for the context. If it's a grammar form, briefly mention the base form (e.g. 'went (past of go)')."
                },
                {
                    role: "user",
                    content: `Word: "${word}"\nContext: "${context}"`
                }
            ],
            max_tokens: 50,
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error("Translation Error:", error);
        return "Error translating.";
    }
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

export interface ValidationResult {
    isCorrect: boolean;
    isClose: boolean;
    feedback: string;
}

export const validateAnswer = async (apiKey: string, prompt: string, userAnswer: string, correctAnswer: string): Promise<ValidationResult> => {
    if (!apiKey) throw new Error("API Key is required");

    const client = getOpenAIClient(apiKey);

    try {
        const response = await client.chat.completions.create({
            model: CHAT_MODEL,
            messages: [
                {
                    role: "system",
                    content: `You are an encouraging but accurate Russian tutor checking a learner's answer.
Compare the Student Answer to the Correct Answer for the given Prompt.

Respond with a JSON object:
{
    "isCorrect": boolean, // The answer is right: same meaning AND correct grammar (case endings, gender, verb form).
    "isClose": boolean,   // Not correct, but nearly: the right words with one grammar slip or a real spelling mistake.
    "feedback": string    // Max 15 words. Kind and specific; when wrong, name the exact fix.
}

Rules:
- Never penalise: capitalisation, punctuation, missing stress marks, е instead of ё, or a different but equally natural word order or synonym.
- Do penalise: wrong case endings, wrong gender agreement, wrong verb aspect/person, or a different meaning. These are what the learner is here to practise, so mark them isCorrect: false (isClose: true if everything else is right).
- An answer in the wrong language is incorrect; explain kindly.`
                },
                {
                    role: "user",
                    content: `Prompt: "${prompt}"\nCorrect Answer: "${correctAnswer}"\nStudent Answer: "${userAnswer}"`
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("No response from validation");

        return JSON.parse(content) as ValidationResult;
    } catch (error) {
        console.error("Validation Error:", error);
        // Fallback to simple comparison if AI fails
        const cleanUser = userAnswer.trim().toLowerCase();
        const cleanCorrect = correctAnswer.trim().toLowerCase();
        const match = cleanUser === cleanCorrect;
        return {
            isCorrect: match,
            isClose: !match && cleanCorrect.includes(cleanUser) && cleanUser.length > 2,
            feedback: match ? "Correct!" : "Checking failed, simple match used."
        };
    }
};

export const explainError = async (apiKey: string, question: string, userAnswer: string, correctAnswer: string) => {
    if (!apiKey) throw new Error("API Key is required");
    const client = getOpenAIClient(apiKey);

    try {
        const response = await client.chat.completions.create({
            model: CHAT_MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are a helpful Russian tutor. Explain briefly (max 2 sentences) why the student's answer is incorrect. Focus on grammar (case, gender, number) or vocabulary difference."
                },
                {
                    role: "user",
                    content: `Question: "${question}"\nCorrect Answer: "${correctAnswer}"\nStudent Answer: "${userAnswer}"`
                }
            ],
            max_tokens: 60,
        });
        return response.choices[0].message.content;
    } catch (error) {
        console.error("Explanation Error:", error);
        return "Could not generate explanation.";
    }
};
