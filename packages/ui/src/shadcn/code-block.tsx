'use client'

import * as React from 'react'
import {
    Check,
    Copy,
    FileCode,
    FileCode2,
    FileJson,
    FileText,
    Terminal,
    Database,
    Palette,
    Globe,
    Lock,
    Braces,
} from 'lucide-react'
import {Button} from '@workspace/ui/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/ui/select'
import {cn} from '@workspace/ui/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface CodeBlockData {
    language?: string
    filename: string
    code: string
}

interface CodeBlockContextType {
    value: string
    onValueChange: (value: string) => void
    data: CodeBlockData[]
}

const CodeBlockContext = React.createContext<CodeBlockContextType>({
    value: '',
    onValueChange: () => {},
    data: [],
})

export const useCodeBlock = () => React.useContext(CodeBlockContext)

// ============================================================================
// Icon Mapping helper
// ============================================================================

const getFileIcon = (filename: string): React.ElementType => {
    const lower = filename.toLowerCase()
    if (lower.endsWith('.json')) return FileJson
    if (lower.endsWith('.ts') || lower.endsWith('.tsx') || lower.endsWith('.js') || lower.endsWith('.jsx')) return FileCode2
    if (lower.endsWith('.css') || lower.endsWith('.scss') || lower.endsWith('.less')) return Palette
    if (lower.endsWith('.html') || lower.endsWith('.svg')) return Globe
    if (lower.endsWith('.sh') || lower.endsWith('.bash') || lower.endsWith('.zsh') || lower === 'dockerfile') return Terminal
    if (lower.endsWith('.sql')) return Database
    if (lower.endsWith('.md') || lower.endsWith('.mdx') || lower.includes('readme')) return FileText
    if (lower.startsWith('.env')) return Lock
    if (lower.endsWith('.yml') || lower.endsWith('.yaml') || lower.endsWith('.toml')) return Braces
    return FileCode
}

// ============================================================================
// Syntax Tokenizer (Theme-aware, zero external dependency)
// ============================================================================

interface Token {
    type: 'comment' | 'string' | 'keyword' | 'number' | 'tag' | 'attr' | 'function' | 'type' | 'text'
    text: string
}

function tokenizeLine(line: string, language = 'typescript'): Token[] {
    const tokens: Token[] = []
    let i = 0

    const keywords = new Set([
        'import', 'export', 'from', 'default', 'const', 'let', 'var', 'function',
        'return', 'interface', 'type', 'class', 'extends', 'implements', 'new',
        'if', 'else', 'switch', 'case', 'for', 'while', 'do', 'try', 'catch',
        'finally', 'throw', 'async', 'await', 'as', 'typeof', 'instanceof',
        'public', 'private', 'protected', 'readonly', 'static', 'enum',
        'true', 'false', 'null', 'undefined', 'void', 'boolean', 'string',
        'number', 'any', 'never', 'unknown', 'select', 'where', 'insert',
        'into', 'update', 'delete', 'join', 'create', 'table', 'alter', 'drop',
    ])

    while (i < line.length) {
        // Comment //
        if (line.slice(i, i + 2) === '//') {
            tokens.push({type: 'comment', text: line.slice(i)})
            break
        }

        // SQL / generic comments --
        if (line.slice(i, i + 2) === '--') {
            tokens.push({type: 'comment', text: line.slice(i)})
            break
        }

        // Strings
        if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
            const quote = line[i]
            let str = quote
            i++
            while (i < line.length && line[i] !== quote) {
                if (line[i] === '\\' && i + 1 < line.length) {
                    str += line[i] + line[i + 1]
                    i += 2
                } else {
                    str += line[i]
                    i++
                }
            }
            if (i < line.length) {
                str += line[i]
                i++
            }
            tokens.push({type: 'string', text: str})
            continue
        }

        // Numbers
        if (/\d/.test(line[i]) && (i === 0 || /[\s,()\[\]{}:;=><+\-*\/]/.test(line[i - 1]))) {
            let num = ''
            while (i < line.length && /[\d.xXa-fA-F_]/.test(line[i])) {
                num += line[i]
                i++
            }
            tokens.push({type: 'number', text: num})
            continue
        }

        // Identifiers / Keywords
        if (/[a-zA-Z_$]/.test(line[i])) {
            let word = ''
            while (i < line.length && /[a-zA-Z0-9_$]/.test(line[i])) {
                word += line[i]
                i++
            }
            if (keywords.has(word.toLowerCase())) {
                tokens.push({type: 'keyword', text: word})
            } else if (i < line.length && line[i] === '(') {
                tokens.push({type: 'function', text: word})
            } else if (/^[A-Z][a-zA-Z0-9_]*$/.test(word)) {
                tokens.push({type: 'type', text: word})
            } else {
                tokens.push({type: 'text', text: word})
            }
            continue
        }

        // JSX/HTML tags: <div, </div, />
        if (line[i] === '<' && (/[a-zA-Z/]/.test(line[i + 1] || ''))) {
            let tag = '<'
            i++
            while (i < line.length && /[a-zA-Z0-9_.-/]/.test(line[i])) {
                tag += line[i]
                i++
            }
            tokens.push({type: 'tag', text: tag})
            continue
        }

        // Normal characters / symbols / whitespace
        tokens.push({type: 'text', text: line[i]})
        i++
    }

    return tokens
}

