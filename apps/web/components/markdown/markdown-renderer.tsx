'use client'

import React from 'react'
import type {Block} from '@/lib/markdown/types'
import {parseBlocks} from '@/lib/markdown/parse-blocks'
import {renderInline, renderMath} from '@/lib/markdown/render-inline'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@workspace/ui/shadcn/table'
import {CodeBlock} from '@workspace/ui/shadcn/code-block'

interface MarkdownRendererProps {
    content: string
    className?: string
}

export function MarkdownRenderer({content, className = ''}: MarkdownRendererProps) {
    const blocks = parseBlocks(content)
    return (
        <div className={`markdown-content space-y-3 ${className}`}>
            {blocks.map((block, i) => (
                <React.Fragment key={i}>{renderBlock(block)}</React.Fragment>
            ))}
        </div>
    )
}

function renderBlock(block: Block): React.ReactNode {
    switch (block.type) {
        case 'math':
            return (
                <div className="overflow-x-auto py-1">
                    {renderMath(block.text, true)}
                </div>
            )
        case 'heading': {
            const Tag = `h${block.level}` as keyof React.JSX.IntrinsicElements
            const sizes: Record<number, string> = {
                1: 'text-xl font-bold mt-1',
                2: 'text-lg font-bold mt-1',
                3: 'text-base font-semibold mt-0.5',
                4: 'text-sm font-semibold',
                5: 'text-sm font-medium',
                6: 'text-xs font-medium',
            }
            return <Tag className={sizes[block.level] || 'font-semibold'}>{renderInline(block.text)}</Tag>
        }
        case 'code':
            return (
                <CodeBlock
                    code={block.text}
                    language={block.lang || 'typescript'}
                    filename={block.lang ? `code.${block.lang}` : 'code'}
                    lineNumbers={true}
                    className="my-2"
                />
            )
        case 'blockquote':
            return (
                <blockquote className="border-l-2 border-primary/40 pl-3 text-muted-foreground italic">
                    {renderInline(block.text)}
                </blockquote>
            )
        case 'hr':
            return <hr className="border-border"/>
        case 'ol':
            return (
                <ol className="list-decimal list-inside space-y-1">
                    {block.items.map((item, j) => (
                        <li key={j} className="text-sm leading-relaxed">
                            {renderInline(item)}
                        </li>
                    ))}
                </ol>
            )
        case 'ul':
            return (
                <ul className="list-disc list-inside space-y-1">
                    {block.items.map((item, j) => (
                        <li key={j} className="text-sm leading-relaxed">
                            {renderInline(item)}
                        </li>
                    ))}
                </ul>
            )
        case 'table': {
            const alignClass = (a: string) =>
                a === 'center' ? 'text-center' : a === 'right' ? 'text-right' : 'text-left'
            return (
                <Table>
                    <TableHeader>
                        <TableRow>
                            {block.headers.map((h, j) => (
                                <TableHead key={j} className={alignClass(block.alignments[j] || 'default')}>
                                    {renderInline(h)}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {block.rows.map((row, j) => (
                            <TableRow key={j}>
                                {row.map((cell, k) => (
                                    <TableCell key={k} className={alignClass(block.alignments[k] || 'default')}>
                                        {renderInline(cell)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )
        }
        case 'paragraph':
            return <p className="text-sm leading-relaxed">{renderInline(block.text)}</p>
    }
}
