// Shared app configuration.
//
// Never embed an API key here: this app is a static site, so anything in the
// bundle is public. Each learner enters their own key in Settings, and it stays
// in that browser's local storage.

// Models for lesson generation, chat, answer checking and explanations.
export const OPENAI_CHAT_MODEL = "gpt-4o-mini";
export const CLAUDE_MODEL = "claude-opus-5-5";

// OpenAI-only features (Claude has no speech APIs; browser voices cover TTS).
export const TTS_MODEL = "tts-1";
export const TRANSCRIBE_MODEL = "whisper-1";
