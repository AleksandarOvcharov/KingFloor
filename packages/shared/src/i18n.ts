import {LOCALES, type Locale} from './types'

export const LOCALE_COOKIE = 'locale'

/**
 * Not client-only, so both apps/web's server (app/layout.tsx reading the
 * locale cookie) and any client can call it directly.
 */
export function isLocale(value: string | null | undefined): value is Locale {
    return value != null && (LOCALES as readonly string[]).includes(value)
}

/** Each language names itself — not translated per-locale. */
export const LANGUAGE_META: Record<Locale, { flag: string; nativeName: string }> = {
    en: {flag: '🇬🇧', nativeName: 'English'},
    bg: {flag: '🇧🇬', nativeName: 'Български'},
}

/** One string, every language, side by side — the only shape you ever write by hand. */
type LocalizedString = Record<Locale, string>

/** A namespace of strings; every leaf is a LocalizedString, branches nest freely. */
type StringTree = {
    [key: string]: LocalizedString | StringTree
}

/** Same shape as T, but every LocalizedString leaf collapses to a plain `string`. */
type Localized<T> = T extends LocalizedString
    ? string
    : { [K in keyof T]: Localized<T[K]> }

function isLocalizedString(node: unknown): node is LocalizedString {
    if (typeof node !== 'object' || node === null) return false
    const keys = Object.keys(node)
    return keys.length === LOCALES.length && LOCALES.every((l) => typeof (node as Record<string, unknown>)[l] === 'string')
}

function pickLocale<T>(tree: T, locale: Locale): Localized<T> {
    if (isLocalizedString(tree)) {
        return tree[locale] as Localized<T>
    }
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(tree as Record<string, unknown>)) {
        result[key] = pickLocale(value, locale)
    }
    return result as Localized<T>
}

/*
 * ============================================================================
 * STRINGS
 * ------------------------------------------------------------------------
 * To add a new string: write `myKey: {en: '...', bg: '...'}` anywhere below,
 * in whichever namespace it belongs to (add a new namespace if none fits).
 * TypeScript flags it immediately, right at that line, if either language
 * is missing — there is nothing else to keep in sync, and nothing elsewhere
 * in the codebase to touch. Used by both apps/web and apps/mobile — this is
 * the single source of truth for both, moved here (not duplicated) from
 * apps/web/lib/i18n/dictionaries.ts so mobile isn't inventing its own copy.
 *
 * For a string with a dynamic value (e.g. a username), write a `{placeholder}`
 * into the text and fill it in with `tFormat(t.ns.key, {placeholder: value})`
 * from apps/web/lib/i18n/provider or apps/mobile/hooks/useI18n.
 * ============================================================================
 */
