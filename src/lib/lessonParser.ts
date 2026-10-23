import type { FlashcardData } from "@/types/flashcard";
import { extractJson } from "@/lib/ai";
import type { DrillExercise, LessonContent, LessonModule } from "@/types/lesson";

/* eslint-disable @typescript-eslint/no-explicit-any -- this module adapts loosely-shaped LLM JSON */

/**
 * Converts the generator's JSON (V2 teach/drill/recall/use, or the legacy `modules`
 * shape) into the module list the lesson player renders.
 */
export function parseLessonResponse(raw: string): LessonContent {
    const data = JSON.parse(extractJson(raw));

    const modules: LessonModule[] = Array.isArray(data.modules) ? data.modules : [];

    if (modules.length === 0) {
        const teach: any[] = Array.isArray(data.teach) ? data.teach : [];
        if (teach.length > 0) {
            modules.push({
                type: 'vocabulary',
                title: 'New words',
                items: teach.map((t): FlashcardData => ({
                    russian: t.ru_base,
                    russianWithStress: t.ru_display,
                    english: t.en,
                    translit_spelling: t.translit_spelling,
                    pronunciation_hint: t.pronunciation_hint,
                    audio_text_ru: t.audio_text_ru || t.ru_base,
                    notes: t.notes,
                    context: t.example_ru || "",
                    contextEnglish: t.example_en || "",
                })).filter(item => item.russian && item.english),
            });
        }

        const grammar = data.grammar;
        if (grammar && (grammar.explanation_md || grammar.minimal_pairs?.length)) {
            modules.push({
                type: 'grammar',
                title: grammar.title || 'Grammar',
                content: grammar.explanation_md || "",
                minimalPairs: Array.isArray(grammar.minimal_pairs) ? grammar.minimal_pairs : [],
            });
        }

        const drill: any[] = (Array.isArray(data.drill) ? data.drill : []).map(repairExercise);
        if (drill.length > 0) {
            modules.push({ type: 'drill', title: 'Practice', exercises: drill });
        }

        const recall: any[] = Array.isArray(data.recall) ? data.recall : [];
        if (recall.length > 0) {
            modules.push({
                type: 'drill',
                title: 'Recall',
                exercises: recall.map((r): DrillExercise => ({
                    type: 'input',
                    subtype: 'translate_en_to_ru',
                    prompt: r.prompt_en || r.prompt,
                    textToDisplay: r.context_en,
                    correctAnswer: r.answer_key?.accepted_answers_base?.[0] || r.correctAnswer || "",
                    answer_key: r.answer_key,
                    explanation: r.feedback?.incorrect_en,
                    audio_text_ru: r.audio_text_ru,
                })),
            });
        }

        const use: any[] = Array.isArray(data.use) ? data.use : [];
        use.filter(u => u.type === 'dialogue' && Array.isArray(u.lines) && u.lines.length > 0)
            .forEach(d => modules.push({ ...d, title: d.title || 'Conversation' }));
    }

    if (modules.length === 0) {
        throw new Error("The lesson came back empty.");
    }

    return {
        title: data.lesson_meta?.objective || data.title || "New lesson",
        level: data.level || "A1",
        introduction: data.introduction || "",
        modules,
    };
}

/** All vocabulary items in a lesson, for adding to the review deck. */
export function lessonVocabulary(lesson: LessonContent): FlashcardData[] {
    return lesson.modules.flatMap(m =>
        m.type === 'vocabulary' ? m.items : m.type === 'story' ? (m.vocabulary ?? []) : []
    );
}

/** Fills in fields the model sometimes omits or names differently. */
function repairExercise(ex: any): any {
    const fixed = { ...ex };
    if (!fixed.type) {
        if (fixed.options || fixed.distractors) fixed.type = 'selection';
        else if (fixed.pair) fixed.type = 'match';
    }
    if (!fixed.correctAnswer && fixed.answer) fixed.correctAnswer = fixed.answer;
    return fixed;
}