function renderToken(token: Token, key: number): React.ReactNode {
    switch (token.type) {
        case 'comment':
            return <span key={key} className="text-muted-foreground/70 italic">{token.text}</span>
        case 'string':
            return <span key={key} className="text-emerald-600 dark:text-emerald-400">{token.text}</span>
        case 'keyword':
            return <span key={key} className="text-purple-600 dark:text-purple-400 font-semibold">{token.text}</span>
        case 'number':
            return <span key={key} className="text-amber-600 dark:text-amber-400">{token.text}</span>
        case 'type':
            return <span key={key} className="text-blue-600 dark:text-blue-400">{token.text}</span>
        case 'function':
            return <span key={key} className="text-sky-600 dark:text-sky-300">{token.text}</span>
        case 'tag':
            return <span key={key} className="text-rose-600 dark:text-rose-400 font-medium">{token.text}</span>
        case 'attr':
            return <span key={key} className="text-cyan-600 dark:text-cyan-400">{token.text}</span>
        default:
            return <span key={key}>{token.text}</span>
    }
}

// Clean annotation tags from string when copying
function stripAnnotations(code: string): string {
    return code
        .replace(/\/\/\s*\[!code\s+[^\]]+]/g, '')
        .replace(/\n\s*$/g, '')
}

// ============================================================================
// Main CodeBlock Component (Root Container)
// ============================================================================

export interface CodeBlockProps extends React.HTMLAttributes<HTMLDivElement> {
    data?: CodeBlockData[]
    defaultValue?: string
    value?: string
    onValueChange?: (value: string) => void
    /** Shortcut prop for single-snippet usage */
    code?: string
    filename?: string
    language?: string
    lineNumbers?: boolean
}

export const CodeBlock = React.forwardRef<HTMLDivElement, CodeBlockProps>(
    (
        {
            data: dataProp,
            defaultValue,
            value: controlledValue,
            onValueChange: controlledOnChange,
            code,
            filename = 'code',
            language = 'typescript',
            lineNumbers = true,
            className,
            children,
            ...props
        },
        ref
    ) => {
        // Prepare data array
        const data = React.useMemo<CodeBlockData[]>(() => {
            if (dataProp && dataProp.length > 0) return dataProp
            if (code !== undefined) {
                return [{filename, code, language}]
            }
            return []
        }, [dataProp, code, filename, language])

        const defaultActive = defaultValue ?? data[0]?.filename ?? ''
        const [internalValue, setInternalValue] = React.useState(defaultActive)

        const isControlled = controlledValue !== undefined
        const activeValue = isControlled ? controlledValue : internalValue

        const handleValueChange = React.useCallback(
            (val: string) => {
                if (!isControlled) {
                    setInternalValue(val)
                }
                controlledOnChange?.(val)
            },
            [isControlled, controlledOnChange]
        )

        // If children are provided, render compound layout; otherwise render default composition
        return (
            <CodeBlockContext.Provider
                value={{
                    value: activeValue,
                    onValueChange: handleValueChange,
                    data,
                }}
            >
                <div
                    ref={ref}
                    data-lenis-prevent="true"
                    data-lenis-prevent-wheel="true"
                    className={cn(
                        'w-full max-w-full overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xs',
                        className
                    )}
                    {...props}
                >
                    {children ?? (
                        <>
                            <CodeBlockHeader>
                                <CodeBlockFilename>{activeValue || filename}</CodeBlockFilename>
                                <CodeBlockCopyButton />
                            </CodeBlockHeader>
                            <CodeBlockBody>
                                {data.map((item) => (
                                    <CodeBlockItem key={item.filename} value={item.filename} lineNumbers={lineNumbers}>
                                        <CodeBlockContent language={item.language}>{item.code}</CodeBlockContent>
                                    </CodeBlockItem>
                                ))}
                            </CodeBlockBody>
                        </>
                    )}
                </div>
            </CodeBlockContext.Provider>
        )
    }
)
CodeBlock.displayName = 'CodeBlock'

