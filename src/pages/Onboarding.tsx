import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store";
import { GoalHub } from "@/components/onboarding/GoalHub";
import { PlacementTest, type Placement } from "@/components/onboarding/PlacementTest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, ArrowRight, BookOpen, KeyRound } from "lucide-react";

type Step = 'WELCOME' | 'GOAL' | 'EXPERIENCE' | 'TEST' | 'KEY';

export default function OnboardingPage() {
    const navigate = useNavigate();
    const { apiKey, setApiKey, completeOnboarding } = useAppStore();
    const [step, setStep] = useState<Step>('WELCOME');
    const [goal, setGoal] = useState<string>();
    const [placement, setPlacement] = useState<Placement>('beginner');
    const [keyInput, setKeyInput] = useState(apiKey);

    const handlePlaced = (result: Placement) => {
        setPlacement(result);
        if (apiKey) finish(result);
        else setStep('KEY');
    };

    const finish = (result: Placement = placement) => {
        if (keyInput.trim()) setApiKey(keyInput);
        completeOnboarding(result, goal);
        navigate("/", { replace: true });
    };

    return (
        <div className="min-h-dvh bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-xl shadow-primary/20">
                        <span className="text-3xl font-bold" lang="ru">П</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Privet AI</h1>
                </div>

                {step === 'WELCOME' && (
                    <div className="text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                        <h2 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                            Learn Russian <br />
                            <span className="text-primary">that sticks.</span>
                        </h2>
                        <p className="text-muted-foreground text-lg max-w-sm mx-auto">
                            Short AI-built lessons that teach, drill, test and then schedule every word for review.
                        </p>
                        <Button size="lg" className="w-full h-14 text-lg shadow-lg" onClick={() => setStep('GOAL')}>
                            Get started
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                )}

                {step === 'GOAL' && (
                    <GoalHub onSelect={(selected) => {
                        setGoal(selected);
                        setStep('EXPERIENCE');
                    }} />
                )}

                {step === 'EXPERIENCE' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                        <h2 className="text-2xl font-bold text-center mb-8">How much Russian do you know?</h2>
                        <div className="grid gap-4">
                            <Button
                                variant="outline"
                                className="h-20 text-lg justify-between px-6 hover:border-primary hover:bg-primary/5"
                                onClick={() => handlePlaced('beginner')}
                            >
                                <span className="font-semibold">I'm a total beginner</span>
                                <Sparkles className="text-yellow-500" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-20 text-lg justify-between px-6 hover:border-primary hover:bg-primary/5"
                                onClick={() => setStep('TEST')}
                            >
                                <span className="font-semibold">I know some — test me</span>
                                <BookOpen className="text-blue-500" />
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'TEST' && <PlacementTest onComplete={handlePlaced} />}

                {step === 'KEY' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                        <div className="text-center space-y-2">
                            <KeyRound className="h-10 w-10 text-primary mx-auto" />
                            <h2 className="text-2xl font-bold">Connect OpenAI</h2>
                            <p className="text-muted-foreground">
                                Privet AI writes your lessons with OpenAI, using your own API key. It's stored only in this browser
                                and sent only to OpenAI.
                            </p>
                        </div>
                        <Input
                            type="password"
                            placeholder="sk-..."
                            value={keyInput}
                            onChange={(e) => setKeyInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && keyInput.trim() && finish()}
                            autoComplete="off"
                        />
                        <p className="text-xs text-muted-foreground">
                            Create one at{" "}
                            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="underline text-primary">
                                platform.openai.com/api-keys
                            </a>.
                        </p>
                        <div className="grid gap-3">
                            <Button size="lg" className="h-12" disabled={!keyInput.trim()} onClick={() => finish()}>
                                Start learning
                            </Button>
                            <Button variant="ghost" onClick={() => finish()}>
                                Skip for now
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
