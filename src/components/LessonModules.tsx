import { useState, useEffect, useRef, useCallback } from "react";
import type { VocabularyModule, GrammarModule, DrillModule, DialogueModule } from "@/types/lesson";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight, AlertCircle, Volume2, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { useAppStore } from "@/store";
import { playText } from "@/lib/audio";
import { AudioPlayer } from "@/components/AudioPlayer";
import { AudioRecorder } from "@/components/AudioRecorder";
import { ClozeDrill } from "@/components/drills/ClozeDrill";
import { TransformationDrill } from "@/components/drills/TransformationDrill";
import { MinimalPairDrill } from "@/components/drills/MinimalPairDrill";
import { explainError, validateAnswer } from "@/lib/openai";
import { normalizeText, validateInput } from "@/lib/answerValidation";

// --- Helper Hook ---
function useLessonAudio() {
    return useCallback((text?: string, lang?: string) => {
        if (!text || !useAppStore.getState().audioSettings.enabled) return;
        playText(text, { lang });
    }, []);
}

// --- Teacher Narration Component ---
function TeacherNarration({ text }: { text?: string }) {
    const { audioSettings } = useAppStore();
    const playAudio = useLessonAudio();
    const hasPlayed = useRef(false);

    useEffect(() => {
        if (!text || !audioSettings.autoPlay || !audioSettings.narration || hasPlayed.current) return;
        const timer = setTimeout(() => {
            hasPlayed.current = true;
            playAudio(text, 'en');
        }, 600);
        return () => clearTimeout(timer);
    }, [text, audioSettings.autoPlay, audioSettings.narration, playAudio]);

    if (!text) return null;

    return (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
            <div className="space-y-1 flex-1">
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Teacher</p>
                <p className="text-base text-blue-900 dark:text-blue-100 leading-relaxed">{text}</p>
            </div>
            <AudioPlayer text={text} lang="en" className="text-blue-500 hover:text-blue-700 shrink-0" size="sm" />
        </div>
    );
}

