import { useState, useEffect } from "react";
import { useAppStore } from "@/store";
import { generateResponse } from "@/lib/openai";
import { generateFlashcardsPrompt, type FlashcardData } from "@/lib/prompts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ChevronLeft, ChevronRight, Save, Trash2, Play, Volume2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { playText } from "@/lib/audio";

export default function FlashcardsPage() {
    const { apiKey, decks, addDeck, deleteDeck, audioSettings } = useAppStore();
    const [topic, setTopic] = useState("");
    const [generatedCards, setGeneratedCards] = useState<FlashcardData[]>([]);

    // Review Mode
    const [activeDeck, setActiveDeck] = useState<FlashcardData[] | null>(null);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("my-decks");

    const handleGenerateCards = async () => {
        if (!apiKey) return alert("Please set your OpenAI API Key first.");
        if (!topic.trim()) return;

        setIsLoading(true);
        setGeneratedCards([]);
        setError("");

        try {
            const prompt = generateFlashcardsPrompt({ topic, count: 10 });
            const response = await generateResponse(apiKey, prompt);

            if (response?.content) {
                const jsonContent = response.content.replace(/```json/g, "").replace(/```/g, "").trim();
                const parsedCards: FlashcardData[] = JSON.parse(jsonContent);
                setGeneratedCards(parsedCards);
                setActiveTab("generator");
            } else {
                setError("Failed to generate cards. Try again.");
            }
        } catch (err) {
            console.error(err);
            setError("Error parsing response or API issue.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveDeck = () => {
        if (!generatedCards.length || !topic) return;
        addDeck(topic, generatedCards);
        setGeneratedCards([]);
        setTopic("");
        setActiveTab("my-decks");
    };

    const startReview = (cards: FlashcardData[]) => {
        setActiveDeck(cards);
        setCurrentCardIndex(0);
        setIsFlipped(false);
    };

    const closeReview = () => {
        setActiveDeck(null);
        setCurrentCardIndex(0);
        setIsFlipped(false);
    };

    const nextCard = () => {
        if (activeDeck && currentCardIndex < activeDeck.length - 1) {
            setIsFlipped(false);
            setTimeout(() => setCurrentCardIndex(prev => prev + 1), 150);
        }
    };

    const prevCard = () => {
        if (currentCardIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => setCurrentCardIndex(prev => prev - 1), 150);
        }
    };

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!activeDeck) return;
            if (e.key === "ArrowRight") nextCard();
            if (e.key === "ArrowLeft") prevCard();
            if (e.key === " " || e.key === "Enter") {
                e.preventDefault(); // Prevent triggering focused buttons
                setIsFlipped(prev => !prev);
            }
            if (e.key === "Escape") closeReview();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeDeck, currentCardIndex, isFlipped]);

    // Auto-play Audio
    useEffect(() => {
        if (activeDeck && audioSettings.enabled && audioSettings.autoPlay && !isFlipped) {
            const currentCard = activeDeck[currentCardIndex];
            if (currentCard) {
                setTimeout(() => {
                    playText(currentCard.audio_text_ru || currentCard.russian, {
                        voiceURI: audioSettings.voiceURI,
                        speed: audioSettings.speed
                    });
                }, 300);
            }
        }
    }, [activeDeck, currentCardIndex, isFlipped, audioSettings]);

    if (activeDeck) {
        const currentCard = activeDeck[currentCardIndex];
        if (!currentCard) {
            return (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-background text-foreground animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-destructive mb-4">Error: Card not found.</p>
                    <Button onClick={closeReview}>Back to Decks</Button>
                </div>
            )
        }

        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center p-4 bg-background text-foreground animate-in fade-in zoom-in-95 duration-200 overflow-y-auto">
                <div className="max-w-xl w-full flex-1 flex flex-col gap-6 justify-between py-6 relative min-h-[500px]">
                    {/* Close Button at top-right */}
                    <Button variant="ghost" size="icon" className="absolute top-0 right-0 z-50 md:-right-12 md:top-4" onClick={closeReview}>
                        <Trash2 className="h-6 w-6 rotate-45" />
                    </Button>

                    {/* Progress Header */}
                    <div className="w-full flex justify-between items-center shrink-0">
                        <Button variant="outline" onClick={closeReview} className="md:hidden">Back</Button>
                        <span className="text-sm font-medium text-muted-foreground mx-auto">{currentCardIndex + 1} / {activeDeck.length}</span>
                    </div>

                    {/* Card Container - Robust Conditional Rendering (No 3D Flip) */}
                    <div className="relative w-full flex-1 min-h-[300px] cursor-pointer z-10 flex flex-col justify-center" onClick={() => setIsFlipped(!isFlipped)}>
                        <div className="w-full aspect-[3/2] relative">
                            {/* Front (Russian) */}
                            {!isFlipped && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center border-2 border-primary/20 bg-card text-card-foreground shadow-sm rounded-xl animate-in fade-in zoom-in-95 duration-300">
                                    <div className="space-y-4 flex flex-col items-center justify-center h-full w-full">
                                        <h2 className="text-4xl font-bold text-primary" lang="ru">{currentCard.russianWithStress || currentCard.russian}</h2>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 rounded-full hover:bg-primary/10 shrink-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (audioSettings.enabled) {
                                                    playText(currentCard.audio_text_ru || currentCard.russian, {
                                                        voiceURI: audioSettings.voiceURI,
                                                        speed: audioSettings.speed
                                                    });
                                                }
                                            }}
                                        >
                                            <Volume2 className="h-6 w-6 text-primary" />
                                        </Button>

                                        {/* v1.2: Show pronunciation hint + optional spelling */}
                                        <p className="text-xl text-muted-foreground font-mono">
                                            {currentCard.pronunciation_hint || currentCard.transliteration}
                                        </p>
                                        {currentCard.translit_spelling && (
                                            <p className="text-xs text-muted-foreground/50">{currentCard.translit_spelling}</p>
                                        )}

                                        <p className="text-xs text-muted-foreground mt-auto uppercase tracking-widest pt-4">Click (or Space) to Flip</p>
                                    </div>
                                </div>
                            )}

                            {/* Back (English) */}
                            {isFlipped && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-primary text-primary-foreground border-2 border-primary shadow-sm rounded-xl h-full w-full animate-in fade-in zoom-in-95 duration-300">
                                    <div className="space-y-4 flex flex-col items-center justify-center h-full w-full">
                                        <h2 className="text-3xl font-bold">{currentCard.english}</h2>
                                        <p className="text-primary-foreground/80 italic" lang="ru">"{currentCard.context}"</p>
                                        {currentCard.contextEnglish && (
                                            <p className="text-sm text-primary-foreground/70">({currentCard.contextEnglish})</p>
                                        )}
                                        <p className="text-xs text-primary-foreground/50 mt-auto uppercase tracking-widest pt-4">Click (or Space) to Flip Back</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controls Footer */}
                    <div className="flex items-center gap-4 w-full justify-between z-20 shrink-0 pb-4">
                        <Button
                            variant="default"
                            size="lg"
                            onClick={(e) => {
                                e.currentTarget.blur();
                                prevCard();
                            }}
                            disabled={currentCardIndex === 0}
                            className="w-32 shadow-md"
                        >
                            <ChevronLeft className="h-4 w-4 mr-2" /> Prev
                        </Button>
                        <Button
                            variant="default"
                            size="lg"
                            onClick={(e) => {
                                e.currentTarget.blur();
                                nextCard();
                            }}
                            disabled={currentCardIndex === activeDeck.length - 1}
                            className="w-32 shadow-md"
                        >
                            Next <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>

                    <div className="text-center text-xs text-muted-foreground shrink-0 hidden md:block">
                        Use Arrow Keys to Navigate • Space to Flip • Esc to Exit
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col gap-6 p-4 max-w-4xl mx-auto w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="my-decks">My Decks</TabsTrigger>
                    <TabsTrigger value="generator">Generator</TabsTrigger>
                </TabsList>

                <TabsContent value="my-decks" className="flex-1">
                    {decks.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <p>No saved decks yet.</p>
                            <Button variant="link" onClick={() => setActiveTab("generator")}>Create your first deck</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {decks.map(deck => (
                                <Card key={deck.id} className="hover:border-primary/50 transition-colors">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex justify-between items-start">
                                            <span className="truncate">{deck.title}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteDeck(deck.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </CardTitle>
                                        <CardDescription>{deck.cards.length} cards</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Button className="w-full" onClick={() => startReview(deck.cards)}>
                                            <Play className="h-4 w-4 mr-2" /> Study Now
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="generator" className="flex-1 flex flex-col gap-6">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter a topic (e.g. Kitchen, Travel, Emotions)"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            disabled={isLoading}
                        />
                        <Button onClick={handleGenerateCards} disabled={isLoading || !topic.trim()}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
                        </Button>
                    </div>

                    {error && <div className="text-destructive text-sm">{error}</div>}

                    {generatedCards.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border">
                                <div>
                                    <h3 className="font-semibold text-lg">Preview: {topic}</h3>
                                    <p className="text-sm text-muted-foreground">{generatedCards.length} cards generated</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => setGeneratedCards([])}>
                                        Discard
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => startReview(generatedCards)}>
                                        <Play className="h-4 w-4 mr-2" /> Test
                                    </Button>
                                    <Button size="sm" onClick={handleSaveDeck}>
                                        <Save className="h-4 w-4 mr-2" /> Save
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {generatedCards.map((card, i) => (
                                    <div key={i} className="bg-card border rounded-md p-3 text-sm relative group">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                            onClick={() => {
                                                const newCards = [...generatedCards];
                                                newCards.splice(i, 1);
                                                setGeneratedCards(newCards);
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>

                                        <div className="space-y-2 pr-6">
                                            <Input
                                                value={card.russian}
                                                onChange={(e) => {
                                                    const newCards = [...generatedCards];
                                                    newCards[i] = { ...newCards[i], russian: e.target.value };
                                                    setGeneratedCards(newCards);
                                                }}
                                                className="h-7 text-sm font-bold border-none shadow-none p-0 focus-visible:ring-0 text-primary"
                                                placeholder="Russian (plain)"
                                                lang="ru"
                                            />
                                            <Input
                                                value={card.russianWithStress || ""}
                                                onChange={(e) => {
                                                    const newCards = [...generatedCards];
                                                    newCards[i] = { ...newCards[i], russianWithStress: e.target.value };
                                                    setGeneratedCards(newCards);
                                                }}
                                                className="h-7 text-sm border-none shadow-none p-0 focus-visible:ring-0 text-primary/70"
                                                placeholder="Russian (stressed)"
                                                lang="ru"
                                            />

                                            {/* v1.2: Edit fields for new transliteration props */}
                                            <div className="grid grid-cols-2 gap-1">
                                                <Input
                                                    value={card.pronunciation_hint || card.transliteration || ""}
                                                    onChange={(e) => {
                                                        const newCards = [...generatedCards];
                                                        newCards[i] = { ...newCards[i], pronunciation_hint: e.target.value };
                                                        setGeneratedCards(newCards);
                                                    }}
                                                    className="h-6 text-xs text-muted-foreground border-none shadow-none p-0 focus-visible:ring-0"
                                                    placeholder="Pronunciation"
                                                />
                                                <Input
                                                    value={card.translit_spelling || ""}
                                                    onChange={(e) => {
                                                        const newCards = [...generatedCards];
                                                        newCards[i] = { ...newCards[i], translit_spelling: e.target.value };
                                                        setGeneratedCards(newCards);
                                                    }}
                                                    className="h-6 text-xs text-muted-foreground/50 border-none shadow-none p-0 focus-visible:ring-0"
                                                    placeholder="Spelling (en)"
                                                />
                                            </div>

                                            <Input
                                                value={card.english}
                                                onChange={(e) => {
                                                    const newCards = [...generatedCards];
                                                    newCards[i] = { ...newCards[i], english: e.target.value };
                                                    setGeneratedCards(newCards);
                                                }}
                                                className="h-7 text-sm border-none shadow-none p-0 focus-visible:ring-0"
                                                placeholder="English"
                                            />
                                            <Input
                                                value={card.context}
                                                onChange={(e) => {
                                                    const newCards = [...generatedCards];
                                                    newCards[i] = { ...newCards[i], context: e.target.value };
                                                    setGeneratedCards(newCards);
                                                }}
                                                className="h-7 text-xs italic text-muted-foreground border-none shadow-none p-0 focus-visible:ring-0"
                                                placeholder="Context (RU)"
                                                lang="ru"
                                            />
                                            <Input
                                                value={card.contextEnglish || ""}
                                                onChange={(e) => {
                                                    const newCards = [...generatedCards];
                                                    newCards[i] = { ...newCards[i], contextEnglish: e.target.value };
                                                    setGeneratedCards(newCards);
                                                }}
                                                className="h-7 text-xs text-primary/80 border-none shadow-none p-0 focus-visible:ring-0"
                                                placeholder="Context (EN)"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
