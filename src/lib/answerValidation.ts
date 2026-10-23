import type { AnswerKey } from "@/types/lesson";

export interface ValidationResult {
    isCorrect: boolean;
    isClose: boolean; // For typos or almost correct answers
    feedback?: string; // Specific feedback for common wrong answers
}

/**
 * Normalizes text based on the rules provided in the AnswerKey.
 */
export function normalizeText(text: string, rules: AnswerKey['normalization'] = {}): string {
    let normalized = text;

    if (rules.case_insensitive !== false) { // Default true
        normalized = normalized.toLowerCase();
    }

    if (rules.trim_whitespace !== false) { // Default true
        normalized = normalized.trim();
    }

    if (rules.collapse_multiple_spaces !== false) { // Default true
        normalized = normalized.replace(/\s+/g, ' ');
    }

    if (rules.ignore_punctuation) {
        // Remove common punctuation: . , ! ? " ' -
        normalized = normalized.replace(/[.,!?"'«»–—-]/g, '').replace(/\s+/g, ' ').trim();
    }

    if (rules.ignore_stress_marks) {
        // Remove combining acute accent (U+0301)
        normalized = normalized.normalize("NFD").replace(/\u0301/g, "").normalize("NFC");
    }

    if (rules.accept_ё_as_е) {
        normalized = normalized.replace(/ё/g, 'е');
    }

    return normalized;
}

/**
 * Checks if the user's input matches the AnswerKey.
 */
export function validateInput(input: string, key: AnswerKey): ValidationResult {
    const rules = key.normalization || {
        case_insensitive: true,
        trim_whitespace: true,
        collapse_multiple_spaces: true,
        ignore_punctuation: true,
        ignore_stress_marks: true,
        accept_ё_as_е: true
    };

    const normalizedInput = normalizeText(input, rules);

    // 1. Check for specific wrong answers first
    if (key.common_wrong_answers) {
        for (const wrong of key.common_wrong_answers) {
            if (normalizeText(wrong.value, rules) === normalizedInput) {
                return {
                    isCorrect: false,
                    isClose: false,
                    feedback: wrong.feedback_en
                };
            }
        }
    }

    // 2. Check rejection criteria
    if (key.reject_if_contains) {
        for (const reject of key.reject_if_contains) {
            if (reject === "latin_letters" && /[a-zA-Z]/.test(input)) {
                return { isCorrect: false, isClose: false, feedback: "Please use Cyrillic (Russian) letters." };
            }
            // Add other reject rules if needed
        }
    }

    // 3. Check against accepted answers
    for (const answer of key.accepted_answers_base) {
        if (normalizeText(answer, rules) === normalizedInput) {
            return { isCorrect: true, isClose: false, feedback: "Correct!" };
        }
    }

    // Check display answers too just in case
    if (key.accepted_answers_display) {
        for (const answer of key.accepted_answers_display) {
            if (normalizeText(answer, rules) === normalizedInput) {
                return { isCorrect: true, isClose: false, feedback: "Correct!" };
            }
        }
    }

    return { isCorrect: false, isClose: false, feedback: "Incorrect." };
}
