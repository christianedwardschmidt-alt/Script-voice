import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { Resend } from 'resend'
import db from '@/lib/db'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    const user = db
      .prepare(`SELECT id, name FROM users WHERE email = ?`)
      .get(email.toLowerCase().trim()) as { id: number; name: string } | undefined

    // Always return success to avoid leaking whether an email exists
    if (!user) {
      return NextResponse.json({ ok: true })
    }

    // Delete any existing tokens for this user
    db.prepare(`DELETE FROM password_reset_tokens WHERE user_id = ?`).run(user.id)

    const token = randomBytes(32).toString('hex')
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    db.prepare(
      `INSERT INTO password_reset_tokens (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`
    ).run(token, user.id, now, expiresAt)

    const origin = request.headers.get('origin') ?? request.nextUrl.origin
    const resetUrl = `${origin}/reset-password?token=${token}`

    await resend.emails.send({
      from: 'GuildWire <onboarding@resend.dev>',
      to: email.toLowerCase().trim(),
      subject: 'Reset your GuildWire password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <div style="text-align:center;margin-bottom:28px">
            <div style="display:inline-block;width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#15803d,#16a34a);line-height:48px;text-align:center">
              <span style="color:#fff;font-weight:900;font-size:16px">GW</span>
            </div>
            <div style="margin-top:12px;font-size:22px;font-weight:800;letter-spacing:-0.5px">
              <span style="color:#0d1017">Guild</span><span style="color:#16a34a">Wire</span>
            </div>
          </div>

          <h1 style="font-size:20px;font-weight:700;color:#0f1117;margin-bottom:8px">Reset your password</h1>
          <p style="font-size:14px;color:#6b7280;line-height:1.6;margin-bottom:24px">
            Hi ${user.name}, we received a request to reset your password.
            Click the button below — this link expires in 1 hour.
          </p>

          <a href="${resetUrl}"
            style="display:block;text-align:center;padding:13px 24px;background:linear-gradient(135deg,#15803d,#16a34a);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px">
            Reset my password
          </a>

          <p style="margin-top:20px;font-size:12px;color:#9ca3af;line-height:1.6">
            If you didn't request this, you can safely ignore this email.<br>
            Or copy this link: <a href="${resetUrl}" style="color:#16a34a">${resetUrl}</a>
          </p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Request failed: ${msg}` }, { status: 500 })
  }
}
