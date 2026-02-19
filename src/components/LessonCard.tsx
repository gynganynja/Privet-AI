import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
// import { Volume2 } from "lucide-react" // Assuming lucide-react is installed, if not we'll use emoji for now or simple SVG

interface LessonCardProps {
    cyrillic: string
    translit?: string
    english: string
    audioSrc?: string // Placeholder for audio hook
    hideTranslit?: boolean
    className?: string
    showEnglish?: boolean
}

export function LessonCard({
    cyrillic,
    translit,
    english,
    hideTranslit = false,
    showEnglish = true,
    className
}: LessonCardProps) {

    const playAudio = () => {
        console.log("Playing audio for:", cyrillic);
        // Implement actual audio logic here later
    }

    return (
        <Card
            className={cn("w-full max-w-sm mx-auto overflow-hidden cursor-pointer hover:border-primary/50 transition-colors", className)}
            onClick={playAudio}
        >
            <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">

                {/* Cyrillic: Scale based on length, always No Italics */}
                <h2 className="text-4xl font-bold text-foreground no-italics" lang="ru">
                    {cyrillic}
                </h2>

                {/* Transliteration: Hidden if forced, or lighter gray */}
                {!hideTranslit && translit && (
                    <p className="text-lg text-muted-foreground font-medium">
                        {translit}
                    </p>
                )}

                {/* English Meaning: Distinct style */}
                {showEnglish && (
                    <div className="pt-4 border-t w-full">
                        <p className="text-xl font-medium text-foreground/80">
                            {english}
                        </p>
                    </div>
                )}

                {/* Audio Hint */}
                <div className="absolute top-4 right-4 text-primary/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
                </div>

            </CardContent>
        </Card>
    )
}
