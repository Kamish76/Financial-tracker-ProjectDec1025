import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(__dirname, '..')

describe('Milestone 4 Adversarial Challenge: Empirical Verification', () => {
  describe('1. Auth Page Error Styling & Contrast', () => {
    const authPath = path.join(ROOT, 'src/app/auth/page.tsx')
    const content = fs.readFileSync(authPath, 'utf8')

    it('ensures no green/emerald styling is used for error presentation', () => {
      // Find all occurrences of text-emerald or text-green
      const greenMatches = content.match(/text-(?:emerald|green)-\d+/g) || []
      // The only green matches allowed should be text-emerald-600 / text-emerald-400 strictly on success status
      for (const match of greenMatches) {
        expect(['text-emerald-600', 'text-emerald-400']).toContain(match)
      }

      // Check the error container block specifically
      const errorBlockMatch = content.match(/\{error \? \([\s\S]*?\) : null\}/)
      expect(errorBlockMatch).toBeTruthy()
      const errorBlock = errorBlockMatch![0]

      expect(errorBlock).not.toContain('emerald')
      expect(errorBlock).not.toContain('green')
      expect(errorBlock).toContain('role="alert"')
      expect(errorBlock).toContain('aria-live="assertive"')
      expect(errorBlock).toContain('text-red-600')
      expect(errorBlock).toContain('dark:text-red-400')
      expect(errorBlock).toContain('bg-red-50')
      expect(errorBlock).toContain('dark:bg-red-950/40')
    })

    it('ensures Supabase "Invalid login credentials" (without "Error" word) triggers red error state', () => {
      // Verify that result.error is directly assigned to setError, not checked against "Error"
      expect(content).toContain('if (result?.error) {')
      expect(content).toContain('setError(result.error);')
      // Ensure the old fragile heuristic message.includes('Error') is completely absent
      expect(content).not.toContain("message.includes('Error')")
      expect(content).not.toContain("message.includes('error')")
    })

    it('verifies success messages are cleanly isolated from error state', () => {
      const successBlockMatch = content.match(/\{successMessage \? \([\s\S]*?\) : null\}/)
      expect(successBlockMatch).toBeTruthy()
      const successBlock = successBlockMatch![0]

      expect(successBlock).toContain('role="status"')
      expect(successBlock).toContain('aria-live="polite"')
      expect(successBlock).toContain('text-emerald-600')
    })
  })

  describe('2. Dark Mode Utility Class Activation', () => {
    const themeTogglePath = path.join(ROOT, 'src/components/theme-toggle.tsx')
    const themeToggleContent = fs.readFileSync(themeTogglePath, 'utf8')
    const layoutPath = path.join(ROOT, 'src/app/layout.tsx')
    const layoutContent = fs.readFileSync(layoutPath, 'utf8')

    it('verifies theme-toggle.tsx calls document.documentElement.classList.toggle("dark")', () => {
      expect(themeToggleContent).toContain('document.documentElement.classList.toggle("dark"')
    })

    it('verifies layout.tsx initialThemeScript adds/removes or toggles "dark" class before hydration', () => {
      expect(layoutContent).toContain("document.documentElement.classList.add('dark')")
      expect(layoutContent).toContain("document.documentElement.classList.remove('dark')")
    })

    it('executes layout.tsx initialThemeScript across all environment conditions in simulated DOM', () => {
      // Extract script from layout.tsx
      const match = layoutContent.match(/const initialThemeScript = `([\s\S]*?)`;/)
      expect(match).toBeTruthy()
      const scriptCode = match![1]

      class MockClassList {
        private classes = new Set<string>()
        add(c: string) { this.classes.add(c) }
        remove(c: string) { this.classes.delete(c) }
        toggle(c: string, force?: boolean) {
          if (force === true) { this.classes.add(c); return true }
          if (force === false) { this.classes.delete(c); return false }
          if (this.classes.has(c)) { this.classes.delete(c); return false }
          this.classes.add(c); return true
        }
        contains(c: string) { return this.classes.has(c) }
      }

      function runScriptWithEnv(stored: string | null, prefersDark: boolean, throwOnStorage = false) {
        const classList = new MockClassList()
        const dataset: Record<string, string> = {}
        const mockStorage = {
          getItem: () => {
            if (throwOnStorage) throw new Error('SecurityError: LocalStorage denied')
            return stored
          }
        }
        const mockMatchMedia = () => ({
          matches: prefersDark
        })

        const context = {
          localStorage: mockStorage,
          window: { matchMedia: mockMatchMedia },
          document: {
            documentElement: {
              dataset,
              classList
            }
          }
        }

        const fn = new Function('localStorage', 'window', 'document', scriptCode)
        fn(context.localStorage, context.window, context.document)

        return { classList, dataset }
      }

      // Case 1: Stored 'dark'
      const res1 = runScriptWithEnv('dark', false)
      expect(res1.classList.contains('dark')).toBe(true)
      expect(res1.dataset.theme).toBe('dark')

      // Case 2: Stored 'light'
      const res2 = runScriptWithEnv('light', true)
      expect(res2.classList.contains('dark')).toBe(false)
      expect(res2.dataset.theme).toBe('light')

      // Case 3: No stored theme, OS prefers dark
      const res3 = runScriptWithEnv(null, true)
      expect(res3.classList.contains('dark')).toBe(true)
      expect(res3.dataset.theme).toBe('dark')

      // Case 4: No stored theme, OS prefers light
      const res4 = runScriptWithEnv(null, false)
      expect(res4.classList.contains('dark')).toBe(false)
      expect(res4.dataset.theme).toBe('light')

      // Case 5: LocalStorage access blocked
      const res5 = runScriptWithEnv(null, true, true)
      expect(res5.classList.contains('dark')).toBe(false)
      expect(res5.dataset.theme).toBe('light')
    })
  })

  describe('3. Modal Focus Trapping and Body Scroll Locking', () => {
    const modalPath = path.join(ROOT, 'src/components/wallet/add-transaction-modal.tsx')
    const modalContent = fs.readFileSync(modalPath, 'utf8')

    it('verifies body scroll locking implementation on open and restoration on unmount', () => {
      expect(modalContent).toContain("document.body.style.overflow = 'hidden'")
      expect(modalContent).toContain("document.body.style.overflow = originalOverflow")
    })

    it('verifies focus management: saves previousFocusedElementRef and restores it on close', () => {
      expect(modalContent).toContain('previousFocusedElementRef.current = document.activeElement as HTMLElement | null')
      expect(modalContent).toContain('previousFocusedElementRef.current.focus()')
    })

    it('verifies focus trapping logic handles Tab and Shift+Tab key cycling', () => {
      expect(modalContent).toContain("if (e.key === 'Tab')")
      expect(modalContent).toContain('if (e.shiftKey)')
      expect(modalContent).toContain('last.focus()')
      expect(modalContent).toContain('first.focus()')
    })

    it('verifies Escape key handling unconditionally dismisses dialog without being blocked by input/textarea', () => {
      const escIndex = modalContent.indexOf("if (e.key === 'Escape')")
      const inputCheckIndex = modalContent.indexOf("document.activeElement instanceof HTMLInputElement")

      expect(escIndex > -1).toBe(true)
      expect(inputCheckIndex > -1).toBe(true)
      // Escape key check MUST be prior to the input check so typing doesn't swallow Escape
      expect(escIndex < inputCheckIndex).toBe(true)
      expect(modalContent).toContain('onClose()')
    })

    it('verifies dialog accessibility semantics (role="dialog", aria-modal="true", aria-label)', () => {
      expect(modalContent).toContain('role="dialog"')
      expect(modalContent).toContain('aria-modal="true"')
      expect(modalContent).toContain('aria-label="Add Transaction"')
      expect(modalContent).toContain('tabIndex={-1}')
    })

    it('empirically evaluates math calculation engine edge cases', () => {
      // Extract evaluateMathExpression implementation and strip TS types
      const mathFuncMatch = modalContent.match(/function evaluateMathExpression\(expr: string\): number \{[\s\S]*?\n\}/)
      expect(mathFuncMatch).toBeTruthy()

      const jsCode = mathFuncMatch![0]
        .replace(/expr: string\): number/, 'expr)')
        .replace(/: \(number \| string\)\[\]/g, '')
        .replace(/: (?:number|string)\[\]/g, '')
        .replace(/ as number/g, '')
        .replace(/let curNum = ''/g, "let curNum = ''")

      const evaluateMathExpression = new Function(
        `return (${jsCode})`
      )() as (expr: string) => number

      // Test cases
      expect(evaluateMathExpression('100')).toBe(100)
      expect(evaluateMathExpression('10 + 20')).toBe(30)
      expect(evaluateMathExpression('10 - 25')).toBe(-15)
      expect(evaluateMathExpression('5 × 4')).toBe(20)
      expect(evaluateMathExpression('100 ÷ 4')).toBe(25)
      // Precedence: multiplication before addition
      expect(evaluateMathExpression('2 + 3 × 4')).toBe(14)
      expect(evaluateMathExpression('10 - 4 ÷ 2')).toBe(8)
      // Decimals
      expect(evaluateMathExpression('12.50 + 7.25')).toBe(19.75)
      // Consecutive operators (malformed expression safely evaluates to 0)
      expect(evaluateMathExpression('10 + + 5')).toBe(0)
      // Division by zero
      expect(evaluateMathExpression('10 ÷ 0')).toBe(0)
      // Empty or invalid input
      expect(evaluateMathExpression('')).toBe(0)
      expect(evaluateMathExpression('abc')).toBe(0)
      expect(evaluateMathExpression(' ')).toBe(0)
    })
  })

  describe('4. Navigation and Production Cleanup', () => {
    it('verifies persistent debug card is purged from organization page', () => {
      const orgPagePath = path.join(ROOT, 'src/app/(authenticated)/organizations/[id]/page.tsx')
      const orgPageContent = fs.readFileSync(orgPagePath, 'utf8')

      expect(orgPageContent).not.toContain('Debug (temporary)')
      expect(orgPageContent).not.toContain('debugInfo')
      expect(orgPageContent).not.toContain('lg:grid-cols-[1.1fr,1.2fr]')
    })

    it('verifies dead navigation links are removed from header and footer', () => {
      const headerPath = path.join(ROOT, 'src/components/header.tsx')
      const headerContent = fs.readFileSync(headerPath, 'utf8')
      const footerPath = path.join(ROOT, 'src/components/footer.tsx')
      const footerContent = fs.readFileSync(footerPath, 'utf8')

      expect(headerContent).not.toContain("href: '#pricing'")
      expect(headerContent).not.toContain("href: '/docs'")

      expect(footerContent).not.toContain("href: '/about'")
      expect(footerContent).not.toContain("href: '/blog'")
      expect(footerContent).not.toContain("href: '/careers'")
      expect(footerContent).not.toContain("href: '/docs'")
      expect(footerContent).not.toContain("href: '/support'")
      expect(footerContent).not.toContain("href: '/terms'")
      expect(footerContent).not.toContain("href: '/contact'")
    })
  })
})
