import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, CheckCircle2, XCircle, Ear } from "lucide-react";
import { cn } from "@/lib/utils";
import { playText } from "@/lib/audio";
import { useAppStore } from "@/store";

interface MinimalPairDrillProps {
    question: {
        instruction: string;
        options: { word: string; meaning: string; isCorrect: boolean }[];
        audio_text_ru: string;
        explanation?: string;
    };
    onComplete: (isCorrect: boolean) => void;
}

export function MinimalPairDrill({ question, onComplete }: MinimalPairDrillProps) {
    const { audioSettings } = useAppStore();
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const playAudio = () => {
        playText(question.audio_text_ru, {
            voiceURI: audioSettings.voiceURI,
            speed: audioSettings.speed,
            lang: 'ru'
        });
    };

    // Auto-play on mount
    useState(() => {
        if (audioSettings.autoPlay) {
            setTimeout(playAudio, 500);
        }
    });

    const handleSelect = (idx: number) => {
        if (isSubmitted) return;

        setSelectedIdx(idx);
        const isCorrect = question.options[idx].isCorrect;
        setIsSubmitted(true);
        onComplete(isCorrect);
    };

    return (
        <div className="flex flex-col h-full justify-between gap-6 max-w-md mx-auto w-full">
            <div className="flex-1 flex flex-col items-center justify-center gap-8 text-center pt-8">
                <h3 className="text-muted-foreground font-medium">{question.instruction}</h3>

                <Button
                    variant="outline"
                    className="h-24 w-24 rounded-full shadow-lg border-4 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all"
                    onClick={playAudio}
                >
                    <Volume2 className="h-10 w-10 text-primary" />
                </Button>
                <p className="text-sm text-muted-foreground">Tap to listen</p>

                <div className="grid grid-cols-1 gap-4 w-full">
                    {question.options.map((opt, idx) => {
                        let stateStyle = "hover:border-primary/50 hover:bg-muted/50";
                        if (isSubmitted) {
                            if (opt.isCorrect) stateStyle = "border-green-500 bg-green-50 text-green-900";
                            else if (idx === selectedIdx) stateStyle = "border-red-500 bg-red-50 text-red-900";
                            else stateStyle = "opacity-50";
                        }

                        return (
                            <div
                                key={idx}
                                className={cn(
                                    "p-4 rounded-xl border-2 transition-all cursor-pointer flex justify-between items-center group",
                                    stateStyle
                                )}
                                onClick={() => handleSelect(idx)}
                            >
                                <div className="text-left">
                                    <p className="text-lg font-bold" lang="ru">{opt.word}</p>
                                    <p className="text-sm text-muted-foreground opacity-80 group-hover:opacity-100">{opt.meaning}</p>
                                </div>
                                {isSubmitted && opt.isCorrect && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                                {isSubmitted && !opt.isCorrect && idx === selectedIdx && <XCircle className="h-5 w-5 text-red-600" />}
                            </div>
                        );
                    })}
                </div>
            </div>

            {isSubmitted && question.explanation && (
                <div className="p-4 bg-muted/30 rounded-lg text-sm mb-4 animate-in fade-in slide-in-from-bottom-2">
                    <p><span className="font-bold">Explanation:</span> {question.explanation}</p>
                </div>
            )}
        </div>
    );
}
