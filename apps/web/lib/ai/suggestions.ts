// AI Suggestions on new chat pages
import type {Locale} from '@/lib/i18n/dictionaries'

export const suggestions: Record<Locale, string[]> = {
    en: [
        'Explain how React hooks work',
        'Help me write a SQL query',
        'What is a REST API?',
        'Explain the difference between HTTP and HTTPS',
        'What is a closure in JavaScript?',
        'How do promises work in JS?',
        'What is TypeScript and why use it?',
        'How to fetch data from an API in React?',
        'Explain functional components vs class components',
        'How to center a div?',
    ],
    bg: [
        'Обясни как работят React hooks',
        'Помогни ми да напиша SQL заявка',
        'Какво е REST API?',
        'Обясни разликата между HTTP и HTTPS',
        'Какво е closure в JavaScript?',
        'Как работят promises в JS?',
        'Какво е TypeScript и защо да го използваме?',
        'Как да взема данни от API в React?',
        'Обясни функционални компоненти срещу клас компоненти',
        'Как да центрирам div?',
    ],
}