// ============================================================================
// CodeBlockHeader
// ============================================================================

export interface CodeBlockHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    trafficLights?: boolean
}

export const CodeBlockHeader = React.forwardRef<HTMLDivElement, CodeBlockHeaderProps>(
    ({className, trafficLights, children, ...props}, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'flex items-center justify-between border-b border-border/70 bg-muted/40 px-2.5 sm:px-3 py-1.5 text-xs text-muted-foreground gap-2 min-w-0 w-full overflow-hidden',
                    className
                )}
                {...props}
            >
                {trafficLights && (
                    <div className="flex items-center gap-1.5 pr-1 select-none shrink-0" aria-hidden="true">
                        <span className="size-2.5 rounded-full bg-rose-500/80 hover:bg-rose-600" />
                        <span className="size-2.5 rounded-full bg-amber-500/80 hover:bg-amber-600" />
                        <span className="size-2.5 rounded-full bg-emerald-500/80 hover:bg-emerald-600" />
                    </div>
                )}
                <div className="flex items-center justify-between gap-2 min-w-0 flex-1 overflow-hidden">
                    {children}
                </div>
            </div>
        )
    }
)
CodeBlockHeader.displayName = 'CodeBlockHeader'

// ============================================================================
// CodeBlockFilename
// ============================================================================

export interface CodeBlockFilenameProps extends React.HTMLAttributes<HTMLDivElement> {
    icon?: React.ElementType
    value?: string
}

export const CodeBlockFilename = React.forwardRef<HTMLDivElement, CodeBlockFilenameProps>(
    ({className, icon: CustomIcon, value, children, ...props}, ref) => {
        const {value: activeValue} = useCodeBlock()

        // If a specific value is passed, only show when active
        if (value !== undefined && value !== activeValue) {
            return null
        }

        const filenameStr = typeof children === 'string' ? children : (activeValue || '')
        const DetectedIcon = getFileIcon(filenameStr)
        const IconComponent = CustomIcon ?? DetectedIcon

        return (
            <div
                ref={ref}
                className={cn(
                    'inline-flex items-center gap-1.5 font-mono text-xs text-foreground/90 select-none truncate min-w-0',
                    className
                )}
                {...props}
            >
                {IconComponent && <IconComponent className="size-3.5 shrink-0 text-muted-foreground" />}
                <span className="truncate">{children || activeValue}</span>
            </div>
        )
    }
)
CodeBlockFilename.displayName = 'CodeBlockFilename'

// ============================================================================
// CodeBlockFiles (Tabs container)
// ============================================================================

export interface CodeBlockFilesProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
    children?: React.ReactNode | ((item: CodeBlockData) => React.ReactNode)
}

export const CodeBlockFiles = React.forwardRef<HTMLDivElement, CodeBlockFilesProps>(
    ({className, children, ...props}, ref) => {
        const {data} = useCodeBlock()

        return (
            <div
                ref={ref}
                className={cn('flex items-center gap-1 overflow-x-auto no-scrollbar touch-pan-x min-w-0 flex-1', className)}
                {...props}
            >
                {typeof children === 'function'
                    ? data.map((item) => children(item))
                    : children ??
                      data.map((item) => (
                          <CodeBlockFileTab key={item.filename} value={item.filename}>
                              {item.filename}
                          </CodeBlockFileTab>
                      ))}
            </div>
        )
    }
)
CodeBlockFiles.displayName = 'CodeBlockFiles'

// ============================================================================
// CodeBlockFileTab (Individual file tab)
// ============================================================================

export interface CodeBlockFileTabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    value: string
    icon?: React.ElementType
}

export const CodeBlockFileTab = React.forwardRef<HTMLButtonElement, CodeBlockFileTabProps>(
    ({className, value, icon: CustomIcon, children, ...props}, ref) => {
        const {value: activeValue, onValueChange} = useCodeBlock()
        const isActive = activeValue === value

        const filenameStr = typeof children === 'string' ? children : value
        const DetectedIcon = getFileIcon(filenameStr)
        const IconComponent = CustomIcon ?? DetectedIcon

        return (
            <button
                ref={ref}
                type="button"
                onClick={() => onValueChange(value)}
                className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-xs transition-colors select-none shrink-0 cursor-pointer',
                    isActive
                        ? 'bg-background text-foreground shadow-2xs font-medium border border-border/70'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    className
                )}
                {...props}
            >
                {IconComponent && <IconComponent className="size-3.5 shrink-0" />}
                <span className="truncate max-w-30 sm:max-w-none">{children ?? value}</span>
            </button>
        )
    }
)
CodeBlockFileTab.displayName = 'CodeBlockFileTab'

