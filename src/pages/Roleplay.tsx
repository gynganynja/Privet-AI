import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store";
import { type ChatMessage } from "@/lib/openai";
import { complete, useAIReady } from "@/lib/ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, User, Bot, AlertCircle, ArrowLeft, Coffee, MapPin, ShoppingBag, Briefcase, GraduationCap, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import InteractiveText from "@/components/InteractiveText";
import { AudioRecorder } from "@/components/AudioRecorder";

// Scenario Definitions
const SCENARIOS = [
    {
        id: "cafe",
        title: "Ordering at a Cafe",
        description: "Order a coffee and a pastry from a barista.",
        difficulty: "Beginner",
        icon: Coffee,
        objectives: [
            "Greet the barista",
            "Order a drink (coffee/tea)",
            "Order a snack or pastry",
            "Ask for the bill",
            "Say thank you and goodbye"
        ],
        systemPrompt: "You are a barista in a cafe in Moscow. You are friendly and helpful. The user is a customer ordering food and drinks. Converse in Russian. Keep responses concise (1-2 sentences) to keep the conversation flowing. If the user makes a massive mistake, gently correct them in English parentheses, but mostly stay in character."
    },
    {
        id: "directions",
        title: "Asking for Directions",
        description: "You are lost in St. Petersburg. Ask a passerby for help.",
        difficulty: "Beginner",
        icon: MapPin,
        objectives: [
            "Excuse yourself politely",
            "Ask where the Metro is",
            "Ask if it is far on foot",
            "Thank the stranger"
        ],
        systemPrompt: "You are a local in St. Petersburg. A tourist (the user) is asking you for directions. You are helpful but speak at a normal pace. Converse in Russian. Give clear instructions (turn left, go straight, etc.)."
    },
    {
        id: "market",
        title: "Grocery Shopping",
        description: "Buy fruits and vegetables at a local market.",
        difficulty: "Intermediate",
        icon: ShoppingBag,
        objectives: [
            "Ask the price of apples",
            "Buy 1 kilogram of fruit",
            "Ask if the vegetables are fresh",
            "Try to get a small discount"
        ],
        systemPrompt: "You are a vendor at a market in Russia selling fresh produce. You want to sell your goods. You can haggle a little bit. Converse in Russian."
    },
    {
        id: "interview",
        title: "Job Interview",
        description: "Answer basic questions about yourself for a new job.",
        difficulty: "Advanced",
        icon: Briefcase,
        objectives: [
            "Introduce yourself professionally",
            "Describe your work experience",
            "Explain why you want this job",
            "Ask one question about the company"
        ],
        systemPrompt: "You are a hiring manager for a tech company in Moscow. You are conducting a job interview with the user. Ask about their experience, skills, and why they want the job. Be professional. Converse in Russian."
    },
    {
        id: "university",
        title: "University Registration",
        description: "Register for classes at a university office.",
        difficulty: "Intermediate",
        icon: GraduationCap,
        objectives: [
            "State your name and purpose",
            "Ask which documents are needed",
            "Register for the Russian Language course",
            "Ask when classes start"
        ],
        systemPrompt: "You are an administrator at Moscow State University. Help a new student (the user) register for their Russian language courses. Ask for their name, documents, and preferred schedule."
    }
];

// Appended to every persona so conversations stay usable for a beginner.
const LEARNER_GUIDANCE = " The learner is a beginner (A1–A2). Use short, simple sentences and common words. If they write in English or get stuck, reply with a simple Russian phrase they could use, followed by its English meaning in parentheses. Briefly correct real grammar mistakes in English parentheses, then stay in character.";

