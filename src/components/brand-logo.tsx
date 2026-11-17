import { cn } from '@/lib/utils'

interface OrgFinanceLogoMarkProps {
  className?: string
  /** Force light wallet fill on fixed-dark surfaces such as the auth sidebar. */
  dark?: boolean
}

/**
 * 1:1 OrgFinance wallet-and-growth emblem matching the mobile brand palette.
 */
export function OrgFinanceLogoMark({ className, dark }: OrgFinanceLogoMarkProps) {
  const walletFillClass = dark ? 'fill-slate-50' : 'fill-slate-900 dark:fill-slate-50'

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <path
        className={walletFillClass}
        d="M15 12H45C47.209 12 49 13.791 49 16V17H15C13.343 17 12 18.343 12 20C12 21.657 13.343 23 15 23H47C50.314 23 53 25.686 53 29V46C53 49.314 50.314 52 47 52H15C11.686 52 9 49.314 9 46V18C9 14.686 11.686 12 15 12Z"
      />
      <path
        d="M11.5 50L23.5 38.5L28.5 43L37.5 34"
        stroke="#F97316"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M32 31.5L42 29L39.5 39L32 31.5Z" fill="#F97316" />
      <path d="M53 29.5L57 33V35H53V29.5Z" fill="#EA580C" />
      <path
        d="M56.5 33H49.5C46.462 33 44 35.462 44 38.5C44 41.538 46.462 44 49.5 44H56.5C57.328 44 58 43.328 58 42.5V34.5C58 33.672 57.328 33 56.5 33Z"
        fill="#F97316"
      />
      <circle className={walletFillClass} cx="49.5" cy="38.5" r="2.2" />
    </svg>
  )
}

interface BrandLogoProps {
  markClassName?: string
  textClassName?: string
}

/**
 * Horizontal OrgFinance lockup pairing the 1:1 mark with the wordmark.
 */
export function BrandLogo({ markClassName, textClassName }: BrandLogoProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <OrgFinanceLogoMark className={cn('h-6 w-6', markClassName)} />
      <span className={cn('tracking-tight text-sm text-foreground', textClassName)}>
        <span className="font-bold">Org</span>
        <span className="font-medium">Finance</span>
      </span>
    </span>
  )
}