// ============================================================================
// CodeBlockSelect (Dropdown file switcher)
// ============================================================================

export interface CodeBlockSelectProps {
    value?: string
    onValueChange?: (val: string) => void
    children?: React.ReactNode
}

export const CodeBlockSelect = ({children, ...props}: CodeBlockSelectProps) => {
    const {value, onValueChange, data} = useCodeBlock()

    return (
        <Select value={value} onValueChange={onValueChange} {...props}>
            {children ?? (
                <>
                    <CodeBlockSelectTrigger />
                    <CodeBlockSelectContent>
                        {data.map((item) => (
                            <CodeBlockSelectItem key={item.filename} value={item.filename}>
                                {item.filename}
                            </CodeBlockSelectItem>
                        ))}
                    </CodeBlockSelectContent>
                </>
            )}
        </Select>
    )
}

export const CodeBlockSelectTrigger = React.forwardRef<
    React.ElementRef<typeof SelectTrigger>,
    React.ComponentPropsWithoutRef<typeof SelectTrigger>
>(({className, children, ...props}, ref) => (
    <SelectTrigger
        ref={ref}
        className={cn('h-7 w-auto min-w-30 border-border/70 bg-background text-xs font-mono shadow-none gap-1.5', className)}
        {...props}
    >
        {children ?? <CodeBlockSelectValue />}
    </SelectTrigger>
))
CodeBlockSelectTrigger.displayName = 'CodeBlockSelectTrigger'

export const CodeBlockSelectValue = SelectValue
export const CodeBlockSelectContent = SelectContent
export const CodeBlockSelectItem = SelectItem

// ============================================================================
// CodeBlockCopyButton
// ============================================================================

export interface CodeBlockCopyButtonProps extends React.ComponentProps<typeof Button> {
    code?: string
    timeout?: number
    onCopy?: () => void
}

export const CodeBlockCopyButton = React.forwardRef<HTMLButtonElement, CodeBlockCopyButtonProps>(
    ({code: directCode, timeout = 2000, onCopy, className, ...props}, ref) => {
        const [isCopied, setIsCopied] = React.useState(false)
        const {data, value} = useCodeBlock()

        const codeToCopy = React.useMemo(() => {
            if (directCode !== undefined) return stripAnnotations(directCode)
            const current = data.find((item) => item.filename === value) ?? data[0]
            return current ? stripAnnotations(current.code) : ''
        }, [directCode, data, value])

        const handleCopy = async (e: React.MouseEvent) => {
            e.stopPropagation()
            if (!navigator?.clipboard || !codeToCopy) return

            try {
                await navigator.clipboard.writeText(codeToCopy)
                setIsCopied(true)
                onCopy?.()
                setTimeout(() => setIsCopied(false), timeout)
            } catch (err) {
                console.error('Failed to copy code to clipboard', err)
            }
        }

        return (
            <Button
                ref={ref}
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleCopy}
                title={isCopied ? 'Copied!' : 'Copy code'}
                aria-label={isCopied ? 'Copied to clipboard' : 'Copy code to clipboard'}
                className={cn(
                    'size-7 text-muted-foreground hover:bg-background hover:text-foreground shrink-0 ml-auto transition-colors cursor-pointer',
                    isCopied && 'text-success hover:text-success',
                    className
                )}
                {...props}
            >
                {isCopied ? (
                    <Check className="size-3.5 stroke-[2.5] animate-in zoom-in-50 duration-200" />
                ) : (
                    <Copy className="size-3.5" />
                )}
            </Button>
        )
    }
)
CodeBlockCopyButton.displayName = 'CodeBlockCopyButton'

// ============================================================================
// CodeBlockBody
// ============================================================================

export interface CodeBlockBodyProps extends React.HTMLAttributes<HTMLDivElement> {
    maxHeight?: string | number
}

