"use client"

import { useEffect, useState } from "react"
import { searchCategories } from "@/lib/categories"
import { Input } from "@/components/ui/input"

type Category = {
  id: string
  normalized_name: string
  aliases?: string[]
}

type CategoryDropdownProps = {
  organizationId: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function CategoryDropdown({
  organizationId,
  value,
  onChange,
  placeholder = "Select or type category...",
}: CategoryDropdownProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Load categories on mount and when value changes
  useEffect(() => {
    const loadCategories = async () => {
      if (value.length < 2) {
        setCategories([])
        return
      }
      
      setIsLoading(true)
      const results = await searchCategories(organizationId, value)
      setCategories(results)
      setIsLoading(false)
    }

    loadCategories()
  }, [organizationId, value])

  return (
    <div className="space-y-2 relative">
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        className="w-full"
      />

      {showSuggestions && categories.length > 0 && (
        <div className="absolute z-10 w-full border rounded-md bg-white shadow-lg max-h-48 overflow-y-auto">
          {isLoading ? (
            <div className="p-2 text-sm text-gray-500">Loading...</div>
          ) : (
            <div className="py-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onChange(cat.normalized_name)
                    setShowSuggestions(false)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                >
                  <div className="font-medium">{cat.normalized_name}</div>
                  {cat.aliases && cat.aliases.length > 0 && (
                    <div className="text-xs text-gray-500">
                      Also: {cat.aliases.join(", ")}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
