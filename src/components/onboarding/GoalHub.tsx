import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plane, Briefcase, Heart, BookOpen, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface GoalHubProps {
    onSelect: (goal: string) => void;
}

const goals = [
    { id: "Travel", icon: Plane, label: "Travel", color: "text-blue-500", bg: "bg-blue-500/10" },
    { id: "Family", icon: Heart, label: "Family & Friends", color: "text-red-500", bg: "bg-red-500/10" },
    { id: "Culture", icon: BookOpen, label: "Culture", color: "text-amber-500", bg: "bg-amber-500/10" },
    { id: "Work", icon: Briefcase, label: "Work", color: "text-green-500", bg: "bg-green-500/10" },
    { id: "Challenge", icon: Trophy, label: "Brain Training", color: "text-purple-500", bg: "bg-purple-500/10" },
];

export function GoalHub({ onSelect }: GoalHubProps) {
    const [selected, setSelected] = useState<string | null>(null);

    const handleContinue = () => {
        if (selected) onSelect(selected);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Why do you want to learn Russian?</h1>
                <p className="text-muted-foreground">We'll personalize your experience.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {goals.map((goal) => (
                    <Card
                        key={goal.id}
                        className={cn(
                            "cursor-pointer hover:border-primary transition-all duration-200 border-2",
                            selected === goal.id ? "border-primary bg-primary/5 shadow-md scale-105" : "border-transparent bg-card shadow-sm"
                        )}
                        onClick={() => setSelected(goal.id)}
                    >
                        <div className="p-6 flex flex-col items-center gap-4 text-center">
                            <div className={cn("p-4 rounded-full", goal.bg, goal.color)}>
                                <goal.icon size={32} />
                            </div>
                            <span className="font-semibold">{goal.label}</span>
                        </div>
                    </Card>
                ))}
            </div>

            <Button
                className="w-full h-12 text-lg"
                size="lg"
                disabled={!selected}
                onClick={handleContinue}
            >
                Continue
            </Button>
        </div>
    );
}
