import {useEffect, useState} from 'react'

export type Theme = 'light' | 'dark'

export function useTheme() {
    const [theme, setTheme] = useState<Theme>('light')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const stored = localStorage.getItem('theme') as Theme | null
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

        const initialTheme = stored || (prefersDark ? 'dark' : 'light')
        setTheme(initialTheme)

        if (initialTheme === 'dark') {
            document.documentElement.classList.add('dark')
        }
    }, [])

    const toggle = () => {
        const newTheme: Theme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)

        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }

    return {theme, toggle, mounted}
}
