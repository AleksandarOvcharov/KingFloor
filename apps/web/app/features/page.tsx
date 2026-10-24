'use client'

import {useState} from 'react'
import Link from 'next/link'
import {useAuth} from '@/hooks/useAuth'
import {Header} from '@/components/header'
import {Button} from '@workspace/ui/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@workspace/ui/ui/card'
import {Badge} from '@workspace/ui/ui/badge'
import {Separator} from '@workspace/ui/ui/separator'
import {Alert, AlertDescription, AlertTitle} from '@workspace/ui/ui/alert'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@workspace/ui/ui/tabs'
import {Modal, ModalBody, ModalDescription, ModalFooter, ModalHeader, ModalTitle} from '@/components/modal/modal'
import {ConfirmModal, ErrorModal, FormModal, InfoModal, SuccessModal} from '@/components/modal/modal-templates'
import {useModal} from '@/hooks/useModal'
import {useToast} from '@/hooks/useToast'
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@workspace/ui/shadcn/accordion'
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from '@workspace/ui/shadcn/alert-dialog'
import {Checkbox} from '@workspace/ui/shadcn/checkbox'
import {Slider} from '@workspace/ui/shadcn/slider'
import {RadioGroup, RadioGroupItem} from '@workspace/ui/shadcn/radio-group'
import {Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger} from '@workspace/ui/shadcn/sheet'
import {Popover, PopoverContent, PopoverTrigger} from '@workspace/ui/shadcn/popover'
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from '@workspace/ui/shadcn/command'
import {HoverCard, HoverCardContent, HoverCardTrigger} from '@workspace/ui/shadcn/hover-card'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@workspace/ui/shadcn/table'
import {Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious} from '@workspace/ui/shadcn/pagination'
import {InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot} from '@workspace/ui/shadcn/input-otp'
import {Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger} from '@workspace/ui/shadcn/drawer'
import {Calendar} from '@workspace/ui/shadcn/calendar'
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from '@workspace/ui/shadcn/carousel'
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from '@workspace/ui/shadcn/resizable'
import {Spinner} from '@workspace/ui/shadcn/spinner'
import {Kbd} from '@workspace/ui/shadcn/kbd'
import {Label} from '@workspace/ui/ui/label'
import {Input} from '@workspace/ui/ui/input'
import {Switch} from '@workspace/ui/ui/switch'
import {Progress} from '@workspace/ui/ui/progress'
import {Skeleton} from '@workspace/ui/ui/skeleton'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@workspace/ui/ui/tooltip'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@workspace/ui/ui/select'
import {Textarea} from '@workspace/ui/ui/textarea'
import {SearchFilter} from '@workspace/ui/ui/search-filter'
import {CopyButton} from '@/components/ui/copy-button'
import {EmptyState} from '@workspace/ui/ui/empty-state'
import {LoadingState} from '@workspace/ui/ui/loading-state'
import {Grid, Stack, SpaceBetween} from '@workspace/ui/ui/layout'
import {notify} from '@/lib/notify'
import {useSearch} from '@/hooks/useSearch'
import {useFormValidation} from '@/hooks/useFormValidation'
import {useSpeechToText} from '@/hooks/useSpeechToText'
import {useMediaQuery, useBreakpoint, useIsMobile, useIsDesktop, usePrefersReducedMotion} from '@/hooks/useMediaQuery'
import {ErrorBoundary} from '@workspace/ui/ui/async-boundary'
import {createSimpleStore} from '@/lib/store'
import {demoProducts, demoTeamMembers, demoNotifications} from '@/lib/demo-data'
import {useNotification, NotificationItem, type NotificationPosition} from '@/components/notification'
import {ExportButton} from '@/components/ui/export-button'
import {TopLoader, OverlayLoader, InlineLoader, LoadingScreen} from '@workspace/ui/ui/global-loading'
import {Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator} from '@workspace/ui/shadcn/breadcrumb'
import {
    CodeBlock,
    CodeBlockHeader,
    CodeBlockFiles,
    CodeBlockFileTab,
    CodeBlockCopyButton,
    CodeBlockBody,
    CodeBlockItem,
    CodeBlockContent,
} from '@workspace/ui/shadcn/code-block'
import {MapView, type MapPin} from '@/components/map'
import {useSmoothScroll} from '@/hooks/useSmoothScroll'
import {SmoothScrollToggle} from '@/components/smooth-scroll-toggle'
import {useI18n} from '@/lib/i18n/provider'
import {ArrowRight, ArrowUpDown, Bell, Bot, Compass, MapPin as MapPinIcon, Clipboard, Code, Component, Database, Download, Filter, GripVertical, HardDrive, Info, Keyboard, LayoutGrid, Layers, Loader2, Monitor, Palette, PanelRight, RefreshCw, Rocket, Shield, ShieldAlert, Smartphone, Sparkles, Store, Type, Users, Wrench, Zap} from 'lucide-react'

// Demo store for the Starter Kit tab
const {SimpleStoreProvider, useSimpleStore} = createSimpleStore({
    count: 0,
    name: '',
    theme: 'blue' as string,
})

function StoreDemo() {
    const {state, set, reset} = useSimpleStore()
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Count:</span>
                <span className="font-mono font-bold text-lg">{state.count}</span>
                <Button size="sm" variant="outline" onClick={() => set('count', state.count - 1)}>-</Button>
                <Button size="sm" variant="outline" onClick={() => set('count', state.count + 1)}>+</Button>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Name:</span>
                <Input
                    value={state.name as string}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Type a name..."
                    className="w-full sm:max-w-50 h-8 text-sm"
                />
            </div>
            <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Theme:</span>
                <div className="flex gap-1">
                    {['blue', 'green', 'purple'].map((c) => (
                        <Button
                            key={c}
                            size="sm"
                            variant={state.theme === c ? 'default' : 'outline'}
                            onClick={() => set('theme', c)}
                            className="text-xs capitalize"
                        >{c}</Button>
                    ))}
                </div>
            </div>
            <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={reset}>Reset All</Button>
            </div>
            <pre className="text-xs bg-muted rounded px-3 py-2 font-mono">{JSON.stringify(state, null, 2)}</pre>
        </div>
    )
}

function CodeBlockShowcase() {
    const [lineNumbers, setLineNumbers] = useState(true)
    const [trafficLights, setTrafficLights] = useState(true)

    const files = [
        {
            filename: 'useAuth.ts',
            language: 'typescript',
            code: `import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useAuth() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true) // [!code highlight]

    useEffect(() => {
        // Sync session cookie for server proxy // [!code ++]
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null) // [!code ++]
                setLoading(false)
            }
        )
        return () => subscription.unsubscribe()
    }, [])

    return { user, loading }
}`,
        },
        {
            filename: 'schema.sql',
            language: 'sql',
            code: `-- Enable Row Level Security on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by owner or public"
    ON public.profiles FOR SELECT
    USING (is_public = true OR auth.uid() = id);`,
        },
        {
            filename: 'package.json',
            language: 'json',
            code: `{
  "name": "hackathon-startup",
  "version": "1.0.0",
  "dependencies": {
    "next": "16.3.5",
    "react": "^19.2.0",
    "tailwindcss": "^4.1.18"
  }
}`,
        },
    ]

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground">
                    Header composition with smart file icons, diff highlights, line numbers, and copy action.
                </span>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <Switch checked={lineNumbers} onCheckedChange={setLineNumbers} />
                        <span>Line numbers</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <Switch checked={trafficLights} onCheckedChange={setTrafficLights} />
                        <span>Window dots</span>
                    </label>
                </div>
            </div>

            <CodeBlock data={files} defaultValue="useAuth.ts">
                <CodeBlockHeader trafficLights={trafficLights}>
                    <CodeBlockFiles>
                        {(item) => (
                            <CodeBlockFileTab key={item.filename} value={item.filename}>
                                {item.filename}
                            </CodeBlockFileTab>
                        )}
                    </CodeBlockFiles>
                    <CodeBlockCopyButton />
                </CodeBlockHeader>
                <CodeBlockBody maxHeight={280}>
                    {files.map((file) => (
                        <CodeBlockItem key={file.filename} value={file.filename} lineNumbers={lineNumbers}>
                            <CodeBlockContent language={file.language}>{file.code}</CodeBlockContent>
                        </CodeBlockItem>
                    ))}
                </CodeBlockBody>
            </CodeBlock>
        </div>
    )
}

