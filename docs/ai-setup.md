# AI Setup & Gemini Integration Guide

This guide explains how AI is configured, how the developer-managed configuration works, and how to build AI features using Google Gemini. All paths below are relative to `apps/web/` — this is where the actual Gemini integration lives. `apps/mobile`'s AI Chat tab has no AI logic of its own; it calls `apps/web`'s `/api/ai/chat` endpoint directly (see `docs/mobile.md`).

---

## Architecture Overview

```
Client (Browser)
  ├── useAI() hook (state, history, loading)
  ├── useSpeechToText() hook (Universal 100% cross-browser voice dictation)
  │     ├── Chrome / Safari / Edge ──> Web Speech API (Instant real-time speech)
  │     └── Firefox / Opera / All ───> MediaRecorder + POST /api/ai/transcribe (Gemini Audio)
  └── UI components (chat, forms, structured widgets, camera/file upload)
        │
        ▼
Server Routes (Next.js API)
  ├── POST /api/ai/chat        ──> Multi-turn conversation (authenticated)
  ├── POST /api/ai/generate    ──> One-shot generation (authenticated)
  ├── POST /api/ai/structured  ──> Schema-constrained JSON outputs (authenticated)
  ├── POST /api/ai/vision      ──> Multimodal image OCR & visual analysis (authenticated)
  ├── POST /api/ai/transcribe  ──> Universal Gemini audio speech-to-text (authenticated)
  ├── GET/POST /api/ai/history ──> Per-user chat persistence (authenticated)
        │
        ▼
AI Layer (`lib/ai/client.ts`)
  ├── `createAIClient()`       ──> GoogleGenAI instance with GEMINI_API_KEY
  ├── `generateText()`         ──> Standard text generation
  ├── `generateStructured()`   ──> Strict JSON Schema generation
  ├── `analyzeImage()`         ──> Multimodal Gemini Vision (text or JSON Schema)
  ├── `transcribeAudio()`      ──> Gemini Multimodal Audio transcription
  └── `generateChatResponse()` ──> Multi-turn chat with history
        │
        ▼
Google Gemini API (`gemini-3.6-flash`)
```

---

## Quick Start (3 Steps)

### 1. Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey).
2. Sign in with a Google account and click **Create API Key**.
3. Copy the key (it starts with `AIza...`).

### 2. Add to Environment

```env
# .env.local
GEMINI_API_KEY=AIzaSy...your-key-here
```

### 3. Test It

Run `pnpm dev` and visit [http://localhost:3000/ai](http://localhost:3000/ai). Send a message, speak with your microphone, or attach an image to verify it's working.

---

## Server API Endpoints

### `POST /api/ai/transcribe` (authenticated)

Universal audio transcription endpoint powered by Gemini Multimodal Audio. Works across 100% of browsers (including Firefox, Safari, Chrome, Edge, iOS, Android).

```jsonc
// Request
{
  "audio": "data:audio/webm;base64,GkXfo59ChoEBQveBAULygQRC...",
  "mimeType": "audio/webm",
  "lang": "en-US" // or "bg-BG", "es-ES", "de-DE", etc.
}

// Response
{
  "text": "Hello world this is a test recording"
}
```

### `POST /api/ai/vision` (authenticated)

Multimodal image understanding and OCR endpoint. Accepts base64 images or data URLs, extracts text or returns strictly structured JSON.

```jsonc
// Request
{
  "image": "data:image/png;base64,iVBORw0KGgo...",
  "prompt": "Extract the vendor, date, and total from this receipt",
  "schema": {
    "type": "OBJECT",
    "properties": {
      "vendor": { "type": "STRING" },
      "total": { "type": "NUMBER" },
      "date": { "type": "STRING" }
    },
    "required": ["vendor", "total"]
  }
}

// Response
{
  "data": {
    "vendor": "Acme Hardware",
    "total": 42.50,
    "date": "2026-09-12"
  }
}
```

### `POST /api/ai/structured` (authenticated)

Type-safe structured data generator conforming to strict JSON schemas.

```jsonc
// Request
{
  "prompt": "List 3 top cafes in San Francisco",
  "schema": {
    "type": "ARRAY",
    "items": {
      "type": "OBJECT",
      "properties": {
        "title": { "type": "STRING" },
        "lat": { "type": "NUMBER" },
        "lng": { "type": "NUMBER" },
        "category": { "type": "STRING" }
      },
      "required": ["title", "lat", "lng", "category"]
    }
  }
}

// Response
{
  "data": [
    { "title": "Sightglass Coffee", "lat": 37.7771, "lng": -122.4087, "category": "Cafe" },
    { "title": "Blue Bottle", "lat": 37.7825, "lng": -122.4078, "category": "Cafe" },
    { "title": "Philz Coffee", "lat": 37.7523, "lng": -122.4143, "category": "Cafe" }
  ]
}
```

### `POST /api/ai/chat` (authenticated)

Multi-turn chat endpoint. Body: `{ "messages": [...], "message": "..." }`.

### `GET /api/ai/history` (authenticated)

List all conversations for the authenticated user.

---

## Universal Cross-Browser Speech-to-Text (`useSpeechToText`)

Works seamlessly on **100% of browsers** (Firefox, Chrome, Edge, Safari, Opera, iOS, Android):

```tsx
import { useSpeechToText } from '@/hooks/useSpeechToText'

export function VoiceMic() {
  const {
    isListening,
    isTranscribing,
    isSupported,
    transcript,
    interimTranscript,
    toggleListening,
    stopListening
  } = useSpeechToText({
    lang: 'en-US', // Supports 'bg-BG', 'es-ES', 'de-DE', etc.
    onTranscript: (spokenText, isFinal) => {
      console.log('Spoken:', spokenText, 'Final:', isFinal)
    },
  })

  return (
    <div>
      <button onClick={() => toggleListening()} disabled={isTranscribing}>
        {isTranscribing ? '⏳ Transcribing...' : isListening ? '🛑 Stop Recording' : '🎤 Speak'}
      </button>
      {interimTranscript && <p>Live: {interimTranscript}</p>}
      {transcript && <p>Transcript: {transcript}</p>}
    </div>
  )
}
```

### How Cross-Browser Speech Works
1. **Chrome / Edge / Safari**: Uses the browser's native `webkitSpeechRecognition` for sub-second, zero-latency streaming text and partial results.
2. **Firefox / Opera / Non-WebSpeech Browsers**: Automatically uses `MediaRecorder` to record microphone audio and routes it to `POST /api/ai/transcribe`, transcribing verbatim via Gemini Multimodal Audio with zero manual configuration.
