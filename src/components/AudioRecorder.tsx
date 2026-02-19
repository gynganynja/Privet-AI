import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { useAppStore } from "@/store";
import { transcribeAudio } from "@/lib/openai";
import { cn } from "@/lib/utils";

interface AudioRecorderProps {
    onTranscriptionComplete: (text: string) => void;
    className?: string;
    disabled?: boolean;
    language?: string;
}

export function AudioRecorder({ onTranscriptionComplete, className, disabled, language = "ru" }: AudioRecorderProps) {
    const { apiKey } = useAppStore();
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const [volume, setVolume] = useState(0);

    const startRecording = async () => {
        if (!apiKey) {
            alert("Please set your OpenAI API Key in Settings to use Voice Input.");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            // Audio Analysis for Silence Detection
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            let speechDetected = false;

            // Periodically check volume
            // Track max volume for debugging
            let maxRms = 0;

            const checkVolume = () => {
                if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
                    console.log("Recording stopped. Max RMS observed:", maxRms);
                    audioContext.close();
                    setVolume(0);
                    return;
                }

                analyser.getByteTimeDomainData(dataArray);

                // Calculate RMS (Volume)
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const x = (dataArray[i] - 128) / 128.0; // Normalize to -1..1
                    sum += x * x;
                }
                const rms = Math.sqrt(sum / bufferLength);

                if (rms > maxRms) maxRms = rms;

                // Update visual volume (scale up for visibility 0-1 range)
                setVolume(Math.min(1, rms * 10)); // Increased sensitivity for UI

                // Threshold: Extremely low (0.001) to catch almost anything
                if (rms > 0.001) {
                    speechDetected = true;
                }

                requestAnimationFrame(checkVolume);
            };
            checkVolume();

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());

                // If no speech detected, warn but maybe simple alert?
                if (!speechDetected) {
                    console.warn(`No speech detected. Max RMS: ${maxRms} (Threshold: 0.001)`);
                }

                if (chunksRef.current.length === 0) return;

                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

                // If silence, don't send? 
                // We've had issues with false positives blocking the user. 
                // Let's rely on the OpenAI Prompt ("Ignore silence") to handle hallucinations for now.
                if (!speechDetected) {
                    console.warn("Microphone analysis reported silence, but sending anyway (User fallback).");
                    // alert("Microphone heard silence. Aborting transcription.");
                    // setIsRecording(false);
                    // return;
                }

                handleTranscription(audioBlob);
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleTranscription = async (blob: Blob) => {
        setIsTranscribing(true);
        try {
            const text = await transcribeAudio(apiKey, blob, language);
            if (text) {
                onTranscriptionComplete(text);
            }
        } catch (err) {
            console.error("Transcription failed:", err);
            alert("Failed to transcribe audio. Check console/API key.");
        } finally {
            setIsTranscribing(false);
        }
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {!isRecording ? (
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={startRecording}
                    disabled={disabled || isTranscribing}
                    className={cn(isTranscribing ? "animate-pulse" : "")}
                >
                    {isTranscribing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Mic className="h-4 w-4" />
                    )}
                </Button>
            ) : (
                <div className="relative">
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={stopRecording}
                        className="relative z-10"
                    >
                        <Square className="h-4 w-4 fill-current" />
                    </Button>
                    {/* Visual Volume Ring */}
                    <div
                        className="absolute inset-0 rounded-md bg-red-500/30 transition-all duration-75"
                        style={{ transform: `scale(${1 + volume})`, opacity: volume * 2 }}
                    />
                </div>
            )}
        </div>
    );
}
