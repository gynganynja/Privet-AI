import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Loader2 } from "lucide-react";
import { playText } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";

interface AudioPlayerProps {
    text: string;
    speed?: number; // Optional override, otherwise uses global settings
    className?: string;
    iconClassName?: string;
    size?: "sm" | "icon" | "default" | "lg";
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    lang?: string; // Defaults to Russian
    disabled?: boolean;
}

export function AudioPlayer({
    text,
    speed,
    className,
    iconClassName,
    size = "icon",
    variant = "ghost",
    lang,
    disabled
}: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const enabled = useAppStore((s) => s.audioSettings.enabled);

    const handlePlay = async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation(); // Prevent card clicks
        if (isPlaying || disabled || !text) return;

        setIsPlaying(true);
        try {
            await playText(text, {
                speed,
                lang,
                onEnd: () => setIsPlaying(false),
                onError: () => setIsPlaying(false)
            });
        } catch (err) {
            console.error(err);
            setIsPlaying(false);
        }
    };

    if (!enabled) return null;

    return (
        <Button
            variant={variant}
            size={size}
            className={cn(
                "rounded-full transition-colors",
                // Default styles only if not overridden by variant/className
                variant === 'ghost' && "text-foreground/70 hover:text-primary hover:bg-primary/10",
                isPlaying && "text-primary animate-pulse",
                className
            )}
            onClick={handlePlay}
            disabled={disabled || isPlaying || !text}
            title="Play audio"
            aria-label="Play audio"
            type="button"
        >
            {isPlaying ? (
                <Loader2 className={cn("animate-spin", iconClassName)} size={size === 'sm' ? 14 : (size === 'lg' ? 24 : 20)} />
            ) : (
                <Volume2 className={cn(iconClassName)} size={size === 'sm' ? 16 : (size === 'lg' ? 28 : 24)} />
            )}
        </Button>
    );
}
