import OpenAI from 'openai';

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

export const generateResponse = async (apiKey: string, messages: ChatMessage[]) => {
    if (!apiKey) throw new Error("API Key is required");

    const client = getOpenAIClient(apiKey);

    try {
        const response = await client.chat.completions.create({
            model: "gpt-3.5-turbo", // or gpt-4o, configurable later
            messages: messages,
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
            model: "gpt-3.5-turbo",
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
            model: "tts-1",
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
            model: "whisper-1",
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
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are a lenient and encouraging Russian language tutor. Your goal is to keep the student motivated. 
                    Compare the Student's Answer to the Correct Answer based on the Prompt.
                    
                    Respond with a JSON object:
                    {
                        "isCorrect": boolean, // True if the meaning is basically correct, even with minor spelling errors or small grammar slips.
                        "isClose": boolean, // True if the meaning is mostly there but there's a significant error (like wrong word) or it's slightly messy.
                        "feedback": string // A short, encouraging message (max 12 words). Praise them if they are close!
                    }

                    Rules for Leniency:
                    - **Prioritize Meaning**: If they communicated the right idea, be generous.
                    - **Ignore Minor Slips**: A missing letter, a slightly wrong case ending, or a typo shouldn't necessarily fail them.
                    - **Communication First**: If you understand what they meant and it's 90% there, mark 'isCorrect: true'.
                    - **Feedback**: Be specific but kind. If they made a mistake, suggest the correction gently.
                    - **Wrong Language**: Still mark as Incorrect if they answer in the wrong language, but explain kindly.`
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
            model: "gpt-3.5-turbo",
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
