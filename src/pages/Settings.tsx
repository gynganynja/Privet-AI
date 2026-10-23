import { useState, useEffect } from "react";
import { useAppStore, type AIProvider, type OpenAIVoice } from "@/store";
import { CLAUDE_MODEL, OPENAI_CHAT_MODEL } from "@/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, KeyRound, Volume2, PlayCircle, Sparkles } from "lucide-react";
import { getAvailableVoices, playText, type VoiceOption } from "@/lib/audio";

export default function SettingsPage() {
    const { aiProvider, setAIProvider, apiKey, setApiKey, anthropicKey, setAnthropicKey } = useAppStore();

    return (
        <div className="max-w-2xl mx-auto w-full space-y-6 p-4 sm:p-6">
            <h1 className="text-3xl font-bold">Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        AI tutor
                    </CardTitle>
                    <CardDescription>
                        Choose who writes your lessons and runs the tutor. Keys are stored only in this browser and sent only
                        to that provider. Set a monthly spending limit in your provider account to stay in control.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="AI provider">
                        {PROVIDERS.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                role="radio"
                                aria-checked={aiProvider === p.id}
                                onClick={() => setAIProvider(p.id)}
                                className={
                                    "rounded-lg border-2 p-3 text-left transition-colors " +
                                    (aiProvider === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40")
                                }
                            >
                                <p className="font-semibold">{p.name}</p>
                                <p className="text-xs text-muted-foreground">{p.model}</p>
                            </button>
                        ))}
                    </div>

                    <KeyField
                        label="Claude (Anthropic) API key"
                        placeholder="sk-ant-..."
                        value={anthropicKey}
                        onSave={setAnthropicKey}
                        help={<>Get one at <a href="https://platform.claude.com/settings/keys" target="_blank" rel="noreferrer" className="underline text-primary">platform.claude.com</a>.</>}
                    />
                    <KeyField
                        label="OpenAI API key"
                        placeholder="sk-..."
                        value={apiKey}
                        onSave={setApiKey}
                        help={<>Get one at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="underline text-primary">platform.openai.com</a>.
                            {aiProvider === 'anthropic' && " Optional with Claude: it adds voice answers and OpenAI voices."}</>}
                    />
                </CardContent>
            </Card>

            <AudioSettingsSection />
        </div>
    );
}

const PROVIDERS: { id: AIProvider; name: string; model: string }[] = [
    { id: 'anthropic', name: 'Claude', model: CLAUDE_MODEL },
    { id: 'openai', name: 'OpenAI', model: OPENAI_CHAT_MODEL },
];

function KeyField({ label, placeholder, value, onSave, help }: {
    label: string;
    placeholder: string;
    value: string;
    onSave: (key: string) => void;
    help: React.ReactNode;
}) {
    const [localKey, setLocalKey] = useState(value);
    const [showKey, setShowKey] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        setLocalKey(value);
    }, [value]);

    const handleSave = () => {
        onSave(localKey);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
                <KeyRound className="h-4 w-4" /> {label}
            </label>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Input
                        type={showKey ? "text" : "password"}
                        autoComplete="off"
                        placeholder={placeholder}
                        value={localKey}
                        onChange={(e) => setLocalKey(e.target.value)}
                        aria-label={label}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowKey(!showKey)}
                        aria-label={showKey ? "Hide key" : "Show key"}
                    >
                        {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
                <Button onClick={handleSave} disabled={localKey.trim() === value}>
                    {isSaved ? "Saved!" : localKey.trim() || !value ? "Save" : "Remove"}
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">{help}</p>
        </div>
    );
}

