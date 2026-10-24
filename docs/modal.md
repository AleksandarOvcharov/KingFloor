# Modal System

`apps/web`-only (paths below relative to `apps/web/`) — `apps/mobile` uses React Native's own `Alert.alert()` for the one case that needs a confirmation dialog (account deletion in Settings) rather than a ported modal system.

A custom modal system with smooth animations, form validation, 5 pre-built templates, and both declarative and
programmatic APIs. Built with Tailwind CSS — no external dependencies.

## Files

```
components/modal/
├── modal.tsx              # Core Modal component + sub-components
├── modal-templates.tsx    # 5 ready-to-use templates (Form, Info, Success, Error, Confirm)
└── modal-provider.tsx     # ModalProvider + useModalContext for programmatic modals

hooks/
└── useModal.ts            # useModal hook for state management
```

## Live Demo

Visit `/features` > **UI Components** tab > **Modal System** card. Try all 6 buttons: Basic, Form, Confirm, Info,
Success, Error.

---

## Quick Start

### Basic Modal

```tsx
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/modal/modal'
import { useModal } from '@/hooks/useModal'
import { Button } from '@workspace/ui/ui/button'

function MyPage() {
  const modal = useModal()

  return (
    <>
      <Button onClick={() => modal.open()}>Open</Button>

      <Modal open={modal.isOpen} onClose={modal.close}>
        <ModalHeader>
          <ModalTitle>Hello</ModalTitle>
          <ModalDescription>Description text here.</ModalDescription>
        </ModalHeader>
        <ModalBody>
          <p>Content goes here.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={modal.close}>Cancel</Button>
          <Button onClick={modal.close}>Save</Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
```

### Form Modal with Validation

```tsx
import { FormModal } from '@/components/modal/modal-templates'
import { useModal } from '@/hooks/useModal'

function MyPage() {
  const modal = useModal()

  return (
    <>
      <Button onClick={() => modal.open()}>Create</Button>

      <FormModal
        open={modal.isOpen}
        onClose={modal.close}
        title="Create Account"
        description="Required fields are marked with *."
        submitLabel="Create"
        fields={[
          {
            name: 'name',
            label: 'Full Name',
            placeholder: 'John Doe',
            required: true,
          },
          {
            name: 'email',
            label: 'Email',
            type: 'email',
            placeholder: 'john@example.com',
            required: true,
          },
          {
            name: 'password',
            label: 'Password',
            type: 'password',
            required: true,
            validate: (v) => v.length < 8 ? 'Must be at least 8 characters' : undefined,
          },
          {
            name: 'bio',
            label: 'Bio',
            type: 'textarea',
            placeholder: 'Optional...',
          },
        ]}
        onSubmit={async (values) => {
          // values = { name: '...', email: '...', password: '...', bio: '...' }
          await createUser(values)
        }}
      />
    </>
  )
}
```

---

## Templates

### FormModal

Modal with dynamic form fields, built-in validation, and submit handling.

```tsx
import { FormModal } from '@/components/modal/modal-templates'
```

| Prop          | Type                          | Default    | Description                          |
|---------------|-------------------------------|------------|--------------------------------------|
| `open`        | `boolean`                     | required   | Open state                           |
| `onClose`     | `() => void`                  | required   | Close handler                        |
| `onSubmit`    | `(values) => void \| Promise` | required   | Called with `Record<string, string>` |
| `title`       | `string`                      | required   | Header title                         |
| `description` | `string`                      | -          | Header description                   |
| `fields`      | `ModalField[]`                | required   | Form field definitions               |
| `submitLabel` | `string`                      | `'Submit'` | Submit button text                   |
| `cancelLabel` | `string`                      | `'Cancel'` | Cancel button text                   |
| `size`        | modal size                    | `'md'`     | Modal width                          |

**ModalField definition:**

| Property       | Type                                                                 | Default  | Description                             |
|----------------|----------------------------------------------------------------------|----------|-----------------------------------------|
| `name`         | `string`                                                             | required | Unique field key                        |
| `label`        | `string`                                                             | required | Display label                           |
| `type`         | `'text' \| 'email' \| 'password' \| 'number' \| 'url' \| 'textarea'` | `'text'` | Input type                              |
| `placeholder`  | `string`                                                             | -        | Placeholder text                        |
| `required`     | `boolean`                                                            | `false`  | Required validation                     |
| `defaultValue` | `string`                                                             | `''`     | Initial value                           |
| `validate`     | `(value: string) => string \| undefined`                             | -        | Custom validator (return error message) |

**Built-in validation:**

- `required` fields show "`{label} is required`" when empty
- `email` type validates email format
- `url` type validates URL format (must start with `http://` or `https://`)
- Custom `validate` function for anything else
- Errors clear on field change
- Red border + error message displayed below field
- Submit is blocked until all validations pass

### ConfirmModal

