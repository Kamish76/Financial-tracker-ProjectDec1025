'use client'

import React, { useState, useSyncExternalStore } from 'react'
import { ArrowDown, ArrowUp, Eye, EyeOff, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type DashboardSection = {
  id: string
  label: string
  node: React.ReactNode
}

type LayoutConfig = {
  order: string[]
  hidden: string[]
}

const EMPTY_CONFIG = 'default'

function parseLayoutConfig(raw: string, defaultIds: string[]): LayoutConfig {
  if (!raw || raw === EMPTY_CONFIG) {
    return { order: defaultIds, hidden: [] }
  }
  try {
    const parsed = JSON.parse(raw) as Partial<LayoutConfig>
    const validIds = new Set(defaultIds)
    const savedOrder = Array.isArray(parsed.order)
      ? parsed.order.filter((id): id is string => typeof id === 'string' && validIds.has(id))
      : []
    const missingIds = defaultIds.filter((id) => !savedOrder.includes(id))
    const hidden = Array.isArray(parsed.hidden)
      ? parsed.hidden.filter((id): id is string => typeof id === 'string' && validIds.has(id))
      : []
    return { order: [...savedOrder, ...missingIds], hidden }
  } catch {
    return { order: defaultIds, hidden: [] }
  }
}

export function CustomizableDashboard({
  organizationId,
  sections,
}: {
  organizationId: string
  sections: DashboardSection[]
}) {
  const [isCustomizing, setIsCustomizing] = useState(false)
  const storageKey = `orfinance:dashboard-layout:${organizationId}`
  const defaultIds = sections.map((s) => s.id)

  const rawConfig = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {}
      const handler = () => onStoreChange()
      window.addEventListener('storage', handler)
      window.addEventListener('orfinance:layout-change', handler)
      return () => {
        window.removeEventListener('storage', handler)
        window.removeEventListener('orfinance:layout-change', handler)
      }
    },
    () => (typeof window === 'undefined' ? EMPTY_CONFIG : window.localStorage.getItem(storageKey) ?? EMPTY_CONFIG),
    () => EMPTY_CONFIG
  )

  const config = parseLayoutConfig(rawConfig, defaultIds)

  const saveConfig = (next: LayoutConfig) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(storageKey, JSON.stringify(next))
    window.dispatchEvent(new Event('orfinance:layout-change'))
  }

  const resetConfig = () => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(storageKey)
    window.dispatchEvent(new Event('orfinance:layout-change'))
  }

  const sectionMap = new Map(sections.map((s) => [s.id, s]))
  const orderedSections = config.order
    .map((id) => sectionMap.get(id))
    .filter((s): s is DashboardSection => Boolean(s))
  const hiddenSet = new Set(config.hidden)
  const visibleSections = orderedSections.filter((s) => !hiddenSet.has(s.id))
  const hiddenSections = orderedSections.filter((s) => hiddenSet.has(s.id))

  const moveSection = (id: string, direction: -1 | 1) => {
    const visibleIds = visibleSections.map((s) => s.id)
    const idx = visibleIds.indexOf(id)
    const targetIdx = idx + direction
    if (idx < 0 || targetIdx < 0 || targetIdx >= visibleIds.length) return

    const swapId = visibleIds[targetIdx]
    const nextOrder = [...config.order]
    const a = nextOrder.indexOf(id)
    const b = nextOrder.indexOf(swapId)
    if (a !== -1 && b !== -1) {
      ;[nextOrder[a], nextOrder[b]] = [nextOrder[b], nextOrder[a]]
      saveConfig({ ...config, order: nextOrder })
    }
  }

  const toggleVisibility = (id: string) => {
    const nextHidden = hiddenSet.has(id)
      ? config.hidden.filter((h) => h !== id)
      : [...config.hidden, id]
    saveConfig({ ...config, hidden: nextHidden })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {isCustomizing && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetConfig}
            className="gap-1.5 text-xs text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Layout
          </Button>
        )}
        <Button
          type="button"
          variant={isCustomizing ? 'default' : 'outline'}
          size="sm"
          onClick={() => setIsCustomizing((v) => !v)}
          className="gap-1.5 text-xs"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {isCustomizing ? 'Done Customizing' : 'Customize Layout'}
        </Button>
      </div>

      {isCustomizing && hiddenSections.length > 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground mr-1">Hidden sections:</span>
          {hiddenSections.map((section) => (
            <Button
              key={section.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => toggleVisibility(section.id)}
              className="h-7 gap-1.5 text-xs"
            >
              <Eye className="h-3.5 w-3.5" />
              Show {section.label}
            </Button>
          ))}
        </div>
      )}

      {visibleSections.map((section, idx) => (
        <div key={section.id} className={isCustomizing ? 'relative rounded-xl ring-1 ring-border/80 p-2 bg-muted/10' : undefined}>
          {isCustomizing && (
            <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-border/60 px-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.label}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={idx === 0}
                  onClick={() => moveSection(section.id, -1)}
                  title="Move up"
                  aria-label={`Move ${section.label} up`}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={idx === visibleSections.length - 1}
                  onClick={() => moveSection(section.id, 1)}
                  title="Move down"
                  aria-label={`Move ${section.label} down`}
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => toggleVisibility(section.id)}
                  title="Hide section"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  Hide
                </Button>
              </div>
            </div>
          )}
          {section.node}
        </div>
      ))}
    </div>
  )
}
