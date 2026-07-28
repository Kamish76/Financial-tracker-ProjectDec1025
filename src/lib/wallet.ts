const WALLET_MARKER = '[wallet]'

export function isWalletOrganization(description: string | null | undefined) {
  return description?.trim().toLowerCase().startsWith(WALLET_MARKER) ?? false
}

export function stripWalletMarker(description: string | null | undefined) {
  if (!description) {
    return null
  }

  const normalized = description.trim()
  if (!normalized.toLowerCase().startsWith(WALLET_MARKER)) {
    return normalized || null
  }

  return normalized.slice(WALLET_MARKER.length).trim().replace(/^[:\-\s]+/, '') || null
}

export function encodeWalletDescription(description: string | null | undefined) {
  const note = stripWalletMarker(description)
  return [WALLET_MARKER, note].filter(Boolean).join(' ')
}