import { type ChatMessage } from "./openai";

// ... (imports remain)
export interface LessonRequest {
  topic: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  mode?: 'standard' | 'story';
}

export const generateStructuredLessonPrompt = (request: LessonRequest): ChatMessage[] => {
  const mode = request.mode || 'standard';

  if (mode === 'story') {
    return [
      {
        role: "system",
        content: `You are an expert Russian language teacher. Create an interactive Story Lesson for a ${request.level} student on the topic: "${request.topic}".

        ### 0) GOAL:
        Create a "Comprehensible Input" experience. The user should learn through reading and listening to a story, then answering questions.

        ### 1) LESSON CONTRACT:
        - **Format**: Single 'story' module followed by comprehension check.
        - **Target**: **15-20 key vocabulary words** interwoven into the story.
        - **Story Length**: 300-500 words (appropriate for ${request.level}).
        - **Structure**:
           1. **Introduction**: Brief setup in English.
           2. **The Story**: Russian text. usage of key vocab.
           3. **Vocabulary List**: Definitions of the key words used.
           4. **Comprehension**: 5-8 questions about the plot.

        ### 2) CONTENT RULES:
        - **Russian**: Natural, slightly graded for level.
        - **Strict Transliteration**: Latin-only 'translit_spelling' and 'pronunciation_hint'.
        - **Audio**: Provide 'audio_text_ru' for the full story and all vocab.

        ### OUTPUT FORMAT:
        Return a single valid JSON object.

        Example Structure:
        {
          "title": "The [Topic] Story",
          "level": "${request.level}",
          "introduction": "Read this story about...",
          "modules": [
            {
              "type": "story",
              "title": "Story Title",
              "content": "Full Russian story text...",
              "vocabulary": [ ... ],
              "comprehensionQuestions": [ ... ]
            }
          ]
        }

        Return ONLY JSON.`
      }
    ];
  }

  // STANDARD MODE
  return [
    {
      role: "system",
      content: `You are an encouraging, English-speaking Russian language teacher. Create a strictly structured lesson for a ${request.level} student on the topic: "${request.topic}".

            ### 0) PRIME DIRECTIVE:
            Act like a teacher in a classroom.
            - **Direct Address**: Speak directly to the student ("Today we will learn...", "Notice how...").
            - **Instructional Tone**: Explanations should be simple, clear, and conversational in English.
            - **Closed Loop**: Teach -> Drill -> Recall -> Use -> Review.

            ### 1) LESSON CONTRACT (Constraints):
            - **Comprehensive Lesson**: This is a deep-dive. Target **20-30 minutes**.
            - **Strict Closed Loop**: Teach (Vocab 1) -> Drill -> Teach (Vocab 2) -> Drill -> Grammar -> Drill -> Dialogue.
            - **Teach**: **20-25 new items** total (split into 2-3 specific Vocabulary modules).
            - **Drill & Recall**: **Intense practice**. At least **6-10 questions** per Drill module.
            - **Exercise Types**: prioritized 'selection' (multiple choice with distractors) or 'input' (translation/dictation). Avoid 'match' unless strictly necessary.
            - **narrative**: Every module MUST include 'instructor_narration'.

            ### 2) CONTENT RULES:
            - **Russian Specifics**: Focus on cases, aspect, motion verbs, stress.
            - **Strict Transliteration (v1.2)**: 
              - 'translit_spelling': Latin mapping of written Cyrillic (e.g. "semya").
              - 'pronunciation_hint': Phonetic approximation (e.g. "syem-YA").
              - NO HYBRIDS (e.g. co-mye).
            - **Minimal Pairs**: For grammar, use contrast (Base vs Case, Process vs Result).
            - **Quality Gate**: Cyrillic ONLY for Russian text. Target word MUST be in example.
            
            ### 3) DRILL RULES (Critical):
            - **Mixed Translation**:
              - 50% Questions: English word -> Select Russian translation.
              - 50% Questions: Russian word -> Select English translation.
            - **Distractors**: Must be valid words in the TARGET language.
            - **NO English-to-English** or **Russian-to-Russian** questions.

            ### 4) AUDIO METADATA (Mandatory):
            - For every "russian", "text", "base", "contrast", or "question" (if dictation), provides:
              - "audio_text_ru": Exact Cyrillic text to speak.
              - "audio_type": "word" | "sentence" | "dialogue_line".
            
            ### OUTPUT FORMAT:
            Return a single valid JSON object.
            
            **CRITICAL STRUCTURE**: The "modules" array MUST contain at least 6 items in this order:
            1. "vocabulary" (First batch of ~7 words)
            2. "drill" (Practice first batch)
            3. "vocabulary" (Second batch of ~7 words)
            4. "drill" (Practice second batch)
            5. "grammar" (Focus on rules)
            6. "drill" (Mixed practice)
            7. "dialogue" (Extended context)

            interface LessonContent {
              title: string;
              level: string; 
              introduction: string; 
              modules: [
                  { 
                      "type": "vocabulary", 
                      "title": "Core Vocabulary", 
                      "items": [
                          { 
                              "russian": "...", 
                              "english": "...", 
                              "transliteration": "...", 
                              "audio_text_ru": "..." 
                          }
                      ] 
                  },
                  { 
                      "type": "drill", 
                      "title": "Drill Title", 
                      "exercises": [
                          { 
                              "type": "selection", 
                              "question": "...", 
                              "options": ["A", "B", "C"], 
                              "correctAnswer": "A",
                              "explanation": "Why..."
                          }
                      ] 
                  },
                  {
                      "type": "grammar",
                      "title": "Grammar Title",
                      "content": "Explanation in markdown...",
                      "minimalPairs": [
                          { "base": "...", "contrast": "...", "explanation": "..." }
                      ]
                  }
                  // ... ensure every module has a "type"
              ];
            }

            // ... (Use standard Module types as defined in previous prompts)
            
            Return ONLY JSON.`
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
