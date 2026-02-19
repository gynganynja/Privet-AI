import type { FlashcardData } from "@/types/flashcard";

export interface SavedLesson {
    id: string;
    content: LessonContent;
    createdAt: number;
    relatedDeckId?: string;
}

export interface LessonContent {
    title: string;
    level: string; // "Beginner" | "Intermediate" | "Advanced"
    introduction: string;
    modules: LessonModule[];
}

export type LessonModule =
    | VocabularyModule
    | GrammarModule
    | DrillModule
    | DialogueModule
    | StoryModule;

export interface VocabularyModule {
    type: 'vocabulary';
    title: string;
    instructor_narration?: string; // Teacher's voice intro
    items: FlashcardData[];
}

export interface GrammarModule {
    type: 'grammar';
    title: string;
    instructor_narration?: string;
    content: string; // Markdown supported
    minimalPairs: {
        base: string;     // e.g. "Стол"
        contrast: string; // e.g. "На столе"
        explanation: string; // "Base form vs. Location (Prepositional case)"

        // Audio Metadata
        audio_text_ru?: string;
        audio_type?: 'sentence';
    }[];
}

export interface DrillModule {
    type: 'drill';
    title: string;
    instructor_narration?: string;
    exercises: DrillExercise[];
}

export type DrillExercise =
    | {
        type: 'match';
        pair: { term: string; definition: string };

        // Audio Metadata
        audio_text_ru?: string;
        audio_type?: 'word';
    }
    | {
        type: 'selection';
        question: string;
        // Legacy:
        options?: string[];
        correctIndex?: number;
        // New Robust Format:
        correctAnswer?: string;
        distractors?: string[];

        explanation: string;
        tag?: 'case' | 'gender' | 'aspect' | 'vocab';

        // Audio Metadata (for dictation/listening)
        audio_text_ru?: string;
        audio_type?: 'sentence' | 'word';
    }
    | {
        type: 'input';
        subtype?: 'translate_ru_to_en' | 'translate_en_to_ru' | 'pronunciation';
        prompt: string;
        textToDisplay?: string; // Challenge text
        correctAnswer: string;
        translation?: string; // Literal meaning or hint
        explanation?: string; // Detailed teacher feedback
        audio_text_ru?: string;
        audio_type?: 'sentence' | 'word';
    }
    | {
        type: 'cloze'; // Fill-in-the-blank
        question: string;
        // We'll rely on a sentence with {{cloze}} syntax, OR structured segments
        textWithBlanks: string; // "Ya {{live}} v Moskve" -> user types "zhivu"
        correctAnswer: string; // "zhivu"
        hint?: string;
        translation: string;
        explanation?: string;
        audio_text_ru?: string;
    }
    | {
        type: 'transformation'; // Form change
        instruction: string; // "Change to Past Tense"
        original: string; // "Ya chitayu"
        transformed: string; // "Ya chital"
        hint?: string;
        explanation?: string;
        audio_text_ru?: string;
    }
    | {
        type: 'minimal_pair'; // Audio discrimination
        instruction: string;
        options: { word: string; meaning: string; isCorrect: boolean }[];
        audio_text_ru: string; // The sound to match
        explanation?: string;
    };

export interface DialogueModule {
    type: 'dialogue';
    title: string;
    instructor_narration?: string;
    lines: {
        speaker: string; // "A" or "B" (or name)
        text: string;
        translation: string;

        // Audio Metadata
        audio_text_ru?: string;
        audio_type?: 'dialogue_line';
    }[];
}

export interface StoryModule {
    type: 'story';
    title: string;
    instructor_narration?: string;
    content: string; // The full story text
    vocabulary: FlashcardData[]; // Key terms glossed
    comprehensionQuestions: DrillExercise[]; // Quick checks
    audio_text_ru?: string; // Full story audio
}
