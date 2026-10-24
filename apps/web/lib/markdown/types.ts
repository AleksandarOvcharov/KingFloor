export type TableAlignment = 'left' | 'center' | 'right' | 'default'

export type Block =
    | { type: 'heading'; level: number; text: string }
    | { type: 'code'; lang: string; text: string }
    | { type: 'math'; text: string }
    | { type: 'blockquote'; text: string }
    | { type: 'hr' }
    | { type: 'ol'; items: string[] }
    | { type: 'ul'; items: string[] }
    | { type: 'table'; headers: string[]; alignments: TableAlignment[]; rows: string[][] }
    | { type: 'paragraph'; text: string }