// --- Vocabulary Module ---
export function VocabularyView({ module, onComplete }: { module: VocabularyModule; onComplete?: () => void }) {
    const playAudio = useLessonAudio();
    // Auto-complete vocabulary on mount (or could require clicking all cards?)
    useEffect(() => {
        if (onComplete) onComplete();
    }, [onComplete]);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <TeacherNarration text={module.instructor_narration} />
            <h3 className="text-xl font-bold">{module.title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {module.items.map((item, idx) => (
                    <Card key={idx} className="overflow-hidden border-l-4 border-l-primary/50 group hover:border-l-primary transition-all">
                        <CardContent className="p-4 flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-2xl font-bold text-primary" lang="ru">{item.russianWithStress || item.russian}</h4>
                                    {/* v1.2: Show pronunciation hint if available, fallback to legacy transliteration */}
                                    <p className="text-sm text-muted-foreground font-mono">
                                        {item.pronunciation_hint || item.transliteration}
                                    </p>
                                </div>
                                <AudioPlayer text={item.audio_text_ru || item.russian} />
                            </div>
                            <div className="mt-2 text-sm space-y-2">
                                <p className="font-semibold">{item.english}</p>
                                {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                                {item.context && (
                                    <button
                                        type="button"
                                        className="w-full text-left bg-muted/40 hover:bg-muted/70 p-2 rounded text-xs transition-colors"
                                        onClick={() => playAudio(item.context)}
                                    >
                                        <p lang="ru" className="font-medium">{item.context}</p>
                                        {item.contextEnglish && <p className="text-muted-foreground">{item.contextEnglish}</p>}
                                    </button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// --- Grammar Module ---
export function GrammarView({ module, onComplete }: { module: GrammarModule; onComplete?: () => void }) {
    // Auto-complete grammar on mount
    useEffect(() => {
        if (onComplete) onComplete();
    }, [onComplete]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <TeacherNarration text={module.instructor_narration} />
            <h3 className="text-xl font-bold">{module.title}</h3>

            <Card className="bg-muted/20">
                <CardContent className="p-4 prose prose-sm dark:prose-invert max-w-none">
                    {module.content ? (
                        <ReactMarkdown>{module.content}</ReactMarkdown>
                    ) : (
                        <p className="text-muted-foreground italic">No grammar explanation available.</p>
                    )}
                </CardContent>
            </Card>

            <div className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Minimal Pairs (Contrast)</h4>
                {module.minimalPairs && module.minimalPairs.map((pair, idx) => (
                    <div
                        key={idx}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-card hover:bg-muted/10 transition group relative"
                    >
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-blue-500">BASE</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-lg" lang="ru">{pair.base}</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-bold text-pink-500">CONTRAST</span>
                            <div className="flex justify-between items-center">
                                <p className="text-lg font-medium" lang="ru">{pair.contrast}</p>
                                <AudioPlayer text={pair.audio_text_ru || `${pair.base}. ${pair.contrast}`} size="sm" className="opacity-70 group-hover:opacity-100" />
                            </div>
                            <p className="text-sm text-muted-foreground border-l-2 border-primary/20 pl-2 mt-1">{pair.explanation}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Drill Module ---

export function DrillView({ module, onComplete, onResult }: {
    module: DrillModule;
    onComplete?: () => void;
    onResult?: (isCorrect: boolean) => void;
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [inputAnswer, setInputAnswer] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    // v1.3 Smart Validation State
    const [validationResult, setValidationResult] = useState<{ isCorrect: boolean; isClose: boolean; feedback: string } | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    // AI Explanation State
    const [aiExplanation, setAiExplanation] = useState<string | null>(null);
    const [isExplaining, setIsExplaining] = useState(false);

    // Phase 2: Error Logging
    const { logError, audioSettings, apiKey } = useAppStore();
    const playAudio = useLessonAudio();

    const shuffledCache = useRef<Map<number, { options: string[], correctIndex: number }>>(new Map());

    // Clear cache when module changes (new lesson)
    useEffect(() => {
        shuffledCache.current.clear();
    }, [module]);

    // Malformed AI exercises are repaired in lessonParser before they reach here.
    const question = module.exercises[currentIndex];

    const isLastQuestion = currentIndex === module.exercises.length - 1;

    // --- Client-Side Shuffling Logic ---
    let currentOptions: string[] = [];
    let currentCorrectIndex = -1;

    if (question.type === 'selection') {
        const cacheKey = currentIndex;

        // Initialize if not in cache
        if (!shuffledCache.current.has(cacheKey)) {
            // Case A: New Robust Format (correctAnswer + distractors)
            if (question.distractors && question.correctAnswer) {
                const opts = [question.correctAnswer, ...question.distractors];
                // Fisher-Yates Shuffle
                for (let i = opts.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [opts[i], opts[j]] = [opts[j], opts[i]];
                }
                const idx = opts.indexOf(question.correctAnswer);
                shuffledCache.current.set(cacheKey, { options: opts, correctIndex: idx });
            }
            // Case B: Legacy/Fallback (LLM provided options/index directly)
            else if (question.options) {
                // Trust the legacy data (or maybe we should try to fix it if correctAnswer is present?)
                // If correctAnswer is present, let's verify/fix the index to be safe.
                if (question.correctAnswer) {
                    // Try to find the real index
                    const realIdx = question.options.findIndex(opt => opt === question.correctAnswer);
                    if (realIdx !== -1) {
                        shuffledCache.current.set(cacheKey, { options: question.options, correctIndex: realIdx });
                    } else {
                        // Fallback to provided index
                        shuffledCache.current.set(cacheKey, { options: question.options, correctIndex: question.correctIndex ?? 0 });
                    }
                } else {
                    shuffledCache.current.set(cacheKey, { options: question.options, correctIndex: question.correctIndex ?? 0 });
                }
            } else {
                // Error state
                shuffledCache.current.set(cacheKey, { options: ["Error loading options"], correctIndex: -1 });
            }
        }

        const cached = shuffledCache.current.get(cacheKey);
        if (cached) {
            currentOptions = cached.options;
            currentCorrectIndex = cached.correctIndex;
        }
    }

    // Check for completion whenever state changes
    useEffect(() => {
        if (isLastQuestion && isSubmitted && onComplete) {
            onComplete();
        }
    }, [isLastQuestion, isSubmitted, onComplete]);

    // Auto-play audio if enabled
    useEffect(() => {
        // Only for standard drills. Specialized drills handle their own audio.
        if (question.type === 'selection' || question.type === 'input') {
            if (audioSettings.autoPlay && question.audio_text_ru) {
                const timer = setTimeout(() => {
                    playAudio(question.audio_text_ru);
                }, 500);
                return () => clearTimeout(timer);
            }
        }
    }, [currentIndex, question, audioSettings.autoPlay, playAudio]);

    // Reset state when question changes
    const nextQuestion = () => {
        if (currentIndex < module.exercises.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setInputAnswer("");
            setIsSubmitted(false);
            setValidationResult(null);
            setIsValidating(false);
            setAiExplanation(null); // Reset explanation
            setIsExplaining(false);
        }
    };

    // Generic handler for Smart Components
    const handleSmartComponentComplete = (isCorrect: boolean) => {
        if (onResult) onResult(isCorrect);

        if (!isCorrect) {
            let tag = 'drill_specialized';
            if (question.type === 'cloze') tag = 'cloze_grammar';
            if (question.type === 'transformation') tag = 'grammar_transformation';
            if (question.type === 'minimal_pair') tag = 'listening_discrimination';

            logError(tag, {
                prompt: 'Drill Question',
                error: 'Incorrect Selection', // We could pass more details from the component if needed
                correct: 'Detailed in drill'
            });
        }
        setIsSubmitted(true);
    };

    const checkSelection = (optionIndex: number) => {
        if (isSubmitted || question.type !== 'selection') return;
        setSelectedOption(optionIndex);
        const correct = optionIndex === currentCorrectIndex;

        // Simple validation for selection
        setValidationResult({
            isCorrect: correct,
            isClose: false,
            feedback: correct ? "Correct!" : "Incorrect."
        });

        if (onResult) onResult(correct);

        if (!correct) {
            logError(question.tag || 'general_selection', {
                prompt: question.question,
                error: currentOptions[optionIndex],
                correct: currentOptions[currentCorrectIndex]
            });
        }

        setIsSubmitted(true);
    };

    const checkInput = async () => {
        if (isSubmitted || question.type !== 'input') return;

        setIsValidating(true);

        // 1. Deterministic check against the lesson's answer key
        const local = question.answer_key
            ? validateInput(inputAnswer, question.answer_key)
            : (() => {
                const correct = normalizeText(inputAnswer) === normalizeText(question.correctAnswer || "");
                return { isCorrect: correct, isClose: false, feedback: correct ? "Correct!" : "Incorrect." };
            })();
        let result = { ...local, feedback: local.feedback || (local.isCorrect ? "Correct!" : "Incorrect.") };

        // 2. If the key says no, let the AI judge valid alternatives (synonyms, word order)
        if (!local.isCorrect && apiKey) {
            try {
                result = await validateAnswer(apiKey, question.prompt, inputAnswer, question.correctAnswer);
            } catch (error) {
                console.error("Validation failed", error);
            }
        }

        setValidationResult(result);
        const isAnswerCorrect = result.isCorrect;

        if (onResult) onResult(isAnswerCorrect);

        if (!isAnswerCorrect) {
            logError(question.subtype ? `input_${question.subtype}` : 'input_general', {
                prompt: question.prompt,
                error: inputAnswer,
                correct: question.correctAnswer
            });
        }

        setIsSubmitted(true);
        setIsValidating(false);
    };

    const handleExplain = async () => {
        if (!apiKey) return;
        setIsExplaining(true);
        try {
            const result = question.type === 'selection'
                ? await explainError(apiKey, question.question, currentOptions[selectedOption ?? 0], currentOptions[currentCorrectIndex] ?? "")
                : question.type === 'input'
                    ? await explainError(apiKey, question.prompt || "Question", inputAnswer, question.correctAnswer || "")
                    : null;
            setAiExplanation(result);
        } catch {
            setAiExplanation("Could not load explanation.");
        } finally {
            setIsExplaining(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-right-4 duration-300 min-h-[500px] flex flex-col">
            <TeacherNarration text={module.instructor_narration} />

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{module.title}</h3>
                <div className="flex items-center gap-2">
                    {/* Audio button for standard questions */}
                    {(question.type === 'selection' || question.type === 'input') && question.audio_text_ru && (
                        <AudioPlayer text={question.audio_text_ru} size="sm" />
                    )}
                    <Badge variant="outline">Question {currentIndex + 1} / {module.exercises.length}</Badge>
                </div>
            </div>

            <Card className="flex-1 flex flex-col">
                <CardContent className="p-6 flex-1 flex flex-col">

                    {/* --- SMART DRILLS --- */}
                    {question.type === 'cloze' && (
                        <ClozeDrill question={question} onComplete={handleSmartComponentComplete} />
                    )}

                    {question.type === 'transformation' && (
                        <TransformationDrill question={question} onComplete={handleSmartComponentComplete} />
                    )}

                    {question.type === 'minimal_pair' && (
                        <MinimalPairDrill question={question} onComplete={handleSmartComponentComplete} />
                    )}

                    {/* --- STANDARD DRILLS --- */}
                    {question.type === 'selection' && (
                        <>
                            <div className="space-y-2 mb-6">
                                {question.tag && <Badge variant="secondary" className="mb-2 uppercase text-[10px]">{question.tag}</Badge>}
                                <h4 className="text-xl font-medium leading-relaxed">{question.question}</h4>
                            </div>

                            <div className="grid gap-3 flex-1">
                                {currentOptions.map((opt, idx) => {
                                    let stateStyle = "hover:border-primary/50 cursor-pointer";
                                    if (isSubmitted) {
                                        if (idx === currentCorrectIndex) stateStyle = "border-green-500 bg-green-50 dark:bg-green-900/20";
                                        else if (idx === selectedOption) stateStyle = "border-red-500 bg-red-50 dark:bg-red-900/20";
                                        else stateStyle = "opacity-50";
                                    } else if (selectedOption === idx) {
                                        stateStyle = "border-primary bg-primary/5";
                                    }

                                    return (
                                        <button
                                            type="button"
                                            key={idx}
                                            className={cn("p-4 rounded-lg border-2 transition-all text-left text-lg", stateStyle)}
                                            onClick={() => checkSelection(idx)}
                                            disabled={isSubmitted}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {question.type === 'input' && (
                        <div className="flex-1 flex flex-col gap-6 justify-center">
                            <div className="text-center space-y-4">
                                <h4 className="text-lg text-muted-foreground">{question.prompt}</h4>
                                <h2 className="text-3xl font-bold" lang={question.subtype === 'translate_ru_to_en' || question.subtype === 'pronunciation' ? "ru" : "en"}>
                                    {question.subtype === 'pronunciation' ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <span lang="ru">{question.textToDisplay}</span>
                                            <AudioPlayer text={question.audio_text_ru || question.textToDisplay || ""} size="sm" className="mt-2" />
                                        </div>
                                    ) : (
                                        question.textToDisplay || question.translation
                                    )}
                                </h2>
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <Input
                                        className="text-center text-xl p-6 pr-12"
                                        placeholder={question.subtype === 'translate_en_to_ru' || question.subtype === 'pronunciation' ? "Type in Russian..." : "Type in English..."}
                                        value={inputAnswer}
                                        onChange={(e) => setInputAnswer(e.target.value)}
                                        disabled={isSubmitted || isValidating}
                                        onKeyDown={(e) => e.key === "Enter" && !isValidating && checkInput()}
                                        lang={question.subtype === 'translate_en_to_ru' || question.subtype === 'pronunciation' ? "ru" : "en"}
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        {/* Indicator for Smart Validation */}
                                        {apiKey && (
                                            <div title="AI Smart Validation Active" className="h-2 w-2 rounded-full bg-green-500/50 animate-pulse" />
                                        )}
                                        <AudioRecorder
                                            onTranscriptionComplete={(text) => setInputAnswer(text)}
                                            disabled={isSubmitted || isValidating}
                                            language={question.subtype === 'translate_ru_to_en' ? "en" : "ru"}
                                        />
                                    </div>
                                </div>
                                {!isSubmitted && (
                                    <Button className="w-full" size="lg" onClick={checkInput} disabled={!inputAnswer.trim() || isValidating}>
                                        {isValidating ? "Checking..." : "Check Answer"}
                                    </Button>
                                )}
                                {!apiKey && !isSubmitted && (
                                    <p className="text-[10px] text-center text-muted-foreground opacity-50">
                                        Basic check only. Set API Key for smart feedback.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- MATCH DRILL (Fallback) --- */}
                    {question.type === 'match' && (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                            <h4 className="text-xl font-medium text-muted-foreground">Match / Flashcard Review</h4>

                            <div className="text-center space-y-4 p-8 border-2 rounded-xl bg-card w-full max-w-md">
                                <h2 className="text-4xl font-bold text-primary" lang="ru">{question.pair.term}</h2>
                                {isSubmitted ? (
                                    <p className="text-2xl animate-in fade-in slide-in-from-bottom-2">{question.pair.definition}</p>
                                ) : (
                                    <p className="text-muted-foreground italic">What does this mean?</p>
                                )}
                            </div>

                            {!isSubmitted ? (
                                <Button className="w-full max-w-xs" size="lg" onClick={() => {
                                    setIsSubmitted(true);
                                    if (onResult) onResult(true); // Always count as correct for review
                                }}>
                                    Reveal Answer
                                </Button>
                            ) : !isLastQuestion && (
                                <Button className="w-full max-w-xs" size="lg" variant="secondary" onClick={nextQuestion}>
                                    Next <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            )}
                        </div>
                    )}

                    {/* --- FALLBACK FOR UNKNOWN TYPES --- */}
                    {!['selection', 'input', 'cloze', 'transformation', 'minimal_pair', 'match'].includes(question.type) && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                            <AlertCircle className="h-12 w-12 text-yellow-500" />
                            <h3 className="text-lg font-bold">Unknown Exercise Type</h3>
                            <p className="text-sm text-muted-foreground">
                                This exercise type <code>{(question as { type?: string }).type}</code> is not supported yet.
                            </p>
                            <pre className="text-xs text-left bg-muted p-4 rounded overflow-auto max-w-full">
                                {JSON.stringify(question, null, 2)}
                            </pre>
                            <Button onClick={() => {
                                setIsSubmitted(true);
                                if (onResult) onResult(true); // Skip
                            }}>
                                Skip Exercise
                            </Button>
                        </div>
                    )}

                    {/* Feedback for Standard Drills */}
                    {(question.type === 'selection' || question.type === 'input') && isSubmitted && validationResult && (
                        <div className={cn(
                            "rounded-lg p-4 mt-6 animate-in fade-in slide-in-from-bottom-2",
                            validationResult.isCorrect ? "bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-100" :
                                validationResult.isClose ? "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-100" :
                                    "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-100"
                        )}>
                            <div className="flex items-start gap-3">
                                {validationResult.isCorrect ? <CheckCircle2 className="h-5 w-5 mt-0.5" /> :
                                    validationResult.isClose ? <AlertCircle className="h-5 w-5 mt-0.5" /> :
                                        <XCircle className="h-5 w-5 mt-0.5" />}
                                <div className="space-y-2 w-full">
                                    <p className="font-bold">{validationResult.feedback}</p>
                                    {!validationResult.isCorrect && (
                                        <div className="mt-2 space-y-1">
                                            {question.type === 'input' && (
                                                <>
                                                    <p>Correct answer: <span className="font-bold select-all">{question.correctAnswer}</span></p>
                                                    {(question.explanation || question.translation) && (
                                                        <p className="text-sm opacity-80 italic">
                                                            {question.explanation || (question.subtype === 'translate_en_to_ru' ? "" : question.translation)}
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                    {question.type === 'selection' && (
                                        <p className="text-sm mt-1 opacity-90">{question.explanation}</p>
                                    )}

                                    {/* AI Explanation Button / Result */}
                                    {!validationResult.isCorrect && apiKey && (
                                        <div className="pt-2">
                                            {aiExplanation ? (
                                                <div className="p-3 bg-white/50 rounded-lg border border-black/5 animate-in fade-in">
                                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1 opacity-70">
                                                        <Sparkles className="h-3 w-3" /> AI Analysis
                                                    </div>
                                                    <p className="text-sm leading-relaxed">{aiExplanation}</p>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-auto p-0 hover:bg-transparent hover:underline"
                                                    onClick={handleExplain}
                                                    disabled={isExplaining}
                                                >
                                                    {isExplaining ? (
                                                        <>
                                                            <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Asking AI...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="h-3 w-3 mr-1" /> Explain Mistake
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Button (Bottom of Card) */}
                    {isSubmitted && !isLastQuestion && question.type !== 'match' && (
                        <div className="mt-6 flex justify-end">
                            <Button size="lg" variant="secondary" onClick={nextQuestion}>
                                Next question <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    )}

                </CardContent>
            </Card>

            {isSubmitted && isLastQuestion && (
                <p className="text-center text-muted-foreground text-sm animate-in fade-in">Drill complete — press Continue.</p>
            )}
        </div>
    );
}

// --- Dialogue Module ---
export function DialogueView({ module, onComplete }: { module: DialogueModule; onComplete?: () => void }) {
    const playAudio = useLessonAudio();
    const [showTranslation, setShowTranslation] = useState(false);

    // Auto-complete dialogue on mount
    useEffect(() => {
        if (onComplete) onComplete();
    }, [onComplete]);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto">
            <TeacherNarration text={module.instructor_narration} />
            <h3 className="text-xl font-bold text-center mb-6">{module.title}</h3>

            <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
                {module.lines && module.lines.length > 0 ? (
                    module.lines.map((line, idx) => {
                        const isLeft = line.speaker === "A" || idx % 2 === 0;
                        return (
                            <div key={idx} className={cn("flex flex-col max-w-[80%]", isLeft ? "mr-auto items-start" : "ml-auto items-end")}>
                                <div
                                    className={cn("p-4 rounded-2xl text-sm relative group cursor-pointer transition-colors border",
                                        isLeft ? "bg-card rounded-bl-none hover:border-primary/50" : "bg-primary text-primary-foreground rounded-br-none hover:opacity-90")}
                                    onClick={() => playAudio(line.audio_text_ru || line.text)}
                                >
                                    <div className="flex items-center gap-2">
                                        <p className="text-base font-medium" lang="ru">{line.text}</p>
                                        <Volume2 className={cn("h-3 w-3 shrink-0 opacity-50 group-hover:opacity-90 transition-opacity", isLeft ? "text-primary" : "text-primary-foreground")} />
                                    </div>
                                    {showTranslation && (
                                        <p className="text-xs mt-1 opacity-70 animate-in fade-in">{line.translation}</p>
                                    )}
                                </div>
                                <span className="text-[10px] text-muted-foreground mt-1 px-1">{line.speaker}</span>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center p-8 text-muted-foreground">
                        <p>No dialogue available.</p>
                    </div>
                )}
            </div>

            <div className="flex flex-col items-center gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => setShowTranslation(v => !v)}>
                    {showTranslation ? "Hide translation" : "Show translation"}
                </Button>
                <p className="text-xs text-muted-foreground">Tap a line to hear it. Try reading it aloud before checking the translation.</p>
            </div>
        </div>
    );
}
