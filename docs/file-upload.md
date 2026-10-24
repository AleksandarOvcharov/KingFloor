# File Upload System

`apps/web`-only — not yet ported to `apps/mobile` (it would need `expo-image-picker`/`expo-document-picker` instead of a browser file input; a deliberate, acknowledged gap, not an oversight). All paths below are relative to `apps/web/`.

Universal, reusable file upload system built on Supabase Storage. Provides validation, drag-and-drop, progress
tracking, and presets for common file types.

---

## Architecture

```
lib/upload/           → Core utilities (no React dependency)
├── types.ts          → Interfaces, presets, type exports
├── validators.ts     → File validation & formatting helpers
├── uploader.ts       → Supabase Storage upload/delete functions
└── index.ts          → Barrel export

hooks/
└── useFileUpload.ts  → React hook wrapping upload lifecycle

components/upload/    → UI components
├── file-dropzone.tsx → Drag-and-drop zone with preview
├── file-upload.tsx   → Complete upload widget (dropzone + progress + button)
├── upload-progress.tsx → Progress bar with status indicator
└── index.ts          → Barrel export
```

---

## Quick Start

### 1. Full Upload Widget

The `FileUpload` component is the all-in-one solution — dropzone, validation, progress, and upload button:

```tsx
import {FileUpload} from '@/components/upload'

<FileUpload
    validation="image"
    uploadOptions={{
        bucket: 'my-bucket',
        path: `${userId}/photo.jpg`,
    }}
    onUploadComplete={(result) => {
        console.log('Uploaded to:', result.url)
    }}
    onError={(error) => {
        console.error(error)
    }}
/>
```

### 2. Dropzone Only (Custom Upload Logic)

Use `FileDropzone` when you need custom handling (e.g., cropping before upload):

```tsx
import {FileDropzone} from '@/components/upload'

<FileDropzone
    validation="avatar"
    onFileSelect={(file) => openCropModal(file)}
    compact
    hint="JPG, PNG, GIF or WebP — Max 5MB"
/>
```

### 3. Hook Only (Headless)

Use `useFileUpload` when you want full control over the UI:

```tsx
import {useFileUpload} from '@/hooks/useFileUpload'

const {file, preview, uploading, progress, error, selectFile, upload, reset} =
    useFileUpload({
        validation: 'image',
        onUploadComplete: (result) => console.log(result.url),
    })
```

### 4. Utility Functions Only (No React)

Use the core utilities directly in server routes or non-React code:

```ts
import {uploadToStorage, validateFile, FILE_PRESETS} from '@/lib/upload'

const validation = validateFile(file, FILE_PRESETS.document)
if (!validation.valid) throw new Error(validation.error)

const result = await uploadToStorage(file, {
    bucket: 'documents',
    path: `${userId}/report.pdf`,
})
```

---

## Validation Presets

| Preset     | Max Size | Allowed Types                              |
| ---------- | -------- | ------------------------------------------ |
| `avatar`   | 5 MB     | JPEG, PNG, GIF, WebP                       |
| `image`    | 10 MB    | JPEG, PNG, GIF, WebP, SVG                  |
| `document` | 25 MB    | PDF, DOC, DOCX, TXT, CSV                   |
| `any`      | 50 MB    | All file types                              |

### Custom Validation

Pass a `FileValidationRule` object instead of a preset string:

```tsx
<FileUpload
    validation={{
        maxSizeBytes: 2 * 1024 * 1024,
        allowedTypes: ['application/json', 'text/yaml'],
        allowedExtensions: ['.json', '.yaml', '.yml'],
    }}
    uploadOptions={{bucket: 'configs', path: 'config.json'}}
/>
```

---

## Component Props

### `FileUpload`