Confirmation dialog with optional destructive styling.

```tsx
import { ConfirmModal } from '@/components/modal/modal-templates'

<ConfirmModal
  open={modal.isOpen}
  onClose={modal.close}
  onConfirm={handleDelete}
  title="Delete item?"
  description="This action cannot be undone."
  confirmLabel="Delete"
  variant="destructive"
/>
```

| Prop           | Type                         | Default     | Description         |
|----------------|------------------------------|-------------|---------------------|
| `onConfirm`    | `() => void \| Promise`      | required    | Called on confirm   |
| `variant`      | `'default' \| 'destructive'` | `'default'` | Button + icon style |
| `confirmLabel` | `string`                     | `'Confirm'` | Confirm button text |
| `cancelLabel`  | `string`                     | `'Cancel'`  | Cancel button text  |

### InfoModal

Informational display with icon and dismiss button.

```tsx
import { InfoModal } from '@/components/modal/modal-templates'

<InfoModal
  open={modal.isOpen}
  onClose={modal.close}
  title="How it works"
  description="Explanation text here."
/>
```

Accepts optional `children` for custom body content below the description.

### SuccessModal

Success state with green check icon.

```tsx
import { SuccessModal } from '@/components/modal/modal-templates'

<SuccessModal
  open={modal.isOpen}
  onClose={modal.close}
  title="Changes saved"
  description="Your profile has been updated."
/>
```

### ErrorModal

Error state with red X icon.

```tsx
import { ErrorModal } from '@/components/modal/modal-templates'

<ErrorModal
  open={modal.isOpen}
  onClose={modal.close}
  title="Something went wrong"
  description="Please try again later."
/>
```

All templates accept `size` prop and standard `open`/`onClose` props.

---

## Core API

### `<Modal>`

| Prop                  | Type                                     | Default    | Description                        |
|-----------------------|------------------------------------------|------------|------------------------------------|
| `open`                | `boolean`                                | required   | Whether the modal is visible       |
| `onClose`             | `() => void`                             | required   | Called when the modal should close |
| `size`                | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'`     | Modal width                        |
| `position`            | `'center' \| 'top'`                      | `'center'` | Vertical positioning               |
| `closeOnOverlayClick` | `boolean`                                | `true`     | Close when clicking backdrop       |
| `closeOnEscape`       | `boolean`                                | `true`     | Close on Escape key                |
| `showCloseButton`     | `boolean`                                | `true`     | Show X button                      |
| `className`           | `string`                                 | -          | Additional panel classes           |

### Sub-Components

| Component          | Purpose                           | Default Padding  |
|--------------------|-----------------------------------|------------------|
| `ModalHeader`      | Title + description               | `px-6 pt-6 pb-2` |
| `ModalTitle`       | `<h2>` heading                    | -                |
| `ModalDescription` | Muted text                        | -                |
| `ModalBody`        | Main content                      | `px-6 py-4`      |
| `ModalFooter`      | Action buttons (stacks on mobile) | `px-6 pb-6 pt-2` |

### `useModal(initialOpen?)`

```tsx
const modal = useModal()
modal.open()           // open
modal.open({ id: 5 })  // open with data
modal.close()          // close
modal.toggle()         // toggle
modal.isOpen           // boolean
modal.data             // data passed to open()
```

### Programmatic API (`ModalProvider`)

```tsx
// Wrap app in ModalProvider
<ModalProvider><App /></ModalProvider>

// Then use anywhere:
const { confirm, alert } = useModalContext()

const ok = await confirm({ title: 'Sure?', variant: 'destructive' })
await alert({ title: 'Done!' })
```

---

## Sizes

| Size   | Max Width   | Use Case                             |
|--------|-------------|--------------------------------------|
| `sm`   | 384px       | Confirmations, alerts, success/error |
| `md`   | 448px       | Forms, standard dialogs              |
| `lg`   | 512px       | Complex forms, detail views          |
| `xl`   | 576px       | Large content, tables                |
| `full` | 100% - 2rem | Full-screen editors                  |

---

## Animation

Uses CSS transitions (not keyframes) for Tailwind v4 compatibility:

- **Overlay**: Opacity 0 → 1 (200ms ease-out) with `backdrop-blur-sm`
- **Panel**: Scale 95% → 100% + opacity 0 → 1 (250ms cubic-bezier)
- Centering via flexbox (no `translate(-50%, -50%)` — avoids Tailwind v4 conflicts)

---

## Features

- Scale + fade transitions on open/close
- Backdrop blur overlay
- Focus management (auto-focus panel, restore on close)
- Scroll lock on body
- Escape key and overlay click (both configurable)
- Mobile responsive (footer buttons stack vertically)
- `role="dialog"` + `aria-modal="true"`
- Form validation with required fields, email/url format, custom validators
- Error messages with inline display
- Async submit handling with loading state
- Data passing via `useModal().open(data)`
