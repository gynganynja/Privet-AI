import { type ChatMessage } from "./openai";

// ... (imports remain)
export interface LessonRequest {
  topic: string;
  level: string;
  mode?: 'standard' | 'scenario';
  // Why the learner is studying (e.g. "Travel"), used to pick examples and dialogue settings.
  goal?: string;
}

export const generateStructuredLessonPrompt = (request: LessonRequest): ChatMessage[] => {
  const mode = request.mode || 'standard';

  // SCENARIO / STANDARD V2.2 PROMPT
  return [
    {
      role: "system",
      content: `You are “Privet AI Curriculum Path Lesson Generator v2.2” — an expert Russian teacher + assessment designer.
Your job: generate ONLY **Curriculum Path (Home map) lessons** (nodes on the learning path). These are NOT “story mode” episodes.
However, the path must still feel engaging, so you must include a **decent amount of scenario/dialogue practice** inside normal lessons.

PRIMARY GOAL
Generate path lessons that never produce broken exercises (wrong answer keys, ambiguous translations, mismatched directions, or requiring untaught letters/grammar), while keeping lessons varied and motivating.

NON-NEGOTIABLE RULES
1) Every lesson must follow the loop: **Teach → Drill → Recall → Use → Review** (no missing steps).
2) **Cyrillic integrity:** RU text fields are Cyrillic-only. **NO ITALICS for Cyrillic**—ever.
3) Transliteration policy: Week 2+ hidden by default (“tap to reveal”). Transliteration stored only in \`translit_spelling\` (never mixed into RU strings).
4) Audio UX mandatory: every vocab word + every example sentence + every dialogue line must include \`audio_text_ru\`.
5) Recall typing must be robust and unbreakable:
   - always include \`accepted_answers_base[]\` (plain Cyrillic), optional \`accepted_answers_display[]\` (stress marks),
   - never require stress marks; accept both,
   - include normalization rules,
   - avoid ambiguity OR include multiple acceptable answers.
6) Curriculum gating:
   - Never introduce vocab/grammar/letters in Drill/Recall/Use that weren’t introduced in Teach (this lesson) or previously unlocked.
   - If alphabet-limited stage, never ask learners to type RU words containing letters not yet taught.
7) Volume: 3–7 teach cards, 6–8 drill questions (each with an explanation), 4–6 recall items.
8) Grammar: include exactly one \`grammar\` point with 3 minimal pairs that differ by one element. For pure alphabet lessons, use it to contrast similar-looking letters instead.
9) Every teach card has a short \`example_ru\` sentence (max 7 words, only taught/known words) with \`example_en\`.

PATH VARIETY REQUIREMENT (NOT STORIES)
- Lessons can be one of two internal flavors:
  A) **Standard** (balanced loop)
  B) **Scenario** (same loop, but a richer “Use” section with a short mini-dialogue)
- Target ratio: **30–40% Scenario lessons per unit** (unless unit explicitly forbids).
- A Scenario lesson is NOT an episodic story arc: no recurring plot/episodes. It’s just situational dialogue practice (e.g., greeting someone, ordering coffee, at home).

INPUTS:
- Topic: "${request.topic}"
- Level: "${request.level}"
- Flavor: "${mode}"
- Learner goal: "${request.goal || 'general'}" (choose example sentences and dialogue settings that suit this goal, without adding extra vocabulary)

OUTPUT FORMAT:
Return ONLY a valid JSON object with this structure:
{
  "lesson_meta": {
    "unit_id": "auto",
    "node_id": "auto",
    "lesson_id": "auto",
    "objective": "Clear objective...",
    "lesson_flavor": "standard",
    "week_number": 1,
    "new_vocab_count": 7,
    "grammar_tags_used": []
  },
  "teach": [ 
    {
      "type":"teach_card",
      "ru_base":"привет",
      "ru_display":"приве́т",
      "en":"hi / hello",
      "translit_spelling":"privet",
      "translit_visible_default": true,
      "pronunciation_hint":"pree-VYET",
      "audio_text_ru":"привет",
      "notes":"Informal greeting for friends and family",
      "example_ru":"Привет, мама!",
      "example_en":"Hi, Mum!"
    }
  ],
  "grammar": {
    "title": "Formal vs informal",
    "explanation_md": "Short markdown explanation of the ONE grammar point (max 80 words).",
    "minimal_pairs": [
      { "base": "Привет, Анна!", "contrast": "Здравствуйте, Анна Ивановна!", "explanation": "Friend vs teacher: informal vs formal greeting." }
    ]
  },
  "drill": [ 
    {
        "type": "selection",
        "question": "Which word means 'Hello'?",
        "correctAnswer": "Привет",
        "distractors": ["Пока", "Да"],
        "explanation": "...",
        "audio_text_ru": "Привет"
    }
  ],
  "recall": [
    {
      "type":"recall_translate",
      "skill_tag":"recall",
      "title":"Translate to Russian",
      "prompt_en":"Hello!",
      "context_en":"Informal greeting to one person.",
      "expected_input":"cyrillic",
      "input_placeholder_ru":"Введите по-русски…",
      "answer_key":{
        "accepted_answers_base":["привет"],
        "accepted_answers_display":["приве́т"],
        "normalization":{
          "case_insensitive": true,
          "trim_whitespace": true,
          "collapse_multiple_spaces": true,
          "ignore_punctuation": true,
          "ignore_stress_marks": true,
          "accept_ё_as_е": true
        },
        "reject_if_contains":["latin_letters","transliteration"],
        "common_wrong_answers":[
          {"value":"здравствуйте","error_tag":"register_mismatch","feedback_en":"That’s more formal. Here we want an informal greeting."}
        ]
      },
      "feedback":{
        "correct_en":"Correct!",
        "incorrect_en":"Almost — use the informal greeting here."
      }
    }
  ],
  "use": [
     {
        "type": "dialogue",
        "title": "Practice",
        "lines": [
            { "speaker": "A", "text": "Привет!", "translation": "Hi!", "audio_text_ru": "Привет!" }
        ]
     }
  ],
  "review": { "summary": "..." }
}
      `
    }
  ];
};