export const CodeBlockBody = React.forwardRef<HTMLDivElement, CodeBlockBodyProps>(
    ({className, maxHeight, children, style, onWheel, ...props}, ref) => {
        const handleWheel = React.useCallback((e: React.WheelEvent<HTMLDivElement>) => {
            onWheel?.(e)
            if (e.defaultPrevented) return

            const el = e.currentTarget
            e.stopPropagation()

            const hasVerticalScroll = el.scrollHeight > el.clientHeight
            const hasHorizontalScroll = el.scrollWidth > el.clientWidth

            if (hasVerticalScroll && !e.shiftKey) {
                const atTop = el.scrollTop <= 0 && e.deltaY < 0
                const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1 && e.deltaY > 0
                if (!atTop && !atBottom) {
                    el.scrollTop += e.deltaY
                    e.preventDefault()
                }
            } else if (hasHorizontalScroll && (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY))) {
                const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY
                const atLeft = el.scrollLeft <= 0 && delta < 0
                const atRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && delta > 0
                if (!atLeft && !atRight) {
                    el.scrollLeft += delta
                    e.preventDefault()
                }
            }
        }, [onWheel])

        return (
            <div
                ref={ref}
                data-lenis-prevent="true"
                data-lenis-prevent-wheel="true"
                onWheel={handleWheel}
                className={cn(
                    'w-full max-w-full overflow-x-auto overflow-y-auto no-scrollbar font-mono text-xs leading-relaxed touch-pan-x touch-pan-y overscroll-contain',
                    className
                )}
                style={{
                    maxHeight: maxHeight !== undefined ? (typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight) : undefined,
                    ...style,
                }}
                {...props}
            >
                {children}
            </div>
        )
    }
)
CodeBlockBody.displayName = 'CodeBlockBody'

// ============================================================================
// CodeBlockItem
// ============================================================================

export interface CodeBlockItemProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string
    lineNumbers?: boolean
}

export const CodeBlockItem = React.forwardRef<HTMLDivElement, CodeBlockItemProps>(
    ({className, value, lineNumbers = true, children, ...props}, ref) => {
        const {value: activeValue} = useCodeBlock()

        if (activeValue !== value) {
            return null
        }

        return (
            <div
                ref={ref}
                data-line-numbers={lineNumbers}
                className={cn('w-full min-w-full p-3 sm:p-4', className)}
                {...props}
            >
                {children}
            </div>
        )
    }
)
CodeBlockItem.displayName = 'CodeBlockItem'

// ============================================================================
// CodeBlockContent
// ============================================================================

export interface CodeBlockContentProps extends React.HTMLAttributes<HTMLPreElement> {
    language?: string
    children?: string
}

export const CodeBlockContent = React.forwardRef<HTMLPreElement, CodeBlockContentProps>(
    ({className, language = 'typescript', children = '', ...props}, ref) => {
        const lines = React.useMemo(() => {
            return children.replace(/\r\n/g, '\n').split('\n')
        }, [children])

        return (
            <pre
                ref={ref}
                className={cn(
                    'table w-full border-collapse font-mono text-xs text-foreground select-text',
                    className
                )}
                {...props}
            >
                <code>
                    {lines.map((rawLine, idx) => {
                        const lineNum = idx + 1

                        // Check for line annotation tags like // [!code highlight], // [!code ++], // [!code --]
                        const isHighlight = /\/\/\s*\[!code\s+highlight]/.test(rawLine)
                        const isAdded = /\/\/\s*\[!code\s+\+\+]/.test(rawLine)
                        const isRemoved = /\/\/\s*\[!code\s+--]/.test(rawLine)

                        const cleanedLine = rawLine
                            .replace(/\/\/\s*\[!code\s+[^\]]+]/g, '')
                            .replace(/\s+$/, '')

                        const tokens = tokenizeLine(cleanedLine, language)

                        return (
                            <span
                                key={lineNum}
                                className={cn(
                                    'table-row transition-colors',
                                    isHighlight && 'bg-amber-500/10 text-foreground',
                                    isAdded && 'bg-emerald-500/15 text-foreground',
                                    isRemoved && 'bg-rose-500/15 text-foreground line-through opacity-75'
                                )}
                            >
                                <span
                                    className="table-cell select-none pr-3 sm:pr-4 text-right text-muted-foreground/50 w-8 sm:w-10 text-[11px]"
                                    aria-hidden="true"
                                >
                                    {isAdded ? '+' : isRemoved ? '-' : lineNum}
                                </span>
                                <span className="table-cell whitespace-pre pr-4">
                                    {tokens.length === 0 || cleanedLine.length === 0 ? (
                                        '\u00A0'
                                    ) : (
                                        tokens.map((tok, tIdx) => renderToken(tok, tIdx))
                                    )}
                                </span>
                            </span>
                        )
                    })}
                </code>
            </pre>
        )
    }
)
CodeBlockContent.displayName = 'CodeBlockContent'
