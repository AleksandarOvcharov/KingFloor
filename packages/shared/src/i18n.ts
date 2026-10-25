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
        currencySymbol: {en: '€', bg: '€'},
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
        building: {en: 'My Building', bg: 'Моята сграда'},
    },
    map: {
        loadingInteractiveMap: {en: 'Loading interactive map...', bg: 'Зареждане на интерактивна карта...'},
    },
    status: {
        label: {en: 'Status', bg: 'Статус'},
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
    home: {
        title: {en: 'Run Your Building, Not Spreadsheets', bg: 'Управлявайте етажната собственост лесно'},
        subtitle: {
            en: 'KingFloor is where your building manages fees, announcements, votes, and maintenance — all in one place.',
            bg: 'KingFloor е платформата, в която сградата ви управлява такси, обявления, гласувания и ремонти — всичко на едно място.',
        },
        getStarted: {en: 'Get Started', bg: 'Започнете'},
        welcomeBack: {en: 'Welcome back, {name}!', bg: 'Добре дошли отново, {name}!'},
        goToDashboard: {en: 'Go to My Building', bg: 'Към моята сграда'},
        featureAuthTitle: {en: 'Fees & Payments', bg: 'Такси и плащания'},
        featureAuthDescription: {en: 'Generate monthly fees per apartment and track who has paid', bg: 'Генерирайте месечни такси по апартамент и следете кой е платил'},
        featureUiTitle: {en: 'Announcements & Voting', bg: 'Обявления и гласувания'},
        featureUiDescription: {en: 'Share building news and run decisions by one vote per apartment', bg: 'Споделяйте новини и вземайте решения с един глас на апартамент'},
        featureAiTitle: {en: 'Maintenance Requests', bg: 'Ремонти'},
        featureAiDescription: {en: 'Residents report issues, the building manager tracks them to resolved', bg: 'Живущите докладват проблеми, домоуправителят следи до решаването им'},
    },
    // Added for apps/mobile — screens/copy with no web equivalent (web's
    // landing page is marketing content mobile doesn't have a page for).
    mobile: {
        homeWelcome: {en: 'Welcome', bg: 'Добре дошли'},
        homeSubtitle: {en: 'What would you like to do today?', bg: 'Какво искате да направите днес?'},
    },
    // KingFloor domain — управление на етажна собственост. Shared by both
    // apps the moment mobile grows its own /building screens; web is first.
    building: {
        navOverview: {en: 'Dashboard', bg: 'Табло'},
        navUnits: {en: 'House Register', bg: 'Домова книга'},
        navFees: {en: 'Fees', bg: 'Такси'},
        navExpenses: {en: 'Expenses', bg: 'Разходи'},
        navAnnouncements: {en: 'Announcements', bg: 'Обявления'},
        navChat: {en: 'Chat', bg: 'Чат'},
        navPolls: {en: 'Voting', bg: 'Гласувания'},
        navIssues: {en: 'Maintenance', bg: 'Ремонти'},

        roleAdmin: {en: 'Building manager', bg: 'Домоуправител'},
        roleResident: {en: 'Resident', bg: 'Живущ'},

        navSettings: {en: 'Settings', bg: 'Настройки'},
        settingsTitle: {en: 'Building settings', bg: 'Настройки на сградата'},
        settingsDescription: {en: 'Edit your building’s details.', bg: 'Редактирайте данните на сградата си.'},
        ibanLabel: {en: 'IBAN (for bank transfers)', bg: 'IBAN (за банкови преводи)'},
        ibanPlaceholder: {en: 'BG00XXXX00000000000000', bg: 'BG00XXXX00000000000000'},
        ibanHint: {en: 'Shown to residents on the Fees page so they know where to transfer money.', bg: 'Показва се на живущите в страница Такси, за да знаят къде да превеждат пари.'},
        settingsSaved: {en: 'Saved', bg: 'Запазено'},

        setupTitle: {en: 'Set up your building', bg: 'Настройте своята сграда'},
        setupDescription: {en: 'Create your building to start managing fees, announcements, voting and maintenance requests.', bg: 'Създайте сградата си, за да управлявате такси, обявления, гласувания и ремонти.'},
        setupNameLabel: {en: 'Building name', bg: 'Име на сградата'},
        setupNamePlaceholder: {en: 'e.g. Bl. 25, ж.к. Младост 1', bg: 'напр. Бл. 25, ж.к. Младост 1'},
        setupAddressLabel: {en: 'Address', bg: 'Адрес'},
        setupAddressPlaceholder: {en: 'Street, number, city', bg: 'Улица, номер, град'},
        setupSubmit: {en: 'Create building', bg: 'Създай сграда'},
        needUnitToVote: {en: 'You need an apartment assigned to vote. Ask your building manager.', bg: 'За да гласувате, трябва да имате зачислен апартамент. Обърнете се към домоуправителя.'},

        setupTabCreate: {en: "I'm the building manager", bg: 'Аз съм домоуправител'},
        setupTabJoin: {en: "I'm a resident", bg: 'Аз съм живущ'},
        inviteCodeLabel: {en: 'Invite code', bg: 'Код за присъединяване'},
        inviteCodeHint: {en: 'Share this code with your residents so they can join.', bg: 'Споделете този код с живущите, за да могат да се присъединят.'},
        copyCode: {en: 'Copy code', bg: 'Копирай кода'},
        codeCopied: {en: 'Code copied', bg: 'Кодът е копиран'},
        joinTitle: {en: 'Join your building', bg: 'Присъединете се към сградата си'},
        joinDescription: {en: "Enter the invite code your building manager shared with you, then pick your apartment.", bg: 'Въведете кода, който домоуправителят ви е споделил, след което изберете своя апартамент.'},
        joinCodeLabel: {en: 'Invite code', bg: 'Код за присъединяване'},
        joinCodePlaceholder: {en: 'e.g. A3F9K2', bg: 'напр. A3F9K2'},
        findBuilding: {en: 'Find building', bg: 'Намери сграда'},
        selectUnitLabel: {en: 'Your apartment', bg: 'Вашият апартамент'},
        noUnitsAvailable: {en: 'No free apartments left — ask your building manager to add yours.', bg: 'Няма свободни апартаменти — поискайте от домоуправителя да добави вашия.'},
        joinSubmit: {en: 'Join as resident', bg: 'Присъедини се като живущ'},
        changeCode: {en: 'Use a different code', bg: 'Използвай друг код'},

        statOutstandingFees: {en: 'Outstanding fees', bg: 'Неплатени такси'},
        statOpenIssues: {en: 'Open issues', bg: 'Отворени ремонти'},
        statActivePolls: {en: 'Active votes', bg: 'Активни гласувания'},
        statAnnouncements: {en: 'Announcements', bg: 'Обявления'},
        myUnit: {en: 'My unit', bg: 'Моят апартамент'},

        unitsTitle: {en: 'Units', bg: 'Апартаменти'},
        noUnitsYet: {en: 'No units added yet.', bg: 'Все още няма добавени апартаменти.'},
        addUnit: {en: 'Add unit', bg: 'Добави апартамент'},
        editUnit: {en: 'Edit unit', bg: 'Редактирай апартамент'},
        deleteUnit: {en: 'Delete unit', bg: 'Изтрий апартамент'},
        deleteUnitConfirmTitle: {en: 'Delete this apartment?', bg: 'Изтриване на апартамента?'},
        deleteUnitConfirmDescription: {
            en: 'This permanently deletes apartment {number} along with its fee and vote history. Any assigned resident will lose this apartment and need to be reassigned.',
            bg: 'Апартамент {number} ще бъде изтрит перманентно заедно с историята на таксите и гласуванията му. Ако има зачислен живущ, той ще загуби апартамента и ще трябва да бъде зачислен отново.',
        },
        unitNumberLabel: {en: 'Apartment no.', bg: 'Апартамент №'},
        unitFloorLabel: {en: 'Floor', bg: 'Етаж'},
        unitAreaLabel: {en: 'Area (m²)', bg: 'Площ (кв.м)'},
        unitResident: {en: 'Resident', bg: 'Живущ'},
        unitNoResident: {en: 'No resident assigned', bg: 'Няма зачислен живущ'},
        addMember: {en: 'Assign resident', bg: 'Зачисли живущ'},
        removeResident: {en: 'Remove', bg: 'Премахни'},
        removeResidentConfirmTitle: {en: 'Remove this resident?', bg: 'Премахване на живущия?'},
        removeResidentConfirmDescription: {
            en: '{name} will lose access to this building and will need a new invite code to rejoin.',
            bg: '{name} ще загуби достъп до тази сграда и ще трябва нов код за покана, за да се присъедини отново.',
        },
        memberEmailLabel: {en: 'Resident email', bg: 'Имейл на живущия'},
        memberEmailHint: {en: 'They must already have an account on this platform.', bg: 'Трябва вече да имат регистрация в платформата.'},
        myUnitTitle: {en: 'My apartment', bg: 'Моят апартамент'},

        feesTitle: {en: 'Fees & payments', bg: 'Такси и плащания'},
        generateFees: {en: 'Generate monthly fees', bg: 'Генерирай месечни такси'},
        periodLabel: {en: 'Month', bg: 'Месец'},
        amountModeLabel: {en: 'Amount', bg: 'Сума'},
        amountModeFixed: {en: 'Fixed amount per unit', bg: 'Фиксирана сума на апартамент'},
        amountModePerSqm: {en: 'Per m² of area', bg: 'На кв.м площ'},
        amountLabel: {en: 'Amount (EUR)', bg: 'Сума (€)'},
        dueDateLabel: {en: 'Due date', bg: 'Срок за плащане'},
        feeStatusUnpaid: {en: 'Unpaid', bg: 'Неплатена'},
        feeStatusPaid: {en: 'Paid', bg: 'Платена'},
        feeStatusOverdue: {en: 'Overdue', bg: 'Просрочена'},
        markPaid: {en: 'Mark as paid', bg: 'Отбележи като платена'},
        markUnpaid: {en: 'Mark as unpaid', bg: 'Отбележи като неплатена'},
        payMethodCash: {en: 'Cash', bg: 'В брой'},
        payMethodBankTransfer: {en: 'Bank transfer', bg: 'Банков превод'},
        totalCollected: {en: 'Collected', bg: 'Събрани'},
        totalOutstanding: {en: 'Outstanding', bg: 'Дължими'},
        noFeesYet: {en: 'No fees generated yet.', bg: 'Все още няма генерирани такси.'},

        announcementsTitle: {en: 'Announcements', bg: 'Обявления'},
        newAnnouncement: {en: 'New announcement', bg: 'Ново обявление'},
        announcementTitleLabel: {en: 'Title', bg: 'Заглавие'},
        announcementBodyLabel: {en: 'Message', bg: 'Съобщение'},
        pinAnnouncement: {en: 'Pin to top', bg: 'Закачи най-горе'},
        unpinAnnouncement: {en: 'Unpin', bg: 'Откачи'},
        pinnedBadge: {en: 'Pinned', bg: 'Закачено'},
        editAnnouncement: {en: 'Edit announcement', bg: 'Редактирай обявление'},
        deleteAnnouncementConfirmTitle: {en: 'Delete this announcement?', bg: 'Изтриване на обявлението?'},
        deleteAnnouncementConfirmDescription: {en: 'This cannot be undone.', bg: 'Това действие не може да бъде отменено.'},
        noAnnouncementsYet: {en: 'No announcements yet.', bg: 'Все още няма обявления.'},

        pollsTitle: {en: 'Voting', bg: 'Гласувания'},
        newPoll: {en: 'New vote', bg: 'Ново гласуване'},
        pollTitleLabel: {en: 'Question', bg: 'Въпрос'},
        pollOptionsLabel: {en: 'Options', bg: 'Опции'},
        addOption: {en: 'Add option', bg: 'Добави опция'},
        castVote: {en: 'Vote', bg: 'Гласувай'},
        changeVote: {en: 'Change vote', bg: 'Промени гласа'},
        confirmVotePrompt: {en: 'Confirm your vote', bg: 'Потвърдете гласа си'},
        biometricAuthFailed: {en: 'Authentication failed — vote not cast.', bg: 'Удостоверяването не бе успешно — гласът не е подаден.'},
        pollStatusOpen: {en: 'Open', bg: 'Отворено'},
        pollClosed: {en: 'Voting closed', bg: 'Гласуването е затворено'},
        closePoll: {en: 'Close voting', bg: 'Затвори гласуването'},
        deletePollConfirmTitle: {en: 'Delete this vote?', bg: 'Изтриване на гласуването?'},
        deletePollConfirmDescription: {en: 'All cast votes will be permanently deleted along with it.', bg: 'Всички подадени гласове ще бъдат изтрити заедно с него.'},
        votesCount: {en: 'Votes: {count}', bg: 'Гласове: {count}'},
        noPollsYet: {en: 'No votes open yet.', bg: 'Все още няма отворени гласувания.'},

        issuesTitle: {en: 'Maintenance & issues', bg: 'Ремонти'},
        reportIssue: {en: 'Report an issue', bg: 'Докладвай проблем'},
        issueTitleLabel: {en: 'What is wrong?', bg: 'Какъв е проблемът?'},
        issueDescriptionLabel: {en: 'Details', bg: 'Детайли'},
        priorityLabel: {en: 'Priority', bg: 'Приоритет'},
        priorityLow: {en: 'Low', bg: 'Нисък'},
        priorityNormal: {en: 'Normal', bg: 'Среден'},
        priorityHigh: {en: 'High', bg: 'Висок'},
        issueStatusOpen: {en: 'Open', bg: 'Отворен'},
        issueStatusInProgress: {en: 'In progress', bg: 'В обработка'},
        issueStatusResolved: {en: 'Resolved', bg: 'Решен'},
        noIssuesYet: {en: 'No issues reported.', bg: 'Няма докладвани проблеми.'},
        commentsCount: {en: '{count} comments', bg: '{count} коментара'},
        noCommentsYet: {en: 'No comments yet.', bg: 'Все още няма коментари.'},
        addComment: {en: 'Add comment', bg: 'Добави коментар'},
        commentPlaceholder: {en: 'Write a comment…', bg: 'Напишете коментар…'},

        chatTitle: {en: 'Building chat', bg: 'Чат на сградата'},
        chatDescription: {en: 'Everyone in the building can see and send messages here.', bg: 'Всички в сградата виждат и могат да изпращат съобщения тук.'},
        chatPlaceholder: {en: 'Write a message…', bg: 'Напишете съобщение…'},
        sendMessage: {en: 'Send', bg: 'Изпрати'},
        noMessagesYet: {en: 'No messages yet — say hello!', bg: 'Все още няма съобщения — поздравете се!'},

        attachDocument: {en: 'Attach a document', bg: 'Прикачи документ'},
        viewAttachment: {en: 'View document', bg: 'Виж документа'},
        removeAttachment: {en: 'Remove', bg: 'Премахни'},

        // ── Dashboard (admin) ──────────────────────────────────────────
        dashboardIncomeExpense: {en: 'Income & expenses', bg: 'Приходи и разходи'},
        dashboardLast6Months: {en: 'Last 6 months', bg: 'Последните 6 месеца'},
        dashboardCashbook: {en: 'Cash book', bg: 'Каса'},
        dashboardTotalBalance: {en: 'Total balance', bg: 'Обща наличност'},
        dashboardAsOfToday: {en: 'As of today', bg: 'Към днешна дата'},
        dashboardCash: {en: 'cash', bg: 'кеш'},
        dashboardOnline: {en: 'online', bg: 'онлайн'},
        dashboardRemainingToPay: {en: 'Remaining to pay', bg: 'Остават да платят'},
        dashboardUnpaidBadge: {en: 'Unpaid', bg: 'Неплатени'},
        dashboardApartments: {en: 'apartments', bg: 'апартамента'},
        dashboardOfTotal: {en: 'of {total} total', bg: 'от {total} общо'},
        dashboardExpensesByCategory: {en: 'Expenses by category', bg: 'Разходи по категории'},
        dashboardThisMonth: {en: 'This month', bg: 'Този месец'},
        dashboardNoExpensesYet: {en: 'No expenses logged this month.', bg: 'Няма въведени разходи този месец.'},
        dashboardBillBreakdown: {en: 'Bill distribution', bg: 'Разпределение на сметки'},
        dashboardOwner: {en: 'Owner', bg: 'Собственик'},
        dashboardTotalDue: {en: 'Total due', bg: 'Общо задължения'},
        dashboardTabUnpaid: {en: 'Unpaid', bg: 'Неплатени'},
        dashboardTabPaid: {en: 'Paid', bg: 'Платени'},
        dashboardTabAll: {en: 'All', bg: 'Всички'},
        dashboardStatusPaid: {en: 'Paid', bg: 'Платено'},
        dashboardStatusPartial: {en: 'Partial', bg: 'Частично'},
        dashboardStatusUnpaid: {en: 'Unpaid', bg: 'Неплатено'},
        dashboardNoOwners: {en: 'No residents assigned yet.', bg: 'Все още няма зачислени живущи.'},

        // ── Expenses (разходи / касова книга) ──────────────────────────
        expensesTitle: {en: 'Expenses', bg: 'Разходи'},
        expensesDescription: {en: "The building's spending — repairs, cleaning, utilities for shared areas.", bg: 'Разходите на сградата — ремонти, почистване, комунални услуги за общите части.'},
        newExpense: {en: 'Log expense', bg: 'Добави разход'},
        expenseCategoryLabel: {en: 'Category', bg: 'Категория'},
        expenseCategoryPlaceholder: {en: 'e.g. Cleaning, Repairs, Electricity', bg: 'напр. Хигиенист, Ремонт, Електричество'},
        expenseDescriptionLabel: {en: 'Description', bg: 'Описание'},
        expenseAmountLabel: {en: 'Amount (EUR)', bg: 'Сума (€)'},
        expenseDateLabel: {en: 'Date', bg: 'Дата'},
        noExpensesYet: {en: 'No expenses logged yet.', bg: 'Все още няма въведени разходи.'},
        totalSpent: {en: 'Total spent', bg: 'Общо изразходвани'},
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
