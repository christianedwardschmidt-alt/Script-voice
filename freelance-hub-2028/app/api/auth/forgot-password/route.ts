import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    const user = await queryOne<{ id: number; name: string }>(
      `SELECT id, name FROM users WHERE email = ?`, [email.toLowerCase()]
    )

    // Always return success to avoid revealing whether email exists
    if (!user) {
      return NextResponse.json({ ok: true, emailSent: false })
    }

    // Delete any existing reset tokens for this email
    await execute(`DELETE FROM password_resets WHERE email = ?`, [email.toLowerCase()])

    const token = generateToken()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
    await execute(
      `INSERT INTO password_resets (token, email, expires_at) VALUES (?, ?, ?)`,
      [token, email.toLowerCase(), expiresAt]
    )

    const origin = request.headers.get('origin') ?? request.headers.get('x-forwarded-host') ?? ''
    const resetUrl = `${origin}/reset-password?token=${token}`

    // Try to send email via Resend if API key is configured
    let emailSent = false
    if (process.env.RESEND_API_KEY) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'GuildWire <noreply@guildwire.io>',
            to: [email.toLowerCase()],
            subject: 'Reset your GuildWire password',
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 20px">
                <div style="font-size:22px;font-weight:800;margin-bottom:8px">
                  <span style="color:#0A1A0F">Guild</span><span style="color:#16A34A">Wire</span>
                </div>
                <p style="color:#444;margin-bottom:24px">Hi ${user.name}, click the button below to reset your password. This link expires in 1 hour.</p>
                <a href="${resetUrl}" style="display:inline-block;background:#16A34A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700">Reset password</a>
                <p style="color:#999;font-size:12px;margin-top:24px">If you didn't request this, ignore this email.</p>
              </div>
            `,
          }),
        })
        emailSent = res.ok
      } catch { /* email failed, fall through */ }
    }

    return NextResponse.json({ ok: true, emailSent, resetUrl: emailSent ? null : resetUrl })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Failed: ${msg}` }, { status: 500 })
  }
}