export default function RoleplayPage() {
    const { chatSessions, saveChatSession, clearChatSession } = useAppStore();
    const aiReady = useAIReady();
    const [selectedScenario, setSelectedScenario] = useState<typeof SCENARIOS[0] | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logic
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                setTimeout(() => {
                    scrollContainer.scrollTop = scrollContainer.scrollHeight;
                }, 100);
            }
        }
    }, [messages, selectedScenario]);

    const startScenario = (scenario: typeof SCENARIOS[0]) => {
        setSelectedScenario(scenario);
        // Load existing session or start new
        if (chatSessions[scenario.id] && chatSessions[scenario.id].length > 0) {
            setMessages(chatSessions[scenario.id] as ChatMessage[]);
        } else {
            const initialMessages: ChatMessage[] = [
                { role: "system", content: scenario.systemPrompt + LEARNER_GUIDANCE },
                { role: "assistant", content: "Здравствуйте! Чем я могу вам помочь?" }
            ];
            setMessages(initialMessages);
            saveChatSession(scenario.id, initialMessages);
        }
    };

    const exitScenario = () => {
        setSelectedScenario(null);
        setMessages([]);
        setInputValue("");
    };

    const resetScenario = () => {
        if (!selectedScenario) return;
        clearChatSession(selectedScenario.id);
        const initialMessages: ChatMessage[] = [
            { role: "system", content: selectedScenario.systemPrompt + LEARNER_GUIDANCE },
            { role: "assistant", content: "Здравствуйте! Чем я могу вам помочь?" }
        ];
        setMessages(initialMessages);
        saveChatSession(selectedScenario.id, initialMessages);
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading || !aiReady || !selectedScenario) return;

        const userMsg: ChatMessage = { role: "user", content: inputValue };
        const newMessages = [...messages, userMsg];

        setMessages(newMessages);
        saveChatSession(selectedScenario.id, newMessages);
        setInputValue("");
        setIsLoading(true);
        setError(null);

        try {
            const reply = await complete(newMessages, { maxTokens: 8000 });
            if (reply) {
                const botMsg: ChatMessage = { role: "assistant", content: reply };
                const updatedMessages = [...newMessages, botMsg];
                setMessages(updatedMessages);
                saveChatSession(selectedScenario.id, updatedMessages);
            }
        } catch (error) {
            console.error("Roleplay Error", error);
            setError("Couldn't get a reply. Check your connection and API key, then send again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!aiReady) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] gap-4 p-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>API Key Missing</AlertTitle>
                    <AlertDescription>Add an OpenAI or Claude API key in Settings to use Roleplay.</AlertDescription>
                </Alert>
                <Button asChild><Link to="/settings">Go to Settings</Link></Button>
            </div>
        );
    }

    // SCENARIO SELECTION SCREEN
    if (!selectedScenario) {
        return (
            <div className="container mx-auto max-w-5xl py-6 px-4 space-y-8 animate-in fade-in duration-500">
                <div className="space-y-2">
                    <Link to="/practice" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" /> Practice
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Roleplay Scenarios</h1>
                    <p className="text-muted-foreground">Practice real-world conversations with AI personas.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {SCENARIOS.map((scenario) => {
                        const hasSession = chatSessions[scenario.id] && chatSessions[scenario.id].length > 2; // >2 means more than system prompt + initial greeting
                        return (
                            <Card key={scenario.id} className="hover:border-primary/50 transition-colors cursor-pointer flex flex-col group" onClick={() => startScenario(scenario)}>
                                <CardHeader>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                            <scenario.icon className="h-6 w-6" />
                                        </div>
                                        <span className={cn(
                                            "text-xs font-medium px-2.5 py-0.5 rounded-full",
                                            scenario.difficulty === "Beginner" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                                                scenario.difficulty === "Intermediate" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                                    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                        )}>
                                            {scenario.difficulty}
                                        </span>
                                    </div>
                                    <CardTitle>{scenario.title}</CardTitle>
                                    <CardDescription>{scenario.description}</CardDescription>
                                </CardHeader>
                                <CardFooter className="mt-auto pt-4 flex gap-2">
                                    <Button className="w-full" variant={hasSession ? "secondary" : "default"}>
                                        {hasSession ? "Resume Chat" : "Start Conversation"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            </div >
        );
    }

    // CHAT INTERFACE
    return (
        <div className="flex flex-col h-full max-w-6xl mx-auto w-full p-4 animate-in fade-in slide-in-from-right-8 duration-300">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={exitScenario}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="font-semibold">{selectedScenario.title}</h2>
                        <p className="text-xs text-muted-foreground">Roleplay Mode</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={resetScenario}>
                    <Trash2 className="h-4 w-4 mr-2" /> Reset Chat
                </Button>
            </div>

            <div className="flex gap-4 h-[calc(100dvh-14rem)] min-h-[400px]">
                {/* Chat Area */}
                <Card className="flex-[2] flex flex-col overflow-hidden shadow-lg border-primary/10">
                    <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                        <div className="space-y-4 pb-4">
                            {messages.filter(m => m.role !== 'system').map((msg, index) => (
                                <div key={index} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>
                                            {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className={`rounded-lg px-3 py-2 text-sm max-w-[85%] shadow-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                                        }`}>
                                        <InteractiveText content={msg.content} role={msg.role} />
                                    </div>
                                </div>
                            ))}
                            {error && (
                                <p className="text-sm text-destructive text-center">{error}</p>
                            )}
                            {isLoading && (
                                <div className="flex gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                    <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                                        <span className="animate-pulse">Writing...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    <div className="p-4 border-t bg-card/50 backdrop-blur-sm">
                        <div className="flex gap-2 relative">
                            <Input
                                placeholder="Type in Russian..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                                className="pr-12"
                                lang="ru"
                            />
                            <div className="absolute right-12 top-1/2 -translate-y-1/2">
                                <AudioRecorder
                                    onTranscriptionComplete={(text) => setInputValue(text)}
                                    disabled={isLoading}
                                />
                            </div>
                            <Button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} size="icon">
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Objectives Panel */}
                <Card className="flex-1 p-4 bg-muted/20 border-l hidden md:flex flex-col">
                    <CardHeader className="p-0 pb-4">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Briefcase className="h-4 w-4" /> Mission Objectives
                        </CardTitle>
                    </CardHeader>
                    <div className="space-y-3">
                        {/* We could make these checkable in the future. For now, just a list. */}
                        {selectedScenario.objectives ? selectedScenario.objectives.map((obj, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-card border shadow-sm">
                                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0 mt-0.5" />
                                <p className="text-sm">{obj}</p>
                            </div>
                        )) : (
                            <p className="text-sm text-muted-foreground italic">No specific objectives.</p>
                        )}
                    </div>
                    <div className="mt-auto pt-4 text-xs text-muted-foreground">
                        <p>Complete these tasks during your conversation.</p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
