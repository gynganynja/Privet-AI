import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, RotateCcw, Award, Flame, BookOpen, Layers, Target } from "lucide-react";
import { currentStreak, useAppStore } from "@/store";
import { ALL_NODES } from "@/data/courseContent";
import { isDue } from "@/lib/srs";

export default function ProfilePage() {
    const { userProgress, decks, errorProfile, resetProgress } = useAppStore();

    const lessonsDone = ALL_NODES.filter(n => userProgress.completedNodes.includes(n.id)).length;
    const cards = decks.flatMap(d => d.cards);
    const learned = cards.filter(c => (c.srs?.repetition ?? 0) >= 2).length;
    const due = cards.filter(isDue).length;
    const focusAreas = Object.entries(errorProfile.tags).sort(([, a], [, b]) => b - a).slice(0, 4);

    const stats = [
        { icon: Flame, color: "text-orange-500", value: currentStreak(userProgress), label: "Day streak" },
        { icon: Award, color: "text-yellow-500", value: userProgress.xp, label: "Total XP" },
        { icon: BookOpen, color: "text-primary", value: `${lessonsDone}/${ALL_NODES.length}`, label: "Lessons" },
        { icon: Layers, color: "text-green-600", value: learned, label: "Words learned" },
    ];

    const handleReset = () => {
        if (confirm("Reset your course progress, XP and streak? Your flashcards and settings are kept.")) {
            resetProgress();
        }
    };

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-md mx-auto">
            <header className="space-y-1">
                <h1 className="text-2xl font-bold">Your progress</h1>
                <p className="text-muted-foreground text-sm">
                    {userProgress.userGoal ? `Learning for: ${userProgress.userGoal}` : "Russian Foundation · A1"}
                </p>
            </header>

            <div className="grid grid-cols-2 gap-3">
                {stats.map(({ icon: Icon, color, value, label }) => (
                    <Card key={label}>
                        <CardContent className="pt-6 flex flex-col items-center">
                            <Icon className={`w-7 h-7 mb-2 ${color}`} />
                            <span className="text-2xl font-bold">{value}</span>
                            <span className="text-xs text-muted-foreground uppercase">{label}</span>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {due > 0 && (
                <Button asChild className="w-full">
                    <Link to="/practice">Review {due} due {due === 1 ? "card" : "cards"}</Link>
                </Button>
            )}

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-4 w-4 text-orange-500" />
                        Focus areas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {focusAreas.length > 0 ? (
                        <ul className="space-y-2">
                            {focusAreas.map(([tag, count]) => (
                                <li key={tag} className="flex justify-between text-sm">
                                    <span className="capitalize">{tag.replace(/_/g, " ")}</span>
                                    <span className="text-muted-foreground">{count} {count === 1 ? "mistake" : "mistakes"}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">Mistakes you make in lessons are grouped here so you know what to revisit.</p>
                    )}
                </CardContent>
            </Card>

            <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start h-12" asChild>
                    <Link to="/settings">
                        <Settings className="mr-3 h-5 w-5" />
                        Settings
                    </Link>
                </Button>
                <Button variant="ghost" className="w-full justify-start h-12 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleReset}>
                    <RotateCcw className="mr-3 h-5 w-5" />
                    Reset progress
                </Button>
            </div>
        </div>
    );
}
