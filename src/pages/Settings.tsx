import { useState, useEffect } from "react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, KeyRound, Volume2, PlayCircle } from "lucide-react";
import { getAvailableVoices, playText, type VoiceOption } from "@/lib/audio";

export default function SettingsPage() {
    const { apiKey, setApiKey } = useAppStore();
    const [localKey, setLocalKey] = useState(apiKey);
    const [showKey, setShowKey] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        setLocalKey(apiKey);
    }, [apiKey]);

    const handleSave = () => {
        setApiKey(localKey);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="max-w-2xl mx-auto w-full space-y-6">
            <h1 className="text-3xl font-bold">Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5" />
                        OpenAI API Key
                    </CardTitle>
                    <CardDescription>
                        Your API key is stored locally on this device and is never sent to any other server.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Input
                                type={showKey ? "text" : "password"}
                                placeholder="sk-..."
                                value={localKey}
                                onChange={(e) => setLocalKey(e.target.value)}
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowKey(!showKey)}
                            >
                                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        <Button onClick={handleSave} disabled={!localKey || localKey === apiKey}>
                            {isSaved ? "Saved!" : "Save Key"}
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        You can get an API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="underline text-primary">platform.openai.com</a>.
                    </p>
                </CardContent>
            </Card>

            <AudioSettingsSection />
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
                                <option value="openai">OpenAI TTS (High Quality, Paid)</option>
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
                                        const voice = e.target.value as any;
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
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-sm font-medium">Playback Speed</label>
                                <span className="text-sm text-muted-foreground">{audioSettings.speed}x</span>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="1.5"
                                step="0.1"
                                className="w-full accent-primary"
                                value={audioSettings.speed}
                                onChange={(e) => setAudioSettings({ speed: parseFloat(e.target.value) })}
                            />
                        </div>

                        {/* Auto-play Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <label className="text-sm font-medium">Auto-play Narration</label>
                                <p className="text-xs text-muted-foreground">Automatically play audio during lessons.</p>
                            </div>
                            <input
                                type="checkbox"
                                className="h-4 w-4 accent-primary"
                                checked={audioSettings.autoPlay}
                                onChange={(e) => setAudioSettings({ autoPlay: e.target.checked })}
                            />
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => playText("Это тест звука. Один, два, три.", {
                                voiceURI: audioSettings.voiceURI,
                                speed: audioSettings.speed
                            })}
                        >
                            <PlayCircle className="h-4 w-4 mr-2" />
                            Test Audio Settings
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
