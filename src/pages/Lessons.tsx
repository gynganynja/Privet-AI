import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateResponse } from "@/lib/openai";
import { generateStructuredLessonPrompt } from "@/lib/prompts";
import { VocabularyView, GrammarView, DrillView, DialogueView } from "@/components/LessonModules";
import { StoryView } from "@/components/StoryView";
import { SessionSummary } from "@/components/SessionSummary";
import { type SavedLesson, type LessonContent } from "@/types/lesson";
import { Loader2, ChevronLeft, ChevronRight, Save, Layers, CheckCircle2, BookOpen, AlertCircle, Trash2, PlayCircle, BookMarked, GraduationCap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LessonsPage() {
    const { apiKey, saveLesson, addDeck, savedLessons, deleteLesson } = useAppStore();

    // State
    const [selectedTopic, setSelectedTopic] = useState("");
    const [lessonMode, setLessonMode] = useState<'standard' | 'story'>('standard');
    const [isLoading, setIsLoading] = useState(false);
    const [lessonData, setLessonData] = useState<SavedLesson | null>(null);
    const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
    const [isStepComplete, setIsStepComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Stats State
    const [sessionStats, setSessionStats] = useState({ total: 0, correct: 0 });

    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Reset scroll when module changes
    useEffect(() => {
        if (scrollAreaRef.current) {
            const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (viewport) viewport.scrollTop = 0;
        }
    }, [currentModuleIndex]);

    const handleGenerateLesson = async () => {
        if (!selectedTopic.trim()) return;
        if (!apiKey) {
            setError("Please set your OpenAI API Key in Settings first.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSessionStats({ total: 0, correct: 0 });

        try {
            const messages = generateStructuredLessonPrompt({
                topic: selectedTopic,
                level: 'Beginner',
                mode: lessonMode
            });
            const response = await generateResponse(apiKey, messages);

            if (!response || !response.content) {
                throw new Error("No response from AI");
            }

            // Parse response
            // The prompt asks for strictly JSON, but we might need to exact it if there's markdown
            const jsonStr = response.content.replace(/```json/g, "").replace(/```/g, "").trim();
            const content: LessonContent = JSON.parse(jsonStr);

            // Wrap in SavedLesson structure
            const newLesson: SavedLesson = {
                id: Date.now().toString(),
                content: content,
                createdAt: Date.now()
            };

            setLessonData(newLesson);
            setCurrentModuleIndex(0);
            setIsStepComplete(false);

        } catch (err: any) {
            console.error("Lesson Generation Error:", err);
            setError("Failed to generate lesson. " + (err.message || ""));
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadLesson = (lesson: SavedLesson) => {
        setLessonData(lesson);
        setCurrentModuleIndex(0);
        setIsStepComplete(false);
        setSessionStats({ total: 0, correct: 0 });
    };

    const handleDeleteLesson = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this saved lesson?")) {
            deleteLesson(id);
        }
    };

    const handleStepComplete = () => {
        setIsStepComplete(true);
    };

    const handleDrillResult = (isCorrect: boolean) => {
        setSessionStats(prev => ({
            total: prev.total + 1,
            correct: prev.correct + (isCorrect ? 1 : 0)
        }));
    };

    const handleSaveLessonOnly = () => {
        if (!lessonData) return;
        saveLesson(lessonData.content);
        alert("Lesson saved to library!");
    };

    const handleSaveVocabulary = () => {
        if (!lessonData) return;

        // Extract all vocab items
        const vocabItems = lessonData.content.modules
            .filter(m => m.type === 'vocabulary')
            .flatMap((m: any) => m.items);

        // Also extract story vocab
        const storyVocab = lessonData.content.modules
            .filter(m => m.type === 'story')
            .flatMap((m: any) => m.vocabulary || []);

        const allVocab = [...vocabItems, ...storyVocab];

        if (allVocab.length > 0) {
            const deckId = addDeck(`${lessonData.content.title} Vocab`, allVocab);
            saveLesson(lessonData.content, deckId);
            alert("Lesson saved and Flashcard Deck created!");
        } else {
            saveLesson(lessonData.content);
            alert("Lesson saved! (No vocabulary found to create deck)");
        }
    };

    const renderCurrentModule = () => {
        if (!lessonData) return null;
        const module = lessonData.content.modules[currentModuleIndex];
        const normalizedType = module.type?.toLowerCase() || 'unknown';

        // Ensure key changes on index change to force remount/reset of internal state
        const props = {
            key: currentModuleIndex,
            module: module as any, // Type casting to satisfy union discrimination if needed
            onComplete: handleStepComplete
        };

        switch (normalizedType) {
            case 'vocabulary': return <VocabularyView {...props} />;
            case 'grammar': return <GrammarView {...props} />;
            case 'drill': return <DrillView {...props} onResult={handleDrillResult} />;
            case 'dialogue': return <DialogueView {...props} />;
            case 'story': return <StoryView {...props} />;
            default:
                console.error("Unknown module type:", module);
                return (
                    <div className="p-4 text-center space-y-2">
                        <p className="text-red-500 font-bold">Unknown module type</p>
                        <pre className="text-xs text-left bg-muted p-2 rounded overflow-auto max-h-40 whitespace-pre-wrap">
                            {JSON.stringify(module, null, 2)}
                        </pre>
                    </div>
                );
        }
    };

    // 1. TOPIC SELECTION / EMPTY STATE
    if (!lessonData) {
        return (
            <div className="container mx-auto max-w-4xl py-8 space-y-8 animate-in fade-in zoom-in-95 duration-500 px-4">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">AI Lesson Generator</h1>
                    <p className="text-muted-foreground">What do you want to learn today?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* LEFT COLUMN: GENERATOR */}
                    <div className="space-y-6">
                        <Card className="border-2 border-primary/10 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    New Lesson
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Tabs value={lessonMode} onValueChange={(v) => setLessonMode(v as any)} className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="standard" className="gap-2">
                                            <GraduationCap className="h-4 w-4" />
                                            Standard
                                        </TabsTrigger>
                                        <TabsTrigger value="story" className="gap-2">
                                            <BookMarked className="h-4 w-4" />
                                            Story Mode
                                        </TabsTrigger>
                                    </TabsList>

                                    <div className="mt-4 text-xs text-muted-foreground min-h-[40px]">
                                        {lessonMode === 'standard'
                                            ? "Structured lesson: Vocab -> Grammar -> Drills -> Dialogue."
                                            : "Comprehensible Input: Learn through reading and listening to a story."}
                                    </div>
                                </Tabs>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Topic or Situation</label>
                                    <Input
                                        placeholder={lessonMode === 'story' ? "e.g. A Mystery in Moscow" : "e.g. Ordering Coffee"}
                                        value={selectedTopic}
                                        onChange={(e) => setSelectedTopic(e.target.value)}
                                        disabled={isLoading}
                                        onKeyDown={(e) => e.key === 'Enter' && handleGenerateLesson()}
                                    />
                                </div>

                                {error && (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={handleGenerateLesson}
                                    disabled={isLoading || !selectedTopic.trim()}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating {lessonMode === 'story' ? "Story" : "Lesson"}...
                                        </>
                                    ) : (
                                        <>
                                            <PlayCircle className="mr-2 h-4 w-4" />
                                            Start Learning
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: SAVED LESSONS */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Save className="h-5 w-5" />
                                Saved Lessons
                            </h2>
                            <span className="text-xs text-muted-foreground">{savedLessons.length} saved</span>
                        </div>

                        <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-3">
                                {savedLessons.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
                                        <Save className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>No saved lessons yet.</p>
                                        <p className="text-xs">Complete a lesson to save it here.</p>
                                    </div>
                                ) : (
                                    savedLessons
                                        .sort((a, b) => b.createdAt - a.createdAt)
                                        .map((lesson) => (
                                            <Card
                                                key={lesson.id}
                                                className="cursor-pointer hover:bg-muted/50 transition-colors group relative overflow-hidden"
                                                onClick={() => handleLoadLesson(lesson)}
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="font-semibold">{lesson.content.title}</h3>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                {new Date(lesson.createdAt).toLocaleDateString()} • {lesson.content.modules.length} modules
                                                            </p>
                                                            {lesson.content.modules.some((m: any) => m.type === 'story') && (
                                                                <div className="mt-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full inline-block">
                                                                    Story
                                                                </div>
                                                            )}
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={(e) => handleDeleteLesson(lesson.id, e)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-8">
                    Powered by OpenAI GPT-3.5. Requires API Key in settings.
                </p>
            </div>
        );
    }

    // 2. ACTIVE LESSON VIEW
    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-right-8 duration-300">
            <div className="flex items-center justify-between mb-4 px-4 md:px-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => {
                        if (confirm("Exit lesson? Progress will be lost.")) {
                            setLessonData(null);
                        }
                    }}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="font-semibold line-clamp-1">{lessonData.content.title}</h2>
                        <p className="text-xs text-muted-foreground">
                            Module {currentModuleIndex + 1} of {lessonData.content.modules.length}
                        </p>
                    </div>
                </div>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden shadow-lg border-primary/10 mx-4 md:mx-0">
                <ScrollArea className="flex-1" ref={scrollAreaRef}>
                    <div className="p-4 md:p-8 pb-8 space-y-8 min-h-[500px]">
                        {renderCurrentModule()}

                        {/* Completion State - Show only on last module when complete */}
                        {currentModuleIndex === lessonData.content.modules.length - 1 && isStepComplete && (
                            <div className="mt-12 space-y-8 animate-in fade-in zoom-in-95 delay-200 pb-8">
                                <div className="p-6 border rounded-xl bg-primary/5 text-center space-y-4">
                                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                                    <h3 className="text-xl font-bold">Lesson Complete!</h3>
                                    <p className="text-muted-foreground">Great job. Save this lesson to your library to keep it.</p>
                                </div>

                                <SessionSummary
                                    totalQuestions={sessionStats.total}
                                    correctCount={sessionStats.correct}
                                />

                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Button onClick={handleSaveLessonOnly} variant="outline">
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Lesson Only
                                    </Button>
                                    <Button onClick={handleSaveVocabulary}>
                                        <Layers className="h-4 w-4 mr-2" />
                                        Save + Create Flashcards
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t bg-card/50 backdrop-blur-sm flex justify-between items-center shrink-0">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            setCurrentModuleIndex(prev => Math.max(0, prev - 1));
                            setIsStepComplete(true); // Allow going back without locking
                        }}
                        disabled={currentModuleIndex === 0}
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                    </Button>

                    <div className="flex gap-2">
                        {/* If not last module, show Next button */}
                        {currentModuleIndex < lessonData.content.modules.length - 1 ? (
                            <Button
                                onClick={() => {
                                    setCurrentModuleIndex(prev => Math.min(lessonData.content.modules.length - 1, prev + 1));
                                    setIsStepComplete(false);
                                }}
                                disabled={!isStepComplete}
                            >
                                Next Step
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        ) : (
                            // Last module: Button helps if they want to verify they are done, usually UI above handles it
                            <Button variant="ghost" disabled className="opacity-0">Last Step</Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
