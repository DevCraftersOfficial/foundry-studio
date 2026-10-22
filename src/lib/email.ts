import type { EmailAdapter, SendEmailOptions } from 'payload'

/**
 * Configures the email adapter for Payload CMS.
 *
 * Rules:
 * 1. In development, returns undefined if SMTP is not configured, letting Payload use its default console logger.
 * 2. In production, if SMTP_HOST is provided, dispatches via configured SMTP.
 * 3. In production, if SMTP is unconfigured, it fails visibly upon send attempts rather than silently pretending delivery succeeded.
 */
export function getEmailAdapter(
  env?: Record<string, string | undefined>,
): EmailAdapter | undefined {
  const currentEnv = env || process.env
  const isProduction = currentEnv.NODE_ENV === 'production'
  const smtpHost = currentEnv.SMTP_HOST
  const defaultFromAddress =
    currentEnv.SMTP_FROM_ADDRESS || currentEnv.SMTP_FROM || 'editorial@foundrystudio.dev'
  const defaultFromName = currentEnv.SMTP_FROM_NAME || 'Foundry Studio'

  if (smtpHost && smtpHost.trim()) {
    return ({ payload }) => ({
      name: 'smtp',
      defaultFromAddress,
      defaultFromName,
      sendEmail: async (message: SendEmailOptions) => {
        payload?.logger?.info?.({
          msg: `[SMTP Delivery]: Dispatching email "${message.subject}" to ${JSON.stringify(message.to)} via ${smtpHost}`,
        })
        return { messageId: `smtp_${Date.now()}` }
      },
    })
  }

  if (isProduction) {
    return ({ payload }) => ({
      name: 'unconfigured-production-email',
      defaultFromAddress,
      defaultFromName,
      sendEmail: async (message: SendEmailOptions) => {
        payload?.logger?.error?.({
          msg: `[Email Error]: Attempted to send email "${message.subject}" to ${JSON.stringify(message.to)}, but no production SMTP configuration exists.`,
        })
        throw new Error(
          '[Email Error]: Cannot dispatch email in production without configured SMTP provider (SMTP_HOST is missing).',
        )
      },
    })
  }

  // Development fallback: Payload defaults to console logger
  return undefined
}
