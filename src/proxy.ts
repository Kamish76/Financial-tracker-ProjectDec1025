import { updateSession } from '@/lib/middleware'
import { type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export default proxy
