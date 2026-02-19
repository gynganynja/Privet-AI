import { useState } from "react";
import { useAppStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MessageCircle, Library, Plus, Trash2, BrainCircuit } from "lucide-react";
import { ReviewMode } from "@/components/ReviewMode";

export default function PracticePage() {
    const {
        decks,
        addDeck,
        deleteDeck,
        getDueCards
    } = useAppStore();

    const [newDeckName, setNewDeckName] = useState("");
    const [reviewingDeckId, setReviewingDeckId] = useState<string | null>(null);

    const handleCreateDeck = () => {
        if (!newDeckName.trim()) return;
        addDeck(newDeckName, []);
        setNewDeckName("");
    };

    if (reviewingDeckId) {
        return <ReviewMode deckId={reviewingDeckId} onClose={() => setReviewingDeckId(null)} />;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in p-6">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Practice Hub</h1>
                <p className="text-muted-foreground">Master your skills with AI chat and Spaced Repetition.</p>
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
                    {/* Deck Creator */}
                    <div className="flex gap-4">
                        <Input
                            placeholder="New Deck Name..."
                            value={newDeckName}
                            onChange={(e) => setNewDeckName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateDeck()}
                        />
                        <Button onClick={handleCreateDeck}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create
                        </Button>
                    </div>

                    {/* Decks Grid */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {decks.map(deck => {
                            const dueCount = getDueCards(deck.id).length;

                            return (
                                <Card key={deck.id} className="group relative transition-all hover:border-primary/50">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-xl font-semibold">{deck.title}</CardTitle>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                                            onClick={() => deleteDeck(deck.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex justify-between text-sm text-muted-foreground">
                                                <span>{deck.cards.length} cards</span>
                                                <span className={dueCount > 0 ? "text-orange-500 font-bold" : "text-green-500"}>
                                                    {dueCount} due
                                                </span>
                                            </div>

                                            <Button
                                                className="w-full"
                                                variant={dueCount > 0 ? "default" : "secondary"}
                                                onClick={() => setReviewingDeckId(deck.id)}
                                                disabled={deck.cards.length === 0}
                                            >
                                                {dueCount > 0 ? (
                                                    <>
                                                        <BrainCircuit className="w-4 h-4 mr-2" />
                                                        Review Now ({dueCount})
                                                    </>
                                                ) : (
                                                    "Practice All"
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {decks.length === 0 && (
                            <div className="col-span-2 text-center py-12 border-2 border-dashed rounded-lg bg-muted/50">
                                <Library className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium">No Flashcard Decks</h3>
                                <p className="text-muted-foreground">Create a deck or save words from a lesson to get started.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="chat">
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle>AI Tutor</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Chat implementation coming in AI Phase.
                            </p>
                            <Button className="w-full" disabled>Start Chat</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
