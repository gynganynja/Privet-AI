import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Volume2, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { playText } from "@/lib/audio";
import { useAppStore } from "@/store";

// Helper to extract parts: "Ya {{live}} in Moscow" -> ["Ya ", "{{live}}", " in Moscow"]
// Actually, LLM usually gives "Ya ___ v Moskve" and we expect the answer.
// Let's assume textWithBlanks is "Ya ___ v Moskve" and correctAnswer is "zhivu".

interface ClozeDrillProps {
    question: {
        textWithBlanks: string;
        correctAnswer: string;
        translation: string;
        explanation?: string;
        audio_text_ru?: string;
        hint?: string;
    };
    onComplete: (isCorrect: boolean) => void;
}

export function ClozeDrill({ question, onComplete }: ClozeDrillProps) {
    const { audioSettings } = useAppStore();
    const [input, setInput] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [showHint, setShowHint] = useState(false);

    const checkAnswer = () => {
        const correct = input.trim().toLowerCase() === question.correctAnswer.toLowerCase();
        setIsCorrect(correct);
        setIsSubmitted(true);
        onComplete(correct);

        if (correct && audioSettings.autoPlay && question.audio_text_ru) {
            playText(question.audio_text_ru, {
                voiceURI: audioSettings.voiceURI,
                speed: audioSettings.speed,
                lang: 'ru'
            });
        }
    };

    // Render text with input box replacing the blank (___)
    const renderSentence = () => {
        // Simple string replacement for now. 
        // We assume "___" is the placeholder.
        const parts = question.textWithBlanks.split("___");

        if (parts.length === 1) return <p className="text-lg font-medium">{question.textWithBlanks}</p>;

        return (
            <div className="flex flex-wrap items-center justify-center gap-2 text-xl font-medium leading-relaxed">
                <span lang="ru">{parts[0]}</span>
                <Input
                    className={cn(
                        "w-32 text-center h-10 border-b-2 border-x-0 border-t-0 rounded-none focus-visible:ring-0 px-1 font-bold",
                        isSubmitted && isCorrect ? "text-green-600 border-green-500" :
                            isSubmitted && !isCorrect ? "text-red-600 border-red-500" : "border-primary"
                    )}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isSubmitted}
                    onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                    placeholder="?"
                    autoFocus
                    lang="ru"
                />
                <span lang="ru">{parts[1]}</span>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full justify-between gap-6">
            <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">

                {renderSentence()}

                <p className="text-muted-foreground italic">{question.translation}</p>

                {showHint && question.hint && (
                    <div className="text-sm bg-yellow-50 text-yellow-800 px-3 py-1 rounded animate-in fade-in">
                        Hint: {question.hint}
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {!isSubmitted ? (
                    <div className="flex gap-2">
                        {question.hint && (
                            <Button variant="ghost" size="icon" onClick={() => setShowHint(true)} title="Show Hint">
                                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        )}
                        <Button className="w-full" size="lg" onClick={checkAnswer} disabled={!input.trim()}>
                            Check Answer
                        </Button>
                    </div>
                ) : (
                    <div className={cn(
                        "p-4 rounded-lg flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2",
                        isCorrect ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"
                    )}>
                        {isCorrect ? <CheckCircle2 className="h-6 w-6 mt-0.5 shrink-0" /> : <XCircle className="h-6 w-6 mt-0.5 shrink-0" />}
                        <div className="flex-1 text-left">
                            <p className="font-bold">{isCorrect ? "Correct!" : "Incorrect"}</p>
                            {!isCorrect && <p>Answer: <span className="font-bold">{question.correctAnswer}</span></p>}
                            {question.explanation && <p className="text-sm mt-1 opacity-90">{question.explanation}</p>}
                        </div>
                        {question.audio_text_ru && (
                            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => playText(question.audio_text_ru!, { voiceURI: audioSettings.voiceURI, speed: audioSettings.speed, lang: 'ru' })}>
                                <Volume2 className="h-5 w-5" />
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
