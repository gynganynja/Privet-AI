import { useState } from "react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { X, CheckCircle2 } from "lucide-react";
import { AudioPlayer } from "@/components/AudioPlayer";
import { intervalLabel, isDue, type ReviewRating } from "@/lib/srs";

interface ReviewModeProps {
    deckId: string;
    // 'due' reviews only scheduled cards; 'all' lets the learner practise the whole deck.
    mode?: 'due' | 'all';
    onClose: () => void;
}

const RATINGS: { rating: ReviewRating; label: string; className: string }[] = [
    { rating: 'again', label: 'Again', className: "border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40" },
    { rating: 'hard', label: 'Hard', className: "border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40" },
    { rating: 'good', label: 'Good', className: "border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40" },
    { rating: 'easy', label: 'Easy', className: "border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/40" },
];

export function ReviewMode({ deckId, mode = 'due', onClose }: ReviewModeProps) {
    const { reviewCard } = useAppStore();
    // Snapshot the queue (with each card's index in the deck) when the session starts,
    // so rating cards doesn't reshuffle what's left.
    const [queue] = useState(() => {
        const deck = useAppStore.getState().decks.find(d => d.id === deckId);
        const entries = (deck?.cards ?? [])
            .map((card, index) => ({ card, index }))
            .filter(({ card }) => mode === 'all' || isDue(card));
        for (let i = entries.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [entries[i], entries[j]] = [entries[j], entries[i]];
        }
        return entries;
    });
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [complete, setComplete] = useState(false);

    const current = queue[currentIndex];
    const progress = queue.length > 0 ? (currentIndex / queue.length) * 100 : 100;

    const handleRate = (rating: ReviewRating) => {
        reviewCard(deckId, current.index, rating);
        if (currentIndex < queue.length - 1) {
            setIsFlipped(false);
            setCurrentIndex(prev => prev + 1);
        } else {
            setComplete(true);
        }
    };

    if (queue.length === 0 || complete) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center animate-in zoom-in-95">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
                <h2 className="text-2xl font-bold">{complete ? "Session complete!" : "All caught up!"}</h2>
                <p className="text-muted-foreground">
                    {complete ? `You reviewed ${queue.length} ${queue.length === 1 ? 'card' : 'cards'}.` : "No cards are due in this deck."}
                </p>
                <Button onClick={onClose} size="lg">Back to decks</Button>
            </div>
        );
    }

    const { card } = current;

    return (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                        {mode === 'all' ? 'Practising' : 'Reviewing'} {currentIndex + 1} / {queue.length}
                    </span>
                    <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close review">
                        <X className="w-5 h-5" />
                    </Button>
                </div>
                <Progress value={progress} className="h-2" />

                <Card
                    className="min-h-[360px] flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all hover:shadow-lg"
                    onClick={() => !isFlipped && setIsFlipped(true)}
                >
                    <div className="space-y-6">
                        <div className="space-y-3 flex flex-col items-center">
                            <h2 className="text-4xl font-bold" lang="ru">{card.russianWithStress || card.russian}</h2>
                            <AudioPlayer text={card.audio_text_ru || card.russian} />
                        </div>

                        {isFlipped ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                <div className="h-px w-24 bg-border mx-auto" />
                                <p className="text-2xl font-medium">{card.english}</p>
                                {card.pronunciation_hint && (
                                    <p className="text-sm font-mono text-muted-foreground">{card.pronunciation_hint}</p>
                                )}
                                {card.context && (
                                    <div className="text-sm space-y-1">
                                        <p lang="ru">{card.context}</p>
                                        {card.contextEnglish && <p className="text-muted-foreground">{card.contextEnglish}</p>}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground mt-8">Tap to reveal</p>
                        )}
                    </div>
                </Card>

                {isFlipped ? (
                    <div className="grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-bottom-2">
                        {RATINGS.map(({ rating, label, className }) => (
                            <Button
                                key={rating}
                                variant="outline"
                                className={`h-14 flex flex-col gap-1 ${className}`}
                                onClick={() => handleRate(rating)}
                            >
                                <span className="font-bold">{label}</span>
                                <span className="text-[10px] opacity-70">{intervalLabel(card.srs, rating)}</span>
                            </Button>
                        ))}
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
