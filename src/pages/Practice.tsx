import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageCircle, Library, Trash2, BrainCircuit, Sparkles, Loader2, Wand2, ChevronRight } from "lucide-react";
import { ReviewMode } from "@/components/ReviewMode";
import { generateResponse } from "@/lib/openai";
import { generateFlashcardsPrompt } from "@/lib/prompts";
import type { FlashcardData } from "@/types/flashcard";

export default function PracticePage() {
    const { apiKey, decks, addDeck, deleteDeck, getDueCards } = useAppStore();

    const [topic, setTopic] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [review, setReview] = useState<{ deckId: string; mode: 'due' | 'all' } | null>(null);

    const handleGenerateDeck = async () => {
        const title = topic.trim();
        if (!title || isGenerating) return;
        setIsGenerating(true);
        setError(null);
        try {
            const response = await generateResponse(apiKey, generateFlashcardsPrompt({ topic: title, count: 10 }));
            const json = (response?.content ?? "").replace(/```json/g, "").replace(/```/g, "").trim();
            const cards = (JSON.parse(json) as FlashcardData[]).filter(c => c.russian && c.english);
            if (cards.length === 0) throw new Error("No cards returned");
            addDeck(title, cards);
            setTopic("");
        } catch (err) {
            console.error("Deck generation failed", err);
            setError("Couldn't generate that deck. Check your API key and try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (review) {
        return <ReviewMode deckId={review.deckId} mode={review.mode} onClose={() => setReview(null)} />;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in p-4 sm:p-6">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Practice</h1>
                <p className="text-muted-foreground">Review what you've learned and put it to use in conversation.</p>
            </header>

            <Tabs defaultValue="decks" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="decks" className="gap-2">
                        <Library className="w-4 h-4" />
                        Flashcards
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="gap-2">
                        <MessageCircle className="w-4 h-4" />
                        AI Tutor
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="decks" className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Generate a deck, e.g. Food & drink"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && apiKey && handleGenerateDeck()}
                                disabled={isGenerating}
                            />
                            <Button onClick={handleGenerateDeck} disabled={!apiKey || !topic.trim() || isGenerating}>
                                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                <span className="ml-2 hidden sm:inline">Generate</span>
                            </Button>
                        </div>
                        {!apiKey && (
                            <p className="text-xs text-muted-foreground">
                                Add your OpenAI key in <Link to="/settings" className="underline">Settings</Link> to generate decks.
                            </p>
                        )}
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {decks.map(deck => {
                            const dueCount = getDueCards(deck.id).length;
                            return (
                                <Card key={deck.id}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-lg font-semibold line-clamp-1">{deck.title}</CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive shrink-0"
                                            aria-label={`Delete ${deck.title}`}
                                            onClick={() => confirm(`Delete "${deck.title}" and its review history?`) && deleteDeck(deck.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                            <span>{deck.cards.length} cards</span>
                                            <span className={dueCount > 0 ? "text-orange-500 font-bold" : "text-green-600"}>
                                                {dueCount > 0 ? `${dueCount} due` : "Up to date"}
                                            </span>
                                        </div>
                                        <Button
                                            className="w-full"
                                            variant={dueCount > 0 ? "default" : "secondary"}
                                            onClick={() => setReview({ deckId: deck.id, mode: dueCount > 0 ? 'due' : 'all' })}
                                            disabled={deck.cards.length === 0}
                                        >
                                            {dueCount > 0 ? (
                                                <>
                                                    <BrainCircuit className="w-4 h-4 mr-2" />
                                                    Review now ({dueCount})
                                                </>
                                            ) : "Practise anyway"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {decks.length === 0 && (
                            <div className="md:col-span-2 text-center py-12 px-4 border-2 border-dashed rounded-lg bg-muted/50">
                                <Library className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium">No flashcards yet</h3>
                                <p className="text-muted-foreground">Finish a lesson and its words land here automatically, or generate a deck above.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="chat" className="space-y-4">
                    <PracticeLink
                        to="/roleplay"
                        icon={<MessageCircle className="h-6 w-6" />}
                        title="Roleplay conversations"
                        description="Order coffee, ask for directions, haggle at a market — in Russian, with an AI partner."
                    />
                    <PracticeLink
                        to="/lessons"
                        icon={<Wand2 className="h-6 w-6" />}
                        title="Custom lesson"
                        description="Generate a full lesson or short story on any topic you choose."
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function PracticeLink({ to, icon, title, description }: { to: string; icon: React.ReactNode; title: string; description: string }) {
    return (
        <Link to={to} className="block">
            <Card className="hover:border-primary/50 transition-colors">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary shrink-0">{icon}</div>
                    <div className="flex-1 space-y-1">
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </CardHeader>
            </Card>
        </Link>
    );
}
