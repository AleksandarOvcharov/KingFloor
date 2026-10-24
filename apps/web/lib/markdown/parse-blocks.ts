import type {Block, TableAlignment} from './types'

export function parseBlocks(raw: string): Block[] {
    const lines = raw.split('\n')
    const blocks: Block[] = []
    let i = 0

    while (i < lines.length) {
        const line = lines[i]

        // Display math block ($$...$$)
        if (line.trimStart().startsWith('$$')) {
            const singleLine = line.trimStart()
            if (singleLine.indexOf('$$', 2) > 2) {
                const mathContent = singleLine.slice(2, singleLine.indexOf('$$', 2))
                blocks.push({type: 'math', text: mathContent.trim()})
                i++
                continue
            }
            const mathLines: string[] = []
            i++
            while (i < lines.length && !lines[i].trimStart().startsWith('$$')) {
                mathLines.push(lines[i])
                i++
            }
            i++ // skip closing $$
            blocks.push({type: 'math', text: mathLines.join('\n').trim()})
            continue
        }

        // Fenced code block
        if (line.trimStart().startsWith('```')) {
            const lang = line.trimStart().slice(3).trim()
            const codeLines: string[] = []
            i++
            while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
                codeLines.push(lines[i])
                i++
            }
            i++ // skip closing ```
            blocks.push({type: 'code', lang, text: codeLines.join('\n')})
            continue
        }

        // Horizontal rule
        if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line.trim())) {
            blocks.push({type: 'hr'})
            i++
            continue
        }

        // Heading
        const headingMatch = line.match(/^(#{1,6})\s+(.+)/)
        if (headingMatch) {
            blocks.push({type: 'heading', level: headingMatch[1].length, text: headingMatch[2].trim()})
            i++
            continue
        }

        // Blockquote (collect consecutive > lines)
        if (line.trimStart().startsWith('>')) {
            const quoteLines: string[] = []
            while (i < lines.length && lines[i].trimStart().startsWith('>')) {
                quoteLines.push(lines[i].replace(/^>\s?/, ''))
                i++
            }
            blocks.push({type: 'blockquote', text: quoteLines.join('\n')})
            continue
        }

        // Ordered list
        if (/^\s*\d+[.)]\s/.test(line)) {
            const items: string[] = []
            while (i < lines.length && /^\s*\d+[.)]\s/.test(lines[i])) {
                items.push(lines[i].replace(/^\s*\d+[.)]\s/, ''))
                i++
            }
            blocks.push({type: 'ol', items})
            continue
        }

        // Unordered list (* - +)
        if (/^\s*[*\-+]\s/.test(line)) {
            const items: string[] = []
            while (i < lines.length && /^\s*[*\-+]\s/.test(lines[i])) {
                items.push(lines[i].replace(/^\s*[*\-+]\s/, ''))
                i++
            }
            blocks.push({type: 'ul', items})
            continue
        }

        // Table: detect header row followed by separator row (| --- | --- |)
        if (
            line.includes('|') &&
            i + 1 < lines.length &&
            /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(lines[i + 1].trim())
        ) {
            const parseCells = (row: string) =>
                row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim())

            const headers = parseCells(line)
            const sepCells = parseCells(lines[i + 1])
            const alignments = sepCells.map((cell): TableAlignment => {
                const left = cell.startsWith(':')
                const right = cell.endsWith(':')
                if (left && right) return 'center'
                if (right) return 'right'
                if (left) return 'left'
                return 'default'
            })

            i += 2 // skip header + separator
            const rows: string[][] = []
            while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
                rows.push(parseCells(lines[i]))
                i++
            }
            blocks.push({type: 'table', headers, alignments, rows})
            continue
        }

        // Empty line — skip
        if (line.trim() === '') {
            i++
            continue
        }

        // Paragraph (collect consecutive non-empty, non-special lines)
        const paraLines: string[] = []
        while (
            i < lines.length &&
            lines[i].trim() !== '' &&
            !lines[i].trimStart().startsWith('```') &&
            !lines[i].trimStart().startsWith('>') &&
            !/^#{1,6}\s/.test(lines[i]) &&
            !/^\s*[*\-+]\s/.test(lines[i]) &&
            !/^\s*\d+[.)]\s/.test(lines[i]) &&
            !/^(\*{3,}|-{3,}|_{3,})\s*$/.test(lines[i].trim())
            ) {
            paraLines.push(lines[i])
            i++
        }
        if (paraLines.length > 0) {
            blocks.push({type: 'paragraph', text: paraLines.join('\n')})
        }
    }

    return blocks
}
