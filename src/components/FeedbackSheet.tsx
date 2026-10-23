import { useRef, useEffect, useState } from "react"
import { CheckCircle2, XCircle, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type FeedbackType = "success" | "error" | "info" | null

interface FeedbackSheetProps {
    isOpen: boolean
    type: FeedbackType
    title: string
    description: string
    correctAnswer?: string
    onAction: () => void
    actionLabel?: string
    onSecondaryAction?: () => void
    secondaryActionLabel?: string
    onExplain?: () => Promise<string | null>
}

export function FeedbackSheet({
    isOpen,
    type,
    title,
    description,
    correctAnswer,
    onAction,
    actionLabel = "Continue",
    onSecondaryAction,
    secondaryActionLabel,
    onExplain
}: FeedbackSheetProps) {
    const [explanation, setExplanation] = useState<string | null>(null);
    const [isExplaining, setIsExplaining] = useState(false);
    const continueButtonRef = useRef<HTMLButtonElement>(null)

    // Reset explanation when open state changes
    useEffect(() => {
        if (!isOpen) {
            setExplanation(null);
            setIsExplaining(false);
        }
    }, [isOpen]);

    // Focus management for accessibility
    useEffect(() => {
        if (isOpen && continueButtonRef.current) {
            continueButtonRef.current.focus()
        }
    }, [isOpen])

    if (!type) return null

    const isSuccess = type === "success"
    const isError = type === "error"

    const handleExplain = async () => {
        if (!onExplain) return;
        setIsExplaining(true);
        try {
            const result = await onExplain();
            setExplanation(result);
        } catch {
            setExplanation("Failed to load explanation.");
        } finally {
            setIsExplaining(false);
        }
    };

    return (
        <Sheet open={isOpen}>
            <SheetContent
                side="bottom"
                className={cn(
                    "rounded-t-3xl border-t-0 p-6 pt-8 focus:outline-none max-h-[85vh] overflow-y-auto",
                    isSuccess ? "bg-[hsl(var(--success-green))]/10" : "", // Subtle tint
                    isError ? "bg-red-50" : ""
                )}
            >
                <div className="flex flex-col gap-4 max-w-md mx-auto">

                    <SheetHeader className="text-left space-y-1">
                        <div className="flex items-center gap-3 mb-2">
                            {isSuccess && <CheckCircle2 className="w-8 h-8 text-[hsl(var(--success-green))]" />}
                            {isError && <XCircle className="w-8 h-8 text-destructive" />}

                            <SheetTitle className={cn(
                                "text-2xl font-bold",
                                isSuccess && "text-[hsl(var(--success-green))]",
                                isError && "text-destructive"
                            )}>
                                {title}
                            </SheetTitle>
                        </div>

                        <SheetDescription className="text-base text-foreground/80">
                            {description}
                        </SheetDescription>

                        {/* Correction Diff View for Errors */}
                        {isError && correctAnswer && (
                            <div className="mt-4 p-4 bg-white rounded-xl border border-red-100 shadow-sm">
                                <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Correct Answer</span>
                                <p className="text-lg font-medium text-destructive mt-1">
                                    {correctAnswer}
                                </p>
                            </div>
                        )}

                        {/* AI Explanation Area */}
                        {explanation ? (
                            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-1">
                                    <Sparkles className="w-4 h-4" />
                                    AI Tutor
                                </div>
                                <p className="text-sm text-blue-900 leading-relaxed">
                                    {explanation}
                                </p>
                            </div>
                        ) : isError && onExplain && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleExplain}
                                disabled={isExplaining}
                                className="mt-2 w-fit text-blue-600 hover:text-blue-700 hover:bg-blue-50 self-start p-0 h-auto font-medium"
                            >
                                {isExplaining ? (
                                    <>
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                        Asking AI...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        Explain why
                                    </>
                                )}
                            </Button>
                        )}
                    </SheetHeader>

                    <SheetFooter className="gap-3 mt-4 sm:flex-col-reverse">
                        <Button
                            ref={continueButtonRef}
                            onClick={onAction}
                            size="lg"
                            variant={isSuccess ? "correct" : isError ? "destructive" : "default"}
                            className="w-full text-lg font-semibold"
                        >
                            {actionLabel}
                        </Button>

                        {onSecondaryAction && (
                            <Button
                                variant="ghost"
                                onClick={onSecondaryAction}
                                className={cn(
                                    "w-full",
                                    isError ? "text-destructive/70 hover:text-destructive" : ""
                                )}
                            >
                                {secondaryActionLabel}
                            </Button>
                        )}
                    </SheetFooter>

                </div>
            </SheetContent>
        </Sheet>
    )
}
