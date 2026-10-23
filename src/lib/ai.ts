import Anthropic from "@anthropic-ai/sdk";
import { useAppStore, type AIProvider } from "@/store";
import { CLAUDE_MODEL } from "@/config";
import { openaiComplete, type ChatMessage } from "@/lib/openai";

/*
 * Provider-neutral text generation. Lessons, chat, answer checking and
 * explanations go through here and run on whichever provider the learner
 * picked in Settings (OpenAI or Claude), using their own key.
 */

type Effort = "low" | "medium" | "high";

interface CompleteOptions {
    json?: boolean;            // Ask for a JSON reply
    schema?: Record<string, unknown>; // Claude: enforce this JSON schema with structured outputs
    maxTokens?: number;
    effort?: Effort;           // Claude: how hard to think
}

export const providerKey = (state: { aiProvider: AIProvider; apiKey: string; anthropicKey: string }) =>
    state.aiProvider === "anthropic" ? state.anthropicKey : state.apiKey;

/** True when the selected provider has a key, i.e. AI features can run. */
export const useAIReady = () => useAppStore((s) => !!providerKey(s));

export const providerName = (provider: AIProvider) => (provider === "anthropic" ? "Claude" : "OpenAI");

export async function complete(messages: ChatMessage[], options: CompleteOptions = {}): Promise<string> {
    const state = useAppStore.getState();
    const key = providerKey(state);
    if (!key) throw new Error(`Add your ${providerName(state.aiProvider)} API key in Settings first.`);

    if (state.aiProvider === "openai") {
        return openaiComplete(key, messages, { json: options.json, maxTokens: options.maxTokens });
    }
    return claudeComplete(key, messages, options);
}

async function claudeComplete(apiKey: string, messages: ChatMessage[], options: CompleteOptions): Promise<string> {
    // Browser-only app: each learner supplies their own key, so direct browser access is intended.
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

    const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const turns: Anthropic.Beta.BetaMessageParam[] = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    // The conversation must open with a user turn (e.g. a lesson prompt that is all system text,
    // or a roleplay that starts with the character's greeting).
    if (turns.length === 0 || turns[0].role !== "user") {
        turns.unshift({ role: "user", content: options.json ? "Generate it now. Reply with the JSON only." : "Please begin." });
    }

    const stream = client.beta.messages.stream({
        model: CLAUDE_MODEL,
        max_tokens: options.maxTokens ?? 16000,
        ...(system && { system }),
        messages: turns,
        output_config: {
            effort: options.effort ?? "low",
            ...(options.schema && { format: { type: "json_schema" as const, schema: options.schema } }),
        },
        // If a safety classifier declines, retry on Anthropic's recommended fallback model.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
    });
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
        throw new Error("Claude declined this request. Try rephrasing the topic.");
    }
    return message.content
        .flatMap((block) => (block.type === "text" ? [block.text] : []))
        .join("")
        .trim();
}

// --- Tutor helpers --------------------------------------------------------------

export const translateWord = async (word: string, context: string) => {
    try {
        return await complete([
            {
                role: "system",
                content: "You are a translator. Translate the given word or phrase into English based on the provided context. Return ONLY the translation, no extra text. If the word has multiple meanings, provide the most relevant one for the context. If it's a grammar form, briefly mention the base form (e.g. 'went (past of go)').",
            },
            { role: "user", content: `Word: "${word}"\nContext: "${context}"` },
        ], { maxTokens: 4000 });
    } catch (error) {
        console.error("Translation Error:", error);
        return "Error translating.";
    }
};

export interface ValidationResult {
    isCorrect: boolean;
    isClose: boolean;
    feedback: string;
}

const VALIDATION_SCHEMA = {
    type: "object",
    properties: {
        isCorrect: { type: "boolean" },
        isClose: { type: "boolean" },
        feedback: { type: "string" },
    },
    required: ["isCorrect", "isClose", "feedback"],
    additionalProperties: false,
};

/** AI second opinion on a typed answer the lesson's answer key rejected. Throws on failure. */
export const validateAnswer = async (prompt: string, userAnswer: string, correctAnswer: string): Promise<ValidationResult> => {
    const content = await complete([
        {
            role: "system",
            content: VALIDATE_PROMPT,
        },
        {
            role: "user",
            content: `Prompt: "${prompt}"\nCorrect Answer: "${correctAnswer}"\nStudent Answer: "${userAnswer}"`,
        },
    ], { json: true, schema: VALIDATION_SCHEMA, maxTokens: 4000 });
    return JSON.parse(extractJson(content)) as ValidationResult;
};

export const explainError = async (question: string, userAnswer: string, correctAnswer: string) => {
    try {
        return await complete([
            {
                role: "system",
                content: "You are a helpful Russian tutor. Explain briefly (max 2 sentences) why the student's answer is incorrect. Focus on grammar (case, gender, number) or vocabulary difference.",
            },
            { role: "user", content: `Question: "${question}"\nCorrect Answer: "${correctAnswer}"\nStudent Answer: "${userAnswer}"` },
        ], { maxTokens: 4000 });
    } catch (error) {
        console.error("Explanation Error:", error);
        return "Could not generate explanation.";
    }
};

/** Pulls the JSON object or array out of a reply that may include code fences or a sentence around it. */
export function extractJson(text: string): string {
    const cleaned = text.replace(/```(?:json)?/g, "").trim();
    const start = cleaned.search(/[[{]/);
    const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
    return start !== -1 && end > start ? cleaned.slice(start, end + 1) : cleaned;
}

const VALIDATE_PROMPT = `You are an encouraging but accurate Russian tutor checking a learner's answer.
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
- An answer in the wrong language is incorrect; explain kindly.`;
