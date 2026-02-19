import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowDown, CheckCircle2, XCircle, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { playText } from "@/lib/audio";
import { useAppStore } from "@/store";

interface TransformationDrillProps {
    question: {
        instruction: string;
        original: string;
        transformed: string;
        hint?: string;
        explanation?: string;
        audio_text_ru?: string; // Audio of the CORRECT transformed version
    };
    onComplete: (isCorrect: boolean) => void;
}

export function TransformationDrill({ question, onComplete }: TransformationDrillProps) {
    const { audioSettings } = useAppStore();
    const [input, setInput] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    const checkAnswer = () => {
        // Lenient check (case insensitive, trim)
        const normalizedInput = input.trim().toLowerCase().replace(/[.,!]/g, "");
        const normalizedTarget = question.transformed.trim().toLowerCase().replace(/[.,!]/g, "");

        const correct = normalizedInput === normalizedTarget;
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

    return (
        <div className="flex flex-col h-full justify-between gap-6">
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                <h3 className="text-muted-foreground font-medium uppercase tracking-wide text-sm mb-2">{question.instruction}</h3>

                <div className="p-4 bg-muted/30 rounded-lg border w-full max-w-sm">
                    <p className="text-xl font-medium" lang="ru">{question.original}</p>
                </div>

                <div className="flex justify-center text-muted-foreground/50">
                    <ArrowDown className="h-6 w-6 animate-bounce" />
                </div>

                <Input
                    className={cn(
                        "text-center text-xl p-6 font-medium max-w-sm",
                        isSubmitted && isCorrect ? "border-green-500 bg-green-50 text-green-900" :
                            isSubmitted && !isCorrect ? "border-red-500 bg-red-50 text-red-900" : ""
                    )}
                    placeholder="Type transformed result..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isSubmitted}
                    onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                    lang="ru"
                    autoFocus
                />
            </div>

            <div className="space-y-4">
                {!isSubmitted ? (
                    <Button className="w-full" size="lg" onClick={checkAnswer} disabled={!input.trim()}>
                        Check Answer
                    </Button>
                ) : (
                    <div className={cn(
                        "p-4 rounded-lg flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2",
                        isCorrect ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900"
                    )}>
                        {isCorrect ? <CheckCircle2 className="h-6 w-6 mt-0.5 shrink-0" /> : <XCircle className="h-6 w-6 mt-0.5 shrink-0" />}
                        <div className="flex-1 text-left">
                            <p className="font-bold">{isCorrect ? "Correct!" : "Incorrect"}</p>
                            {!isCorrect && <p>Answer: <span className="font-bold" lang="ru">{question.transformed}</span></p>}
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
