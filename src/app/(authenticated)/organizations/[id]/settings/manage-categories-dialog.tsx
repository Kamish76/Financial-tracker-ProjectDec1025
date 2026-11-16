'use client'

import React, { useState, useEffect, useCallback, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Loader2,
  GitMerge,
} from 'lucide-react'
import {
  getOrganizationCategoriesByType,
  getUnlinkedTransactionCategories,
  addOrganizationCategory,
  updateOrganizationCategory,
  deleteOrganizationCategory,
  mergeOrganizationCategories,
} from '@/lib/categories'
import { type CategoryItem, type UnlinkedCategoryItem } from '@/lib/category-constants'

type ManageCategoriesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  onCategoriesChanged?: () => void
}

export function ManageCategoriesDialog({
  open,
  onOpenChange,
  organizationId,
  onCategoriesChanged,
}: ManageCategoriesDialogProps) {
  const [activeTab, setActiveTab] = useState<'income' | 'expense' | 'cleanup'>('income')
  const [incomeCategories, setIncomeCategories] = useState<CategoryItem[]>([])
  const [expenseCategories, setExpenseCategories] = useState<CategoryItem[]>([])
  const [unlinkedCategories, setUnlinkedCategories] = useState<UnlinkedCategoryItem[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [mergingId, setMergingId] = useState<string | null>(null)
  const [mergeTargetId, setMergeTargetId] = useState<string>('')
  const [unifyTargets, setUnifyTargets] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => {
      setError(null)
    }, 30000)
    return () => clearTimeout(timer)
  }, [error])

  const loadCategories = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [res, unlinked] = await Promise.all([
        getOrganizationCategoriesByType(organizationId),
        getUnlinkedTransactionCategories(organizationId),
      ])
      setIncomeCategories(res.income)
      setExpenseCategories(res.expense)
      setUnlinkedCategories(unlinked)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load categories.')
    } finally {
      setIsLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    if (open && organizationId) {
      loadCategories()
    }
  }, [open, organizationId, loadCategories])

  const handleAdd = () => {
    if (!newCategoryName.trim() || activeTab === 'cleanup') return
    setError(null)
    startTransition(async () => {
      const res = await addOrganizationCategory(
        organizationId,
        newCategoryName.trim(),
        activeTab
      )
      if (res.error) {
        setError(res.error)
      } else {
        setNewCategoryName('')
        await loadCategories()
        onCategoriesChanged?.()
      }
    })
  }

  const handleStartEdit = (cat: CategoryItem) => {
    setMergingId(null)
    setEditingId(cat.id)
    setEditingName(cat.display_name || cat.normalized_name)
    setError(null)
  }

  const handleStartMerge = (cat: CategoryItem) => {
    const others = [...incomeCategories, ...expenseCategories].filter((c) => c.id !== cat.id)
    setEditingId(null)
    setMergingId(cat.id)
    setMergeTargetId(others[0]?.id || '')
    setError(null)
  }

  const handleConfirmMerge = (sourceCategoryId: string) => {
    if (!mergeTargetId) return
    setError(null)
    startTransition(async () => {
      const res = await mergeOrganizationCategories(
        organizationId,
        { categoryId: sourceCategoryId },
        mergeTargetId
      )
      if (res.error) {
        setError(res.error)
      } else {
        setMergingId(null)
        setMergeTargetId('')
        await loadCategories()
        onCategoriesChanged?.()
      }
    })
  }

  const handleUnifyRaw = (rawName: string) => {
    const allCats = [...incomeCategories, ...expenseCategories]
    const targetId = unifyTargets[rawName] || allCats[0]?.id
    if (!targetId) return
    setError(null)
    startTransition(async () => {
      const res = await mergeOrganizationCategories(
        organizationId,
        { rawName },
        targetId
      )
      if (res.error) {
        setError(res.error)
      } else {
        await loadCategories()
        onCategoriesChanged?.()
      }
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
    setError(null)
  }

  const handleSaveEdit = (categoryId: string) => {
    if (!editingName.trim()) return
    setError(null)
    startTransition(async () => {
      const res = await updateOrganizationCategory(
        organizationId,
        categoryId,
        editingName.trim()
      )
      if (res.error) {
        setError(res.error)
      } else {
        setEditingId(null)
        setEditingName('')
        await loadCategories()
        onCategoriesChanged?.()
      }
    })
  }

  const handleDelete = (categoryId: string) => {
    setError(null)
    startTransition(async () => {
      const res = await deleteOrganizationCategory(organizationId, categoryId)
      if (res.error) {
        setError(res.error)
      } else {
        await loadCategories()
        onCategoriesChanged?.()
      }
    })
  }

  const allCategories = [...incomeCategories, ...expenseCategories]
  const currentList = activeTab === 'income' ? incomeCategories : expenseCategories

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            <span>Manage Categories</span>
          </DialogTitle>
          <DialogDescription>
            Customize, rename, or unify transaction categories across your records.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switching: Income vs Expense vs Cleanup */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border mt-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('income')
              setEditingId(null)
              setMergingId(null)
              setError(null)
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'income'
                ? 'bg-emerald-500 text-emerald-950 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ArrowDownRight className="h-3.5 w-3.5" />
            <span>Income ({incomeCategories.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('expense')
              setEditingId(null)
              setMergingId(null)
              setError(null)
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'expense'
                ? 'bg-rose-500 text-rose-950 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>Expense ({expenseCategories.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('cleanup')
              setEditingId(null)
              setMergingId(null)
              setError(null)
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'cleanup'
                ? 'bg-amber-500 text-amber-950 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <GitMerge className="h-3.5 w-3.5" />
            <span>Unify ({unlinkedCategories.length})</span>
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Categories / Cleanup List */}
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 my-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading categories...</span>
            </div>
          ) : activeTab === 'cleanup' ? (
            unlinkedCategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                All transaction categories are linked and unified.
              </div>
            ) : (
              unlinkedCategories.map((item) => {
                const selectedTarget = unifyTargets[item.raw_name] || allCategories[0]?.id || ''
                return (
                  <div
                    key={item.raw_name}
                    className="flex flex-col gap-2 px-3.5 py-2.5 rounded-xl border border-border/80 bg-card/60"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{item.raw_name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {item.count} {item.count === 1 ? 'tx' : 'txs'}
                      </span>
                    </div>
                    {allCategories.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedTarget}
                          onChange={(e) =>
                            setUnifyTargets((prev) => ({
                              ...prev,
                              [item.raw_name]: e.target.value,
                            }))
                          }
                          className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                        >
                          {allCategories.map((target) => (
                            <option key={target.id} value={target.id}>
                              {target.display_name || target.normalized_name} ({target.type})
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-8 px-3 text-xs"
                          onClick={() => handleUnifyRaw(item.raw_name)}
                          disabled={isPending || !selectedTarget}
                        >
                          Unify
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Add an Income or Expense category first to unify into it.
                      </span>
                    )}
                  </div>
                )
              })
            )
          ) : currentList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No {activeTab} categories yet. Add one below!
            </div>
          ) : (
            currentList.map((cat) => {
              const isEditing = editingId === cat.id
              const isMerging = mergingId === cat.id
              const mergeTargets = allCategories.filter((c) => c.id !== cat.id)
              return (
                <div
                  key={cat.id}
                  className="flex flex-col gap-2 px-3.5 py-2.5 rounded-xl border border-border/80 bg-card/60 hover:bg-card transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(cat.id)
                            if (e.key === 'Escape') handleCancelEdit()
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                          onClick={() => handleSaveEdit(cat.id)}
                          disabled={isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={handleCancelEdit}
                          disabled={isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-medium">
                            {cat.display_name || cat.normalized_name}
                          </span>
                          {!cat.is_custom && (
                            <span className="text-[10px] font-semibold text-muted-foreground bg-secondary/80 px-1.5 py-0.5 rounded">
                              Core
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          {mergeTargets.length > 0 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Merge into another category"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => handleStartMerge(cat)}
                              disabled={isPending}
                            >
                              <GitMerge className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Rename category"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => handleStartEdit(cat)}
                            disabled={isPending}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Delete category"
                            className="h-7 w-7 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                            onClick={() => handleDelete(cat.id)}
                            disabled={isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>

                  {isMerging && (
                    <div className="flex items-center gap-2 pt-1.5 border-t border-border/60">
                      <span className="text-xs text-muted-foreground shrink-0">Merge into:</span>
                      <select
                        value={mergeTargetId}
                        onChange={(e) => setMergeTargetId(e.target.value)}
                        className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                      >
                        {mergeTargets.map((target) => (
                          <option key={target.id} value={target.id}>
                            {target.display_name || target.normalized_name} ({target.type})
                          </option>
                        ))}
                      </select>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                        onClick={() => handleConfirmMerge(cat.id)}
                        disabled={isPending || !mergeTargetId}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setMergingId(null)}
                        disabled={isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Add New Category Row (hidden on Cleanup tab) */}
        {activeTab !== 'cleanup' && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder={`New ${activeTab} category...`}
              className="h-9 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAdd()
                }
              }}
              disabled={isPending || isLoading}
            />
            <Button
              type="button"
              onClick={handleAdd}
              disabled={!newCategoryName.trim() || isPending || isLoading}
              className={`h-9 px-4 font-semibold text-xs gap-1.5 ${
                activeTab === 'income'
                  ? 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400'
                  : 'bg-rose-500 text-rose-950 hover:bg-rose-400'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
