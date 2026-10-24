'use client'

import { useSmoothScroll } from '@/hooks/useSmoothScroll'
import { Switch } from '@workspace/ui/ui/switch'
import { Label } from '@workspace/ui/ui/label'

interface SmoothScrollToggleProps {
  showLabel?: boolean
  className?: string
}

export function SmoothScrollToggle({ showLabel = true, className }: SmoothScrollToggleProps) {
  const { isEnabled, toggle } = useSmoothScroll()

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Switch
        id="smooth-scroll-toggle"
        checked={isEnabled}
        onCheckedChange={toggle}
        aria-label="Toggle Smooth Scroll"
      />
      {showLabel && (
        <Label htmlFor="smooth-scroll-toggle" className="cursor-pointer text-sm font-medium select-none">
          Smooth Scroll {isEnabled ? 'On' : 'Off'}
        </Label>
      )}
    </div>
  )
}