const strings = {
    common: {
        save: {en: 'Save', bg: 'Запази'},
        cancel: {en: 'Cancel', bg: 'Отказ'},
        delete: {en: 'Delete', bg: 'Изтрий'},
        confirm: {en: 'Confirm', bg: 'Потвърди'},
        close: {en: 'Close', bg: 'Затвори'},
        back: {en: 'Back', bg: 'Назад'},
        next: {en: 'Next', bg: 'Напред'},
        loading: {en: 'Loading...', bg: 'Зареждане...'},
        retry: {en: 'Retry', bg: 'Опитай пак'},
        refresh: {en: 'Refresh', bg: 'Обнови'},
        settings: {en: 'Settings', bg: 'Настройки'},
        dashboard: {en: 'Dashboard', bg: 'Табло'},
        login: {en: 'Login', bg: 'Вход'},
        logout: {en: 'Log out', bg: 'Изход'},
        signup: {en: 'Sign Up', bg: 'Регистрация'},
        home: {en: 'Home', bg: 'Начало'},
        submit: {en: 'Submit', bg: 'Изпрати'},
        submitting: {en: 'Submitting...', bg: 'Изпращане...'},
        pleaseWait: {en: 'Please wait...', bg: 'Моля, изчакайте...'},
        gotIt: {en: 'Got it', bg: 'Разбрах'},
        done: {en: 'Done', bg: 'Готово'},
        upload: {en: 'Upload', bg: 'Качи'},
        // Added for apps/mobile — every screen's sign-in CTA used the raw
        // English string "Sign In" (not translated); web has no identical
        // generic label (common.login says "Login" instead), so this is new.
        signIn: {en: 'Sign In', bg: 'Вход'},
        guestUser: {en: 'Guest User', bg: 'Гост'},
        // Added for apps/mobile's Map tab label — web's `map` namespace only
        // has a loading-state string, no plain "Map" label (its nav link is
        // literal text, not translated).
        map: {en: 'Map', bg: 'Карта'},
    },
    nav: {
        features: {en: 'Features', bg: 'Функции'},
        ai: {en: 'AI', bg: 'AI'},
        about: {en: 'About', bg: 'За нас'},
    },
    map: {
        loadingInteractiveMap: {en: 'Loading interactive map...', bg: 'Зареждане на интерактивна карта...'},
    },
    status: {
        success: {en: 'Success', bg: 'Успех'},
        successExclaim: {en: 'Success!', bg: 'Успех!'},
        info: {en: 'Info', bg: 'Инфо'},
        error: {en: 'Error', bg: 'Грешка'},
        verified: {en: 'Verified', bg: 'Потвърден'},
        unverified: {en: 'Unverified', bg: 'Непотвърден'},
        pending: {en: 'Pending', bg: 'Изчакващ'},
        online: {en: 'Online', bg: 'Онлайн'},
        offline: {en: 'Offline', bg: 'Офлайн'},
    },
    errors: {
        generic: {en: 'Something went wrong. Please try again.', bg: 'Нещо се обърка. Моля, опитайте отново.'},
        boundaryTitle: {en: 'Something went wrong', bg: 'Нещо се обърка'},
        boundaryDescription: {en: 'An unexpected error occurred. Try refreshing the page.', bg: 'Възникна неочаквана грешка. Опитайте да презаредите страницата.'},
        refreshPage: {en: 'Refresh page', bg: 'Презареди страницата'},
        network: {en: 'Network error — check your connection and try again.', bg: 'Мрежова грешка — проверете връзката си и опитайте отново.'},
        unauthorized: {en: 'Session expired — please log in again.', bg: 'Сесията е изтекла — моля, впишете се отново.'},
        notFound: {en: 'Not found.', bg: 'Не е намерено.'},
        validation: {en: 'Please check the highlighted fields.', bg: 'Моля, прегледайте маркираните полета.'},
    },
    loading: {
        checkingAuth: {en: 'Checking authentication...', bg: 'Проверка на автентикацията...'},
        signingIn: {en: 'Signing you in...', bg: 'Влизане в профила...'},
        features: {en: 'Loading features...', bg: 'Зареждане на функции...'},
    },
    ai: {
        send: {en: 'Send', bg: 'Изпрати'},
        thinking: {en: 'Thinking...', bg: 'Мисля...'},
        newChat: {en: 'New chat', bg: 'Нов разговор'},
        placeholder: {en: 'Ask anything...', bg: 'Попитай нещо...'},
        stop: {en: 'Stop', bg: 'Стоп'},
        regenerate: {en: 'Regenerate', bg: 'Генерирай отново'},
        dropImageHere: {en: 'Drop your image here', bg: 'Пуснете изображението тук'},
        supportsFormats: {en: 'Supports PNG, JPG, GIF, WebP', bg: 'Поддържа PNG, JPG, GIF, WebP'},
        conversations: {en: 'Conversations', bg: 'Разговори'},
        closeSidebar: {en: 'Close sidebar', bg: 'Затвори страничната лента'},
        openSidebar: {en: 'Open sidebar', bg: 'Отвори страничната лента'},
        signInToSave: {en: 'Sign in to save your chat history across sessions.', bg: 'Впишете се, за да запазите историята си между сесии.'},
        signIn: {en: 'Sign In', bg: 'Вход'},
        noConversationsYet: {en: 'No conversations yet. Start chatting!', bg: 'Все още няма разговори. Започнете чат!'},
        deleteConversationTitle: {en: 'Delete conversation', bg: 'Изтрий разговора'},
        chatHistoryEnabled: {en: 'Chat History Enabled', bg: 'Историята на чата е активна'},
        guestMode: {en: 'Guest Mode (history not saved)', bg: 'Режим на гост (историята не се запазва)'},
        howCanIHelp: {en: 'How can I help you today?', bg: 'Как мога да помогна днес?'},
        askQuestionsHint: {
            en: 'Ask questions, paste/upload images for OCR, or speak with your voice.',
            bg: 'Задавайте въпроси, прикачвайте изображения за OCR или говорете с глас.',
        },
        attachedContext: {en: 'Attached context', bg: 'Прикачен контекст'},
        transcribingWithGemini: {en: 'Transcribing audio with Gemini AI...', bg: 'Транскрибиране на аудио с Gemini AI...'},
        listeningLabel: {en: 'Listening ({lang})...', bg: 'Слушам ({lang})...'},
        speakIntoMic: {en: '(Speak into your microphone)', bg: '(Говорете в микрофона)'},
        attachedPreviewAlt: {en: 'Attached preview', bg: 'Прикачен преглед'},
        removeAttachedImage: {en: 'Remove attached image', bg: 'Премахни прикаченото изображение'},
        uploadImageTitle: {en: 'Upload image for AI analysis', bg: 'Качи изображение за AI анализ'},
        uploadImageAriaLabel: {en: 'Upload image', bg: 'Качи изображение'},
        typeMessagePlaceholder: {en: 'Type a message, speak with voice, or drop an image...', bg: 'Напишете съобщение, говорете с глас или пуснете изображение...'},
        listeningPlaceholder: {en: 'Listening... speak now', bg: 'Слушам... говорете сега'},
        askAboutImagePlaceholder: {en: 'Ask something about this image (or press Enter)...', bg: 'Попитайте нещо за това изображение (или натиснете Enter)...'},
        speechLangTitle: {en: 'Speech recognition language: {lang}. Click to toggle.', bg: 'Език за гласово разпознаване: {lang}. Кликнете за превключване.'},
        bulgarianLangName: {en: 'Bulgarian (Български)', bg: 'Български'},
        englishLangName: {en: 'English', bg: 'Английски'},
        transcribingAudio: {en: 'Transcribing audio...', bg: 'Транскрибиране на аудио...'},
        stopRecording: {en: 'Stop recording voice', bg: 'Спри записа на глас'},
        voiceInputLabel: {en: 'Voice input ({lang})', bg: 'Гласов вход ({lang})'},
        voiceInput: {en: 'Voice input', bg: 'Гласов вход'},
        footerHint: {
            en: 'Press Enter to send • Mic for voice input • Paste, drop or attach images',
            bg: 'Натиснете Enter за изпращане • Микрофон за гласов вход • Поставете, пуснете или прикачете изображения',
        },
        analyzeImageDefault: {en: 'Analyze this image in detail and describe what you see.', bg: 'Анализирай детайлно това изображение и опиши какво виждаш.'},
        requestCancelled: {en: 'Request cancelled or timed out', bg: 'Заявката е отказана или е изтекла'},
        unknownError: {en: 'An error occurred', bg: 'Възникна грешка'},
        failedGenerateText: {en: 'Failed to generate text', bg: 'Неуспешно генериране на текст'},
        failedGenerateStructured: {en: 'Failed to generate structured data', bg: 'Неуспешно генериране на структурирани данни'},
        unsupportedImageFormat: {
            en: 'Unsupported image format ({type}). Please use JPEG, PNG, WebP, or GIF.',
            bg: 'Неподдържан формат на изображение ({type}). Моля, използвайте JPEG, PNG, WebP или GIF.',
        },
        failedAnalyzeImage: {en: 'Failed to analyze image', bg: 'Неуспешен анализ на изображението'},
        failedSendMessage: {en: 'Failed to send message', bg: 'Неуспешно изпращане на съобщението'},
        // Added for apps/mobile's AI tab sign-in gate (web gates on
        // signInToSave/signIn instead, which assume history persistence
        // rather than "no account at all" — mobile's gate is stricter).
        signInRequired: {en: 'Sign in to chat', bg: 'Впишете се, за да чатите'},
        signInRequiredDescription: {en: 'The AI assistant needs an account to respond', bg: 'AI асистентът изисква профил, за да отговори'},
    },
    accessibility: {
        language: {en: 'Language', bg: 'Език'},
        colorblindMode: {en: 'Colorblind-friendly mode', bg: 'Режим за далтонисти'},
        colorblindModeDescription: {
            en: 'Swaps red/green status colors for a blue/amber pairing and darkens borders for extra contrast.',
            bg: 'Замества червено/зелено статусните цветове със синьо/кехлибарено и усилва контраста на рамките.',
        },
    },
    auth: {
        loginDescription: {en: 'Enter your credentials to access your account', bg: 'Въведете данните си за достъп до профила'},
        signupDescription: {en: 'Create a new account to get started', bg: 'Създайте нов профил, за да започнете'},
        email: {en: 'Email', bg: 'Имейл'},
        password: {en: 'Password', bg: 'Парола'},
        loggingIn: {en: 'Logging in...', bg: 'Влизане...'},
        signingUp: {en: 'Signing up...', bg: 'Регистрация...'},
        orContinueWith: {en: 'Or continue with', bg: 'Или продължете с'},
        redirecting: {en: 'Redirecting...', bg: 'Пренасочване...'},
        noAccount: {en: "Don't have an account?", bg: 'Нямате профил?'},
        haveAccount: {en: 'Already have an account?', bg: 'Вече имате профил?'},
        fillBothFields: {en: 'Please enter both email and password.', bg: 'Моля, въведете имейл и парола.'},
        unexpectedError: {en: 'An unexpected error occurred', bg: 'Възникна неочаквана грешка'},
        welcomeBackToast: {en: 'Welcome back!', bg: 'Добре дошли отново!'},
        loggedInSuccess: {en: 'You have successfully logged in.', bg: 'Успешно влязохте в профила си.'},
        error: {en: 'Error', bg: 'Грешка'},
        checkYourEmail: {en: 'Check your email', bg: 'Проверете имейла си'},
        confirmationSentTo: {en: "We've sent a confirmation link to", bg: 'Изпратихме линк за потвърждение на'},
        confirmationInstructions: {
            en: 'Click the link in the email to confirm your account and complete the signup process.',
            bg: 'Кликнете върху линка в имейла, за да потвърдите профила си и да завършите регистрацията.',
        },
        didntReceiveEmail: {en: "Didn't receive the email? Check your spam folder or try again.", bg: 'Не получихте имейла? Проверете папката със спам или опитайте отново.'},
        // Added for apps/mobile's sign-in modal title — preserves the exact
        // Bulgarian copy that was previously hardcoded in app/_layout.tsx's
        // Stack.Screen options instead of being locale-aware.
        signInTitle: {en: 'Sign In', bg: 'Вход в профила'},
    },
    about: {
        badge: {en: 'About This Project', bg: 'За този проект'},
        title: {en: 'Built for Hackathons, Designed for Speed', bg: 'Създаден за хакатони, проектиран за скорост'},
        subtitle: {
            en: 'A production-ready starter template that helps you skip the boilerplate and start building your hackathon project in minutes.',
            bg: 'Готов за продукция начален шаблон, който ви помага да пропуснете шаблонния код и да започнете да изграждате своя хакатон проект за минути.',
        },
        whyTitle: {en: 'Why This Template?', bg: 'Защо този шаблон?'},
        whyDescription: {en: 'The motivation behind the boilerplate', bg: 'Мотивацията зад шаблонния код'},
        whyParagraph1: {
            en: 'Hackathons are time-constrained. Spending the first few hours setting up authentication, UI components, and project structure takes away from building your core idea.',
            bg: 'Хакатоните са ограничени във времето. Прекарването на първите няколко часа в настройване на автентикация, UI компоненти и структура на проекта отнема от изграждането на основната ви идея.',
        },
        whyParagraph2: {
            en: 'This template provides a solid foundation with Supabase auth, shadcn/ui components, and dark mode support out of the box.',
            bg: 'Този шаблон предоставя солидна основа със Supabase автентикация, shadcn/ui компоненти и поддръжка на тъмен режим веднага от кутията.',
        },
        stackTitle: {en: 'Tech Stack', bg: 'Технологичен стек'},
        stackDescription: {en: 'Modern tools for rapid development', bg: 'Модерни инструменти за бързо разработване'},
        stackNextjs: {en: 'App Router with React 19', bg: 'App Router с React 19'},
        stackSupabase: {en: 'Authentication & Database', bg: 'Автентикация и база данни'},
        stackShadcn: {en: 'Accessible UI components', bg: 'Достъпни UI компоненти'},
        stackTailwind: {en: 'Utility-first styling', bg: 'Utility-first стилизиране'},
        stackLucide: {en: 'Beautiful, consistent icons', bg: 'Красиви, последователни икони'},
        authTitle: {en: 'Authentication Ready', bg: 'Готова автентикация'},
        authDescription: {en: 'Supabase Auth integration', bg: 'Интеграция със Supabase Auth'},
        authParagraph1Pre: {
            en: 'Includes email/password signup and login, protected route middleware, and a custom ',
            bg: 'Включва регистрация и вход с имейл/парола, middleware за защитени маршрути и персонализиран ',
        },
        authParagraph1Post: {en: ' hook for easy access to the user session.', bg: ' hook за лесен достъп до потребителската сесия.'},
        authParagraph2: {
            en: 'OAuth providers (Google, GitHub) can be enabled with just a few clicks in the Supabase dashboard.',
            bg: 'OAuth доставчиците (Google, GitHub) могат да се активират само с няколко клика в Supabase таблото.',
        },
        archTitle: {en: 'Clean Architecture', bg: 'Чиста архитектура'},
        archDescription: {en: 'Organized and extensible codebase', bg: 'Организирана и разширяема кодова база'},
        archParagraph1: {
            en: 'Follows Next.js best practices with clear separation between components, hooks, lib utilities, and route handlers.',
            bg: 'Следва най-добрите практики на Next.js с ясно разделение между компоненти, hooks, lib помощни функции и route handlers.',
        },
        archParagraph2: {
            en: 'TypeScript strict mode is enabled for maximum type safety and better developer experience.',
            bg: 'TypeScript strict mode е активиран за максимална типова безопасност и по-добро developer experience.',
        },
        tipsTitle: {en: 'Tips for Your Hackathon', bg: 'Съвети за вашия хакатон'},
        tipsSubtitle: {en: 'Make the most out of your time', bg: 'Извлечете максимума от времето си'},
        tip1Title: {en: 'Focus on the MVP', bg: 'Фокусирайте се върху MVP'},
        tip1Description: {
            en: 'Build the core feature first. Polish and extra features can wait until the main flow works.',
            bg: 'Изградете основната функция първо. Полирането и допълнителните функции могат да почакат, докато основният процес заработи.',
        },
        tip2Title: {en: 'Use Existing Components', bg: 'Използвайте съществуващите компоненти'},
        tip2DescriptionPre: {en: 'Leverage the shadcn/ui components in ', bg: 'Използвайте shadcn/ui компонентите в '},
        tip2DescriptionPost: {en: ' instead of building from scratch.', bg: ' вместо да изграждате от нулата.'},
        tip3Title: {en: 'Deploy Early', bg: 'Деплойвайте рано'},
        tip3Description: {
            en: 'Deploy to Vercel as soon as possible to catch environment and build issues early.',
            bg: 'Деплойвайте във Vercel възможно най-рано, за да хванете проблеми със средата и build процеса рано.',
        },
        quickStartTitle: {en: 'Quick Start Guide', bg: 'Ръководство за бързо начало'},
        step1Pre: {en: '1. Clone the repository and install dependencies with ', bg: '1. Клонирайте хранилището и инсталирайте зависимостите с '},
        step2Pre: {en: '2. Copy ', bg: '2. Копирайте '},
        step2Mid: {en: ' to ', bg: ' в '},
        step2Post: {en: ' and add your Supabase credentials', bg: ' и добавете вашите Supabase credentials'},
        step3Pre: {en: '3. Run the Supabase migration script in ', bg: '3. Изпълнете Supabase миграционния скрипт в '},
        step4Pre: {en: '4. Start the dev server with ', bg: '4. Стартирайте dev сървъра с '},
        step5: {en: '5. Start building your awesome project!', bg: '5. Започнете да изграждате своя невероятен проект!'},
    },
    dashboard: {
        welcomeBack: {en: 'Welcome back, {name}', bg: 'Добре дошли отново, {name}'},
        joined: {en: 'Joined {date}', bg: 'Регистриран от {date}'},
        notAvailable: {en: 'N/A', bg: 'Няма данни'},
        refreshStats: {en: 'Refresh stats', bg: 'Обнови статистиката'},
        viewPublicProfile: {en: 'View public profile', bg: 'Виж публичния профил'},
        tabAnalytics: {en: 'Analytics', bg: 'Анализи'},
        tabActivity: {en: 'Activity', bg: 'Активност'},
        tabAccount: {en: 'Account', bg: 'Профил'},
        statConversations: {en: 'Conversations', bg: 'Разговори'},
        statConversationsSubtitle: {en: 'Total chats', bg: 'Общо чатове'},
        statMessagesSent: {en: 'Messages Sent', bg: 'Изпратени съобщения'},
        statMessagesSentSubtitle: {en: 'Your messages', bg: 'Вашите съобщения'},
        statAiResponses: {en: 'AI Responses', bg: 'AI отговори'},
        statAiResponsesSubtitle: {en: 'From AI assistant', bg: 'От AI асистента'},
        statTotalActivity: {en: 'Total Activity', bg: 'Обща активност'},
        statTotalActivitySubtitle: {en: 'Recent events', bg: 'Скорошни събития'},
        profileCompleteness: {en: 'Profile Completeness', bg: 'Завършеност на профила'},
        profileCompletenessDescription: {en: 'Complete your profile to unlock all features', bg: 'Завършете профила си, за да отключите всички функции'},
        stepUsernameSet: {en: 'Username set', bg: 'Потребителско име зададено'},
        stepEmailVerified: {en: 'Email verified', bg: 'Имейл потвърден'},
        stepAvatarUploaded: {en: 'Avatar uploaded', bg: 'Профилна снимка качена'},
        stepBioWritten: {en: 'Bio written', bg: 'Биография написана'},
        completeProfile: {en: 'Complete Profile', bg: 'Завърши профила'},
        accountDetails: {en: 'Account Details', bg: 'Детайли за профила'},
        username: {en: 'Username', bg: 'Потребителско име'},
        notSet: {en: 'Not set', bg: 'Не е зададено'},
        verified: {en: 'Verified', bg: 'Потвърден'},
        yes: {en: 'Yes', bg: 'Да'},
        no: {en: 'No', bg: 'Не'},
        userId: {en: 'User ID', bg: 'ID на потребителя'},
        quickActions: {en: 'Quick Actions', bg: 'Бързи действия'},
        quickActionsDescription: {en: 'Jump to common tasks', bg: 'Прескочи към честите задачи'},
        aiChat: {en: 'AI Chat', bg: 'AI Чат'},
        // Added for apps/mobile's Dashboard tab sign-in gate.
        signInRequired: {en: 'Sign in to see your dashboard', bg: 'Впишете се, за да видите таблото си'},
        signInRequiredDescription: {en: 'Track your chats and activity across devices', bg: 'Следете чатовете и активността си на всички устройства'},
    },
    activity: {
        recentActivity: {en: 'Recent Activity', bg: 'Скорошна активност'},
        recentActivityDescription: {en: 'Your latest actions and events', bg: 'Вашите последни действия и събития'},
        noActivity: {en: 'No activity recorded yet.', bg: 'Все още няма записана активност.'},
        eventPageView: {en: 'Page view', bg: 'Преглед на страница'},
        eventChatMessage: {en: 'Chat message', bg: 'Чат съобщение'},
        eventChatCreated: {en: 'New conversation', bg: 'Нов разговор'},
        eventChatDeleted: {en: 'Deleted conversation', bg: 'Изтрит разговор'},
        eventProfileUpdated: {en: 'Profile updated', bg: 'Профилът е обновен'},
        eventAvatarUploaded: {en: 'Avatar uploaded', bg: 'Профилна снимка качена'},
        eventSignedIn: {en: 'Signed in', bg: 'Влязохте в профила'},
        eventSignedOut: {en: 'Signed out', bg: 'Излязохте от профила'},
        justNow: {en: 'just now', bg: 'току-що'},
        minutesAgo: {en: '{n}m ago', bg: 'преди {n}мин'},
        hoursAgo: {en: '{n}h ago', bg: 'преди {n}ч'},
        daysAgo: {en: '{n}d ago', bg: 'преди {n}д'},
        aiUsage: {en: 'AI Usage', bg: 'Използване на AI'},
        aiUsageDescription: {en: 'Messages sent and received over the last 14 days', bg: 'Изпратени и получени съобщения през последните 14 дни'},
        noChatActivity: {en: 'No chat activity yet. Start a conversation to see your usage.', bg: 'Все още няма чат активност. Започнете разговор, за да видите използването си.'},
        sent: {en: 'Sent', bg: 'Изпратени'},
        received: {en: 'Received', bg: 'Получени'},
        messageBreakdown: {en: 'Message Breakdown', bg: 'Разбивка на съобщенията'},
        messageBreakdownDescription: {en: 'Your messages vs AI responses', bg: 'Вашите съобщения спрямо AI отговори'},
        noMessagesYet: {en: 'No messages yet.', bg: 'Все още няма съобщения.'},
        you: {en: 'You', bg: 'Вие'},
    },
    settings: {
        pageDescription: {en: 'Manage your account settings and profile', bg: 'Управлявайте настройките на акаунта и профила си'},
        avatarHint: {en: 'JPG, PNG, GIF or WebP — Max 5MB', bg: 'JPG, PNG, GIF или WebP — Макс. 5MB'},
        accountCardTitle: {en: 'Account', bg: 'Профил'},
        authProviderLabel: {en: 'Auth Provider', bg: 'Доставчик за автентикация'},
        memberSinceLabel: {en: 'Member Since', bg: 'Член от'},
        tabProfile: {en: 'Profile', bg: 'Профил'},
        tabPreferences: {en: 'Preferences', bg: 'Предпочитания'},
        usernameCardDescription: {en: 'Your unique username displayed across the platform.', bg: 'Вашето уникално потребителско име, показвано в платформата.'},
        usernamePlaceholder: {en: 'Enter your username', bg: 'Въведете потребителско име'},
        current: {en: 'Current:', bg: 'Текущо:'},
        bioCardTitle: {en: 'Bio', bg: 'Биография'},
        bioCardDescription: {en: 'Tell others a little about yourself.', bg: 'Разкажете на останалите малко за себе си.'},
        bioLabel: {en: 'Bio', bg: 'Биография'},
        bioPlaceholder: {en: 'Write a short bio...', bg: 'Напишете кратка биография...'},
        updating: {en: 'Updating...', bg: 'Обновяване...'},
        saveBio: {en: 'Save Bio', bg: 'Запази биография'},
        extendedCardTitle: {en: 'Extended Info', bg: 'Допълнителна информация'},
        extendedCardDescription: {en: 'Extra details shown on your public profile.', bg: 'Допълнителни детайли, показани в публичния ви профил.'},
        displayNameLabel: {en: 'Display name', bg: 'Име за показване'},
        displayNamePlaceholder: {en: 'Your full name', bg: 'Вашето пълно име'},
        locationLabel: {en: 'Location', bg: 'Местоположение'},
        locationPlaceholder: {en: 'City, Country', bg: 'Град, Държава'},
        websiteLabel: {en: 'Website', bg: 'Уебсайт'},
        twitterLabel: {en: 'Twitter / X handle', bg: 'Twitter / X потребител'},
        githubLabel: {en: 'GitHub handle', bg: 'GitHub потребител'},
        saving: {en: 'Saving...', bg: 'Запазване...'},
        saveInfo: {en: 'Save Info', bg: 'Запази информацията'},
        visibilityCardTitle: {en: 'Profile Visibility', bg: 'Видимост на профила'},
        visibilityCardDescription: {en: 'Control who can view your public profile page.', bg: 'Контролирайте кой може да вижда публичната ви профилна страница.'},
        publicProfile: {en: 'Public profile', bg: 'Публичен профил'},
        privateProfile: {en: 'Private profile', bg: 'Личен профил'},
        publicProfileDescription: {en: 'Anyone with the link can view your profile', bg: 'Всеки с линка може да вижда профила ви'},
        privateProfileDescription: {en: 'Only you can see your profile', bg: 'Само вие можете да виждате профила си'},
        publicUrl: {en: 'Public URL:', bg: 'Публичен URL:'},
        viewProfile: {en: 'View Profile', bg: 'Виж профила'},
        appearanceCardTitle: {en: 'Appearance', bg: 'Изглед'},
        appearanceCardDescription: {en: 'Customize how the application looks.', bg: 'Персонализирайте как изглежда приложението.'},
        darkMode: {en: 'Dark mode', bg: 'Тъмен режим'},
        darkModeDescription: {en: 'Toggle between light and dark themes', bg: 'Превключване между светла и тъмна тема'},
        languageDescription: {en: 'Switch the interface language', bg: 'Превключи езика на интерфейса'},
        notificationsCardTitle: {en: 'Notifications', bg: 'Известия'},
        notificationsCardDescription: {en: 'Configure your notification preferences.', bg: 'Конфигурирайте предпочитанията си за известия.'},
        emailNotifications: {en: 'Email notifications', bg: 'Имейл известия'},
        emailNotificationsDescription: {en: 'Receive updates via email', bg: 'Получавайте актуализации по имейл'},
        marketingEmails: {en: 'Marketing emails', bg: 'Маркетингови имейли'},
        marketingEmailsDescription: {en: 'Receive product updates and news', bg: 'Получавайте продуктови новини и актуализации'},
        dangerZone: {en: 'Danger Zone', bg: 'Опасна зона'},
        dangerZoneDescription: {
            en: 'Permanently delete your account and all associated data. This action cannot be undone.',
            bg: 'Перманентно изтрива профила ви и всички свързани данни. Това действие не може да бъде отменено.',
        },
        deleteAccount: {en: 'Delete Account', bg: 'Изтрий профила'},
        deleteAccountDescription: {
            en: 'Removes your profile, chat history, analytics, avatar, and authentication data.',
            bg: 'Премахва вашия профил, чат история, анализи, профилна снимка и данни за автентикация.',
        },
        deleteConfirmTitle: {en: 'Delete your account?', bg: 'Изтриване на профила?'},
        deleteConfirmDescription: {
            en: 'This will permanently delete your account ({email}), including your profile, chat conversations, analytics events, and uploaded files. This action cannot be undone.',
            bg: 'Това ще изтрие перманентно профила ви ({email}), включително профила, чат разговорите, събитията от анализите и качените файлове. Това действие не може да бъде отменено.',
        },
        deletingLabel: {en: 'Deleting...', bg: 'Изтриване...'},
        deleteMyAccount: {en: 'Delete my account', bg: 'Изтрий моя профил'},
        usernameEmptyError: {en: 'Username cannot be empty', bg: 'Потребителското име не може да бъде празно'},
        usernameSameInfo: {en: 'Username is the same', bg: 'Потребителското име е същото'},
        usernameUpdatedToast: {en: 'Username updated to {username}', bg: 'Потребителското име е обновено на {username}'},
        usernameUpdateFailed: {en: 'Failed to update username', bg: 'Неуспешно обновяване на потребителското име'},
        bioSameInfo: {en: 'Bio is the same', bg: 'Биографията е същата'},
        bioUpdatedToast: {en: 'Bio updated', bg: 'Биографията е обновена'},
        bioUpdateFailed: {en: 'Failed to update bio', bg: 'Неуспешно обновяване на биографията'},
        avatarUpdatedToast: {en: 'Profile picture updated', bg: 'Профилната снимка е обновена'},
        avatarUpdateFailed: {en: 'Failed to upload image', bg: 'Неуспешно качване на изображение'},
        profileInfoUpdatedToast: {en: 'Profile info updated', bg: 'Информацията за профила е обновена'},
        profileInfoUpdateFailed: {en: 'Failed to update', bg: 'Неуспешно обновяване'},
        profileNowPublic: {en: 'Profile is now public', bg: 'Профилът вече е публичен'},
        profileNowPrivate: {en: 'Profile is now private', bg: 'Профилът вече е личен'},
        profileNowPublicDescription: {en: 'Accessible at /users/{username}', bg: 'Достъпен на /users/{username}'},
        profileNowPrivateDescription: {en: 'Your profile is hidden from others', bg: 'Профилът ви е скрит от останалите'},
        visibilityUpdateFailed: {en: 'Failed to update visibility', bg: 'Неуспешно обновяване на видимостта'},
        failedToFetchProfile: {en: 'Failed to fetch profile', bg: 'Неуспешно зареждане на профила'},
    },
    speech: {
        notSupportedHttps: {
            en: 'Audio recording is not supported in this browser context (HTTPS required).',
            bg: 'Записването на аудио не се поддържа в този браузър (изисква се HTTPS).',
        },
        transcribeFailed: {en: 'Failed to transcribe audio', bg: 'Неуспешно транскрибиране на аудио'},
        transcriptionFailed: {en: 'Transcription failed', bg: 'Транскрибирането се провали'},
        processAudioFailed: {en: 'Failed to process audio', bg: 'Неуспешна обработка на аудио'},
        micPermissionDenied: {en: 'Microphone permission denied or audio device unavailable.', bg: 'Достъпът до микрофона е отказан или устройството не е достъпно.'},
        micAccessDenied: {
            en: 'Microphone access was denied. Please allow microphone permissions in your browser settings.',
            bg: 'Достъпът до микрофона беше отказан. Моля, разрешете достъп до микрофона в настройките на браузъра си.',
        },
        noMicFound: {en: 'No microphone device was found on this system.', bg: 'Не беше намерено микрофонно устройство на тази система.'},
        micInUse: {en: 'Microphone is currently in use by another application.', bg: 'Микрофонът се използва от друго приложение в момента.'},
        micRequiresHttps: {en: 'Microphone access requires a secure HTTPS connection or localhost.', bg: 'Достъпът до микрофона изисква защитена HTTPS връзка или localhost.'},
        speechRecognitionError: {en: 'Speech recognition error', bg: 'Грешка при разпознаване на реч'},
        noMicFoundOrNotWorking: {en: 'No microphone was found or microphone is not working.', bg: 'Не беше намерен микрофон или микрофонът не работи.'},
        networkErrorSpeech: {en: 'Network error occurred during speech recognition.', bg: 'Възникна мрежова грешка при разпознаването на реч.'},
    },
    upload: {
        allFiles: {en: 'All files', bg: 'Всички файлове'},
        sizeExceeds: {en: 'File size ({size}) exceeds the {limit} limit', bg: 'Размерът на файла ({size}) надвишава лимита от {limit}'},
        typeNotAllowed: {en: 'File type "{type}" is not allowed. Accepted: {accepted}', bg: 'Типът файл "{type}" не е разрешен. Приемат се: {accepted}'},
        extensionNotAllowed: {en: 'File extension "{ext}" is not allowed. Accepted: {accepted}', bg: 'Разширението "{ext}" не е разрешено. Приемат се: {accepted}'},
        clickToUpload: {en: 'Click to upload', bg: 'Кликнете за качване'},
        orDragAndDrop: {en: 'or drag and drop', bg: 'или пуснете файл тук'},
        maxLabel: {en: '{type} — Max {size}', bg: '{type} — Макс {size}'},
        noFileSelected: {en: 'No file selected', bg: 'Няма избран файл'},
        previewAlt: {en: 'Preview', bg: 'Преглед'},
        uploadingProgress: {en: 'Uploading... {percent}%', bg: 'Качване... {percent}%'},
        uploadComplete: {en: 'Upload complete', bg: 'Качването завърши'},
    },
    export: {
        nothingToExport: {en: 'Nothing to export', bg: 'Няма нищо за експортиране'},
        tableCopied: {en: 'Table copied to clipboard', bg: 'Таблицата е копирана в клипборда'},
        failedToCopy: {en: 'Failed to copy', bg: 'Неуспешно копиране'},
        downloaded: {en: 'Downloaded {filename}.csv', bg: 'Изтеглен {filename}.csv'},
        copyTableAriaLabel: {en: 'Copy table as CSV', bg: 'Копирай таблицата като CSV'},
        downloadAriaLabel: {en: 'Download {filename}.csv', bg: 'Изтегли {filename}.csv'},
        copyCsv: {en: 'Copy CSV', bg: 'Копирай CSV'},
        exportCsv: {en: 'Export CSV', bg: 'Експортирай CSV'},
        copiedToClipboard: {en: 'Copied to clipboard', bg: 'Копирано в клипборда'},
    },
    modal: {
        fieldRequired: {en: '{field} is required', bg: '{field} е задължително'},
        invalidEmail: {en: 'Please enter a valid email address', bg: 'Моля, въведете валиден имейл адрес'},
        invalidUrl: {en: 'Please enter a valid URL', bg: 'Моля, въведете валиден URL'},
        cropTitle: {en: 'Crop Your Profile Picture', bg: 'Изрежете профилната си снимка'},
        cropDescription: {
            en: 'Drag the square to select the area you want to use as your profile picture',
            bg: 'Преместете квадрата, за да изберете областта, която искате да използвате като профилна снимка',
        },
        uploading: {en: 'Uploading...', bg: 'Качване...'},
        cropAndUpload: {en: 'Crop & Upload', bg: 'Изрежи и качи'},
    },
    profile: {
        backToHome: {en: 'Back to Home', bg: 'Към началната страница'},
        userNotFound: {en: 'User not found', bg: 'Потребителят не е намерен'},
        noProfileFor: {en: 'No profile exists for', bg: 'Няма профил за'},
        profilePrivate: {en: 'This profile is private', bg: 'Този профил е личен'},
        profilePrivateDescription: {en: 'The user has set their profile to private:', bg: 'Потребителят е направил профила си личен:'},
        noBioYet: {en: 'No bio yet.', bg: 'Все още няма биография.'},
        memberFor: {en: 'Member for', bg: 'Член от'},
        socials: {en: 'Socials', bg: 'Социални мрежи'},
        aboutTitle: {en: 'About', bg: 'За профила'},
        publicProfileFooter: {
            en: 'Public profile · Only publicly shared information is displayed',
            bg: 'Публичен профил · Показва се само публично споделена информация',
        },
        daySuffix: {en: 'd', bg: 'д'},
        monthSuffix: {en: 'mo', bg: 'мес'},
        yearSuffix: {en: 'yr', bg: 'г'},
        // Added for apps/mobile's Profile tab.
        signInToSeeProfile: {en: 'Sign in to see your profile', bg: 'Впишете се, за да видите профила си'},
    },
    features: {
        heroTitle: {en: 'Powerful Features', bg: 'Мощни функции'},
        heroSubtitle: {en: 'Everything you need to build a production-ready application in record time.', bg: 'Всичко, от което се нуждаете, за да изградите продукционно приложение за рекордно време.'},
        newInVersion: {en: 'New in this version', bg: 'Ново в тази версия'},
        newInVersionDescription: {
            en: 'Dashboard analytics, AI chat with LaTeX math rendering, and 54 UI components ready to use.',
            bg: 'Анализи в таблото, AI чат с визуализация на LaTeX математика и 54 готови за използване UI компонента.',
        },
        tabCore: {en: 'Core', bg: 'Основни'},
        tabUi: {en: 'UI Components', bg: 'UI компоненти'},
        tabLibrary: {en: 'Component Library', bg: 'Библиотека компоненти'},
        tabUtilities: {en: 'Utilities', bg: 'Инструменти'},
        tabAi: {en: 'AI & Data', bg: 'AI и данни'},
        tabStarter: {en: 'Starter Kit', bg: 'Стартов пакет'},
        savingChanges: {en: 'Saving changes...', bg: 'Запазване на промените...'},

        authTitle: {en: 'Secure Authentication', bg: 'Сигурна автентикация'},
        authDesc: {en: 'Built-in Supabase authentication with email/password and OAuth', bg: 'Вградена Supabase автентикация с имейл/парола и OAuth'},
        authLi1: {en: 'Email/password + Google & GitHub OAuth', bg: 'Имейл/парола + Google & GitHub OAuth'},
        authLi2: {en: 'Protected routes with useAuth hook', bg: 'Защитени маршрути с useAuth hook'},
        authLi3: {en: 'Auto-redirect for unauthenticated users', bg: 'Автоматично пренасочване за невписани потребители'},
        authLi4: {en: 'User profile management', bg: 'Управление на потребителския профил'},

        stackTitle: {en: 'Modern Tech Stack', bg: 'Модерен технологичен стек'},
        stackDesc: {en: 'Built on the latest stable versions of modern tools', bg: 'Изграден на базата на най-новите стабилни версии на модерни инструменти'},
        stackLi1: {en: 'Next.js 16.3 with App Router', bg: 'Next.js 16.3 с App Router'},
        stackLi2: {en: 'React 19 & TypeScript 5.7', bg: 'React 19 и TypeScript 5.7'},
        stackLi3: {en: 'Tailwind CSS v4 (CSS-first config)', bg: 'Tailwind CSS v4 (CSS-first конфигурация)'},
        stackLi4: {en: 'Lenis smooth scrolling', bg: 'Плавно превъртане с Lenis'},

        geminiTitle: {en: 'Google Gemini AI', bg: 'Google Gemini AI'},
        geminiDesc: {en: 'Free-tier AI with conversational memory', bg: 'Безплатен AI с памет за разговора'},
        geminiLi1: {en: 'Multi-turn chat with history', bg: 'Многоходов чат с история'},
        geminiLi2: {en: 'Per-user conversation persistence', bg: 'Запазване на разговорите за всеки потребител'},
        geminiLi3: {en: 'Markdown & LaTeX math support', bg: 'Поддръжка на Markdown и LaTeX математика'},
        geminiLi4: {en: 'Guardrails against prompt injection', bg: 'Защита срещу prompt injection'},

        supabaseTitle: {en: 'Supabase Backend', bg: 'Supabase Backend'},
        supabaseDesc: {en: 'PostgreSQL database with Row Level Security', bg: 'PostgreSQL база данни с Row Level Security'},
        supabaseLi1: {en: 'Real-time database triggers', bg: 'Тригери на база данни в реално време'},
        supabaseLi2: {en: 'Row Level Security (RLS) policies', bg: 'Политики за Row Level Security (RLS)'},
        supabaseLi3: {en: 'Avatar file storage bucket', bg: 'Хранилище за профилни снимки'},
        supabaseLi4: {en: 'Analytics event logging', bg: 'Регистриране на анализ събития'},

        prodTitle: {en: 'Production Ready', bg: 'Готов за продукция'},
        prodDesc: {en: 'Containerized and ready for any cloud platform', bg: 'Контейнеризиран и готов за всяка облачна платформа'},
        prodLi1: {en: 'Multi-stage Dockerfile', bg: 'Многоетапен Dockerfile'},
        prodLi2: {en: 'Docker Compose configuration', bg: 'Docker Compose конфигурация'},
        prodLi3: {en: 'Health check endpoints', bg: 'Health check крайни точки'},
        prodLi4: {en: 'Standalone Next.js output', bg: 'Самостоятелен Next.js изход'},

        shadcnTitle: {en: 'shadcn/ui Components', bg: 'shadcn/ui компоненти'},
        shadcnDesc: {en: 'Full component library — 24 core + 30 extended', bg: 'Пълна библиотека компоненти — 24 основни + 30 разширени'},

        modalSystemTitle: {en: 'Modal System', bg: 'Система за модали'},
        modalSystemDesc: {en: 'Animated modals with templates and form validation', bg: 'Анимирани модали с шаблони и валидация на формуляри'},
        tryThemLive: {en: 'Try them live:', bg: 'Изпробвайте ги на живо:'},
        modalTemplatesIntro: {en: '5 ready-to-use templates with built-in validation. Try them live:', bg: '5 готови за използване шаблона с вградена валидация. Изпробвайте ги на живо:'},
        basic: {en: 'Basic', bg: 'Базов'},
        form: {en: 'Form', bg: 'Формуляр'},
        default: {en: 'Default', bg: 'По подразбиране'},
        destructive: {en: 'Destructive', bg: 'Деструктивен'},

        toastTitle: {en: 'Toast Notifications', bg: 'Toast известия'},
        toastDesc: {en: 'Compact, auto-dismissing toasts powered by Sonner', bg: 'Компактни известия със самостоятелно затваряне, задвижвани от Sonner'},
        toastVariantsIntro: {en: '4 variants with developer-configurable corner placement. Try them live:', bg: '4 варианта с конфигурируемо от разработчика ъглово разположение. Изпробвайте ги на живо:'},

        themingTitle: {en: 'Dark Mode & Theming', bg: 'Тъмен режим и теми'},
        themingDesc: {en: 'CSS-first Tailwind v4 with HSL variables', bg: 'CSS-first Tailwind v4 с HSL променливи'},
        themingLi1: {en: 'Class-based dark mode toggle', bg: 'Превключване на тъмен режим чрез клас'},
        themingLi2: {en: 'HSL CSS custom properties', bg: 'Персонализирани HSL CSS свойства'},
        themingLi3: {en: 'Consistent design tokens', bg: 'Последователни дизайн токени'},
        themingLi4: {en: 'Easy to customize', bg: 'Лесно персонализиране'},

        patternsTitle: {en: 'Component Patterns', bg: 'Шаблони на компонентите'},
        patternsDesc: {en: 'CVA + Radix UI + forwardRef', bg: 'CVA + Radix UI + forwardRef'},
        patternsLi1: {en: 'Class Variance Authority for variants', bg: 'Class Variance Authority за варианти'},
        patternsLi2: {en: 'Radix UI for accessibility', bg: 'Radix UI за достъпност'},
        patternsLi3: {en: 'React.forwardRef throughout', bg: 'React.forwardRef навсякъде'},
        patternsLi4: {en: 'cn() utility for merging', bg: 'cn() помощна функция за обединяване'},

        libraryIntroPre: {en: 'Interactive previews of components from ', bg: 'Интерактивни визуализации на компоненти от '},
        libraryIntroPost: {en: '. All ready to import and use.', bg: '. Всички готови за импортиране и използване.'},
        codeBlockTitle: {en: 'Code Block', bg: 'Code Block'},
        codeBlockDesc: {
            en: 'Header composition with filename label, detected language icons, line numbers, diff annotations, and copy-to-clipboard button',
            bg: 'Заглавие с етикет на файла, икони за открития език, номера на редове, diff анотации и бутон за копиране',
        },
        notificationCardsTitle: {en: 'Notification Cards & Feed', bg: 'Карти и емисия за известия'},
        notificationCardsDesc: {
            en: 'Interactive notification list with unread pulse indicators, avatar image/fallback, animated dismiss, status accents, and action shortcuts',
            bg: 'Интерактивен списък с известия с пулсиращи индикатори за непрочетени, профилна снимка/резервен вариант, анимирано затваряне, статусни акценти и преки пътища за действия',
        },
        mapTitle: {en: 'OpenStreetMap & Custom Vector Pins', bg: 'OpenStreetMap и персонализирани векторни пинове'},
        mapDesc: {
            en: 'Free OpenStreetMap Leaflet engine with custom color-coded vector pins, pulsing halos, rich popup details, category filtering, search, and layer switcher. Fully read-only for end-users and effortlessly configured via code props.',
            bg: 'Безплатен OpenStreetMap Leaflet двигател с персонализирани цветово кодирани векторни пинове, пулсиращи ореоли, подробни изскачащи прозорци, филтриране по категория, търсене и превключвател на слоеве. Напълно само за преглед за крайните потребители и лесно конфигурируем чрез code props.',
        },
        accordionTitle: {en: 'Accordion', bg: 'Акордеон'},
        accordionDesc: {en: 'Expandable content sections', bg: 'Разгъваеми секции с съдържание'},
        alertDialogTitle: {en: 'Alert Dialog', bg: 'Диалог за предупреждение'},
        alertDialogDesc: {en: 'Confirmation dialogs with cancel/action', bg: 'Диалози за потвърждение с отказ/действие'},
        checkboxRadioTitle: {en: 'Checkbox & Radio Group', bg: 'Чекбокс и радио група'},
        checkboxRadioDesc: {en: 'Selection controls for forms', bg: 'Контроли за избор във формуляри'},
        sliderTitle: {en: 'Slider', bg: 'Слайдер'},
        sliderDesc: {en: 'Range input with thumb control', bg: 'Въвеждане на диапазон с плъзгач'},
        sheetTitle: {en: 'Sheet', bg: 'Странично меню'},
        sheetDesc: {en: 'Slide-out panel from any edge', bg: 'Плъзгащ се панел от всеки край'},
        popoverHoverTitle: {en: 'Popover & Hover Card', bg: 'Popover и Hover карта'},
        popoverHoverDesc: {en: 'Floating content on click or hover', bg: 'Плаващо съдържание при клик или задържане'},
        commandTitle: {en: 'Command', bg: 'Команден палет'},
        commandDesc: {en: 'Searchable command palette', bg: 'Команден палет с търсене'},
        otpTitle: {en: 'Input OTP', bg: 'OTP въвеждане'},
        otpDesc: {en: 'One-time password input fields', bg: 'Полета за еднократна парола'},
        tableTitle: {en: 'Table', bg: 'Таблица'},
        tableDesc: {en: 'Styled data tables', bg: 'Стилизирани таблици с данни'},
        paginationTitle: {en: 'Pagination', bg: 'Пагинация'},
        paginationDesc: {en: 'Page navigation controls', bg: 'Контроли за навигация между страници'},
        drawerTitle: {en: 'Drawer', bg: 'Чекмедже'},
        drawerDesc: {en: 'Bottom sheet for mobile-friendly actions', bg: 'Долно меню за мобилно удобни действия'},
        calendarTitle: {en: 'Calendar', bg: 'Календар'},
        calendarDesc: {en: 'Date picker with month navigation', bg: 'Избор на дата с навигация по месеци'},
        carouselTitle: {en: 'Carousel', bg: 'Карусел'},
        carouselDesc: {en: 'Embla-powered slide carousel', bg: 'Карусел задвижван от Embla'},
        resizableTitle: {en: 'Resizable', bg: 'Преоразмеряващи панели'},
        resizableDesc: {en: 'Drag-to-resize panel groups', bg: 'Групи панели с преоразмеряване чрез влачене'},
        switchProgressTitle: {en: 'Switch, Progress & Select', bg: 'Превключвател, прогрес и избор'},
        switchProgressDesc: {en: 'Form controls and indicators', bg: 'Контроли и индикатори за формуляри'},
        tooltipKbdTitle: {en: 'Tooltip & Kbd', bg: 'Подсказка и клавишни комбинации'},
        tooltipKbdDesc: {en: 'Hover hints and keyboard shortcut badges', bg: 'Подсказки при задържане и значки за клавишни комбинации'},
        skeletonSpinnerTitle: {en: 'Skeleton & Spinner', bg: 'Скелет и спинер'},
        skeletonSpinnerDesc: {en: 'Loading state placeholders', bg: 'Плейсхолдъри за състояние на зареждане'},
        inputTextareaTitle: {en: 'Input & Textarea', bg: 'Поле за въвеждане и текстова област'},
        inputTextareaDesc: {en: 'Text input fields', bg: 'Текстови полета за въвеждане'},
        alsoAvailableTitle: {en: 'Also Available', bg: 'Също налични'},
        alsoAvailableDesc: {en: 'More components ready to import', bg: 'Още компоненти, готови за импортиране'},

        utilitiesIntro: {
            en: 'Hackathon-ready utilities for smooth scrolling, search, clipboard, notifications, forms, loading states, and responsive layouts.',
            bg: 'Готови за хакатон инструменти за плавно превъртане, търсене, клипборд, известия, формуляри, състояния на зареждане и адаптивни оформления.',
        },
        lenisTitle: {en: 'Lenis Smooth Scrolling', bg: 'Плавно превъртане с Lenis'},
        lenisDesc: {
            en: 'Inertia-driven smooth wheel scrolling powered by Lenis. Toggle on/off to compare native vs smooth scroll feel instantly.',
            bg: 'Плавно превъртане с инерция, задвижвано от Lenis. Превключете за да сравните усещането на нативно и плавно превъртане веднага.',
        },
        lenisActive: {en: 'Active (Lenis Physics)', bg: 'Активно (Lenis физика)'},
        lenisDisabled: {en: 'Disabled (Native Scroll)', bg: 'Деактивирано (нативно превъртане)'},
        lenisStatusOn: {en: 'Smooth Wheel ON', bg: 'Плавно превъртане ВКЛ'},
        lenisStatusOff: {en: 'Native Scroll', bg: 'Нативно превъртане'},
        lenisOnDescription: {en: 'Mouse wheel scrolls with fluid acceleration and dampening easing.', bg: 'Колелцето на мишката превърта с плавно ускорение и затихващо изглаждане.'},
        lenisOffDescription: {en: 'Default browser step-scrolling is active.', bg: 'Активно е стандартното стъпкообразно превъртане на браузъра.'},

        searchFilterTitle: {en: 'Search & Filter', bg: 'Търсене и филтриране'},
        searchFilterDesc: {en: 'Debounced text filtering with useSearch hook', bg: 'Текстово филтриране с забавяне чрез useSearch hook'},
        clipboardTitle: {en: 'Copy to Clipboard', bg: 'Копиране в клипборда'},
        clipboardDesc: {en: 'One-click copy with toast confirmation', bg: 'Копиране с един клик и toast потвърждение'},
        notifyTitle: {en: 'Global Notify', bg: 'Глобални известия'},
        notifyDesc: {en: 'One-line notifications from anywhere — no hooks needed', bg: 'Еднолинейни известия отвсякъде — без нужда от hooks'},
        loadingEmptyTitle: {en: 'Loading & Empty States', bg: 'Състояния на зареждане и празни данни'},
        loadingEmptyDesc: {en: 'Skeleton presets and empty data placeholders', bg: 'Готови скелети и плейсхолдъри за празни данни'},
        layoutHelpersTitle: {en: 'Layout Helpers', bg: 'Помощни средства за оформление'},
        layoutHelpersDesc: {en: 'Container, Grid, Row, Stack, Center, SpaceBetween', bg: 'Container, Grid, Row, Stack, Center, SpaceBetween'},
        formValidationTitle: {en: 'Form Validation', bg: 'Валидация на формуляри'},
        formValidationDesc: {en: 'useFormValidation hook — try submitting empty or invalid', bg: 'useFormValidation hook — опитайте да изпратите празен или невалиден формуляр'},

        aiChatTitle: {en: 'AI Chat', bg: 'AI Чат'},
        aiChatDesc: {en: 'Built-in AI chat powered by Google Gemini', bg: 'Вграден AI чат, захранван от Google Gemini'},
        aiChatLi1: {en: 'Multi-turn conversations', bg: 'Многоходови разговори'},
        aiChatLi2: {en: 'Per-user chat history', bg: 'История на чата за всеки потребител'},
        aiChatLi3: {en: 'LaTeX math rendering', bg: 'Визуализация на LaTeX математика'},
        aiChatLi4: {en: 'Markdown support', bg: 'Поддръжка на Markdown'},

        dashboardAnalyticsTitle: {en: 'Dashboard Analytics', bg: 'Анализи в таблото'},
        dashboardAnalyticsDesc: {en: 'Real-time usage stats and activity tracking', bg: 'Статистика за използване и следене на активността в реално време'},
        dashboardAnalyticsLi1: {en: 'Interactive charts (Recharts)', bg: 'Интерактивни графики (Recharts)'},
        dashboardAnalyticsLi2: {en: 'Event logging system', bg: 'Система за регистриране на събития'},
        dashboardAnalyticsLi3: {en: 'Activity feed', bg: 'Емисия с активност'},
        dashboardAnalyticsLi4: {en: 'Profile completeness tracking', bg: 'Следене на завършеността на профила'},

        customHooksTitle: {en: 'Custom Hooks', bg: 'Персонализирани Hooks'},
        customHooksDesc: {en: 'Ready-to-use hooks for common patterns', bg: 'Готови за използване hooks за чести шаблони'},

        starterIntro: {
            en: 'Hackathon essentials — responsive utilities, error boundaries, lightweight state, and demo data to start building instantly.',
            bg: 'Хакатон essentials — адаптивни инструменти, error boundaries, лекотегловно състояние и демо данни за незабавно начало.',
        },
        responsiveUtilityTitle: {en: 'Responsive Utility', bg: 'Адаптивен инструмент'},
        responsiveUtilityDesc: {en: 'useMediaQuery hook with Tailwind breakpoint helpers', bg: 'useMediaQuery hook с помощни функции за Tailwind breakpoints'},
        asyncBoundaryTitle: {en: 'AsyncBoundary', bg: 'AsyncBoundary'},
        asyncBoundaryDesc: {en: 'Suspense + ErrorBoundary in one wrapper', bg: 'Suspense + ErrorBoundary в един обвивка'},
        storeTitle: {en: 'Lightweight Store', bg: 'Лекотегловно хранилище'},
        storeDesc: {en: 'createSimpleStore — typed state with zero dependencies', bg: 'createSimpleStore — типизирано състояние без зависимости'},
        demoDataTitle: {en: 'Demo Data', bg: 'Демо данни'},
        demoDataDesc: {en: 'Mock data + SQL seed script for instant prototyping', bg: 'Примерни данни + SQL скрипт за незабавно прототипиране'},
        teamMembersTitle: {en: 'Team Members', bg: 'Членове на екипа'},
        teamMembersDesc: {en: 'Sample team data with status indicators', bg: 'Примерни данни за екип с индикатори за статус'},
        notificationsDataTitle: {en: 'Notifications', bg: 'Известия'},
        notificationsDataDesc: {en: 'Sample notification feed data', bg: 'Примерни данни за емисия с известия'},
        searchSortTitle: {en: 'Search + Sort', bg: 'Търсене и сортиране'},
        searchSortDesc: {en: 'useSearch with optional sort — filter and order any list', bg: 'useSearch с опционално сортиране — филтриране и подреждане на всеки списък'},
        exportButtonTitle: {en: 'Export Button', bg: 'Бутон за експорт'},
        exportButtonDesc: {en: 'Download or copy table data as CSV', bg: 'Изтегляне или копиране на данни от таблица като CSV'},
        loadingIndicatorsTitle: {en: 'Loading Indicators', bg: 'Индикатори за зареждане'},
        loadingIndicatorsDesc: {en: 'TopLoader, OverlayLoader, and InlineLoader', bg: 'TopLoader, OverlayLoader и InlineLoader'},
        responsiveGridTitle: {en: 'Responsive Grid', bg: 'Адаптивна мрежа'},
        responsiveGridDescPrefix: {en: 'Breakpoint-based columns: ', bg: 'Колони базирани на breakpoint: '},

        ctaTitle: {en: 'Ready to Get Started?', bg: 'Готови сте да започнете?'},
        ctaSubtitle: {en: 'Fork the template and start building your next project.', bg: 'Форкнете шаблона и започнете да изграждате следващия си проект.'},
        learnMore: {en: 'Learn More', bg: 'Научи повече'},
        devTip: {en: 'Developer tip', bg: 'Съвет за разработчици'},

        basicModalTitle: {en: 'Basic Modal', bg: 'Базов модал'},
        basicModalDesc: {
            en: 'The base modal component with header, body, footer, and close button. Supports 5 sizes (sm, md, lg, xl, full) and 2 positions (center, top).',
            bg: 'Базовият modal компонент с заглавие, тяло, футър и бутон за затваряне. Поддържа 5 размера (sm, md, lg, xl, full) и 2 позиции (център, горе).',
        },
        declarativeTitle: {en: 'Declarative', bg: 'Декларативен'},
        declarativeDesc: {en: 'Use Modal + useModal hook for full control.', bg: 'Използвайте Modal + useModal hook за пълен контрол.'},
        programmaticTitle: {en: 'Programmatic', bg: 'Програмен'},
        programmaticDesc: {en: 'ModalProvider + useModalContext for confirm/alert.', bg: 'ModalProvider + useModalContext за потвърждение/предупреждение.'},
        templatesTitle: {en: 'Templates', bg: 'Шаблони'},
        templatesDesc: {en: 'FormModal, InfoModal, SuccessModal, ErrorModal, ConfirmModal.', bg: 'FormModal, InfoModal, SuccessModal, ErrorModal, ConfirmModal.'},
        accessibleTitle: {en: 'Accessible', bg: 'Достъпен'},
        accessibleDesc: {en: 'Focus trap, Escape key, ARIA attributes, scroll lock.', bg: 'Focus trap, клавиш Escape, ARIA атрибути, заключване на превъртането.'},

        createAccountTitle: {en: 'Create Account', bg: 'Създай профил'},
        createAccountDesc: {en: 'Fill in the fields below. Required fields are marked with *.', bg: 'Попълнете полетата по-долу. Задължителните полета са маркирани с *.'},
        create: {en: 'Create', bg: 'Създай'},
        fullNameLabel: {en: 'Full Name', bg: 'Пълно име'},
        passwordMinLength: {en: 'Password must be at least 6 characters', bg: 'Паролата трябва да е поне 6 символа'},

        howItWorksTitle: {en: 'How it works', bg: 'Как работи'},
        howItWorksDesc: {
            en: 'The modal system includes 5 pre-built templates for common UI patterns: forms, confirmations, info, success, and error states.',
            bg: 'Системата за модали включва 5 готови шаблона за чести UI модели: формуляри, потвърждения, информация, успех и грешка.',
        },
        actionCompletedTitle: {en: 'Action completed', bg: 'Действието завърши'},
        actionCompletedDesc: {en: 'Your changes have been saved successfully.', bg: 'Промените ви бяха запазени успешно.'},
        somethingWrongTitle: {en: 'Something went wrong', bg: 'Нещо се обърка'},
        somethingWrongDesc: {en: 'Could not complete the operation. Please try again later.', bg: 'Операцията не можа да бъде завършена. Моля, опитайте отново по-късно.'},
        areYouSureTitle: {en: 'Are you sure?', bg: 'Сигурни ли сте?'},
        areYouSureDesc: {en: 'This action cannot be undone. This will permanently delete your data.', bg: 'Това действие не може да бъде отменено. Това ще изтрие перманентно вашите данни.'},
        devTipPre: {en: 'To add a new page, create a folder in ', bg: 'За да добавите нова страница, създайте папка в '},
        devTipMid: {en: ' with a ', bg: ' с файл '},
        devTipPost: {en: " file. It's automatically routed by Next.js App Router.", bg: '. Автоматично се маршрутизира от Next.js App Router.'},
    },
    home: {
        title: {en: 'Build Your Next Hackathon Project', bg: 'Изградете своя следващ хакатон проект'},
        subtitle: {
            en: 'A minimal Next.js template with authentication, dark mode, and modern UI components. Start building in minutes, not hours.',
            bg: 'Минималистичен Next.js шаблон с автентикация, тъмен режим и модерни UI компоненти. Започнете да изграждате за минути, не часове.',
        },
        getStarted: {en: 'Get Started', bg: 'Започнете'},
        welcomeBack: {en: 'Welcome back, {name}!', bg: 'Добре дошли отново, {name}!'},
        goToDashboard: {en: 'Go to Dashboard', bg: 'Към таблото'},
        featureAuthTitle: {en: 'Authentication', bg: 'Автентикация'},
        featureAuthDescription: {en: 'Supabase auth with email/password ready to go', bg: 'Supabase автентикация с имейл/парола, готова за използване'},
        featureUiTitle: {en: 'Modern UI', bg: 'Модерен UI'},
        featureUiDescription: {en: 'shadcn/ui components with TailwindCSS styling', bg: 'shadcn/ui компоненти със стилизиране от TailwindCSS'},
        featureAiTitle: {en: 'AI Powered', bg: 'AI Възможности'},
        featureAiDescription: {en: 'Built-in AI chat powered by Google Gemini', bg: 'Вграден AI чат, захранван от Google Gemini'},
    },
    // Added for apps/mobile — screens/copy with no web equivalent (web's
    // landing page is marketing content mobile doesn't have a page for).
    mobile: {
        homeWelcome: {en: 'Welcome', bg: 'Добре дошли'},
        homeSubtitle: {en: 'What would you like to do today?', bg: 'Какво искате да направите днес?'},
    },
} satisfies StringTree

export type Dictionary = Localized<typeof strings>

export const dictionaries: Record<Locale, Dictionary> = {
    en: pickLocale(strings, 'en'),
    bg: pickLocale(strings, 'bg'),
}

/** Fills `{placeholders}` in a translated string, e.g. tFormat(t.home.welcomeBack, {name: 'Alex'}). */
export function tFormat(template: string, vars: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match))
}