function NotificationShowcase() {
    const {showNotification, clearAll} = useNotification()
    const [selectedPosition, setSelectedPosition] = useState<NotificationPosition>('top-right')
    const [title, setTitle] = useState('Gym Chad')
    const [description, setDescription] = useState('6 months ago you said tomorrow. Still in couch?')
    const [time, setTime] = useState('30d')
    const [avatar, setAvatar] = useState('/chad.jpg')
    const [previewKey, setPreviewKey] = useState(0)

    const triggerNotification = (pos?: NotificationPosition) => {
        const p = pos || selectedPosition
        showNotification({
            title,
            description,
            time,
            avatar,
            position: p,
            duration: 8000,
            actionLabel: 'Hit the Gym',
            onAction: () => notify.success('PR incoming! 💪'),
        })
    }

    const triggerGymChad = (pos: NotificationPosition) => {
        setSelectedPosition(pos)
        showNotification({
            title: 'Gym Chad',
            description: '6 months ago you said tomorrow. Still in couch?',
            time: '30d',
            avatar: '/chad.jpg',
            position: pos,
            duration: 8000,
            actionLabel: 'Hit the Gym',
            onAction: () => notify.success('PR incoming! 💪'),
        })
    }

    const triggerStackDemo = () => {
        const items = [
            {title: 'Gym Chad', desc: '6 months ago you said tomorrow. Still in couch?', time: '30d', avatar: '/chad.jpg', action: 'Hit the Gym'},
            {title: 'Build Succeeded', desc: 'Production edge deploy completed in 1.2s across 38 nodes.', time: '1m ago', avatar: '/chad.jpg'},
            {title: 'Gym Chad', desc: 'Discipline is doing what you hate to do like you love it.', time: '5m ago', avatar: '/chad.jpg', action: 'Bench Press'},
            {title: 'Security Alert', desc: 'New login detected from Berlin, Germany (IP: 192.0.2.1).', time: '14m ago', avatar: '/chad.jpg'},
            {title: 'Gym Chad', desc: 'Your gym membership is not a donation. Go train!', time: '1h ago', avatar: '/chad.jpg', action: 'Drink Whey'},
            {title: 'PR Review', desc: 'Carol left comments on pull request #48: Ready to merge.', time: '2h ago', avatar: '/chad.jpg'},
        ]

        items.forEach((item, index) => {
            setTimeout(() => {
                showNotification({
                    title: item.title,
                    description: item.desc,
                    time: item.time,
                    avatar: item.avatar,
                    position: selectedPosition,
                    duration: 15000,
                    actionLabel: item.action,
                    onAction: () => notify.success(`Action for ${item.title} completed!`),
                })
            }, index * 120)
        })
        notify.success('Spawned 6 notifications! Try scrolling the stack & swiping cards.')
    }

    const replayAnimation = () => {
        setPreviewKey((k) => k + 1)
    }

    return (
        <div className="space-y-6">
            {/* Position Picker & Trigger Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 rounded-xl border border-border/70 bg-card/50 p-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">1. Choose Position (Top Left / Right, Down Left / Right)</Label>
                        <Badge variant="outline" className="text-xs font-mono">{selectedPosition}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            type="button"
                            variant={selectedPosition === 'top-left' ? 'default' : 'outline'}
                            className="h-10 text-xs font-medium justify-center gap-1.5 cursor-pointer"
                            onClick={() => triggerGymChad('top-left')}
                        >
                            ↖ Top Left
                        </Button>
                        <Button
                            type="button"
                            variant={selectedPosition === 'top-right' ? 'default' : 'outline'}
                            className="h-10 text-xs font-medium justify-center gap-1.5 cursor-pointer"
                            onClick={() => triggerGymChad('top-right')}
                        >
                            ↗ Top Right
                        </Button>
                        <Button
                            type="button"
                            variant={selectedPosition === 'bottom-left' ? 'default' : 'outline'}
                            className="h-10 text-xs font-medium justify-center gap-1.5 cursor-pointer"
                            onClick={() => triggerGymChad('bottom-left')}
                        >
                            ↙ Down Left
                        </Button>
                        <Button
                            type="button"
                            variant={selectedPosition === 'bottom-right' ? 'default' : 'outline'}
                            className="h-10 text-xs font-medium justify-center gap-1.5 cursor-pointer"
                            onClick={() => triggerGymChad('bottom-right')}
                        >
                            ↘ Down Right
                        </Button>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                        <Button
                            type="button"
                            className="w-full h-10 gap-2 font-medium bg-amber-500 hover:bg-amber-600 text-white dark:bg-amber-600 dark:hover:bg-amber-700 shadow-sm cursor-pointer"
                            onClick={() => triggerGymChad(selectedPosition)}
                        >
                            <Bell className="h-4 w-4" />
                            Trigger Single Popup ({selectedPosition})
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                className="flex-1 h-8 text-xs gap-1.5 cursor-pointer"
                                onClick={triggerStackDemo}
                            >
                                <Layers className="h-3.5 w-3.5" />
                                Spawn 6 Items (Test Scroll Stack)
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="h-8 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                                onClick={clearAll}
                            >
                                Clear All
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Custom Content Customizer */}
                <div className="space-y-3 rounded-xl border border-border/70 bg-card/50 p-4">
                    <Label className="text-sm font-semibold">2. Customize Notification Content</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="space-y-1">
                            <span className="text-[11px] text-muted-foreground">Title</span>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Gym Chad"
                                className="h-8 text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[11px] text-muted-foreground">Timestamp</span>
                            <Input
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                placeholder="30d"
                                className="h-8 text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[11px] text-muted-foreground">Avatar URL</span>
                            <Input
                                value={avatar}
                                onChange={(e) => setAvatar(e.target.value)}
                                placeholder="/chad.jpg"
                                className="h-8 text-xs"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[11px] text-muted-foreground">Description</span>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Notification message..."
                            className="h-8 text-xs"
                        />
                    </div>
                    <div className="flex gap-2 pt-1">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="flex-1 h-8 text-xs"
                            onClick={() => triggerNotification()}
                        >
                            Send Custom Floating Notification
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs"
                            onClick={replayAnimation}
                            title="Re-run animation in preview"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Gesture & Physics Info Bar */}
            <div className="flex items-center gap-2 rounded-lg bg-muted/40 border border-border/60 px-3.5 py-2.5 text-xs text-muted-foreground">
                <span className="text-amber-500 font-semibold">✨ Gesture Features:</span>
                <span>Swipe/drag any notification card left or right to instantly clear it. Mouse wheel scrolls the stack when multiple notifications arrive!</span>
            </div>

            {/* In-Page Rendered Preview (Exact HTML Layout) */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">Exact Component Render & Physics Preview</span>
                        <Badge variant="secondary" className="text-[10px]">Exact HTML Structure • Swipeable</Badge>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[11px] gap-1 text-muted-foreground"
                        onClick={replayAnimation}
                    >
                        <RefreshCw className="h-3 w-3" /> Replay Entrance
                    </Button>
                </div>

                <div className="p-3 sm:p-6 rounded-2xl border border-dashed border-border/80 bg-muted/20 flex flex-col sm:flex-row items-center justify-center gap-4 min-h-30 overflow-hidden">
                    <div key={previewKey} className="w-full max-w-full sm:max-w-sm">
                        <NotificationItem
                            title={title}
                            description={description}
                            time={time}
                            avatar={avatar}
                            position={selectedPosition}
                            actionLabel="Hit the Gym"
                            onAction={() => notify.success('PR incoming! 💪')}
                            onDismiss={() => notify('Preview dismissed')}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

const sfCampusPins: MapPin[] = [
    {
        id: 'hq',
        lat: 37.7749,
        lng: -122.4194,
        title: 'Hackathon Main Arena',
        description: 'Main keynote stage, hacking tables, mentor stations, and 24/7 Red Bull bar.',
        category: 'Hacking Arena',
        color: '#6366f1',
        icon: '⚡',
        badge: 'Keynote & Stage',
        metadata: { capacity: '800 hackers', wifi: 'Gigabit 6E' },
        link: 'https://maps.google.com/?q=37.7749,-122.4194',
    },
    {
        id: 'workshop',
        lat: 37.7833,
        lng: -122.4167,
        title: 'AI Workshop & Lab',
        description: 'Hands-on workshops for Gemini Flash 2.0, Next.js 16 App Router, and vector databases.',
        category: 'Workshops',
        color: '#10b981',
        icon: '🧠',
        badge: 'Hands-on Lab',
        metadata: { capacity: '120 seats', mentor: 'Google DeepMind' },
    },
    {
        id: 'food',
        lat: 37.768,
        lng: -122.422,
        title: 'Midnight Pizza & Food Trucks',
        description: 'Free artisan pizza, specialty espresso, boba, and midnight snacks for all teams.',
        category: 'Food & Drinks',
        color: '#f59e0b',
        icon: '🍕',
        badge: 'Open 24h',
    },
    {
        id: 'pitch',
        lat: 37.781,
        lng: -122.404,
        title: 'Demo Pitch & VC Lounge',
        description: 'Final 3-minute project demos, angel investor networking, and prize ceremony.',
        category: 'Pitch Stage',
        color: '#ec4899',
        icon: '🏆',
        badge: '$50k Prizes',
    },
    {
        id: 'chill',
        lat: 37.77,
        lng: -122.435,
        title: 'Chillout & Nap Pods',
        description: 'Quiet dark room with acoustic pods, bean bags, and ambient white noise generators.',
        category: 'Rest Zone',
        color: '#06b6d4',
        icon: '🛋️',
        badge: 'Quiet Zone',
    },
]

const globalHubPins: MapPin[] = [
    {
        id: 'sf',
        lat: 37.7749,
        lng: -122.4194,
        title: 'San Francisco Hub',
        description: 'Global AI HQ with frontier model compute clusters and engineering teams.',
        category: 'Americas',
        color: '#6366f1',
        icon: '🌉',
        badge: 'Global HQ',
    },
    {
        id: 'london',
        lat: 51.5074,
        lng: -0.1278,
        title: 'London Research Center',
        description: 'Deep Learning & Reinforcement Learning research headquarters in Kings Cross.',
        category: 'Europe',
        color: '#3b82f6',
        icon: '🏛️',
        badge: 'AI Research',
    },
    {
        id: 'tokyo',
        lat: 35.6762,
        lng: 139.6503,
        title: 'Tokyo Robotics & Edge Lab',
        description: 'Next-gen robotics, real-time edge AI inference, and APAC developer relations.',
        category: 'Asia-Pacific',
        color: '#ec4899',
        icon: '🗼',
        badge: 'Robotics',
    },
    {
        id: 'singapore',
        lat: 1.3521,
        lng: 103.8198,
        title: 'Singapore Cloud Edge',
        description: 'High-throughput low-latency multi-region edge nodes and cloud distribution.',
        category: 'Asia-Pacific',
        color: '#10b981',
        icon: '🌴',
        badge: 'Edge Node',
    },
    {
        id: 'berlin',
        lat: 52.52,
        lng: 13.405,
        title: 'Berlin Creative & Open Source Hub',
        description: 'Open source development, tooling maintainers, and developer ecosystem.',
        category: 'Europe',
        color: '#f59e0b',
        icon: '🎨',
        badge: 'Open Source',
    },
]

const SF_CENTER: [number, number] = [37.7749, -122.4194]
const WORLD_CENTER: [number, number] = [28, 15]

function MapShowcase() {
    const [activePreset, setActivePreset] = useState<'sf' | 'world'>('sf')
    const [showBottomCards, setShowBottomCards] = useState<boolean>(true)
    const [lastClickedInfo, setLastClickedInfo] = useState<{
        lat: number
        lng: number
        addressName?: string
    } | null>(null)

    const currentPins = activePreset === 'sf' ? sfCampusPins : globalHubPins
    const currentCenter = activePreset === 'sf' ? SF_CENTER : WORLD_CENTER
    const currentZoom = activePreset === 'sf' ? 13 : 2

    return (
        <div className="space-y-4">
            {/* Header controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground">
                    Free OpenStreetMap Leaflet integration with GPS locate, real-time Nominatim reverse geocoding on click, search & category filtering.
                </span>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        size="sm"
                        variant={showBottomCards ? 'secondary' : 'outline'}
                        className="h-7 text-xs px-2.5 cursor-pointer"
                        onClick={() => setShowBottomCards(!showBottomCards)}
                    >
                        {showBottomCards ? 'Bottom Cards: ON' : 'Bottom Cards: OFF'}
                    </Button>
                    <div className="flex items-center rounded-lg border border-border/60 bg-muted/30 p-1">
                        <Button
                            type="button"
                            size="sm"
                            variant={activePreset === 'sf' ? 'default' : 'ghost'}
                            className="h-7 text-xs px-2.5 cursor-pointer"
                            onClick={() => setActivePreset('sf')}
                        >
                            ⚡ SF Campus
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant={activePreset === 'world' ? 'default' : 'ghost'}
                            className="h-7 text-xs px-2.5 cursor-pointer"
                            onClick={() => setActivePreset('world')}
                        >
                            🌍 Global Hubs
                        </Button>
                    </div>
                </div>
            </div>

            {/* Map Canvas (100% Self-Contained with embedded inside-the-map Info Box & Reverse Geocoding) */}
            <MapView
                key={`${activePreset}-${showBottomCards}`}
                center={currentCenter}
                zoom={currentZoom}
                pins={currentPins}
                tileProvider="osm"
                height="480px"
                className="rounded-xl border border-border/80 shadow-inner"
                showSearch={true}
                showCategoryFilter={true}
                showPinInfoBox={true}
                showPinCards={showBottomCards}
                showLayerSelector={true}
                showUserLocationButton={true}
                enableClickToLookup={true}
                allowFullscreen={true}
                onMapClick={(e) => {
                    if (e.address) {
                        setLastClickedInfo({
                            lat: e.lat,
                            lng: e.lng,
                            addressName: e.address.displayName,
                        })
                    }
                }}
                onLocationFound={(loc) => {
                    if (loc.address) {
                        setLastClickedInfo({
                            lat: loc.lat,
                            lng: loc.lng,
                            addressName: loc.address.displayName,
                        })
                    }
                }}
            />

            {/* Live Interactive Reverse Geocode Feedback Banner */}
            {lastClickedInfo && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs flex items-start gap-2.5 text-foreground animate-in fade-in slide-in-from-top-1">
                    <Compass className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-primary">Nominatim Reverse Geocoded:</span>
                            <span className="font-mono text-[11px] text-muted-foreground">
                                {lastClickedInfo.lat.toFixed(5)}, {lastClickedInfo.lng.toFixed(5)}
                            </span>
                        </div>
                        <p className="text-muted-foreground line-clamp-2">
                            {lastClickedInfo.addressName}
                        </p>
                    </div>
                </div>
            )}

            {/* Code example note */}
            <div className="rounded-lg bg-muted/40 border border-border/60 p-3 text-xs flex items-center justify-between gap-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 text-primary shrink-0" />
                    <span>
                        <strong className="text-foreground">Click-to-Geocode & GPS:</strong> Click anywhere on the map or the 🎯 button to reverse-geocode addresses via Nominatim without an API key.
                    </span>
                </div>
                <code className="hidden sm:inline-block font-mono text-[11px] text-primary shrink-0 bg-background/80 px-2 py-1 rounded border">
                    &lt;MapView pins=&#123;pins&#125; enableClickToLookup=&#123;true&#125; /&gt;
                </code>
            </div>
        </div>
    )
}


// Component that throws for ErrorBoundary demo
function BuggyComponent({shouldThrow}: {shouldThrow: boolean}) {
    if (shouldThrow) throw new Error('This is a demo error — click "Try again" to recover.')
    return (
        <div className="rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success">
            Component loaded successfully!
        </div>
    )
}

export default function FeaturesPage() {
    const {user, loading} = useAuth()
    const {t} = useI18n()
    const basicModal = useModal()
    const formModal = useModal()
    const infoModal = useModal()
    const successModal = useModal()
    const errorModal = useModal()
    const confirmModal = useModal()
    const {addToast} = useToast()
    const [formResult, setFormResult] = useState<string>('')
    const [sliderValue, setSliderValue] = useState([50])
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [progressValue, setProgressValue] = useState(33)
    const [switchChecked, setSwitchChecked] = useState(true)
    const [loadingVariant, setLoadingVariant] = useState<'list' | 'card' | 'profile' | 'table'>('list')
    const [boundaryError, setBoundaryError] = useState(false)
    const [topLoaderDemo, setTopLoaderDemo] = useState(false)
    const [overlayLoaderDemo, setOverlayLoaderDemo] = useState(false)
    const [inlineLoaderDemo, setInlineLoaderDemo] = useState(false)
    const [activeTab, setActiveTab] = useState('core')
    const {isEnabled: smoothScrollEnabled, lenis} = useSmoothScroll()

    // Sort demo for products
    const {query: productQuery, setQuery: setProductQuery, filtered: filteredProducts, sort: productSort, setSort: setProductSort} = useSearch(
        demoProducts,
        {keys: ['name', 'category'], sort: {key: 'name', direction: 'asc', type: 'alphabetical'}},
    )

    // Responsive utility demos
    const breakpoint = useBreakpoint()
    const isMobile = useIsMobile()
    const isDesktop = useIsDesktop()
    const prefersReducedMotion = usePrefersReducedMotion()
    const isWide = useMediaQuery('(min-width: 1200px)')

    const sampleItems = [
        {id: 1, name: 'Alice Johnson', role: 'Developer'},
        {id: 2, name: 'Bob Smith', role: 'Designer'},
        {id: 3, name: 'Carol White', role: 'Manager'},
        {id: 4, name: 'Dave Brown', role: 'Developer'},
        {id: 5, name: 'Eve Davis', role: 'Designer'},
    ]
    const {query, setQuery, filtered} = useSearch(sampleItems, {keys: ['name', 'role']})

    const demoForm = useFormValidation({
        email: {required: true, label: 'Email', validate: (v) => v && !v.includes('@') ? 'Must be a valid email' : undefined},
        password: {required: true, label: 'Password', validate: (v) => v && v.length < 6 ? 'Must be at least 6 characters' : undefined},
    })

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingScreen message={t.loading.features} spinnerSize={36} />
            </div>
        )
    }

    return (
        <main className="min-h-screen">
            <TopLoader loading={topLoaderDemo}/>
            <OverlayLoader loading={overlayLoaderDemo} message={t.features.savingChanges}/>
            <Header/>

            <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-16 max-w-full">
                <div className="max-w-6xl mx-auto space-y-12">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/">{t.common.home}</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator/>
                            <BreadcrumbItem>
                                <BreadcrumbPage>{t.nav.features}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <div className="text-center space-y-4">
                        <div className="flex items-center justify-center gap-2">
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                                {t.features.heroTitle}
                            </h1>
                            <Badge className="text-sm">v1.0</Badge>
                        </div>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            {t.features.heroSubtitle}
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            <Badge variant="secondary">Next.js 16</Badge>
                            <Badge variant="secondary">React 19</Badge>
                            <Badge variant="secondary">TypeScript</Badge>
                            <Badge variant="secondary">Tailwind v4</Badge>
                            <Badge variant="secondary">Supabase</Badge>
                            <Badge variant="secondary">Gemini AI</Badge>
                        </div>
                    </div>

                    <Alert>
                        <Sparkles className="h-4 w-4"/>
                        <AlertTitle>{t.features.newInVersion}</AlertTitle>
                        <AlertDescription>
                            {t.features.newInVersionDescription}
                        </AlertDescription>
                    </Alert>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                        <TabsList className="w-full justify-start overflow-x-auto no-scrollbar touch-pan-x flex-nowrap shrink-0">
                            <TabsTrigger className="shrink-0 text-xs sm:text-sm px-2.5 sm:px-3" value="core">{t.features.tabCore}</TabsTrigger>
                            <TabsTrigger className="shrink-0 text-xs sm:text-sm px-2.5 sm:px-3" value="ui">{t.features.tabUi}</TabsTrigger>
                            <TabsTrigger className="shrink-0 text-xs sm:text-sm px-2.5 sm:px-3" value="library">{t.features.tabLibrary}</TabsTrigger>
                            <TabsTrigger className="shrink-0 text-xs sm:text-sm px-2.5 sm:px-3" value="utilities">{t.features.tabUtilities}</TabsTrigger>
                            <TabsTrigger className="shrink-0 text-xs sm:text-sm px-2.5 sm:px-3" value="ai">{t.features.tabAi}</TabsTrigger>
                            <TabsTrigger className="shrink-0 text-xs sm:text-sm px-2.5 sm:px-3" value="starter">{t.features.tabStarter}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="core">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between mb-2">
                                            <Shield className="h-8 w-8 text-primary"/>
                                            <Badge variant="outline">Auth</Badge>
                                        </div>
                                        <CardTitle>{t.features.authTitle}</CardTitle>
                                        <CardDescription>
                                            {t.features.authDesc}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li>{t.features.authLi1}</li>
                                            <li>{t.features.authLi2}</li>
                                            <li>{t.features.authLi3}</li>
                                            <li>{t.features.authLi4}</li>
                                        </ul>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between mb-2">
                                            <Zap className="h-8 w-8 text-primary"/>
                                            <Badge variant="outline">Framework</Badge>
                                        </div>
                                        <CardTitle>{t.features.stackTitle}</CardTitle>
                                        <CardDescription>
                                            {t.features.stackDesc}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li>{t.features.stackLi1}</li>
                                            <li>{t.features.stackLi2}</li>
                                            <li>{t.features.stackLi3}</li>
                                            <li>{t.features.stackLi4}</li>
                                        </ul>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between mb-2">
                                            <Sparkles className="h-8 w-8 text-primary"/>
                                            <Badge variant="outline">AI</Badge>
                                        </div>
                                        <CardTitle>{t.features.geminiTitle}</CardTitle>
                                        <CardDescription>
                                            {t.features.geminiDesc}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li>{t.features.geminiLi1}</li>
                                            <li>{t.features.geminiLi2}</li>
                                            <li>{t.features.geminiLi3}</li>
                                            <li>{t.features.geminiLi4}</li>
                                        </ul>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between mb-2">
                                            <Database className="h-8 w-8 text-primary"/>
                                            <Badge variant="outline">Database</Badge>
                                        </div>
                                        <CardTitle>{t.features.supabaseTitle}</CardTitle>
                                        <CardDescription>
                                            {t.features.supabaseDesc}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li>{t.features.supabaseLi1}</li>
                                            <li>{t.features.supabaseLi2}</li>
                                            <li>{t.features.supabaseLi3}</li>
                                            <li>{t.features.supabaseLi4}</li>
                                        </ul>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between mb-2">
                                            <Rocket className="h-8 w-8 text-primary"/>
                                            <Badge variant="outline">Deploy</Badge>
                                        </div>
                                        <CardTitle>{t.features.prodTitle}</CardTitle>
                                        <CardDescription>
                                            {t.features.prodDesc}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li>{t.features.prodLi1}</li>
                                            <li>{t.features.prodLi2}</li>
                                            <li>{t.features.prodLi3}</li>
                                            <li>{t.features.prodLi4}</li>
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="ui">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between mb-2">
                                            <Palette className="h-8 w-8 text-primary"/>
                                            <Badge>55 Components</Badge>
                                        </div>
                                        <CardTitle>{t.features.shadcnTitle}</CardTitle>
                                        <CardDescription>
                                            {t.features.shadcnDesc}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-1.5">
                                            {[
                                                'Accordion', 'Alert', 'Alert Dialog', 'Avatar', 'Badge',
                                                'Breadcrumb', 'Button', 'Calendar', 'Card', 'Carousel',
                                                'Checkbox', 'Code Block', 'Collapsible', 'Command', 'Context Menu',
                                                'Copy Button', 'Dialog', 'Drawer', 'Dropdown', 'Empty State',
                                                'Hover Card', 'Input', 'Input OTP', 'Kbd', 'Label',
                                                'Layout', 'Loading State', 'Menubar', 'Modal', 'Nav Menu', 'Notification',
                                                'Pagination', 'Popover', 'Progress', 'Radio Group',
                                                'Resizable', 'Scroll Area', 'Search Filter', 'Select',
                                                'Separator', 'Sheet', 'Sidebar', 'Skeleton', 'Slider',
                                                'Sonner', 'Spinner', 'Switch', 'Table', 'Tabs',
                                                'Textarea', 'Toggle', 'Toggle Group', 'Tooltip', 'Typography',
                                            ].map((name) => (
                                                <Badge key={name} variant="secondary" className="text-xs">
                                                    {name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between mb-2">
                                            <Layers className="h-8 w-8 text-primary"/>
                                            <Badge variant="outline">Interactive</Badge>
                                        </div>
                                        <CardTitle>{t.features.modalSystemTitle}</CardTitle>
                                        <CardDescription>
                                            {t.features.modalSystemDesc}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="text-sm text-muted-foreground">
                                            {t.features.modalTemplatesIntro}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <Button size="sm" onClick={() => basicModal.open()}>
                                                {t.features.basic}
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => formModal.open()}>
                                                {t.features.form}
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => confirmModal.open()}>
                                                {t.common.confirm}
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => infoModal.open()}>
                                                {t.status.info}
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => successModal.open()}>
                                                {t.status.success}
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => errorModal.open()}>
                                                {t.auth.error}
                                            </Button>
                                        </div>
                                        {formResult && (
                                            <p className="text-xs text-muted-foreground bg-muted rounded px-2 py-1 font-mono">
                                                {formResult}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between mb-2">
                                            <Bell className="h-8 w-8 text-primary"/>
                                            <Badge variant="outline">Feedback</Badge>
                                        </div>
                                        <CardTitle>{t.features.toastTitle}</CardTitle>
                                        <CardDescription>
                                            {t.features.toastDesc}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="text-sm text-muted-foreground">
                                            {t.features.toastVariantsIntro}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <Button size="sm" onClick={() => addToast({
                                                title: 'Heads up',
                                                description: 'This is a default toast.',
                                            })}>
                                                {t.features.default}
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => addToast({
                                                title: 'Success!',
                                                description: 'Changes saved successfully.',
                                                variant: 'success',
                                            })}>
                                                {t.status.success}
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => addToast({
                                                title: 'Error',
                                                description: 'Something went wrong.',
                                                variant: 'error',
                                            })}>
                                                {t.auth.error}
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => addToast({
                                                title: 'Destructive',
                                                description: 'This action cannot be undone.',
                                                variant: 'destructive',
                                            })}>
                                                {t.features.destructive}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between mb-2">
                                            <Palette className="h-8 w-8 text-primary"/>
                                            <Badge variant="outline">Theming</Badge>
                                        </div>
                                        <CardTitle>{t.features.themingTitle}</CardTitle>
                                        <CardDescription>
                                            {t.features.themingDesc}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li>{t.features.themingLi1}</li>
                                            <li>{t.features.themingLi2}</li>
                                            <li>{t.features.themingLi3}</li>
                                            <li>{t.features.themingLi4}</li>
                                        </ul>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between mb-2">
                                            <Code className="h-8 w-8 text-primary"/>
                                            <Badge variant="outline">Pattern</Badge>
                                        </div>
                                        <CardTitle>{t.features.patternsTitle}</CardTitle>
                                        <CardDescription>
                                            {t.features.patternsDesc}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li>{t.features.patternsLi1}</li>
                                            <li>{t.features.patternsLi2}</li>
                                            <li>{t.features.patternsLi3}</li>
                                            <li>{t.features.patternsLi4}</li>
                                        </ul>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="library">
                            <div className="space-y-6">
                                <p className="text-muted-foreground">
                                    {t.features.libraryIntroPre}<code className="bg-muted px-1.5 py-0.5 rounded text-xs">components/shadcn/</code>{t.features.libraryIntroPost}
                                </p>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Code Block (Composition 1) */}
                                    <Card className="md:col-span-2">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Code className="h-4 w-4 text-primary" />
                                                    <CardTitle className="text-base">{t.features.codeBlockTitle}</CardTitle>
                                                </div>
                                                <Badge variant="secondary" className="font-mono text-xs">Composition 1</Badge>
                                            </div>
                                            <CardDescription>
                                                {t.features.codeBlockDesc}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <CodeBlockShowcase />
                                        </CardContent>
                                    </Card>

                                    {/* Notification Feed & Cards (Composition 2) */}
                                    <Card className="md:col-span-2">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Bell className="h-4 w-4 text-primary" />
                                                    <CardTitle className="text-base">{t.features.notificationCardsTitle}</CardTitle>
                                                </div>
                                                <Badge variant="secondary" className="font-mono text-xs">Composition 2</Badge>
                                            </div>
                                            <CardDescription>
                                                {t.features.notificationCardsDesc}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <NotificationShowcase />
                                        </CardContent>
                                    </Card>

                                    {/* Custom OpenStreetMap Component */}
                                    <Card className="md:col-span-2">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Compass className="h-4 w-4 text-primary" />
                                                    <CardTitle className="text-base">{t.features.mapTitle}</CardTitle>
                                                </div>
                                                <Badge variant="secondary" className="font-mono text-xs">Custom Component</Badge>
                                            </div>
                                            <CardDescription>
                                                {t.features.mapDesc}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <MapShowcase />
                                        </CardContent>
                                    </Card>

                                    {/* Accordion */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">{t.features.accordionTitle}</CardTitle>
                                            <CardDescription>{t.features.accordionDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Accordion type="single" collapsible className="w-full">
                                                <AccordionItem value="item-1">
                                                    <AccordionTrigger>Is it accessible?</AccordionTrigger>
                                                    <AccordionContent>
                                                        Yes. It adheres to the WAI-ARIA design pattern.
                                                    </AccordionContent>
                                                </AccordionItem>
                                                <AccordionItem value="item-2">
                                                    <AccordionTrigger>Is it styled?</AccordionTrigger>
                                                    <AccordionContent>
                                                        Yes. It comes with default styles that match your theme.
                                                    </AccordionContent>
                                                </AccordionItem>
                                                <AccordionItem value="item-3">
                                                    <AccordionTrigger>Is it animated?</AccordionTrigger>
                                                    <AccordionContent>
                                                        Yes. It uses CSS animations for smooth open/close.
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Accordion>
                                        </CardContent>
                                    </Card>

                                    {/* Alert Dialog */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">{t.features.alertDialogTitle}</CardTitle>
                                            <CardDescription>{t.features.alertDialogDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="outline" size="sm">Delete Account</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete your
                                                            account and remove your data from our servers.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction>Continue</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </CardContent>
                                    </Card>

                                    {/* Checkbox + Radio Group */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">{t.features.checkboxRadioTitle}</CardTitle>
                                            <CardDescription>{t.features.checkboxRadioDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-3">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="terms" defaultChecked/>
                                                    <Label htmlFor="terms" className="text-sm">Accept terms</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox id="newsletter"/>
                                                    <Label htmlFor="newsletter" className="text-sm">Newsletter</Label>
                                                </div>
                                            </div>
                                            <Separator/>
                                            <RadioGroup defaultValue="comfortable">
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="default" id="r1"/>
                                                    <Label htmlFor="r1" className="text-sm">Default</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="comfortable" id="r2"/>
                                                    <Label htmlFor="r2" className="text-sm">Comfortable</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="compact" id="r3"/>
                                                    <Label htmlFor="r3" className="text-sm">Compact</Label>
                                                </div>
                                            </RadioGroup>
                                        </CardContent>
                                    </Card>

                                    {/* Slider */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">{t.features.sliderTitle}</CardTitle>
                                            <CardDescription>{t.features.sliderDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <Slider
                                                value={sliderValue}
                                                onValueChange={setSliderValue}
                                                max={100}
                                                step={1}
                                            />
                                            <p className="text-sm text-muted-foreground text-center">
                                                Value: <span className="font-medium text-foreground">{sliderValue[0]}</span>
                                            </p>
                                        </CardContent>
                                    </Card>

                                    {/* Sheet */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-2">
                                                <PanelRight className="h-4 w-4 text-muted-foreground"/>
                                                <CardTitle className="text-base">{t.features.sheetTitle}</CardTitle>
                                            </div>
                                            <CardDescription>{t.features.sheetDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex gap-2">
                                            <Sheet>
                                                <SheetTrigger asChild>
                                                    <Button variant="outline" size="sm">Open Sheet</Button>
                                                </SheetTrigger>
                                                <SheetContent>
                                                    <SheetHeader>
                                                        <SheetTitle>Edit Profile</SheetTitle>
                                                        <SheetDescription>
                                                            Make changes to your profile here.
                                                        </SheetDescription>
                                                    </SheetHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="sheet-name">Name</Label>
                                                            <Input id="sheet-name" placeholder="Your name"/>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="sheet-username">Username</Label>
                                                            <Input id="sheet-username" placeholder="@username"/>
                                                        </div>
                                                    </div>
                                                </SheetContent>
                                            </Sheet>
                                        </CardContent>
                                    </Card>

                                    {/* Popover + Hover Card */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">{t.features.popoverHoverTitle}</CardTitle>
                                            <CardDescription>{t.features.popoverHoverDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex gap-2">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" size="sm">Popover</Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-64">
                                                    <div className="grid gap-2">
                                                        <h4 className="font-medium text-sm leading-none">Dimensions</h4>
                                                        <p className="text-sm text-muted-foreground">Set dimensions for the layer.</p>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            <HoverCard>
                                                <HoverCardTrigger asChild>
                                                    <Button variant="link" size="sm">@nextjs</Button>
                                                </HoverCardTrigger>
                                                <HoverCardContent className="w-64">
                                                    <div className="space-y-1">
                                                        <h4 className="text-sm font-semibold">Next.js</h4>
                                                        <p className="text-xs text-muted-foreground">
                                                            The React framework for the web. Used by some of the
                                                            world&apos;s largest companies.
                                                        </p>
                                                    </div>
                                                </HoverCardContent>
                                            </HoverCard>
                                        </CardContent>
                                    </Card>

                                    {/* Command */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">{t.features.commandTitle}</CardTitle>
                                            <CardDescription>{t.features.commandDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Command className="rounded-lg border shadow-sm">
                                                <CommandInput placeholder="Type a command..."/>
                                                <CommandList>
                                                    <CommandEmpty>No results found.</CommandEmpty>
                                                    <CommandGroup heading="Suggestions">
                                                        <CommandItem>Calendar</CommandItem>
                                                        <CommandItem>Search Emoji</CommandItem>
                                                        <CommandItem>Calculator</CommandItem>
                                                    </CommandGroup>
                                                    <CommandGroup heading="Settings">
                                                        <CommandItem>Profile</CommandItem>
                                                        <CommandItem>Billing</CommandItem>
                                                        <CommandItem>Settings</CommandItem>
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </CardContent>
                                    </Card>

                                    {/* Input OTP */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">{t.features.otpTitle}</CardTitle>
                                            <CardDescription>{t.features.otpDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex justify-center">
                                            <InputOTP maxLength={6}>
                                                <InputOTPGroup>
                                                    <InputOTPSlot index={0}/>
                                                    <InputOTPSlot index={1}/>
                                                    <InputOTPSlot index={2}/>
                                                </InputOTPGroup>
                                                <InputOTPSeparator/>
                                                <InputOTPGroup>
                                                    <InputOTPSlot index={3}/>
                                                    <InputOTPSlot index={4}/>
                                                    <InputOTPSlot index={5}/>
                                                </InputOTPGroup>
                                            </InputOTP>
                                        </CardContent>
                                    </Card>

                                    {/* Table */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">{t.features.tableTitle}</CardTitle>
                                            <CardDescription>{t.features.tableDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Invoice</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead className="text-right">Amount</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    <TableRow>
                                                        <TableCell className="font-medium">INV001</TableCell>
                                                        <TableCell><Badge variant="secondary">Paid</Badge></TableCell>
                                                        <TableCell className="text-right">$250.00</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-medium">INV002</TableCell>
                                                        <TableCell><Badge variant="outline">Pending</Badge></TableCell>
                                                        <TableCell className="text-right">$150.00</TableCell>
                                                    </TableRow>
                                                    <TableRow>
                                                        <TableCell className="font-medium">INV003</TableCell>
                                                        <TableCell><Badge variant="secondary">Paid</Badge></TableCell>
                                                        <TableCell className="text-right">$350.00</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>

                                    {/* Pagination */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">{t.features.paginationTitle}</CardTitle>
                                            <CardDescription>{t.features.paginationDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Pagination>
                                                <PaginationContent>
                                                    <PaginationItem>
                                                        <PaginationPrevious href="#"/>
                                                    </PaginationItem>
                                                    <PaginationItem>
                                                        <PaginationLink href="#" isActive>1</PaginationLink>
                                                    </PaginationItem>
                                                    <PaginationItem>
                                                        <PaginationLink href="#">2</PaginationLink>
                                                    </PaginationItem>
                                                    <PaginationItem>
                                                        <PaginationLink href="#">3</PaginationLink>
                                                    </PaginationItem>
                                                    <PaginationItem>
                                                        <PaginationEllipsis/>
                                                    </PaginationItem>
                                                    <PaginationItem>
                                                        <PaginationNext href="#"/>
                                                    </PaginationItem>
                                                </PaginationContent>
                                            </Pagination>
                                        </CardContent>
                                    </Card>

                                    {/* Drawer */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">{t.features.drawerTitle}</CardTitle>
                                            <CardDescription>{t.features.drawerDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Drawer>
                                                <DrawerTrigger asChild>
                                                    <Button variant="outline" size="sm">Open Drawer</Button>
                                                </DrawerTrigger>
                                                <DrawerContent>
                                                    <DrawerHeader>
                                                        <DrawerTitle>Move Goal</DrawerTitle>
                                                        <DrawerDescription>Set your daily activity goal.</DrawerDescription>
                                                    </DrawerHeader>
                                                    <div className="p-4">
                                                        <Slider defaultValue={[350]} max={500} step={10}/>
                                                    </div>
                                                    <DrawerFooter>
                                                        <Button>Submit</Button>
                                                        <DrawerClose asChild>
                                                            <Button variant="outline">Cancel</Button>
                                                        </DrawerClose>
                                                    </DrawerFooter>
                                                </DrawerContent>
                                            </Drawer>
                                        </CardContent>
                                    </Card>

                                    {/* Calendar */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">{t.features.calendarTitle}</CardTitle>
                                            <CardDescription>{t.features.calendarDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex justify-center">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={setDate}
                                                className="rounded-md border"
                                            />
                                        </CardContent>
                                    </Card>

                                    {/* Carousel */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">{t.features.carouselTitle}</CardTitle>
                                            <CardDescription>{t.features.carouselDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="mx-auto w-full max-w-[220px] sm:max-w-xs px-2">
                                                <Carousel className="w-full">
                                                    <CarouselContent>
                                                        {Array.from({length: 5}).map((_, i) => (
                                                            <CarouselItem key={i}>
                                                                <div className="p-1">
                                                                    <Card>
                                                                        <CardContent className="flex aspect-square items-center justify-center p-6">
                                                                            <span className="text-3xl font-semibold">{i + 1}</span>
                                                                        </CardContent>
                                                                    </Card>
                                                                </div>
                                                            </CarouselItem>
                                                        ))}
                                                    </CarouselContent>
                                                    <CarouselPrevious/>
                                                    <CarouselNext/>
                                                </Carousel>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Resizable */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-2">
                                                <GripVertical className="h-4 w-4 text-muted-foreground"/>
                                                <CardTitle className="text-base">{t.features.resizableTitle}</CardTitle>
                                            </div>
                                            <CardDescription>{t.features.resizableDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <ResizablePanelGroup orientation="horizontal" className="min-h-30 rounded-lg border">
                                                <ResizablePanel defaultSize={50}>
                                                    <div className="flex h-full items-center justify-center p-4">
                                                        <span className="text-sm font-semibold">Panel A</span>
                                                    </div>
                                                </ResizablePanel>
                                                <ResizableHandle withHandle/>
                                                <ResizablePanel defaultSize={50}>
                                                    <div className="flex h-full items-center justify-center p-4">
                                                        <span className="text-sm font-semibold">Panel B</span>
                                                    </div>
                                                </ResizablePanel>
                                            </ResizablePanelGroup>
                                        </CardContent>
                                    </Card>

                                    {/* Switch, Progress, Select */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">{t.features.switchProgressTitle}</CardTitle>
                                            <CardDescription>{t.features.switchProgressDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="airplane-mode" className="text-sm">Airplane Mode</Label>
                                                <Switch id="airplane-mode" checked={switchChecked} onCheckedChange={setSwitchChecked}/>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Progress</span>
                                                    <span className="font-medium">{progressValue}%</span>
                                                </div>
                                                <Progress value={progressValue}/>
                                                <div className="flex gap-1">
                                                    <Button size="sm" variant="outline" onClick={() => setProgressValue(Math.max(0, progressValue - 10))}>-10</Button>
                                                    <Button size="sm" variant="outline" onClick={() => setProgressValue(Math.min(100, progressValue + 10))}>+10</Button>
                                                </div>
                                            </div>
                                            <Separator/>
                                            <Select>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select a fruit"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="apple">Apple</SelectItem>
                                                    <SelectItem value="banana">Banana</SelectItem>
                                                    <SelectItem value="cherry">Cherry</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </CardContent>
                                    </Card>

                                    {/* Tooltip & Kbd */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-2">
                                                <Keyboard className="h-4 w-4 text-muted-foreground"/>
                                                <CardTitle className="text-base">{t.features.tooltipKbdTitle}</CardTitle>
                                            </div>
                                            <CardDescription>{t.features.tooltipKbdDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex gap-2">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="outline" size="sm">Hover me</Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Add to library</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="outline" size="icon"><Info className="h-4 w-4"/></Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>More information</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <Separator/>
                                            <div className="space-y-2">
                                                <p className="text-sm text-muted-foreground">Keyboard shortcuts:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="flex items-center gap-1 text-sm"><Kbd>Ctrl</Kbd>+<Kbd>C</Kbd> Copy</span>
                                                    <span className="flex items-center gap-1 text-sm"><Kbd>Ctrl</Kbd>+<Kbd>V</Kbd> Paste</span>
                                                    <span className="flex items-center gap-1 text-sm"><Kbd>Ctrl</Kbd>+<Kbd>Z</Kbd> Undo</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Skeleton & Spinner */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 text-muted-foreground"/>
                                                <CardTitle className="text-base">{t.features.skeletonSpinnerTitle}</CardTitle>
                                            </div>
                                            <CardDescription>{t.features.skeletonSpinnerDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center space-x-4">
                                                <Skeleton className="h-12 w-12 rounded-full shrink-0"/>
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-36 sm:w-48 max-w-[60vw]"/>
                                                    <Skeleton className="h-4 w-28 sm:w-36 max-w-[45vw]"/>
                                                </div>
                                            </div>
                                            <Separator/>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Spinner size="sm"/>
                                                    <span className="text-xs text-muted-foreground">Small</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Spinner/>
                                                    <span className="text-xs text-muted-foreground">Default</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Spinner size="lg"/>
                                                    <span className="text-xs text-muted-foreground">Large</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Spinner size="xl"/>
                                                    <span className="text-xs text-muted-foreground">XL</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Textarea & Input */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-2">
                                                <Type className="h-4 w-4 text-muted-foreground"/>
                                                <CardTitle className="text-base">{t.features.inputTextareaTitle}</CardTitle>
                                            </div>
                                            <CardDescription>{t.features.inputTextareaDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="grid gap-2">
                                                <Label htmlFor="demo-email" className="text-sm">Email</Label>
                                                <Input id="demo-email" type="email" placeholder="name@example.com"/>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="demo-bio" className="text-sm">Bio</Label>
                                                <Textarea id="demo-bio" placeholder="Tell us about yourself..." className="resize-none" rows={3}/>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* All other components list */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-2">
                                                <Component className="h-4 w-4 text-muted-foreground"/>
                                                <CardTitle className="text-base">{t.features.alsoAvailableTitle}</CardTitle>
                                            </div>
                                            <CardDescription>{t.features.alsoAvailableDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-wrap gap-1.5">
                                                {[
                                                    'Aspect Ratio', 'Breadcrumb', 'Collapsible',
                                                    'Context Menu', 'Menubar', 'Navigation Menu',
                                                    'Scroll Area', 'Sidebar', 'Sonner', 'Toggle Group',
                                                    'Typography',
                                                ].map((name) => (
                                                    <Badge key={name} variant="outline" className="text-xs">
                                                        {name}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-3">
                                                Import from <code className="bg-muted px-1 rounded">@workspace/ui/shadcn/*</code> or <code className="bg-muted px-1 rounded">@workspace/ui/ui/*</code>
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="utilities">
                            <div className="space-y-6">
                                <p className="text-muted-foreground">
                                    {t.features.utilitiesIntro}
                                </p>

                                {/* Lenis Smooth Scrolling Interactive Demo */}
                                <Card className="border-primary/30 bg-linear-to-br from-primary/5 via-background to-accent/10 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <ArrowUpDown className="h-5 w-5 text-primary animate-pulse"/>
                                                <CardTitle className="text-lg">{t.features.lenisTitle}</CardTitle>
                                                <Badge variant={smoothScrollEnabled ? "default" : "secondary"}>
                                                    {smoothScrollEnabled ? t.features.lenisActive : t.features.lenisDisabled}
                                                </Badge>
                                            </div>
                                            <SmoothScrollToggle showLabel={true} />
                                        </div>
                                        <CardDescription>
                                            {t.features.lenisDesc}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                                            <div className="p-4 rounded-lg border bg-background/80 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Status</span>
                                                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${smoothScrollEnabled ? 'text-success' : 'text-amber-600 dark:text-amber-400'}`}>
                                                        <span className={`h-2 w-2 rounded-full ${smoothScrollEnabled ? 'bg-success' : 'bg-amber-500'}`}/>
                                                        {smoothScrollEnabled ? t.features.lenisStatusOn : t.features.lenisStatusOff}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {smoothScrollEnabled
                                                        ? t.features.lenisOnDescription
                                                        : t.features.lenisOffDescription}
                                                </p>
                                            </div>

                                            <div className="p-4 rounded-lg border bg-background/80 space-y-2">
                                                <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Test Scroll Actions</span>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            if (lenis) {
                                                                lenis.scrollTo(window.scrollY + 600, { duration: 1.2 })
                                                            } else {
                                                                window.scrollBy({ top: 600, behavior: 'smooth' })
                                                            }
                                                        }}
                                                    >
                                                        Scroll Down 600px
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            if (lenis) {
                                                                lenis.scrollTo(0, { duration: 1.2 })
                                                            } else {
                                                                window.scrollTo({ top: 0, behavior: 'smooth' })
                                                            }
                                                        }}
                                                    >
                                                        Top
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="p-4 rounded-lg border bg-background/80 space-y-2">
                                                <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Usage Code</span>
                                                <code className="block text-xs font-mono text-primary bg-muted p-2 rounded truncate">
                                                    const &#123; isEnabled, toggle &#125; = useSmoothScroll()
                                                </code>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Search / Filter */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-2">
                                                <Filter className="h-4 w-4 text-muted-foreground"/>
                                                <CardTitle className="text-base">{t.features.searchFilterTitle}</CardTitle>
                                            </div>
                                            <CardDescription>{t.features.searchFilterDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <SearchFilter value={query} onValueChange={setQuery} placeholder="Filter by name or role..." debounce={150}/>
                                            <div className="space-y-1.5">
                                                {filtered.length > 0 ? filtered.map((item) => (
                                                    <div key={item.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                                                        <span className="font-medium">{item.name}</span>
                                                        <Badge variant="secondary" className="text-xs">{item.role}</Badge>
                                                    </div>
                                                )) : (
                                                    <p className="text-sm text-muted-foreground text-center py-3">No results for &quot;{query}&quot;</p>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {filtered.length} of {sampleItems.length} results
                                            </p>
                                        </CardContent>
                                    </Card>

                                    {/* Copy to Clipboard */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-2">
                                                <Clipboard className="h-4 w-4 text-muted-foreground"/>
                                                <CardTitle className="text-base">{t.features.clipboardTitle}</CardTitle>
                                            </div>
                                            <CardDescription>{t.features.clipboardDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono truncate">pnpm add @radix-ui/react-dialog</code>
                                                <CopyButton value="pnpm add @radix-ui/react-dialog"/>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono truncate">import &#123; Button &#125; from &apos;@/components/ui/button&apos;</code>
                                                <CopyButton value="import { Button } from '@workspace/ui/ui/button'"/>
                                            </div>
                                            <div className="flex gap-2">
                                                <CopyButton value="https://ui.shadcn.com" label="Copy Link" variant="outline"/>
                                                <CopyButton value="Hello from the clipboard!" label="Copy Text"/>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Global Notify */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-2">
                                                <Bell className="h-4 w-4 text-muted-foreground"/>
                                                <CardTitle className="text-base">{t.features.notifyTitle}</CardTitle>
                                            </div>
                                            <CardDescription>{t.features.notifyDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <p className="text-sm text-muted-foreground">
                                                Import <code className="bg-muted px-1 rounded text-xs">notify</code> from <code className="bg-muted px-1 rounded text-xs">@/lib/notify</code> and call it anywhere.
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <Button size="sm" onClick={() => notify('Heads up', 'This is a default notification.')}>Default</Button>
                                                <Button size="sm" variant="outline" onClick={() => notify.success('Success', 'Operation completed.')}>Success</Button>
                                                <Button size="sm" variant="outline" onClick={() => notify.error('Error', 'Something went wrong.')}>Error</Button>
                                                <Button size="sm" variant="outline" onClick={() => notify.destructive('Deleted', 'This action cannot be undone.')}>Destructive</Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Empty & Loading States */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 text-muted-foreground"/>
                                                <CardTitle className="text-base">{t.features.loadingEmptyTitle}</CardTitle>
                                            </div>
                                            <CardDescription>{t.features.loadingEmptyDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex gap-1">
                                                {(['list', 'card', 'profile', 'table'] as const).map((v) => (
                                                    <Button key={v} size="sm" variant={loadingVariant === v ? 'default' : 'outline'} onClick={() => setLoadingVariant(v)} className="text-xs capitalize">{v}</Button>
                                                ))}
                                            </div>
                                            <div className="rounded-md border p-3">
                                                <LoadingState variant={loadingVariant} rows={2}/>
                                            </div>
                                            <Separator/>
                                            <EmptyState title="No items found" description="Try adjusting your search or add a new item."/>
                                        </CardContent>
                                    </Card>

                                    {/* Responsive Layout */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-2">
                                                <LayoutGrid className="h-4 w-4 text-muted-foreground"/>
                                                <CardTitle className="text-base">{t.features.layoutHelpersTitle}</CardTitle>
                                            </div>
                                            <CardDescription>{t.features.layoutHelpersDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <p className="text-xs text-muted-foreground font-medium">Grid (2 cols):</p>
                                            <Grid cols={2} gap="sm">
                                                <div className="rounded bg-muted p-2 text-center text-xs">A</div>
                                                <div className="rounded bg-muted p-2 text-center text-xs">B</div>
                                                <div className="rounded bg-muted p-2 text-center text-xs">C</div>
                                                <div className="rounded bg-muted p-2 text-center text-xs">D</div>
                                            </Grid>
                                            <p className="text-xs text-muted-foreground font-medium">SpaceBetween:</p>
                                            <SpaceBetween className="rounded border p-2">
                                                <span className="text-sm font-medium">Title</span>
                                                <Badge variant="outline">Status</Badge>
                                            </SpaceBetween>
                                            <p className="text-xs text-muted-foreground font-medium">Stack:</p>
                                            <Stack gap="sm">
                                                <div className="rounded bg-muted p-2 text-xs text-center">Item 1</div>
                                                <div className="rounded bg-muted p-2 text-xs text-center">Item 2</div>
                                                <div className="rounded bg-muted p-2 text-xs text-center">Item 3</div>
                                            </Stack>
                                        </CardContent>
                                    </Card>

                                    {/* Form Validation */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-2">
                                                <Wrench className="h-4 w-4 text-muted-foreground"/>
                                                <CardTitle className="text-base">{t.features.formValidationTitle}</CardTitle>
                                            </div>
                                            <CardDescription>{t.features.formValidationDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="grid gap-2">
                                                <Label htmlFor="demo-form-email" className="text-sm">Email *</Label>
                                                <Input
                                                    id="demo-form-email"
                                                    type="email"
                                                    placeholder="name@example.com"
                                                    value={demoForm.values.email}
                                                    onChange={(e) => demoForm.setValue('email', e.target.value)}
                                                    onBlur={() => demoForm.setFieldTouched('email')}
                                                    className={demoForm.errors.email ? 'border-destructive' : ''}
                                                />
                                                {demoForm.errors.email && <p className="text-destructive text-xs">{demoForm.errors.email}</p>}
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="demo-form-pass" className="text-sm">Password *</Label>
                                                <Input
                                                    id="demo-form-pass"
                                                    type="password"
                                                    placeholder="At least 6 characters"
                                                    value={demoForm.values.password}
                                                    onChange={(e) => demoForm.setValue('password', e.target.value)}
                                                    onBlur={() => demoForm.setFieldTouched('password')}
                                                    className={demoForm.errors.password ? 'border-destructive' : ''}
                                                />
                                                {demoForm.errors.password && <p className="text-destructive text-xs">{demoForm.errors.password}</p>}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={() => {
                                                    if (demoForm.validateAll()) {
                                                        notify.success('Form valid!', `Email: ${demoForm.values.email}`)
                                                        demoForm.reset()
                                                    } else {
                                                        notify.error('Validation failed', 'Fix the errors above.')
                                                    }
                                                }}>Submit</Button>
                                                <Button size="sm" variant="outline" onClick={demoForm.reset}>Reset</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="ai">
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between mb-2">
                                            <Bot className="h-8 w-8 text-primary"/>
                                            <Badge>Free Tier</Badge>
                                        </div>
                                        <CardTitle>{t.features.aiChatTitle}</CardTitle>
                                        <CardDescription>
                                            {t.features.aiChatDesc}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li>{t.features.aiChatLi1}</li>
                                            <li>{t.features.aiChatLi2}</li>
                                            <li>{t.features.aiChatLi3}</li>
                                            <li>{t.features.aiChatLi4}</li>
                                        </ul>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between mb-2">
                                            <Database className="h-8 w-8 text-primary"/>
                                            <Badge variant="outline">Analytics</Badge>
                                        </div>
                                        <CardTitle>{t.features.dashboardAnalyticsTitle}</CardTitle>
                                        <CardDescription>
                                            {t.features.dashboardAnalyticsDesc}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li>{t.features.dashboardAnalyticsLi1}</li>
                                            <li>{t.features.dashboardAnalyticsLi2}</li>
                                            <li>{t.features.dashboardAnalyticsLi3}</li>
                                            <li>{t.features.dashboardAnalyticsLi4}</li>
                                        </ul>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between mb-2">
                                            <Zap className="h-8 w-8 text-primary"/>
                                            <Badge variant="outline">Hooks</Badge>
                                        </div>
                                        <CardTitle>{t.features.customHooksTitle}</CardTitle>
                                        <CardDescription>
                                            {t.features.customHooksDesc}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-1.5">
                                            {[
                                                'useAuth', 'useProfile', 'useAI',
                                                'useChatHistory', 'useAnalytics', 'useTheme',
                                                'useSpeechToText', 'useMediaQuery', 'useSearch', 'useFormValidation',
                                            ].map((name) => (
                                                <Badge key={name} variant="secondary" className="text-xs font-mono">
                                                    {name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="starter">
                            <div className="space-y-6">
                                <p className="text-muted-foreground">
                                    {t.features.starterIntro}
                                </p>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* useMediaQuery */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-2">
                                                <Monitor className="h-4 w-4 text-muted-foreground"/>
                                                <CardTitle className="text-base">{t.features.responsiveUtilityTitle}</CardTitle>
                                            </div>
                                            <CardDescription>{t.features.responsiveUtilityDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                                                    <span className="text-muted-foreground">Breakpoint</span>
                                                    <Badge variant="secondary" className="font-mono">{breakpoint}</Badge>
                                                </div>
                                                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                                                    <span className="text-muted-foreground">Mobile?</span>
                                                    <Badge variant={isMobile ? 'default' : 'outline'}>{isMobile ? 'Yes' : 'No'}</Badge>
                                                </div>
                                                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                                                    <span className="text-muted-foreground">Desktop?</span>
                                                    <Badge variant={isDesktop ? 'default' : 'outline'}>{isDesktop ? 'Yes' : 'No'}</Badge>
                                                </div>
                                                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                                                    <span className="text-muted-foreground">Wide (1200+)?</span>
                                                    <Badge variant={isWide ? 'default' : 'outline'}>{isWide ? 'Yes' : 'No'}</Badge>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                                                <span className="text-muted-foreground flex items-center gap-1.5">
                                                    <Smartphone className="h-3.5 w-3.5"/>
                                                    Reduced Motion
                                                </span>
                                                <Badge variant={prefersReducedMotion ? 'default' : 'outline'}>
                                                    {prefersReducedMotion ? 'Enabled' : 'Disabled'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Resize your browser to see values update in real-time. Includes{' '}
                                                <code className="bg-muted px-1 rounded">useIsMobile</code>,{' '}
                                                <code className="bg-muted px-1 rounded">useIsDesktop</code>,{' '}
                                                <code className="bg-muted px-1 rounded">useBreakpoint</code>, and more.
                                            </p>
                                        </CardContent>
                                    </Card>

                                    {/* AsyncBoundary */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-2">
                                                <ShieldAlert className="h-4 w-4 text-muted-foreground"/>
                                                <CardTitle className="text-base">{t.features.asyncBoundaryTitle}</CardTitle>
                                            </div>
                                            <CardDescription>{t.features.asyncBoundaryDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <p className="text-sm text-muted-foreground">
                                                Wrap any component to handle loading and errors gracefully. Click the button to trigger a demo error:
                                            </p>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant={boundaryError ? 'destructive' : 'outline'} onClick={() => setBoundaryError(!boundaryError)}>
                                                    {boundaryError ? 'Error Active' : 'Trigger Error'}
                                                </Button>
                                            </div>
                                            <div className="rounded-lg border p-3">
                                                <ErrorBoundary
                                                    onReset={() => setBoundaryError(false)}
                                                >
                                                    <BuggyComponent shouldThrow={boundaryError}/>
                                                </ErrorBoundary>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Also supports custom loading fallbacks via <code className="bg-muted px-1 rounded">loadingVariant</code> prop (list, card, profile, table).
                                            </p>
                                        </CardContent>
                                    </Card>

                                    {/* createStore */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-2">
                                                <Store className="h-4 w-4 text-muted-foreground"/>
                                                <CardTitle className="text-base">{t.features.storeTitle}</CardTitle>
                                            </div>
                                            <CardDescription>{t.features.storeDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <SimpleStoreProvider>
                                                <StoreDemo/>
                                            </SimpleStoreProvider>
                                        </CardContent>
                                    </Card>

                                    {/* Demo Data */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-2">
                                                <HardDrive className="h-4 w-4 text-muted-foreground"/>
                                                <CardTitle className="text-base">{t.features.demoDataTitle}</CardTitle>
                                            </div>
                                            <CardDescription>{t.features.demoDataDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <p className="text-sm text-muted-foreground">
                                                Pre-built sample data for users, products, teams, and notifications. Import from <code className="bg-muted px-1 rounded text-xs">@/lib/demo-data</code>.
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {['demoUsers', 'demoProducts', 'demoTeamMembers', 'demoNotifications', 'demoConversations', 'demoMessages', 'demoDashboardStats'].map((name) => (
                                                    <Badge key={name} variant="secondary" className="text-xs font-mono">{name}</Badge>
                                                ))}
                                            </div>
                                            <Separator/>
                                            <p className="text-xs text-muted-foreground font-medium">Sample products ({demoProducts.length} items):</p>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="text-xs">Name</TableHead>
                                                        <TableHead className="text-xs">Category</TableHead>
                                                        <TableHead className="text-xs text-right">Price</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {demoProducts.slice(0, 4).map((p) => (
                                                        <TableRow key={p.id}>
                                                            <TableCell className="text-xs font-medium">{p.name}</TableCell>
                                                            <TableCell><Badge variant="outline" className="text-xs">{p.category}</Badge></TableCell>
                                                            <TableCell className="text-xs text-right">${p.price}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>

                                    {/* Team Members Demo */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground"/>
                                                <CardTitle className="text-base">{t.features.teamMembersTitle}</CardTitle>
                                            </div>
                                            <CardDescription>{t.features.teamMembersDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            {demoTeamMembers.map((m) => (
                                                <div key={m.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-2 w-2 rounded-full ${m.status === 'active' ? 'bg-green-500' : m.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'}`}/>
                                                        <div>
                                                            <p className="text-sm font-medium">{m.name}</p>
                                                            <p className="text-xs text-muted-foreground">{m.role}</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="secondary" className="text-xs">{m.tasksCompleted} tasks</Badge>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>

                                    {/* Notifications Demo */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-2">
                                                <Bell className="h-4 w-4 text-muted-foreground"/>
                                                <CardTitle className="text-base">{t.features.notificationsDataTitle}</CardTitle>
                                            </div>
                                            <CardDescription>{t.features.notificationsDataDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            {demoNotifications.map((n) => (
                                                <div key={n.id} className={`rounded-md border px-3 py-2 ${!n.read ? 'bg-primary/5 border-primary/20' : ''}`}>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-medium">{n.title}</p>
                                                        <span className="text-xs text-muted-foreground">{n.time}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{n.description}</p>
                                                </div>
                                            ))}
                                            <p className="text-xs text-muted-foreground pt-1">
                                                SQL seed script: <code className="bg-muted px-1 rounded">database/scripts/seed-demo-data.sql</code>
                                            </p>
                                        </CardContent>
                                    </Card>

                                    {/* Search + Sort */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-2">
                                                <ArrowUpDown className="h-4 w-4 text-muted-foreground"/>
                                                <CardTitle className="text-base">{t.features.searchSortTitle}</CardTitle>
                                            </div>
                                            <CardDescription>{t.features.searchSortDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <SearchFilter value={productQuery} onValueChange={setProductQuery} placeholder="Filter products..." debounce={150}/>
                                            <div className="flex flex-wrap gap-1">
                                                {([
                                                    {label: 'Name A-Z', key: 'name', dir: 'asc'},
                                                    {label: 'Name Z-A', key: 'name', dir: 'desc'},
                                                    {label: 'Price Low', key: 'price', dir: 'asc'},
                                                    {label: 'Price High', key: 'price', dir: 'desc'},
                                                ] as const).map(({label, key, dir}) => (
                                                    <Button
                                                        key={label}
                                                        size="sm"
                                                        variant={productSort?.key === key && productSort?.direction === dir ? 'default' : 'outline'}
                                                        className="text-xs"
                                                        onClick={() => setProductSort({key, direction: dir, type: key === 'price' ? 'numeric' : 'alphabetical'})}
                                                    >{label}</Button>
                                                ))}
                                            </div>
                                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                                {filteredProducts.map((p) => (
                                                    <div key={p.id} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
                                                        <span className="font-medium">{p.name}</span>
                                                        <span className="text-muted-foreground">${p.price}</span>
                                                    </div>
                                                ))}
                                                {filteredProducts.length === 0 && (
                                                    <p className="text-sm text-muted-foreground text-center py-2">No products match &quot;{productQuery}&quot;</p>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">{filteredProducts.length} of {demoProducts.length} products</p>
                                        </CardContent>
                                    </Card>

                                    {/* Export CSV */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-2">
                                                <Download className="h-4 w-4 text-muted-foreground"/>
                                                <CardTitle className="text-base">{t.features.exportButtonTitle}</CardTitle>
                                            </div>
                                            <CardDescription>{t.features.exportButtonDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="text-xs">Name</TableHead>
                                                        <TableHead className="text-xs">Role</TableHead>
                                                        <TableHead className="text-xs text-right">Tasks</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {demoTeamMembers.slice(0, 3).map((m) => (
                                                        <TableRow key={m.id}>
                                                            <TableCell className="text-xs font-medium">{m.name}</TableCell>
                                                            <TableCell className="text-xs">{m.role}</TableCell>
                                                            <TableCell className="text-xs text-right">{m.tasksCompleted}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                            <div className="flex gap-2">
                                                <ExportButton
                                                    data={demoTeamMembers}
                                                    columns={[{key: 'name', label: 'Name'}, {key: 'role', label: 'Role'}, {key: 'tasksCompleted', label: 'Tasks Completed'}]}
                                                    filename="team-members"
                                                />
                                                <ExportButton
                                                    data={demoTeamMembers}
                                                    columns={[{key: 'name', label: 'Name'}, {key: 'role', label: 'Role'}, {key: 'tasksCompleted', label: 'Tasks Completed'}]}
                                                    mode="copy"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Loading Indicators */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 text-muted-foreground"/>
                                                <CardTitle className="text-base">{t.features.loadingIndicatorsTitle}</CardTitle>
                                            </div>
                                            <CardDescription>{t.features.loadingIndicatorsDesc}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setTopLoaderDemo(true)
                                                        setTimeout(() => setTopLoaderDemo(false), 2000)
                                                    }}
                                                >Top Bar (2s)</Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setOverlayLoaderDemo(true)
                                                        setTimeout(() => setOverlayLoaderDemo(false), 2000)
                                                    }}
                                                >Overlay (2s)</Button>
                                                <Button size="sm" variant="outline" disabled={inlineLoaderDemo} onClick={() => {
                                                    setInlineLoaderDemo(true)
                                                    setTimeout(() => setInlineLoaderDemo(false), 2000)
                                                }}>
                                                    <InlineLoader loading={inlineLoaderDemo} size={14}/>
                                                    {inlineLoaderDemo ? 'Saving...' : 'Inline Spinner'}
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                <code className="bg-muted px-1 rounded">TopLoader</code> shows a slim bar at the top of the viewport.{' '}
                                                <code className="bg-muted px-1 rounded">OverlayLoader</code> blocks the entire screen.{' '}
                                                <code className="bg-muted px-1 rounded">InlineLoader</code> fits inside buttons.
                                            </p>
                                        </CardContent>
                                    </Card>

                                    {/* Responsive Grid */}
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center gap-2">
                                                <LayoutGrid className="h-4 w-4 text-muted-foreground"/>
                                                <CardTitle className="text-base">{t.features.responsiveGridTitle}</CardTitle>
                                            </div>
                                            <CardDescription>{t.features.responsiveGridDescPrefix}cols=&#123;&#123;sm:1, md:2, lg:3&#125;&#125;</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <Grid cols={{sm: 1, md: 2, lg: 3}} gap="sm">
                                                {['A', 'B', 'C', 'D', 'E', 'F'].map((letter) => (
                                                    <div key={letter} className="rounded bg-muted p-3 text-center text-sm font-medium">{letter}</div>
                                                ))}
                                            </Grid>
                                            <p className="text-xs text-muted-foreground">
                                                1 column on mobile, 2 on tablet, 3 on desktop. Also supports simple <code className="bg-muted px-1 rounded">cols=&#123;3&#125;</code>.
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <Separator/>

                    <div className="bg-muted/50 rounded-lg p-8 text-center space-y-4">
                        <h2 className="text-2xl font-bold">{t.features.ctaTitle}</h2>
                        <p className="text-muted-foreground">
                            {t.features.ctaSubtitle}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/about">
                                <Button size="lg" variant="outline">
                                    {t.features.learnMore}
                                    <ArrowRight className="ml-2 h-4 w-4"/>
                                </Button>
                            </Link>
                            {!user && (
                                <Link href="/signup">
                                    <Button size="lg">
                                        {t.home.getStarted}
                                        <ArrowRight className="ml-2 h-4 w-4"/>
                                    </Button>
                                </Link>
                            )}
                            {user && (
                                <Link href="/dashboard">
                                    <Button size="lg">
                                        {t.home.goToDashboard}
                                        <ArrowRight className="ml-2 h-4 w-4"/>
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>

                    <Alert>
                        <Info className="h-4 w-4"/>
                        <AlertTitle>{t.features.devTip}</AlertTitle>
                        <AlertDescription>
                            {t.features.devTipPre}<code
                            className="bg-muted px-1 rounded text-xs">app/</code>{t.features.devTipMid}<code
                            className="bg-muted px-1 rounded text-xs">page.tsx</code>{t.features.devTipPost}
                        </AlertDescription>
                    </Alert>
                </div>
            </div>

            {/* ---- Demo Modals ---- */}

            {/* Basic Modal */}
            <Modal open={basicModal.isOpen} onClose={basicModal.close} size="lg">
                <ModalHeader>
                    <ModalTitle>{t.features.basicModalTitle}</ModalTitle>
                    <ModalDescription>
                        {t.features.basicModalDesc}
                    </ModalDescription>
                </ModalHeader>
                <ModalBody>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="rounded-lg bg-muted p-4 space-y-1">
                            <h4 className="font-medium text-sm">{t.features.declarativeTitle}</h4>
                            <p className="text-xs text-muted-foreground">
                                {t.features.declarativeDesc}
                            </p>
                        </div>
                        <div className="rounded-lg bg-muted p-4 space-y-1">
                            <h4 className="font-medium text-sm">{t.features.programmaticTitle}</h4>
                            <p className="text-xs text-muted-foreground">
                                {t.features.programmaticDesc}
                            </p>
                        </div>
                        <div className="rounded-lg bg-muted p-4 space-y-1">
                            <h4 className="font-medium text-sm">{t.features.templatesTitle}</h4>
                            <p className="text-xs text-muted-foreground">
                                {t.features.templatesDesc}
                            </p>
                        </div>
                        <div className="rounded-lg bg-muted p-4 space-y-1">
                            <h4 className="font-medium text-sm">{t.features.accessibleTitle}</h4>
                            <p className="text-xs text-muted-foreground">
                                {t.features.accessibleDesc}
                            </p>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={basicModal.close}>{t.common.close}</Button>
                </ModalFooter>
            </Modal>

            {/* Form Modal with validation */}
            <FormModal
                open={formModal.isOpen}
                onClose={formModal.close}
                title={t.features.createAccountTitle}
                description={t.features.createAccountDesc}
                submitLabel={t.features.create}
                fields={[
                    {
                        name: 'name',
                        label: t.features.fullNameLabel,
                        placeholder: 'John Doe',
                        required: true,
                    },
                    {
                        name: 'email',
                        label: t.auth.email,
                        type: 'email',
                        placeholder: 'john@example.com',
                        required: true,
                    },
                    {
                        name: 'password',
                        label: t.auth.password,
                        type: 'password',
                        placeholder: 'At least 6 characters',
                        required: true,
                        validate: (v) => v.length < 6 ? t.features.passwordMinLength : undefined,
                    },
                    {
                        name: 'bio',
                        label: t.settings.bioLabel,
                        type: 'textarea',
                        placeholder: 'Tell us about yourself...',
                    },
                ]}
                onSubmit={(values) => {
                    setFormResult(`Submitted: ${values.name} (${values.email})`)
                }}
            />

            {/* Info Modal */}
            <InfoModal
                open={infoModal.isOpen}
                onClose={infoModal.close}
                title={t.features.howItWorksTitle}
                description={t.features.howItWorksDesc}
            />

            {/* Success Modal */}
            <SuccessModal
                open={successModal.isOpen}
                onClose={successModal.close}
                title={t.features.actionCompletedTitle}
                description={t.features.actionCompletedDesc}
            />

            {/* Error Modal */}
            <ErrorModal
                open={errorModal.isOpen}
                onClose={errorModal.close}
                title={t.features.somethingWrongTitle}
                description={t.features.somethingWrongDesc}
            />

            {/* Confirm Modal */}
            <ConfirmModal
                open={confirmModal.isOpen}
                onClose={confirmModal.close}
                onConfirm={() => setFormResult('Confirmed!')}
                title={t.features.areYouSureTitle}
                description={t.features.areYouSureDesc}
                confirmLabel={t.common.delete}
                variant="destructive"
            />
        </main>
    )
}
