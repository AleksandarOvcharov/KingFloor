/**
 * Copy text to clipboard with fallback for older browsers.
 * Returns true on success, false on failure.
 *
 * Usage:
 *   const ok = await copyToClipboard('Hello world')
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text)
            return true
        }
        // Fallback for non-secure contexts
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(textarea)
        return ok
    } catch {
        return false
    }
}
