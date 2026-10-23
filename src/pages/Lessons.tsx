import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { generateResponse } from "@/lib/openai";
import { generateStructuredLessonPrompt } from "@/lib/prompts";
import { parseLessonResponse, lessonVocabulary } from "@/lib/lessonParser";
import { VocabularyView, GrammarView, DrillView, DialogueView } from "@/components/LessonModules";
import { RecallView } from "@/components/RecallView";
import { StoryView } from "@/components/StoryView";
import { SessionSummary } from "@/components/SessionSummary";
import type { LessonContent, LessonModule } from "@/types/lesson";
import type { LessonNode } from "@/types/curriculum";
import { COURSE_CONTENT, findNode } from "@/data/courseContent";
import {
    Loader2, ChevronLeft, ChevronRight, Save, CheckCircle2, BookOpen, AlertCircle, Trash2,
    PlayCircle, MessagesSquare, GraduationCap, RefreshCw, X, Zap, Layers,
} from "lucide-react";

export default function LessonsPage() {
    const { id } = useParams();
    if (!id) return <CustomLessons />;
    const node = findNode(id);
    if (!node) return <Navigate to="/" replace />;
    return <CourseLesson key={node.id} node={node} />;
}

async function generateLesson(apiKey: string, topic: string, options: { level: string; mode: 'standard' | 'scenario'; goal?: string; focusPoints?: string[] }) {
    const messages = generateStructuredLessonPrompt({
        topic: options.focusPoints?.length ? `${topic}. Focus strictly on: ${options.focusPoints.join("; ")}` : topic,
        level: options.level,
        mode: options.mode,
        goal: options.goal,
    });
    const response = await generateResponse(apiKey, messages, { json: true });
    if (!response?.content) throw new Error("No response from the AI.");
    return parseLessonResponse(response.content);
}

const errorMessage = (err: unknown) => {
    const status = (err as { status?: number })?.status;
    if (status === 401) return "Your OpenAI API key was rejected. Check it in Settings.";
    if (status === 429) return "OpenAI says you're over your rate limit or quota. Wait a moment, or check your OpenAI billing.";
    if (err instanceof SyntaxError) return "The AI returned a lesson we couldn't read. Please try again.";
    return err instanceof Error ? err.message : "Something went wrong.";
};

// --- Course path lesson -------------------------------------------------------

function CourseLesson({ node }: { node: LessonNode }) {
    const navigate = useNavigate();
    const { apiKey, userProgress, nodeLessons, cacheNodeLesson, clearNodeLesson } = useAppStore();
    const cached = nodeLessons[node.id];
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const started = useRef(false);

    const unit = COURSE_CONTENT.units.find(u => u.nodes.some(n => n.id === node.id));

    const generate = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const lesson = await generateLesson(apiKey, node.content.topic, {
                level: node.content.level,
                // Every third lesson leans on dialogue, per the curriculum's variety target.
                mode: node.type === 'lesson' && Number(node.id.slice(-1)) % 3 === 0 ? 'scenario' : 'standard',
                goal: userProgress.userGoal,
                focusPoints: node.content.focusPoints,
            });
            cacheNodeLesson(node.id, { ...lesson, title: node.title });
        } catch (err) {
            console.error("Lesson generation failed", err);
            setError(errorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, [apiKey, node, userProgress.userGoal, cacheNodeLesson]);

    useEffect(() => {
        if (cached || !apiKey || started.current) return;
        started.current = true;
        generate();
    }, [cached, apiKey, generate]);

    if (cached) {
        return (
            <LessonPlayer
                lesson={cached}
                nodeId={node.id}
                deckTitle={unit ? `Unit ${COURSE_CONTENT.units.indexOf(unit) + 1}: ${unit.title}` : "Course vocabulary"}
                onExit={() => navigate("/")}
                onRegenerate={() => {
                    if (confirm("Generate a fresh version of this lesson?")) {
                        clearNodeLesson(node.id);
                        started.current = true;
                        generate();
                    }
                }}
            />
        );
    }

    return (
        <div className="max-w-md mx-auto px-4 py-12 text-center space-y-6">
            <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{node.type === 'quiz' ? 'Checkpoint' : 'Lesson'}</p>
                <h1 className="text-2xl font-bold">{node.title}</h1>
                <p className="text-muted-foreground">{node.content.topic}</p>
            </div>

            {!apiKey ? (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>API key needed</AlertTitle>
                    <AlertDescription>
                        Lessons are written by AI using your OpenAI key. <Link to="/settings" className="underline font-medium">Add it in Settings</Link>.
                    </AlertDescription>
                </Alert>
            ) : error ? (
                <div className="space-y-4">
                    <Alert variant="destructive" className="text-left">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Couldn't create this lesson</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <Button onClick={generate} disabled={isLoading}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Try again
                    </Button>
                </div>
            ) : (
                <div className="space-y-4 py-6">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                    <p className="font-medium">Writing your lesson…</p>
                    <p className="text-sm text-muted-foreground">This takes about 20 seconds. It's saved once it's ready, so next time it opens instantly.</p>
                </div>
            )}

            <Button variant="ghost" onClick={() => navigate("/")}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back to path
            </Button>
        </div>
    );
}