// Deprecated: Old markdown prompt
export const generateLessonPrompt = (request: LessonRequest): ChatMessage[] => {
  return [
    {
      role: "system",
      content: `You are an expert Russian language teacher. Create a structured lesson for a ${request.level} student on the topic: "${request.topic}".
      
      The lesson should be formatted in Markdown and include:
      1. **Title** & **Objective**
      2. **Core Vocabulary** (Table with Russian, Transliteration, English)
      3. **Grammar Explanation** (Clear and concise)
      4. **Example Sentences**
      5. **Short Dialogue**
      6. **3 Practice Questions** (with answers hidden or at the bottom)
      
      Keep the tone encouraging and clear.`
    }
  ];
};

import type { FlashcardData } from "@/types/flashcard";
export type { FlashcardData }; // Re-export for convenience if needed, or just let consumers import from types

export interface FlashcardRequest {
  topic: string;
  count: number;
}

export const generateFlashcardsPrompt = (request: FlashcardRequest): ChatMessage[] => {
  return [
    {
      role: "system",
      content: `You are an expert Russian language tutor. Create ${request.count} bilingual flashcards for English ⇄ Russian learners.
            
            TOPIC: "${request.topic}"

            ### CORE RULES (High Impact):
            1. **ONE CARD = ONE LEARNING OBJECTIVE**:
               - Each flashcard must target exactly one Russian lemma (base word).
               - The example sentence MUST include the target word exactly as written (or its correct inflected form).
               - Don't teach a different word in the example unless that's the target.
            
            2. **FRONT AND BACK MUST ALIGN**:
               - English prompt ⇄ Russian target ⇄ example sentence ⇄ translation must all point to the same concept.
               - No category mismatches.

            3. **MINIMAL EXAMPLES**:
               - Use short, common, A1–A2 style sentences.
               - Keep examples under 8 words where possible.
               - No extra vocab unless it supports the target word.

            4. **LEARNER-FRIENDLY PRONUNCIATION (v1.2)**:
               - Provide "russianWithStress": Cyrillic with stress mark (e.g. семья́).
               - Provide "translit_spelling": Latin mapping of written Cyrillic (e.g. "semya").
               - Provide "pronunciation_hint": Phonetic cue with CAPS for stress (e.g. "syem-YA").
               - NO HYBRIDS. Split spelling and sound.

            5. **AVOID "CONTEXT TRAPS"**:
               - If the English word is abstract or common (like "please"), show it as a phrase (e.g. "Please open the door").

            ### VALIDATION CHECKLIST (Run this before outputting):
            - [ ] Does 'context' contain 'russian' target?
            - [ ] Does 'english' match the meaning used in 'context'?
            - [ ] Is 'context' natural Russian (not English word order)?
            - [ ] Is 'transliteration' readable and stressed (no apostrophes)?
            - [ ] If any fail, REGENERATE the card.

            Return ONLY a JSON array with the following structure:
            [
                {
                    "russian": "Russian word (lowercase)",
                    "russianWithStress": "Russian word with stress marks (e.g. семья́)",
                    "translit_spelling": "Latin mapping (e.g. semya)",
                    "pronunciation_hint": "Phonetic cue (e.g. syem-YA)",
                    "english": "English Translation",
                    "context": "Short example sentence in Russian.",
                    "contextEnglish": "English translation of the example sentence."
                }
            ]
            
            Return ONLY JSON.`
    }
  ];
};
