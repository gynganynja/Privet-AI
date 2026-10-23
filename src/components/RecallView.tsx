import { useState } from "react";
import type { DrillModule } from "@/types/lesson";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeedbackSheet } from "@/components/FeedbackSheet";
import { useAppStore } from "@/store";
import { AudioPlayer } from "@/components/AudioPlayer";
import { AudioRecorder } from "@/components/AudioRecorder";
import { explainError } from "@/lib/openai";
import { normalizeText, validateInput } from "@/lib/answerValidation";

// Same leniency as answer keys: ignore case, punctuation, stress marks and ё/е.
const LENIENT = { ignore_punctuation: true, ignore_stress_marks: true, accept_ё_as_е: true };

export function RecallView({ module, onComplete, onResult }: {
    module: DrillModule;
    onComplete?: () => void;
    onResult?: (isCorrect: boolean) => void;
}) {
    const { apiKey, logError } = useAppStore();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [inputAnswer, setInputAnswer] = useState("");

    // Feedback State
    const [feedback, setFeedback] = useState<{
        isOpen: boolean;
        type: "success" | "error" | "info" | null;
        title: string;
        description: string;
        correctAnswer?: string;
    }>({
        isOpen: false,
        type: "success",
        title: "",
        description: ""
    });

    const question = module.exercises[currentIndex];

    const handleCheck = () => {
        if (!inputAnswer.trim()) return;

        let isCorrect = false;
        let correctAnswerText = "";
        let validationFeedback: string | undefined;

        if (question.type === 'input') {
            const q = question;
            correctAnswerText = q.correctAnswer || (q.answer_key?.accepted_answers_base?.[0] || "");

            if (q.answer_key) {
                const validation = validateInput(inputAnswer, q.answer_key);
                isCorrect = validation.isCorrect;
                validationFeedback = validation.feedback;
            } else {
                isCorrect = normalizeText(inputAnswer, LENIENT) === normalizeText(correctAnswerText, LENIENT);
            }
        } else if (question.type === 'cloze') {
            correctAnswerText = question.correctAnswer || "";
            isCorrect = inputAnswer.trim().toLowerCase() === correctAnswerText.toLowerCase();
        } else if (question.type === 'transformation') {
            correctAnswerText = question.transformed || "";
            isCorrect = inputAnswer.trim().toLowerCase() === correctAnswerText.toLowerCase();
        }

        onResult?.(isCorrect);
        if (!isCorrect) {
            logError('recall_translation', {
                prompt: 'prompt' in question ? question.prompt : 'Recall',
                error: inputAnswer,
                correct: correctAnswerText,
            });
        }

        const description = isCorrect
            ? "You got it right."
            : (validationFeedback || ('explanation' in question && question.explanation) || "Review the correct answer below.");

        setFeedback({
            isOpen: true,
            type: isCorrect ? "success" : "error",
            title: isCorrect ? "Excellent!" : "Not quite",
            description,
            correctAnswer: correctAnswerText
        });
    };

    const handleExplain = async () => {
        if (!apiKey || !question) return null;

        let qText = "Translation exercise";
        if (question.type === 'input') qText = question.prompt;
        else if (question.type === 'cloze') qText = question.question;
        else if (question.type === 'transformation') qText = question.instruction;
        else if ('question' in question) qText = question.question;

        const correct = feedback.correctAnswer || "";

        return await explainError(apiKey, qText || "Question", inputAnswer, correct);
    };

    const handleNext = () => {
        setFeedback(prev => ({ ...prev, isOpen: false }));
        setInputAnswer("");

        if (currentIndex < module.exercises.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            if (onComplete) onComplete();
        }
    };

    return (
        <div className="space-y-6 max-w-md mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center space-y-2 mb-8">
                <Badge variant="outline" className="uppercase tracking-widest text-xs">Recall</Badge>
                <h3 className="text-xl font-bold">Translate to Russian</h3>
            </div>

            <Card className="border-0 shadow-lg overflow-hidden">
                <CardContent className="p-8 space-y-8">
                    {/* Prompt */}
                    <div className="text-center space-y-4">
                        {(question.type === 'input') && (
                            <>
                                <h2 className="text-2xl font-medium text-foreground">
                                    {question.prompt || "Translate"}
                                </h2>
                                {question.textToDisplay && question.textToDisplay !== question.prompt && (
                                    <p className="text-sm text-muted-foreground">{question.textToDisplay}</p>
                                )}
                            </>
                        )}
                        {/* Audio hint: plays the answer, for when the learner is stuck */}
                        {question.audio_text_ru && <div className="flex justify-center">
                            <AudioPlayer
                                text={question.audio_text_ru || ""}
                                disabled={!question.audio_text_ru}
                                variant="ghost"
                                size="lg"
                                className="rounded-full bg-primary/5 text-primary h-12 w-12"
                                iconClassName="h-6 w-6"
                            />
                        </div>}
                    </div>

                    {/* Input Area */}
                    <div className="relative">
                        <Input
                            value={inputAnswer}
                            onChange={(e) => setInputAnswer(e.target.value)}
                            placeholder="Type in Russian..."
                            className="bg-muted/30 border-0 border-b-2 border-input rounded-none px-4 py-8 text-xl text-center focus-visible:ring-0 focus-visible:border-primary"
                            onKeyDown={(e) => e.key === 'Enter' && !feedback.isOpen && handleCheck()}
                            disabled={feedback.isOpen}
                            lang="ru"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            autoFocus
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <AudioRecorder onTranscriptionComplete={setInputAnswer} disabled={feedback.isOpen} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Button
                onClick={handleCheck}
                className="w-full h-14 text-lg"
                size="lg"
                disabled={!inputAnswer.trim() || feedback.isOpen}
            >
                Check Answer
            </Button>

            <FeedbackSheet
                isOpen={feedback.isOpen}
                type={feedback.type ?? "info"}
                title={feedback.title}
                description={feedback.description}
                correctAnswer={feedback.correctAnswer}
                onAction={handleNext}
                actionLabel={currentIndex < module.exercises.length - 1 ? "Next Question" : "Finish Recall"}
                onExplain={handleExplain}
            />
        </div>
    );
}
