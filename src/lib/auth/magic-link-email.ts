import "server-only"

export type AuthEmailProvider = "resend" | "memory"
export type MagicLinkEmailDeliveryMode = "email_sent" | "email_captured" | "email_cooldown"

export interface SendMagicLinkEmailInput {
  email: string
  tenantSlug?: string
  verifyUrl: string
  expiresAt: string
}

export interface MagicLinkEmailRecord {
  email: string
  verifyUrl: string
  subject: string
  html: string
  text: string
  sentAt: string
}

declare global {
  var __nevarilMagicLinkOutbox: MagicLinkEmailRecord[] | undefined
}

function resolveAuthEmailProvider(): AuthEmailProvider {
  const configuredProvider = process.env.AUTH_EMAIL_PROVIDER ?? "resend"
  if (configuredProvider === "resend" || configuredProvider === "memory") {
    return configuredProvider
  }

  throw new Error(
    `Invalid AUTH_EMAIL_PROVIDER=${configuredProvider}. Expected "resend" or "memory".`
  )
}

function getAuthEmailFromAddress() {
  const fromAddress = process.env.AUTH_EMAIL_FROM
  if (!fromAddress) {
    throw new Error(
      "AUTH_EMAIL_FROM is required for Convex magic-link email delivery."
    )
  }

  return fromAddress
}

function getResendApiKey() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is required when AUTH_EMAIL_PROVIDER=resend."
    )
  }

  return apiKey
}

function buildMagicLinkEmailContent(input: SendMagicLinkEmailInput) {
  const subject = input.tenantSlug
    ? `Your sign-in link for ${input.tenantSlug}`
    : "Your sign-in link"
  const text = [
    "Use the sign-in link below to continue:",
    input.verifyUrl,
    "",
    `This link expires at ${input.expiresAt}.`,
  ].join("\n")
  const html = [
    "<p>Use the sign-in link below to continue:</p>",
    `<p><a href="${input.verifyUrl}">Sign in to Nevaril</a></p>`,
    `<p>This link expires at ${input.expiresAt}.</p>`,
  ].join("")

  return { subject, text, html }
}

function getMemoryOutbox() {
  if (!globalThis.__nevarilMagicLinkOutbox) {
    globalThis.__nevarilMagicLinkOutbox = []
  }

  return globalThis.__nevarilMagicLinkOutbox
}

export function getLatestMagicLinkEmail(email?: string) {
  const outbox = getMemoryOutbox()
  const items = email
    ? outbox.filter((item) => item.email === email)
    : outbox
  return items.at(-1) ?? null
}

export async function sendMagicLinkEmail(input: SendMagicLinkEmailInput): Promise<{
  deliveryMode: Exclude<MagicLinkEmailDeliveryMode, "email_cooldown">
}> {
  const provider = resolveAuthEmailProvider()
  const { subject, html, text } = buildMagicLinkEmailContent(input)
  const sentAt = new Date().toISOString()

  if (provider === "memory") {
    const outbox = getMemoryOutbox()
    outbox.push({
      email: input.email,
      verifyUrl: input.verifyUrl,
      subject,
      html,
      text,
      sentAt,
    })

    return { deliveryMode: "email_captured" }
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getResendApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getAuthEmailFromAddress(),
      to: [input.email],
      subject,
      html,
      text,
    }),
  })

  if (!response.ok) {
    throw new Error(
      `Resend email delivery failed with status ${response.status}.`
    )
  }

  return { deliveryMode: "email_sent" }
}
