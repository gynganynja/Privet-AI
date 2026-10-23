// Shared app configuration.
//
// Never embed an OpenAI API key here: this app is a static site, so anything in
// the bundle is public. Each learner enters their own key in Settings, and it
// stays in that browser's local storage.

// Model used for lesson generation, chat, answer checking and explanations.
export const CHAT_MODEL = "gpt-4o-mini";
export const TTS_MODEL = "tts-1";
export const TRANSCRIBE_MODEL = "whisper-1";
