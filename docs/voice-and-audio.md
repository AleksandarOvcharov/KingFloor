# Universal Voice Dictation & Audio Engine

`apps/web`-only (paths below relative to `apps/web/`) — `apps/mobile`'s AI Chat tab is text-input-only for now, no voice dictation yet.

A robust, 100% cross-browser speech-to-text engine that seamlessly pairs native Web Speech API dictation with automated Google Gemini Multimodal Audio transcription fallback.

---

## Why Dual-Engine Voice Input?

- **Standard Problem**: The browser native `SpeechRecognition` / `webkitSpeechRecognition` API is only natively supported in Chromium-based browsers (Google Chrome, Microsoft Edge, Brave). In Firefox, Safari on iOS/macOS, and embedded WebViews, it is frequently unavailable or inconsistent.
- **Solution**: The `useSpeechToText` hook provides transparent dual-engine switching:
  1. **Primary Engine (Native Web Speech API)**: Delivers instant, low-latency live streaming transcription with interim results on Chrome, Edge, and supported browsers.
  2. **Automated Fallback Engine (Gemini Audio STT)**: In Firefox, Safari, or when native speech recognition fails, it automatically switches to recording audio chunks via `MediaRecorder` (`audio/webm` or `audio/mp4`) and sends the audio to `/api/ai/transcribe` powered by Google Gemini (`gemini-3.6-flash`).

---

## 1. Using the `useSpeechToText` Hook

```tsx
'use client'

import { useState } from 'react'
import { useSpeechToText } from '@/hooks/useSpeechToText'
import { Mic, MicOff, Loader2 } from 'lucide-react'

export function VoiceInputExample() {
  const [lang, setLang] = useState<'en-US' | 'bg-BG'>('en-US')
  const [input, setInput] = useState('')

  const {
    isListening,
    isTranscribing,
    isSupported,
    transcript,
    interimTranscript,
    engine,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
    error,
  } = useSpeechToText({
    lang,
    continuous: true,
    interimResults: true,
    onTranscript: (fullText) => {
      setInput((prev) => (prev ? `${prev} ${fullText}` : fullText))
    },
    onError: (err) => {
      console.error('Speech recognition error:', err)
    },
  })

  return (
    <div className="flex flex-col gap-3 max-w-md p-4 border rounded-xl">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          Engine: <strong className="text-primary">{engine === 'native' ? 'Web Speech API' : 'Gemini AI Fallback'}</strong>
        </span>
        <button
          onClick={() => setLang(lang === 'en-US' ? 'bg-BG' : 'en-US')}
          className="text-xs px-2 py-1 rounded bg-muted"
        >
          Lang: {lang === 'en-US' ? 'EN' : 'BG'}
        </button>
      </div>

      <textarea
        value={input + (interimTranscript ? ` (${interimTranscript})` : '')}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type or click the microphone to speak..."
        rows={4}
        className="w-full p-2 border rounded-md"
      />

      <div className="flex items-center gap-2">
        <button
          onClick={toggleListening}
          disabled={isTranscribing}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium ${
            isListening ? 'bg-red-500 animate-pulse' : 'bg-primary'
          }`}
        >
          {isTranscribing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Transcribing with AI...
            </>
          ) : isListening ? (
            <>
              <MicOff className="h-4 w-4" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              Start Dictation
            </>
          )}
        </button>

        {input && (
          <button
            onClick={() => {
              setInput('')
              resetTranscript()
            }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
```

---

## 2. Options & Return Values

### Hook Options

| Option | Type | Default | Description |
|---|---|---|---|
| `lang` | `string` | `'en-US'` | Language code (e.g., `'en-US'`, `'bg-BG'`, `'es-ES'`, `'de-DE'`) |
| `continuous` | `boolean` | `true` | Keep listening until manually stopped |
| `interimResults` | `boolean` | `true` | Provide real-time live preview of in-progress words |
| `onTranscript` | `(text: string) => void` | — | Callback fired when a final speech segment is recognized |
| `onError` | `(error: string) => void` | — | Callback fired when an error occurs |

### Hook Return Values

| Value | Type | Description |
|---|---|---|
| `isListening` | `boolean` | `true` while the microphone is actively recording |
| `isTranscribing` | `boolean` | `true` while Gemini server-side fallback is transcribing audio |
| `isSupported` | `boolean` | `true` if browser supports native speech or `MediaRecorder` |
| `transcript` | `string` | Accumulated finalized transcript text |
| `interimTranscript`| `string` | Unfinalized in-progress spoken text |
| `engine` | `'native' \| 'gemini'` | Currently active transcription engine |
| `startListening` | `() => Promise<void>` | Requests mic permissions and begins recording |
| `stopListening` | `() => void` | Stops recording and finalizes transcript |
| `toggleListening` | `() => void` | Toggles listening state on/off |
| `resetTranscript` | `() => void` | Clears transcript state |
| `error` | `string \| null` | Human-readable error message or null |

---

## 3. Server-Side Audio Transcription Endpoint (`/api/ai/transcribe`, authenticated)

When fallback mode is active, the recorded audio blob is sent as `multipart/form-data` to `/api/ai/transcribe`:

```typescript
// app/api/ai/transcribe/route.ts
// Uses Google Gemini 3.6 Flash multimodal audio capabilities
// Converts audio to inline base64 part and prompts Gemini for verbatim transcription
```

### Safety & Permission Handling
- **Microphone Permissions**: The hook automatically handles `NotAllowedError` / `PermissionDeniedError` and returns clear user instructions.
- **MimeType Negotiation**: Supports `audio/webm;codecs=opus`, `audio/webm`, `audio/mp4`, and `audio/ogg` dynamically based on browser support.
