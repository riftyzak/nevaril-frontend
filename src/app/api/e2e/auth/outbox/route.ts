import { NextRequest, NextResponse } from "next/server"

import { getLatestMagicLinkEmail } from "@/lib/auth/magic-link-email"
import { isE2EBootstrapEnabled } from "@/lib/dev/e2e-bootstrap"

export async function GET(request: NextRequest) {
  if (!isE2EBootstrapEnabled() || process.env.AUTH_EMAIL_PROVIDER !== "memory") {
    return NextResponse.json({ error: "Not found." }, { status: 404 })
  }

  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase() || undefined
  const message = getLatestMagicLinkEmail(email)

  if (!message) {
    return NextResponse.json({ error: "No magic-link email found." }, { status: 404 })
  }

  return NextResponse.json({
    email: message.email,
    verifyUrl: message.verifyUrl,
    subject: message.subject,
    sentAt: message.sentAt,
  })
}
