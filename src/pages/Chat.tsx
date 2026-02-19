import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store";
import { type ChatMessage, generateResponse } from "@/lib/openai";
import InteractiveText from "@/components/InteractiveText";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, User, Bot, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "react-router-dom";

export default function ChatPage() {
    const { apiKey } = useAppStore();
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: "system", content: "You are a helpful and patient Russian language tutor. You should converse with the user in Russian. If the user makes a mistake, gently correct them in English, then continue the conversation in Russian. Adapt your difficulty to the user's level (start beginner unless otherwise specified)." }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        if (!apiKey) {
            alert("Please set your OpenAI API Key in Settings first.");
            return;
        }

        const userMsg: ChatMessage = { role: "user", content: inputValue };
        const newMessages = [...messages, userMsg];

        setMessages(newMessages);
        setInputValue("");
        setIsLoading(true);

        try {
            const response = await generateResponse(apiKey, newMessages);
            if (response) {
                // Type casting since OpenAI response content can be null, but our logic handles it
                const botMsg: ChatMessage = { role: "assistant", content: response.content || "" };
                setMessages([...newMessages, botMsg]);
            }
        } catch (error: any) {
            console.error("Failed to generate response", error);
            const errorMessage = error?.message || "Unknown error occurred";
            const errorMsg: ChatMessage = { role: "system", content: `Error: ${errorMessage}. Please check your API key and connection.` };
            setMessages([...newMessages, errorMsg]);
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

    if (!apiKey) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>API Key Missing</AlertTitle>
                    <AlertDescription>
                        You need to configure your OpenAI API Key to use the chat.
                    </AlertDescription>
                </Alert>
                <Button asChild>
                    <Link to="/settings">Go to Settings</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <Card className="flex-1 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                        {messages.filter(m => m.role !== 'system').map((msg, index) => (
                            <div
                                key={index}
                                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                    }`}
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                        {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                    </AvatarFallback>
                                </Avatar>
                                <div
                                    className={`rounded-lg px-3 py-2 text-sm max-w-[80%] ${msg.role === "user"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                        }`}
                                >
                                    <InteractiveText content={msg.content} role={msg.role} />
                                </div>
                            </div>
                        ))}
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
                <div className="p-4 border-t flex gap-2">
                    <Input
                        placeholder="Type your message in Russian or English..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                    />
                    <Button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} size="icon">
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </Card>
        </div >
    );
}
