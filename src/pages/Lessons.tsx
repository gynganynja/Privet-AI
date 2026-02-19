import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Added useParams, useNavigate
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateResponse } from "@/lib/openai";
import { generateStructuredLessonPrompt } from "@/lib/prompts";
import { VocabularyView, GrammarView, DrillView, DialogueView } from "@/components/LessonModules";
import { RecallView } from "@/components/RecallView";
import { StoryView } from "@/components/StoryView";
import { SessionSummary } from "@/components/SessionSummary";
import { type SavedLesson, type LessonContent, type DrillModule } from "@/types/lesson";
import { Loader2, ChevronLeft, ChevronRight, Save, Layers, CheckCircle2, BookOpen, AlertCircle, Trash2, PlayCircle, BookMarked, GraduationCap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { COURSE_CONTENT } from "@/data/courseContent"; // Import Course Content

export default function LessonsPage() {
    const { id: lessonId } = useParams(); // Get lesson ID from URL
    const navigate = useNavigate();
    const { apiKey, saveLesson, addDeck, savedLessons, deleteLesson, completeNode } = useAppStore();

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

    // NEW: Auto-load structured lesson if ID is present
    const hasInitialized = useRef(false);

    const handleGenerateLesson = useCallback(async (topicOverride?: string, levelOverride?: string, focusPoints?: string[]) => {
        const topic = topicOverride || selectedTopic;
        if (!topic.trim()) return;

        if (!apiKey) {
            setError("Please set your OpenAI API Key in Settings first.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSessionStats({ total: 0, correct: 0 });

        try {
            // Construct a more specific topic if focus points exist
            const enhancedTopic = focusPoints
                ? `${topic}. Focus strictly on these elements: ${focusPoints.join(", ")}`
                : topic;

            const messages = generateStructuredLessonPrompt({
                topic: enhancedTopic,
                level: (levelOverride as any) || 'Beginner',
                mode: lessonMode
            });
            const response = await generateResponse(apiKey, messages);

            if (!response || !response.content) {
                throw new Error("No response from AI");
            }

            // Parse response
            const jsonStr = response.content.replace(/```json/g, "").replace(/```/g, "").trim();
            const parsedData = JSON.parse(jsonStr);

            let modules: any[] = [];

            if (parsedData.modules) {
                // V1 Legacy Format
                modules = parsedData.modules;
            } else if (parsedData.teach || parsedData.drill) {
                // V2 Adapter Logic
                // 1. Teach -> Vocabulary
                if (parsedData.teach && parsedData.teach.length > 0) {
                    modules.push({
                        type: 'vocabulary',
                        title: 'New Vocabulary',
                        items: parsedData.teach.map((t: any) => ({
                            russian: t.ru_base,
                            russianWithStress: t.ru_display,
                            english: t.en,
                            translit_spelling: t.translit_spelling,
                            pronunciation_hint: t.pronunciation_hint,
                            audio_text_ru: t.audio_text_ru,
                            context: t.notes || "",
                            contextEnglish: ""
                        }))
                    });
                }

                // 2. Drill -> DrillModule (Recognition)
                if (parsedData.drill && parsedData.drill.length > 0) {
                    modules.push({
                        type: 'drill',
                        title: 'Practice',
                        exercises: parsedData.drill
                    });
                }

                // 3. Recall -> DrillModule (Production)
                if (parsedData.recall && parsedData.recall.length > 0) {
                    modules.push({
                        type: 'drill',
                        title: 'Recall',
                        exercises: parsedData.recall.map((r: any) => ({
                            type: 'input',
                            subtype: 'translate_en_to_ru',
                            prompt: r.prompt_en,
                            correctAnswer: r.answer_key?.accepted_answers_base?.[0] || "",
                            answer_key: r.answer_key,
                            textToDisplay: r.prompt_en,
                            explanation: r.feedback?.incorrect_en,
                            audio_text_ru: r.audio_text_ru
                        }))
                    });
                }

                // 4. Use -> Dialogue or Drill
                if (parsedData.use && parsedData.use.length > 0) {
                    // Check if it's a dialogue or just more drills
                    const dialogues = parsedData.use.filter((u: any) => u.type === 'dialogue');
                    if (dialogues.length > 0) {
                        dialogues.forEach((d: any) => modules.push(d));
                    }
                }

                // 5. Review (ignored for now or add as a summary card?)
            }

            const content: LessonContent = {
                title: parsedData.lesson_meta?.objective || parsedData.title || "New Lesson",
                level: parsedData.lesson_meta?.week_number ? `Week ${parsedData.lesson_meta.week_number}` : (parsedData.level || "Beginner"),
                introduction: parsedData.introduction || "",
                modules: modules
            };

            // Wrap in SavedLesson structure
            const newLesson: SavedLesson = {
                id: lessonId || Date.now().toString(), // Use URL ID if available
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
    }, [apiKey, lessonMode, selectedTopic, lessonId]);

    // Initialize Lesson from ID
    useEffect(() => {
        if (!lessonId || hasInitialized.current) return;

        // Find the node in COURSE_CONTENT
        let foundNode = null;
        for (const unit of COURSE_CONTENT.units) {
            const node = unit.nodes.find(n => n.id === lessonId);
            if (node) {
                foundNode = node;
                break;
            }
        }

        if (foundNode && foundNode.type === 'lesson') {
            hasInitialized.current = true;
            // Auto-start generation
            // We use the node's content metadata to feed the generator
            if (foundNode.content) {
                handleGenerateLesson(
                    foundNode.content.topic,
                    foundNode.content.level,
                    foundNode.content.focusPoints
                );
            }
        }
    }, [lessonId, handleGenerateLesson]);


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
        const commonProps = {
            module: module as any, // Type casting to satisfy union discrimination if needed
            onComplete: handleStepComplete
        };

        switch (normalizedType) {
            case 'vocabulary': return <VocabularyView key={currentModuleIndex} {...commonProps} />;
            case 'grammar': return <GrammarView key={currentModuleIndex} {...commonProps} />;
            case 'drill':
                // Heuristic: If it contains 'input' exercises, it's a RECALL module
                const drillModule = module as DrillModule;
                const isRecall = drillModule.exercises.some(ex => ex.type === 'input' || ex.type === 'cloze');

                if (isRecall) {
                    return <RecallView key={currentModuleIndex} {...commonProps} />;
                }
                return <DrillView key={currentModuleIndex} {...commonProps} onResult={handleDrillResult} />;
            case 'dialogue': return <DialogueView key={currentModuleIndex} {...commonProps} />;
            case 'story': return <StoryView key={currentModuleIndex} {...commonProps} />;
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
                                    onClick={() => handleGenerateLesson()} // Explicitly call with no args to match signature
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

                                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                                    <Button onClick={handleSaveLessonOnly} variant="outline">
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Lesson Only
                                    </Button>
                                    <Button onClick={handleSaveVocabulary} variant="outline">
                                        <Layers className="h-4 w-4 mr-2" />
                                        Save + Create Flashcards
                                    </Button>
                                    <Button
                                        size="lg"
                                        className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                                        onClick={() => {
                                            if (lessonId) completeNode(lessonId);
                                            completeNode("lesson-completed"); // Fallback for XP if no ID
                                            navigate('/');
                                        }}
                                    >
                                        <CheckCircle2 className="h-5 w-5 mr-2" />
                                        Complete & Finish
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
                            <Button
                                onClick={() => {
                                    if (lessonId) completeNode(lessonId);
                                    completeNode("lesson-completed");
                                    navigate('/');
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                Finish
                                <CheckCircle2 className="h-4 w-4 ml-2" />
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
