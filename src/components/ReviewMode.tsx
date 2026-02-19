import { useState, useEffect } from "react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X, CheckCircle2 } from "lucide-react";
import { AudioPlayer } from "@/components/AudioPlayer";
import type { FlashcardData } from "@/types/flashcard";
import type { ReviewRating } from "@/lib/srs";

interface ReviewModeProps {
    deckId: string;
    onClose: () => void;
}

export function ReviewMode({ deckId, onClose }: ReviewModeProps) {
    const { getDueCards, reviewCard } = useAppStore();
    const [dueCards, setDueCards] = useState<FlashcardData[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [complete, setComplete] = useState(false);

    // Load due cards on mount
    useEffect(() => {
        const cards = getDueCards(deckId);
        // Shuffle slightly? For now strict order.
        setDueCards(cards);
    }, [deckId, getDueCards]);

    const currentCard = dueCards[currentIndex];
    const progress = dueCards.length > 0 ? ((currentIndex) / dueCards.length) * 100 : 100;

    const handleRate = (rating: ReviewRating) => {
        // Find the index of this card in the REAL deck.
        // This is tricky because dueCards is a subset. 
        // We actually need the original index for `reviewCard(deckId, index, rating)`.
        // Let's assume we can find it by content reference or ID if we had one.
        // For v1 safety: we'll find index in the full deck state inside the store action, 
        // BUT current store `reviewCard` takes an INDEX. 
        // We need to fix store to find by ID or content, OR find the index here.

        // HACK: We will look up the card in the global state to get its true index.
        const state = useAppStore.getState();
        const deck = state.decks.find(d => d.id === deckId);
        if (!deck) return;

        const trueIndex = deck.cards.findIndex(c => c.russian === currentCard.russian && c.english === currentCard.english);
        if (trueIndex === -1) return;

        reviewCard(deckId, trueIndex, rating);

        // Next card
        if (currentIndex < dueCards.length - 1) {
            setIsFlipped(false);
            setCurrentIndex(prev => prev + 1);
        } else {
            setComplete(true);
        }
    };

    if (dueCards.length === 0 && !complete) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
                <h2 className="text-xl font-bold">All caught up!</h2>
                <p className="text-muted-foreground">No cards due for review in this deck.</p>
                <Button onClick={onClose}>Back</Button>
            </div>
        );
    }

    if (complete) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4 animate-in zoom-in">
                <CheckCircle2 className="w-16 h-16 text-primary" />
                <h2 className="text-2xl font-bold">Session Complete!</h2>
                <p className="text-muted-foreground">You reviewed {dueCards.length} words.</p>
                <Button onClick={onClose} size="lg">Continue</Button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                        Reviewing {currentIndex + 1} / {dueCards.length}
                    </span>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>
                <Progress value={progress} className="h-2" />

                {/* Card */}
                <Card
                    className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all hover:shadow-lg relative"
                    onClick={() => !isFlipped && setIsFlipped(true)}
                >
                    <div className="space-y-6">
                        {/* Front (Always Visible) */}
                        <div className="space-y-2">
                            <h2 className="text-4xl font-bold">{currentCard.russian}</h2>
                            {currentCard.russianWithStress && (
                                <p className="text-xl text-primary/60 font-serif">{currentCard.russianWithStress}</p>
                            )}
                        </div>

                        {/* Back (Revealed) */}
                        {isFlipped ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                <div className="h-px w-24 bg-border mx-auto" />
                                <p className="text-2xl font-medium">{currentCard.english}</p>
                                {currentCard.context && (
                                    <p className="text-sm text-muted-foreground italic">"{currentCard.context}"</p>
                                )}
                                <div className="pt-4">
                                    <AudioPlayer text={currentCard.russian} autoPlay />
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground mt-8 animate-pulse">Tap to reveal</p>
                        )}
                    </div>
                </Card>

                {/* Controls */}
                {isFlipped ? (
                    <div className="grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-bottom-2">
                        <Button
                            variant="destructive"
                            className="h-14 flex flex-col gap-1"
                            onClick={() => handleRate('again')}
                        >
                            <span className="font-bold">Again</span>
                            <span className="text-[10px] opacity-70">1m</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-14 flex flex-col gap-1 border-orange-500 text-orange-600 hover:bg-orange-50"
                            onClick={() => handleRate('hard')}
                        >
                            <span className="font-bold">Hard</span>
                            <span className="text-[10px] opacity-70">2d</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-14 flex flex-col gap-1 border-blue-500 text-blue-600 hover:bg-blue-50"
                            onClick={() => handleRate('good')}
                        >
                            <span className="font-bold">Good</span>
                            <span className="text-[10px] opacity-70">4d</span>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-14 flex flex-col gap-1 border-green-500 text-green-600 hover:bg-green-50"
                            onClick={() => handleRate('easy')}
                        >
                            <span className="font-bold">Easy</span>
                            <span className="text-[10px] opacity-70">7d</span>
                        </Button>
                    </div>
                ) : (
                    <Button className="w-full h-14 text-lg" onClick={() => setIsFlipped(true)}>
                        Show Answer
                    </Button>
                )}

            </div>
        </div>
    );
}
