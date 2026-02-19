import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store";
import { CheckCircle2, AlertTriangle, TrendingUp, Lightbulb } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SessionSummaryProps {
    totalQuestions: number;
    correctCount: number;
    // We could pass session specific errors here if we tracked them locally in Lessons.tsx
    // For now, we'll pull global top errors from the store as "Focus Areas"
}

export function SessionSummary({ totalQuestions, correctCount }: SessionSummaryProps) {
    const { errorProfile } = useAppStore();

    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 100;

    // Sort tags by frequency
    const topErrors = Object.entries(errorProfile.tags)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Accuracy Card */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Session Accuracy
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{accuracy}%</div>
                        <Progress value={accuracy} className="h-2 mt-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                            {correctCount} out of {totalQuestions} correct
                        </p>
                    </CardContent>
                </Card>

                {/* Focus Areas Card */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            Needs Practice
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {topErrors.length > 0 ? (
                            <div className="space-y-2">
                                {topErrors.map(([tag, count]) => (
                                    <div key={tag} className="flex justify-between items-center text-sm">
                                        <span className="capitalize">{tag.replace(/_/g, " ")}</span>
                                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{count} errors</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
                                <TrendingUp className="h-8 w-8 mb-2 opacity-20" />
                                <p>No major error patterns yet!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* AI Tips / Last Mistakes */}
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        Smart Recommendations
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {topErrors.length > 0 ? (
                        <p className="text-sm">
                            You seem to be struggling with <span className="font-bold">{topErrors[0][0].replace(/_/g, " ")}</span>.
                            Consider reviewing the Grammar guide or creating a specialized drill for this topic.
                        </p>
                    ) : (
                        <p className="text-sm">
                            Great consistency! Try increasing the lesson difficulty or testing yourself with Roleplay scenarios to challenge your recall.
                        </p>
                    )}

                    {errorProfile.lastMistakes.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-primary/10">
                            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-70">Recent Mistake</h4>
                            <div className="bg-background/50 p-3 rounded-lg text-sm border">
                                <p className="mb-1 text-muted-foreground">{errorProfile.lastMistakes[0].prompt}</p>
                                <div className="flex gap-2 items-center">
                                    <span className="line-through text-red-500/70">{errorProfile.lastMistakes[0].error}</span>
                                    <span className="text-muted-foreground">→</span>
                                    <span className="text-green-600 font-medium">{errorProfile.lastMistakes[0].correct}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
