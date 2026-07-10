import { execute } from './db'

export async function sendEmail(params: {
  userId: number
  to: string
  subject: string
  html: string
  relatedType?: string
  relatedId?: string
}): Promise<void> {
  if (!params.to) return
  await execute(
    `INSERT INTO email_log (user_id, to_email, subject, body_html, related_type, related_id, status, sent_at) VALUES (?,?,?,?,?,?,?,?)`,
    [params.userId, params.to, params.subject, params.html, params.relatedType ?? '', params.relatedId ?? '', 'sent', new Date().toISOString()]
  )
}

export function emailTemplate(opts: {
  heading: string
  bodyLines: string[]
  ctaLabel?: string
  ctaHref?: string
}): string {
  const { heading, bodyLines, ctaLabel, ctaHref } = opts
  const paras = bodyLines
    .map(l => `<p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#374151;">${l}</p>`)
    .join('')
  const cta = ctaLabel && ctaHref
    ? `<a href="${ctaHref}" style="display:inline-block;margin-top:10px;padding:11px 22px;background:#16A34A;color:#ffffff;text-decoration:none;border-radius:8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;">${ctaLabel}</a>`
    : ''
  return `<table role="presentation" style="width:100%;border-collapse:collapse;background:#F8FAFC;padding:32px 0;">
  <tr><td align="center">
    <table role="presentation" style="width:100%;max-width:480px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
      <tr><td style="background:linear-gradient(135deg,#14532D,#16A34A);padding:26px 32px;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:19px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;">GuildWire</div>
      </td></tr>
      <tr><td style="padding:30px 32px;">
        <h1 style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:#111827;">${heading}</h1>
        ${paras}
        ${cta}
      </td></tr>
      <tr><td style="padding:14px 32px 20px;border-top:1px solid #F3F4F6;">
        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9CA3AF;">GuildWire · Automated notification</p>
      </td></tr>
    </table>
  </td></tr>
</table>`
}
