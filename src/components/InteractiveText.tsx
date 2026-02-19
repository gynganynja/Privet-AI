import { useState } from "react";
import { useAppStore } from "@/store";
import { translateWord } from "@/lib/openai";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveTextProps {
    content: string;
    role: "user" | "assistant" | "system";
}

export default function InteractiveText({ content, role }: InteractiveTextProps) {
    const { apiKey } = useAppStore();

    // Only make assistant text interactive to save tokens and focus on learning
    if (role !== "assistant") {
        return <span className="whitespace-pre-wrap">{content}</span>;
    }

    // Split by spaces but preserve punctuation
    // This regex splits by spaces but keeps delimiters
    const words = content.split(/(\s+)/);

    return (
        <div className="whitespace-pre-wrap leading-relaxed" lang="ru">
            {words.map((word, index) => {
                // If it's just whitespace, render it directly
                if (word.match(/^\s+$/)) {
                    return <span key={index}>{word}</span>;
                }

                // If it's punctuation only, also render directly (optional, but good for saving clicks)
                if (word.match(/^[.,!?;:"']+$/)) {
                    return <span key={index}>{word}</span>;
                }

                return (
                    <InteractiveWord
                        key={index}
                        word={word}
                        fullContext={content}
                        apiKey={apiKey || ""}
                    />
                );
            })}
        </div>
    );
}

function InteractiveWord({ word, fullContext, apiKey }: { word: string, fullContext: string, apiKey: string }) {
    const [translation, setTranslation] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleTranslate = async () => {
        if (translation || isLoading) return; // Already fetched

        setIsLoading(true);
        try {
            const result = await translateWord(apiKey, word, fullContext);
            setTranslation(result);
        } catch (error) {
            setTranslation("Error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (open) handleTranslate();
        }}>
            <DropdownMenuTrigger asChild>
                <span
                    className={cn(
                        "cursor-pointer hover:bg-primary/10 hover:text-primary hover:underline underline-offset-4 rounded-sm px-0.5 transition-all duration-200",
                        isOpen && "bg-primary/20 text-primary font-medium"
                    )}
                >
                    {word}
                </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="max-w-[200px]">
                <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
                    <Sparkles className="h-3 w-3 text-primary" /> Translation
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2 text-sm font-medium text-center">
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Translating...</span>
                        </div>
                    ) : (
                        translation
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
