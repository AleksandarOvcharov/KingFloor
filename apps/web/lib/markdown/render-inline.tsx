'use client'

import React from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

/**
 * Validates whether a URL protocol is safe against javascript: and data: XSS vectors.
 */
export function isSafeUrl(url: string): boolean {
    try {
        const trimmed = url.trim()
        if (trimmed.startsWith('/') || trimmed.startsWith('#')) return true
        const parsed = new URL(trimmed.startsWith('//') ? `https:${trimmed}` : trimmed)
        return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)
    } catch {
        return false
    }
}

export function renderMath(tex: string, displayMode: boolean): React.ReactNode {
    try {
        const html = katex.renderToString(tex, {
            displayMode,
            throwOnError: false,
            strict: false,
        })
        return (
            <span
                dangerouslySetInnerHTML={{__html: html}}
                className={displayMode ? 'block overflow-x-auto py-2' : ''}
            />
        )
    } catch {
        return <code className="text-destructive">{tex}</code>
    }
}

export function renderInline(text: string): React.ReactNode {
    const tokens: React.ReactNode[] = []
    let remaining = text
    let safetyCounter = 0

    while (remaining.length > 0 && safetyCounter < 1000) {
        safetyCounter++

        // Inline math ($...$)
        const mathMatch = remaining.match(/^\$([^$\n]+?)\$/)
        if (mathMatch && !remaining.startsWith('$$')) {
            tokens.push(
                <React.Fragment key={safetyCounter}>
                    {renderMath(mathMatch[1], false)}
                </React.Fragment>
            )
            remaining = remaining.slice(mathMatch[0].length)
            continue
        }

        // Inline code (backtick)
        const codeMatch = remaining.match(/^`([^`]+)`/)
        if (codeMatch) {
            tokens.push(
                <code key={safetyCounter} className="bg-muted/70 px-1.5 py-0.5 rounded text-xs font-mono">
                    {codeMatch[1]}
                </code>
            )
            remaining = remaining.slice(codeMatch[0].length)
            continue
        }

        // Bold + italic (***text***)
        const boldItalicMatch = remaining.match(/^\*{3}(.+?)\*{3}/)
        if (boldItalicMatch) {
            tokens.push(
                <strong key={safetyCounter}><em>{renderInline(boldItalicMatch[1])}</em></strong>
            )
            remaining = remaining.slice(boldItalicMatch[0].length)
            continue
        }

        // Bold (**text** or __text__)
        const boldMatch = remaining.match(/^\*{2}(.+?)\*{2}/) || remaining.match(/^__(.+?)__/)
        if (boldMatch) {
            tokens.push(
                <strong key={safetyCounter} className="font-semibold">{renderInline(boldMatch[1])}</strong>
            )
            remaining = remaining.slice(boldMatch[0].length)
            continue
        }

        // Italic (*text* or _text_)
        const italicMatch = remaining.match(/^\*([^*]+)\*/) || remaining.match(/^_([^_]+)_/)
        if (italicMatch) {
            tokens.push(<em key={safetyCounter}>{renderInline(italicMatch[1])}</em>)
            remaining = remaining.slice(italicMatch[0].length)
            continue
        }

        // Link [text](url)
        const linkMatch = remaining.match(/^\[([^\]]+)]\(([^)]+)\)/)
        if (linkMatch) {
            const rawUrl = linkMatch[2].trim()
            tokens.push(
                <a
                    key={safetyCounter}
                    href={isSafeUrl(rawUrl) ? rawUrl : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2 hover:text-primary/80"
                >
                    {linkMatch[1]}
                </a>
            )
            remaining = remaining.slice(linkMatch[0].length)
            continue
        }

        // Plain text — consume until next special character
        const plainMatch = remaining.match(/^[^`*_[$\\\n]+/)
        if (plainMatch) {
            tokens.push(plainMatch[0])
            remaining = remaining.slice(plainMatch[0].length)
            continue
        }

        // Newline
        if (remaining[0] === '\n') {
            tokens.push(<br key={safetyCounter}/>)
            remaining = remaining.slice(1)
            continue
        }

        // Fallback: consume one character
        tokens.push(remaining[0])
        remaining = remaining.slice(1)
    }

    return tokens.length === 1 ? tokens[0] : <>{tokens}</>
}