// --- Custom lessons (free topic + library) -----------------------------------

function CustomLessons() {
    const navigate = useNavigate();
    const { apiKey, userProgress, savedLessons, saveLesson, deleteLesson } = useAppStore();
    const [topic, setTopic] = useState("");
    const [mode, setMode] = useState<'standard' | 'scenario'>('standard');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [active, setActive] = useState<{ lesson: LessonContent; saved: boolean } | null>(null);

    const handleGenerate = async () => {
        if (!topic.trim() || isLoading) return;
        setIsLoading(true);
        setError(null);
        try {
            const lesson = await generateLesson(apiKey, topic.trim(), { level: 'A1', mode, goal: userProgress.userGoal });
            setActive({ lesson, saved: false });
        } catch (err) {
            console.error("Lesson generation failed", err);
            setError(errorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    if (active) {
        return (
            <LessonPlayer
                lesson={active.lesson}
                deckTitle={active.lesson.title}
                onExit={() => setActive(null)}
                onSave={active.saved ? undefined : () => {
                    saveLesson(active.lesson);
                    setActive({ ...active, saved: true });
                }}
            />
        );
    }

    const library = [...savedLessons].sort((a, b) => b.createdAt - a.createdAt);

    return (
        <div className="max-w-4xl mx-auto py-6 space-y-8 animate-in fade-in px-4">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => navigate("/practice")} aria-label="Back">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Custom lesson</h1>
                    <p className="text-muted-foreground text-sm">Learn anything — the AI builds a full lesson around it.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="border-2 border-primary/10 shadow-sm h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            New lesson
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <Tabs value={mode} onValueChange={(v) => setMode(v as 'standard' | 'scenario')}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="standard" className="gap-2">
                                    <GraduationCap className="h-4 w-4" /> Standard
                                </TabsTrigger>
                                <TabsTrigger value="scenario" className="gap-2">
                                    <MessagesSquare className="h-4 w-4" /> Scenario
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <p className="text-xs text-muted-foreground -mt-2">
                            {mode === 'standard'
                                ? "Words → grammar → drills → recall → a short dialogue."
                                : "The same loop, with a longer real-life conversation to practise."}
                        </p>

                        <div className="space-y-2">
                            <label htmlFor="lesson-topic" className="text-sm font-medium">Topic or situation</label>
                            <Input
                                id="lesson-topic"
                                placeholder={mode === 'scenario' ? "e.g. Checking into a hotel" : "e.g. Colours and clothes"}
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                disabled={isLoading}
                                onKeyDown={(e) => e.key === 'Enter' && apiKey && handleGenerate()}
                            />
                        </div>

                        {!apiKey && (
                            <p className="text-sm text-muted-foreground">
                                <Link to="/settings" className="underline">Add your OpenAI key</Link> to generate lessons.
                            </p>
                        )}

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button className="w-full" size="lg" onClick={handleGenerate} disabled={!apiKey || isLoading || !topic.trim()}>
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Writing lesson…</>
                            ) : (
                                <><PlayCircle className="mr-2 h-4 w-4" /> Start learning</>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Save className="h-5 w-5" /> Saved lessons
                        </h2>
                        <span className="text-xs text-muted-foreground">{library.length} saved</span>
                    </div>

                    {library.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
                            <Save className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No saved lessons yet.</p>
                            <p className="text-xs">Save a custom lesson at the end to replay it here.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {library.map((lesson) => (
                                <Card key={lesson.id} className="hover:bg-muted/50 transition-colors">
                                    <CardContent className="p-4 flex justify-between items-center gap-2">
                                        <button
                                            type="button"
                                            className="text-left flex-1 min-w-0"
                                            onClick={() => setActive({ lesson: lesson.content, saved: true })}
                                        >
                                            <h3 className="font-semibold line-clamp-1">{lesson.content.title}</h3>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(lesson.createdAt).toLocaleDateString()} · {lesson.content.modules.length} steps
                                            </p>
                                        </button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            aria-label="Delete lesson"
                                            onClick={() => confirm("Delete this saved lesson?") && deleteLesson(lesson.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Lesson player -------------------------------------------------------------

interface LessonPlayerProps {
    lesson: LessonContent;
    nodeId?: string;
    deckTitle: string;
    onExit: () => void;
    onRegenerate?: () => void;
    onSave?: () => void;
}

function LessonPlayer({ lesson, nodeId, deckTitle, onExit, onRegenerate, onSave }: LessonPlayerProps) {
    const { completeLesson, addCardsToDeck } = useAppStore();
    const [index, setIndex] = useState(0);
    const [completed, setCompleted] = useState<Set<number>>(new Set());
    const [stats, setStats] = useState({ total: 0, correct: 0 });
    const [result, setResult] = useState<{ xp: number; newWords: number } | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const modules = lesson.modules;
    const isLast = index === modules.length - 1;
    const stepDone = completed.has(index);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ block: "start" });
    }, [index, result]);

    const markComplete = useCallback(() => {
        setCompleted(prev => prev.has(index) ? prev : new Set(prev).add(index));
    }, [index]);

    // Only count first attempts; revisiting a finished step shouldn't change the score.
    const recordResult = useCallback((isCorrect: boolean) => {
        if (completed.has(index)) return;
        setStats(prev => ({ total: prev.total + 1, correct: prev.correct + (isCorrect ? 1 : 0) }));
    }, [completed, index]);

    const finish = () => {
        const xp = completeLesson(nodeId, stats);
        const newWords = addCardsToDeck(deckTitle, lessonVocabulary(lesson));
        setResult({ xp, newWords });
    };

    const exit = () => {
        if (completed.size === 0 || result || confirm("Leave this lesson? Your progress in it won't be saved.")) {
            onExit();
        }
    };

    if (result) {
        return (
            <div ref={scrollRef} className="max-w-2xl mx-auto px-4 py-8 space-y-8 animate-in fade-in zoom-in-95">
                <div className="text-center space-y-3">
                    <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto" />
                    <h2 className="text-2xl font-bold">Lesson complete!</h2>
                    <div className="flex justify-center gap-6 text-sm">
                        <span className="flex items-center gap-1 font-semibold text-yellow-600"><Zap className="h-4 w-4 fill-yellow-500 text-yellow-500" /> +{result.xp} XP</span>
                        <span className="flex items-center gap-1 text-muted-foreground"><Layers className="h-4 w-4" />
                            {result.newWords > 0 ? `${result.newWords} new words added to review` : "Words already in your review deck"}
                        </span>
                    </div>
                </div>

                <SessionSummary totalQuestions={stats.total} correctCount={stats.correct} />

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {onSave && (
                        <Button variant="outline" onClick={onSave}>
                            <Save className="h-4 w-4 mr-2" /> Save lesson
                        </Button>
                    )}
                    <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white" onClick={onExit}>
                        Continue <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col max-w-4xl mx-auto w-full px-4 md:px-0 py-4 gap-4 animate-in fade-in">
            <div ref={scrollRef} className="flex items-center gap-3 scroll-mt-4">
                <Button variant="ghost" size="icon" onClick={exit} aria-label="Exit lesson">
                    <X className="h-5 w-5" />
                </Button>
                <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex justify-between items-baseline gap-2">
                        <h2 className="font-semibold line-clamp-1">{lesson.title}</h2>
                        <span className="text-xs text-muted-foreground shrink-0">Step {index + 1} of {modules.length}</span>
                    </div>
                    <Progress value={((index + (stepDone ? 1 : 0)) / modules.length) * 100} className="h-2" />
                </div>
                {onRegenerate && (
                    <Button variant="ghost" size="icon" onClick={onRegenerate} aria-label="Regenerate lesson" title="Regenerate lesson">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <Card className="shadow-sm">
                <div className="p-4 md:p-8">
                    <ModuleView
                        key={index}
                        module={modules[index]}
                        onComplete={markComplete}
                        onResult={recordResult}
                    />
                </div>
            </Card>

            <div className="sticky bottom-0 py-3 bg-background/90 backdrop-blur-sm flex justify-between items-center">
                <Button variant="ghost" onClick={() => setIndex(i => Math.max(0, i - 1))} disabled={index === 0}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                {isLast ? (
                    <Button onClick={finish} disabled={!stepDone} className="bg-green-600 hover:bg-green-700 text-white">
                        Finish lesson <CheckCircle2 className="h-4 w-4 ml-2" />
                    </Button>
                ) : (
                    <Button onClick={() => setIndex(i => i + 1)} disabled={!stepDone}>
                        Continue <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                )}
            </div>
        </div>
    );
}

function ModuleView({ module, onComplete, onResult }: { module: LessonModule; onComplete: () => void; onResult: (isCorrect: boolean) => void }) {
    switch (module.type) {
        case 'vocabulary': return <VocabularyView module={module} onComplete={onComplete} />;
        case 'grammar': return <GrammarView module={module} onComplete={onComplete} />;
        case 'dialogue': return <DialogueView module={module} onComplete={onComplete} />;
        case 'story': return <StoryView module={module} onComplete={onComplete} />;
        case 'drill': {
            // Production (typing) exercises get the focused recall screen.
            const isRecall = module.exercises.length > 0 && module.exercises.every(ex => ex.type === 'input');
            return isRecall
                ? <RecallView module={module} onComplete={onComplete} onResult={onResult} />
                : <DrillView module={module} onComplete={onComplete} onResult={onResult} />;
        }
        default:
            console.error("Unknown module type:", module);
            return (
                <div className="p-4 text-center space-y-3">
                    <p className="text-muted-foreground">This step couldn't be displayed.</p>
                    <Button variant="outline" onClick={onComplete}>Skip step</Button>
                </div>
            );
    }
}