function AudioSettingsSection() {
    const { audioSettings, setAudioSettings } = useAppStore();
    const [voices, setVoices] = useState<VoiceOption[]>([]);

    useEffect(() => {
        const loadVoices = () => {
            const available = getAvailableVoices();
            setVoices(available);
        };

        loadVoices();

        // Chrome loads voices asynchronously
        if (window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.onvoiceschanged = null;
            }
        };
    }, []);

    const russianVoices = voices.filter(v => v.lang.toLowerCase().includes('ru'));
    const otherVoices = voices.filter(v => !v.lang.toLowerCase().includes('ru'));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5" />
                    Audio & Pronunciation
                </CardTitle>
                <CardDescription>
                    Configure Text-to-Speech settings for lessons and flashcards.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Enable Audio Toggle */}
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Enable Audio</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            className="h-4 w-4 accent-primary"
                            checked={audioSettings.enabled}
                            onChange={(e) => setAudioSettings({ enabled: e.target.checked })}
                        />
                    </div>
                </div>

                {audioSettings.enabled && (
                    <>
                        {/* Provider Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Voice Provider</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={audioSettings.provider || 'browser'}
                                onChange={(e) => setAudioSettings({ provider: e.target.value as 'browser' | 'openai' })}
                            >
                                <option value="browser">Browser API (Free, Offline)</option>
                                <option value="openai">OpenAI TTS (High Quality, Paid — needs an OpenAI key)</option>
                            </select>
                        </div>

                        {/* Voice Selection - BROWSER */}
                        {audioSettings.provider === 'browser' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Preferred Voice (Browser)</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={audioSettings.voiceURI || ""}
                                    onChange={(e) => {
                                        setAudioSettings({ voiceURI: e.target.value || null });
                                        playText("Привет, как дела?", { voiceURI: e.target.value });
                                    }}
                                >
                                    <option value="">Default (Auto-detect)</option>
                                    <optgroup label="Russian Voices">
                                        {russianVoices.map(v => (
                                            <option key={v.uri} value={v.uri}>{v.name}</option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="All Voices">
                                        {otherVoices.map(v => (
                                            <option key={v.uri} value={v.uri}>{v.name} ({v.lang})</option>
                                        ))}
                                    </optgroup>
                                </select>
                                <p className="text-xs text-muted-foreground">Select a Russian voice for best results.</p>
                            </div>
                        )}

                        {/* Voice Selection - OPENAI */}
                        {audioSettings.provider === 'openai' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">OpenAI Voice</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={audioSettings.openaiVoice || 'alloy'}
                                    onChange={(e) => {
                                        const voice = e.target.value as OpenAIVoice;
                                        setAudioSettings({ openaiVoice: voice });
                                        playText("Привет, это голос " + voice, { voiceURI: null });
                                    }}
                                >
                                    <option value="alloy">Alloy (Neutral)</option>
                                    <option value="echo">Echo (Male)</option>
                                    <option value="fable">Fable (British-ish)</option>
                                    <option value="onyx">Onyx (Deep Male)</option>
                                    <option value="nova">Nova (Female)</option>
                                    <option value="shimmer">Shimmer (Female)</option>
                                </select>
                                <p className="text-xs text-muted-foreground">Requires a valid API key. Costs ~0.015 USD / 1k chars.</p>
                            </div>
                        )}

                        {/* Speed Slider */}
                        <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                            <label className="text-sm font-medium">Playback Speed</label>

                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant={audioSettings.speed === 0.75 ? "default" : "outline"}
                                    onClick={() => setAudioSettings({ speed: 0.75 })}
                                    
                                >
                                    Slow (0.75x)
                                </Button>
                                <Button
                                    variant={audioSettings.speed === 1.0 ? "default" : "outline"}
                                    onClick={() => setAudioSettings({ speed: 1.0 })}
                                    
                                >
                                    Normal (1.0x)
                                </Button>
                                <Button
                                    variant={audioSettings.speed === 1.25 ? "default" : "outline"}
                                    onClick={() => setAudioSettings({ speed: 1.25 })}
                                    
                                >
                                    Fast (1.25x)
                                </Button>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => playText("Привет, меня зовут Анна. Как твои дела?", {
                                        voiceURI: audioSettings.voiceURI,
                                        speed: audioSettings.speed
                                    })}
                                >
                                    <PlayCircle className="h-4 w-4 mr-2" />
                                    Test Current Speed
                                </Button>
                            </div>
                        </div>

                        {/* Auto-play Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium">Auto-play audio</label>
                                <p className="text-xs text-muted-foreground">Play Russian prompts automatically during lessons.</p>
                            </div>
                            <input
                                type="checkbox"
                                className="h-4 w-4 accent-primary"
                                checked={audioSettings.autoPlay}
                                onChange={(e) => setAudioSettings({ autoPlay: e.target.checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <label htmlFor="narration" className="text-sm font-medium">Teacher narration</label>
                                <p className="text-xs text-muted-foreground">With auto-play on, also read the teacher's English guidance aloud.</p>
                            </div>
                            <input
                                id="narration"
                                type="checkbox"
                                className="h-4 w-4 accent-primary"
                                checked={audioSettings.narration}
                                disabled={!audioSettings.autoPlay}
                                onChange={(e) => setAudioSettings({ narration: e.target.checked })}
                            />
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
