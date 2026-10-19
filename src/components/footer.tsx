'use client'

import Link from 'next/link'
import { Github, Linkedin, Mail, ShieldCheck } from 'lucide-react'

const footerLinks = {
  Product: [
    { label: 'Workspace Modes', href: '#modes' },
    { label: 'Features', href: '#features' },
    { label: 'Sign In / Register', href: '/auth' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Delete Account', href: '/delete-account' },
  ],
}

const socialLinks = [
  {
    icon: Github,
    href: 'https://github.com',
    label: 'GitHub',
  },
  {
    icon: Linkedin,
    href: 'https://linkedin.com',
    label: 'LinkedIn',
  },
  {
    icon: Mail,
    href: 'mailto:hello@orgfinance.com',
    label: 'Email',
  },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border/70 bg-card/40 py-12 mt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid gap-8 md:grid-cols-3 mb-8">
          {/* Brand Section */}
          <div className="col-span-1 space-y-3">
            <Link href="/" className="inline-flex items-center gap-2.5 rounded-xl border border-border/80 bg-background/60 px-3 py-1.5 hover:border-accent/50 transition-colors">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15 text-accent-strong">
                <ShieldCheck className="h-4 w-4" aria-hidden />
              </div>
              <span className="font-semibold tracking-tight text-foreground text-sm">
                OrgFinance
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Multi-tenant organization treasuries and personal wallet tracking built for clarity and accountability.
            </p>
          </div>

          {/* Links Sections */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-foreground mb-4">
                {category}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-border/50 my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {currentYear} OrgFinance. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            {socialLinks.map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noreferrer' : undefined}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label={label}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

