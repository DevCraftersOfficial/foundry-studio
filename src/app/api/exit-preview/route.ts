import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  try {
    const draft = await draftMode()
    draft.disable()
  } catch {
    // Gracefully handle in test environments where draftMode is unbound
  }

  const { searchParams } = new URL(request.url)
  const redirectTarget = searchParams.get('redirect') || searchParams.get('url')

  // Prevent open redirects: target must be a safe internal pathname on current host.
  // Must start with '/' and NOT with '//', and cannot contain backslashes or protocol schemes.
  if (
    redirectTarget &&
    redirectTarget.startsWith('/') &&
    !redirectTarget.startsWith('//') &&
    !redirectTarget.includes('\\') &&
    !redirectTarget.includes(':')
  ) {
    redirect(redirectTarget)
  }

  redirect('/')
}
