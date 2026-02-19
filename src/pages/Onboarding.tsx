import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store";
import { GoalHub } from "@/components/onboarding/GoalHub";
import { PlacementTest } from "@/components/onboarding/PlacementTest";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, BookOpen } from "lucide-react";

type Step = 'WELCOME' | 'GOAL' | 'EXPERIENCE' | 'TEST' | 'RESULT';

export default function OnboardingPage() {
    const navigate = useNavigate();
    const { completeOnboarding } = useAppStore();
    const [step, setStep] = useState<Step>('WELCOME');

    const handleComplete = (level: string) => {
        // Save to store
        completeOnboarding(level);

        // Manually trigger redirect for now if store action doesn't

        // Manually trigger redirect for now if store action doesn't
        setTimeout(() => {
            navigate("/");
        }, 500);
    };

    return (
        <div className="min-h-screen bg-[#F5F7FA] dark:bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg">

                {/* LOGO HEADER */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-xl shadow-primary/20">
                        <span className="text-3xl font-bold">P</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Privet AI</h1>
                </div>

                {/* STEPS */}

                {step === 'WELCOME' && (
                    <div className="text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                        <h2 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                            Master Russian <br />
                            <span className="text-primary">Naturally.</span>
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-sm mx-auto">
                            The first AI-powered course designed to teach you Russian the way natives actually speak.
                        </p>
                        <Button size="lg" className="w-full h-14 text-lg shadow-lg hover:shadow-xl transition-all" onClick={() => setStep('GOAL')}>
                            Get Started
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                )}

                {step === 'GOAL' && (
                    <GoalHub onSelect={(goal) => {
                        console.log("Goal selected:", goal);
                        setStep('EXPERIENCE');
                    }} />
                )}

                {step === 'EXPERIENCE' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                        <div className="text-center space-y-2 mb-8">
                            <h2 className="text-2xl font-bold">How much Russian do you know?</h2>
                        </div>

                        <div className="grid gap-4">
                            <Button
                                variant="outline"
                                className="h-20 text-lg justify-between px-6 hover:border-primary hover:bg-primary/5"
                                onClick={() => handleComplete("Unit 1")}
                            >
                                <span className="font-semibold">I'm a total beginner</span>
                                <Sparkles className="text-yellow-500" />
                            </Button>

                            <Button
                                variant="outline"
                                className="h-20 text-lg justify-between px-6 hover:border-primary hover:bg-primary/5"
                                onClick={() => setStep('TEST')}
                            >
                                <span className="font-semibold">I know some words</span>
                                <BookOpen className="text-blue-500" />
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'TEST' && (
                    <PlacementTest onComplete={handleComplete} />
                )}
            </div>
        </div>
    );
}
