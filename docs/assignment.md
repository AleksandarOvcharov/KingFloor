Developer Assignment: Next.js Project Template for Hackathons

> **Historical record** — this is the original brief the project started from, kept as-is for context. The project has since grown well beyond it (a Turborepo monorepo, an Expo mobile app, `packages/shared`/`packages/ui`, etc.) — see `AGENT.md` and `docs/CHANGELOG.md` for what it actually is today.

1. Project Overview

Цел: Минималистичен Next.js проект template, който да служи като основа за хакатони или бързи прототипи.

Технологии:

Frontend: Next.js latest, TailwindCSS latest, shadcn/ui

Backend: Next.js API routes

Database: Supabase (auth + basic DB)

Deployment: Docker compatible

Features:

Auth (Sign up / Login / Logout)

2 starter страници (Home + Dashboard placeholder)

Dark/Light mode

Component-driven UI (shadcn/ui + Tailwind)

Clean, modular project structure

2. Project Structure
   my-hackathon-template/
   ├─ backend/
   │ ├─ api/
   │ │ └─ auth/ # Auth API routes (login/signup/logout)
   │ └─ lib/
   │ └─ supabaseClient.ts # Supabase client wrapper
   ├─ frontend/
   │ ├─ components/ # Reusable UI components
   │ │ └─ Button.tsx
   │ ├─ pages/
   │ │ ├─ index.tsx # Home page
   │ │ └─ dashboard.tsx # Dashboard placeholder
   │ ├─ hooks/ # Custom hooks (useAuth, useTheme)
   │ ├─ styles/
   │ │ └─ globals.css
   │ └─ utils/ # Helper functions (theme, formatters)
   ├─ docker/
   │ ├─ Dockerfile
   │ └─ docker-compose.yml
   ├─ .env # Environment variables
   ├─ next.config.js
   ├─ package.json
   ├─ tailwind.config.js
   └─ README.md

Забележка: frontend и backend са разделени само логически – backend е под API routes на Next.js, но може лесно да се
изнесе в отделен server ако е нужно.

3. Authentication (Supabase)

Supabase setup:

Enable Auth (email/password)

Tables: users (default by Supabase)

Example call:

// backend/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
process.env.SUPABASE_URL!,
process.env.SUPABASE_ANON_KEY!
)

API routes:

POST /api/auth/signup -> { email, password }
POST /api/auth/login -> { email, password }
POST /api/auth/logout -> {}

Frontend hook example:

// frontend/hooks/useAuth.ts
import { useState } from 'react'
import { supabase } from '../../backend/lib/supabaseClient'

export function useAuth() {
const [user, setUser] = useState(supabase.auth.user())

const login = async (email: string, password: string) => {
const { data, error } = await supabase.auth.signInWithPassword({ email, password })
if (!error) setUser(data.user)
return { data, error }
}

const signup = async (email: string, password: string) => {
const { data, error } = await supabase.auth.signUp({ email, password })
if (!error) setUser(data.user)
return { data, error }
}

const logout = async () => {
await supabase.auth.signOut()
setUser(null)
}

return { user, login, signup, logout }
}

4. Frontend Pages & Components

Home Page (index.tsx)
Minimalist landing page with dark/light mode toggle and links to placeholder dashboard.

Dashboard (dashboard.tsx)
Starter page for project functionality. Placeholder components for quick extension.

Components (shadcn/ui + Tailwind):

Button.tsx

Card.tsx

Modal.tsx

Input.tsx

Dark/Light toggle switch

5. Styling

Tailwind + shadcn/ui

Dark/Light mode:

theme.ts + useTheme.ts hook

Tailwind dark: variants used throughout

// frontend/hooks/useTheme.ts
import { useEffect, useState } from 'react'

export function useTheme() {
const [theme, setTheme] = useState<'light'|'dark'>('light')

useEffect(() => {
const local = localStorage.getItem('theme') as 'light'|'dark' | null
if (local) setTheme(local)
}, [])

const toggle = () => {
const newTheme = theme === 'light' ? 'dark' : 'light'
setTheme(newTheme)
localStorage.setItem('theme', newTheme)
}

return { theme, toggle }
}

6. Docker Setup

Dockerfile:

FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]

docker-compose.yml:

version: '3.9'
services:
app:
build: ./docker
ports:
- "3000:3000"
env_file:
- .env
volumes:
- .:/app

7. Developer Documentation (File-based)

README.md:

Project structure

Tech stack

Supabase setup

Auth API usage

How to run docker locally

docs/ (optional folder):

components.md – описва UI компонентите

hooks.md – описва custom hooks

utils.md – описва utility functions

Всичко документацията се пише ръчно и се достъпва само за dev.

8. Bonus / Future-Proof Hooks

AI-first ready:

utils/aiClient.ts – placeholder за OpenAI/AI API integration

hooks/useAI.ts – placeholder за генерация/предложения

Лесно добавяне на нови страници и компоненти с minimal boilerplate.

9. Next Steps

Създай папки и файлове според структурата.

Настрой Supabase Auth и .env.

Напиши basic frontend с shadcn/ui и Tailwind.

Добави docker-compose и тествай локално.

Добавяй нови компоненти/страници според хакатон темата.