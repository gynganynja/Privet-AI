import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, BookOpen, HelpCircle } from "lucide-react";
import type { StoryModule, DrillModule } from "@/types/lesson";
import { useAppStore } from "@/store";
import { playText } from "@/lib/audio";
import { DrillView } from "./LessonModules";

interface StoryViewProps {
    module: StoryModule;
    onComplete: () => void;
}

export function StoryView({ module, onComplete }: StoryViewProps) {
    const { audioSettings } = useAppStore();
    const [showQuestions, setShowQuestions] = useState(false);

    // Simple glossing interaction
    const [selectedWord, setSelectedWord] = useState<string | null>(null);

    const playStoryAudio = () => {
        if (module.audio_text_ru) {
            playText(module.audio_text_ru, {
                voiceURI: audioSettings.voiceURI,
                speed: audioSettings.speed * 0.9, // Slightly slower for stories
                lang: 'ru'
            });
        }
    };

    const handleWordClick = (word: string) => {
        // Normalize word to find in vocabulary list
        const cleanWord = word.replace(/[.,!?;:()]/g, "").toLowerCase();
        const gloss = module.vocabulary.find(v => v.russian.toLowerCase() === cleanWord);

        if (gloss) {
            setSelectedWord(`${gloss.russian} - ${gloss.english}`);
            // Also play the word audio?
            playText(gloss.russian, { voiceURI: audioSettings.voiceURI, speed: 1, lang: 'ru' });
        } else {
            setSelectedWord(null);
        }
    };

    // Wrap comprehension questions in a temporary DrillModule structure
    const comprehensionModule: DrillModule = {
        type: 'drill',
        title: 'Comprehension Check',
        instructor_narration: 'Answer these questions about the story.',
        exercises: module.comprehensionQuestions
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <Badge variant="outline" className="mb-2 gap-1"><BookOpen className="h-3 w-3" /> Story Mode</Badge>
                    <h2 className="text-2xl font-bold">{module.title}</h2>
                </div>
                {module.audio_text_ru && (
                    <Button variant="secondary" size="icon" onClick={playStoryAudio} title="Listen to Story">
                        <Volume2 className="h-5 w-5" />
                    </Button>
                )}
            </div>

            {!showQuestions ? (
                <>
                    <Card className="flex-1 overflow-hidden flex flex-col border-2">
                        <CardContent className="p-8 flex-1 overflow-y-auto">
                            <div className="prose dark:prose-invert max-w-none">
                                <p className="text-xl leading-loose font-medium font-serif w-full text-justify">
                                    {module.content.split(" ").map((word, i) => {
                                        // Highlight glossed words
                                        const cleanWord = word.replace(/[.,!?;:()]/g, "").toLowerCase();
                                        const isGlossed = module.vocabulary?.some(v => v.russian && v.russian.toLowerCase() === cleanWord);

                                        return (
                                            <span
                                                key={i}
                                                className={isGlossed ? "cursor-pointer text-primary font-bold underline decoration-dotted underline-offset-4 hover:bg-primary/10 rounded px-0.5 transition" : ""}
                                                onClick={() => isGlossed && handleWordClick(word)}
                                            >
                                                {word}{" "}
                                            </span>
                                        )
                                    })}
                                </p>
                            </div>

                            {selectedWord && (
                                <div className="mt-6 p-4 bg-muted rounded-lg border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 sticky bottom-0">
                                    <HelpCircle className="h-5 w-5 text-muted-foreground" />
                                    <p className="font-semibold">{selectedWord}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-center pt-4">
                        <Button size="lg" className="w-full md:w-auto min-w-[200px]" onClick={() => setShowQuestions(true)}>
                            Start Comprehension Check
                        </Button>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col h-full animate-in fade-in slide-in-from-bottom-8">
                    <div className="mb-4 flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => setShowQuestions(false)}>
                        <BookOpen className="h-4 w-4" />
                        <span className="text-sm">Back to Story text</span>
                    </div>

                    {/* Reuse DrillView for questions */}
                    <DrillView
                        module={comprehensionModule}
                        onComplete={onComplete}
                    />
                </div>
            )}
        </div>
    );
}
