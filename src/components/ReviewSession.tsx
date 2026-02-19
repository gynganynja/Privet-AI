import { useState, useEffect } from "react";
import { useAppStore } from "@/store";
import type { FlashcardData } from "@/types/flashcard";
import { isCardDue, type ReviewRating } from "@/lib/srs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Volume2, CheckCircle2, ArrowLeft } from "lucide-react";
import { playText } from "@/lib/audio";

interface ReviewSessionProps {
    onClose: () => void;
}

export function ReviewSession({ onClose }: ReviewSessionProps) {
    const { decks, reviewCard, audioSettings } = useAppStore();
    const [dueCards, setDueCards] = useState<{ deckId: string, cardIndex: number, card: FlashcardData }[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionComplete, setSessionComplete] = useState(false);

    // Initialize session with due cards (Snapshot)
    useEffect(() => {
        if (dueCards.length > 0) return; // Prevent regeneration on deck updates

        const due: typeof dueCards = [];
        decks.forEach(deck => {
            deck.cards.forEach((card, index) => {
                if (isCardDue(card)) {
                    due.push({ deckId: deck.id, cardIndex: index, card });
                }
            });
        });

        // Shuffle reviews? Or keep deck order? Let's shuffle for better interleaving.
        for (let i = due.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [due[i], due[j]] = [due[j], due[i]];
        }

        setDueCards(due);
    }, [decks]); // Dependencies kept, but guarded by length check

    const handleRate = (rating: ReviewRating) => {
        const current = dueCards[currentIndex];
        reviewCard(current.deckId, current.cardIndex, rating);

        if (currentIndex < dueCards.length - 1) {
            setIsFlipped(false);
            setCurrentIndex(prev => prev + 1);
        } else {
            setSessionComplete(true);
        }
    };

    const playAudio = (text: string) => {
        if (!audioSettings.enabled) return;
        playText(text, {
            voiceURI: audioSettings.voiceURI,
            speed: audioSettings.speed,
            lang: 'ru'
        });
    };

    if (dueCards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 animate-in fade-in">
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold">All caught up!</h2>
                <p className="text-muted-foreground">No cards due for review right now.</p>
                <Button onClick={onClose} variant="outline" className="mt-4">Back to Dashboard</Button>
            </div>
        );
    }

    if (sessionComplete) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 animate-in zoom-in-95">
                <div className="bg-primary/10 p-6 rounded-full mb-4">
                    <CheckCircle2 className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-3xl font-bold">Session Complete!</h2>
                <p className="text-muted-foreground text-lg">You reviewed {dueCards.length} cards.</p>
                <Button onClick={onClose} className="mt-6 w-full max-w-xs" size="lg">Finish</Button>
            </div>
        );
    }

    const currentItem = dueCards[currentIndex];
    const card = currentItem?.card;

    // Safety guard
    if (!card) return null;

    const progress = ((currentIndex) / dueCards.length) * 100;

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center p-4 bg-background text-foreground animate-in fade-in zoom-in-95 duration-200 overflow-y-auto">
            <div className="max-w-xl w-full flex-1 flex flex-col gap-6 justify-between py-6 relative min-h-[500px]">
                {/* Header / Close */}
                <div className="flex items-center justify-between shrink-0">
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 mx-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-2">
                            <span>Reviewing</span>
                            <span>{currentIndex + 1} / {dueCards.length}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                </div>

                {/* Flashcard Area - Robust Conditional Rendering (No 3D Flip) */}
                <div className="relative w-full flex-1 min-h-[300px] cursor-pointer z-10 flex flex-col justify-center" onClick={() => !isFlipped && setIsFlipped(true)}>
                    <div className="w-full aspect-[3/2] relative">
                        {/* Front */}
                        {!isFlipped && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center border-2 border-primary/20 bg-card text-card-foreground shadow-sm rounded-xl animate-in fade-in zoom-in-95 duration-300">
                                <div className="space-y-4 flex flex-col items-center justify-center h-full w-full">
                                    <h2 className="text-4xl font-bold text-primary" lang="ru">
                                        {card.russianWithStress || card.russian}
                                    </h2>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 rounded-full hover:bg-primary/10 shrink-0"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            playAudio(card.audio_text_ru || card.russian);
                                        }}
                                    >
                                        <Volume2 className="h-6 w-6 text-primary" />
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-auto uppercase tracking-widest pt-4">Click (or Space) to Show Answer</p>
                                </div>
                            </div>
                        )}

                        {/* Back */}
                        {isFlipped && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-primary text-primary-foreground border-2 border-primary shadow-sm rounded-xl h-full w-full animate-in fade-in zoom-in-95 duration-300">
                                <div className="space-y-4 flex flex-col items-center justify-center h-full w-full">
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-bold">{card.english}</h3>
                                    </div>

                                    <div className="pt-4 border-t border-primary-foreground/20 w-full max-w-[200px] mx-auto opacity-90">
                                        <p className="text-sm text-primary-foreground/70 italic mb-1">Context:</p>
                                        <p className="text-base" lang="ru">"{card.context}"</p>
                                        <p className="text-sm text-primary-foreground/70">({card.contextEnglish})</p>
                                    </div>
                                    <p className="text-xs text-primary-foreground/50 mt-auto uppercase tracking-widest pt-4">Click (or Space) to Flip Back</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls */}
                <div className="mt-8 h-24 shrink-0">
                    {!isFlipped ? (
                        <Button
                            size="lg"
                            className="w-full h-14 text-lg font-medium shadow-lg hover:translate-y-[-2px] transition-transform"
                            onClick={() => setIsFlipped(true)}
                        >
                            Show Answer
                        </Button>
                    ) : (
                        <div className="grid grid-cols-4 gap-3 animate-in fade-in slide-in-from-bottom-4">
                            <Button
                                variant="destructive"
                                className="h-16 flex flex-col gap-1 hover:bg-red-600"
                                onClick={() => handleRate('again')}
                            >
                                <span className="font-bold">Again</span>
                                <span className="text-[10px] opacity-80">&lt; 1 min</span>
                            </Button>
                            <Button
                                variant="secondary"
                                className="h-16 flex flex-col gap-1 bg-orange-100 text-orange-900 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-100"
                                onClick={() => handleRate('hard')}
                            >
                                <span className="font-bold">Hard</span>
                                <span className="text-[10px] opacity-80">2 days</span>
                            </Button>
                            <Button
                                variant="secondary"
                                className="h-16 flex flex-col gap-1 bg-blue-100 text-blue-900 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-100"
                                onClick={() => handleRate('good')}
                            >
                                <span className="font-bold">Good</span>
                                <span className="text-[10px] opacity-80">4 days</span>
                            </Button>
                            <Button
                                variant="default"
                                className="h-16 flex flex-col gap-1 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleRate('easy')}
                            >
                                <span className="font-bold">Easy</span>
                                <span className="text-[10px] opacity-80">7 days</span>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