| Prop               | Type                            | Default     | Description                            |
| ------------------ | ------------------------------- | ----------- | -------------------------------------- |
| `validation`       | `FilePreset \| FileValidationRule` | required | Validation preset or custom rules      |
| `uploadOptions`    | `UploadOptions`                 | required    | Supabase Storage upload config         |
| `onUploadComplete` | `(result: UploadResult) => void`| —           | Called on successful upload             |
| `onError`          | `(error: string) => void`       | —           | Called on validation or upload error    |
| `onFileSelect`     | `(file: File) => void`          | —           | Called when a file is selected          |
| `autoUpload`       | `boolean`                       | `false`     | Upload immediately on file select      |
| `disabled`         | `boolean`                       | `false`     | Disable all interactions               |
| `compact`          | `boolean`                       | `false`     | Smaller layout variant                 |
| `label`            | `string`                        | —           | Label above the dropzone               |
| `hint`             | `string`                        | —           | Override the default hint text         |
| `showUploadButton` | `boolean`                       | `true`      | Show the upload button                 |
| `uploadButtonText` | `string`                        | `'Upload'`  | Custom upload button text              |

### `FileDropzone`

| Prop           | Type                            | Default  | Description                         |
| -------------- | ------------------------------- | -------- | ----------------------------------- |
| `validation`   | `FilePreset \| FileValidationRule` | required | Validation preset or custom rules |
| `onFileSelect` | `(file: File) => void`          | required | Called with validated file           |
| `preview`      | `string \| null`                | —        | Image preview URL                   |
| `selectedFile` | `File \| null`                  | —        | Currently selected file             |
| `onClear`      | `() => void`                    | —        | Clear callback (shows X button)     |
| `disabled`     | `boolean`                       | `false`  | Disable interactions                |
| `compact`      | `boolean`                       | `false`  | Smaller layout                      |
| `label`        | `string`                        | —        | Label text                          |
| `hint`         | `string`                        | —        | Override hint text                  |

### `UploadProgress`

| Prop        | Type             | Default  | Description              |
| ----------- | ---------------- | -------- | ------------------------ |
| `progress`  | `number`         | required | 0–100                    |
| `uploading` | `boolean`        | required | Whether upload is active |
| `error`     | `string \| null` | —        | Error message to display |

---

## Hook API — `useFileUpload`

```ts
const {
    file,       // File | null — selected file
    preview,    // string | null — object URL for image preview
    uploading,  // boolean
    progress,   // number (0–100)
    error,      // string | null
    rules,      // resolved FileValidationRule
    selectFile, // (file: File) => boolean — returns true if valid
    upload,     // (options: UploadOptions) => Promise<UploadResult>
    reset,      // () => void — clears state and revokes preview URL
} = useFileUpload({validation, onUploadComplete?, onError?})
```

---

## Utility Functions

| Function             | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `uploadToStorage`    | Upload a file to Supabase Storage                    |
| `deleteFromStorage`  | Delete files from Supabase Storage                   |
| `buildStoragePath`   | Generate `userId/folder/timestamp.ext` path          |
| `buildAvatarPath`    | Generate `userId/avatar.ext` path                    |
| `validateFile`       | Validate file against rules (size, type, extension)  |
| `formatFileSize`     | Format bytes to human-readable string (e.g., "2.4 MB") |
| `getFileExtension`   | Extract lowercase extension from filename            |
| `getAcceptString`    | Generate HTML `accept` attribute from rules          |
| `getHumanReadableTypes` | Format allowed types for display                  |
| `getValidationRule`  | Resolve preset string to full rule object            |

---

## How Avatar Upload Uses This System

The settings page avatar upload uses `FileDropzone` + `ImageCropModal`:

1. `FileDropzone` with `validation="avatar"` handles file selection and validates type/size
2. Selected file opens `ImageCropModal` for cropping
3. Cropped blob is passed to `useProfile().uploadAvatar()`
4. `uploadAvatar()` uses `uploadToStorage()` and `buildAvatarPath()` from `lib/upload`

This pattern lets any future feature reuse the same upload primitives while keeping
avatar-specific logic (cropping, profile update) separate.

---

## Supabase Storage Setup

Each bucket you use needs to exist in Supabase with appropriate RLS policies.
See `docs/supabase-setup.md` for the `avatars` bucket SQL. For new buckets, follow the same pattern:

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('my-bucket', 'my-bucket', true);

CREATE POLICY "Users can upload to their folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'my-bucket' AND (storage.foldername(name))[1] = auth.uid()::text);
```
