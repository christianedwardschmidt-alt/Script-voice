import { NextRequest, NextResponse } from 'next/server'

function getResponse(msg: string): string {
  const lower = msg.toLowerCase()
  if (lower.includes('proposal') || lower.includes('saas')) {
    return `Here's a professional proposal outline:\n\n**Project Proposal: SaaS Dashboard Redesign**\n\n**Scope of Work**\n• Discovery & Research (Week 1–2)\n• Wireframes & IA (Week 3)\n• High-Fidelity Design — 15–20 screens (Week 4–6)\n• Prototype, Handoff & Docs (Week 7–8)\n\n**Investment: $8,000**\n• 50% on kickoff · 50% on delivery\n\n**Timeline: 8 weeks**`
  }
  if (lower.includes('tax') || lower.includes('deduction')) {
    return `**Estimated taxes on $96,200 freelance income:**\n\n• Self-Employment Tax: ~$13,600 (15.3%)\n• Federal Income Tax: ~$17,200\n• Total: ~$30,800\n\n**Top deductions:** Home office, software & tools, health insurance, SEP-IRA (up to $23k), education. Max your SEP-IRA to cut ~$7k from taxable income.`
  }
  if (lower.includes('follow-up') || lower.includes('email')) {
    return `**Follow-up email template:**\n\nSubject: Following up — [Project Name]\n\nHi [Name],\n\nI wanted to follow up on the proposal I sent on [date]. Happy to jump on a quick call to answer any questions.\n\nLooking forward to hearing from you!\n[Your name]`
  }
  if (lower.includes('price') || lower.includes('rate') || lower.includes('charge')) {
    return `**Pricing a mobile app design (25 screens + design system + handoff):**\n\n• 25 screens × $320–400 = $8,000–10,000\n• Design system = $2,500–4,000\n• Figma handoff = $1,500–4,000\n\n**Recommended: $12,000–18,000**\n\nFor a Series A+ client, price at the top end — they value quality and have budget.`
  }
  if (lower.includes('client')) {
    return `**Tips for winning clients:**\n\n• Niche down — specialists charge 2–3× more than generalists\n• Cold outreach with a custom Loom video gets 5–10× reply rates\n• Package services at 3 clear price points (Basic / Standard / Premium)\n• Always get 50% upfront before starting work`
  }
  if (lower.includes('invoice') || lower.includes('payment')) {
    return `**Invoice best practices:**\n\n• Always send invoices immediately on milestone completion\n• Net 14 terms work better than Net 30 for cash flow\n• Add a late fee clause (1.5%/month) to your contract\n• Use auto-reminders at 7, 3, and 1 day before due`
  }
  if (lower.includes('contract')) {
    return `**Essential contract clauses:**\n\n• Scope of work (detailed — prevents scope creep)\n• Revision limits (e.g., 2 rounds included)\n• Kill fee (25–50% if client cancels mid-project)\n• IP ownership transfers only on final payment\n• Net 14 payment terms with 1.5%/month late fee`
  }
  return `**Here's what I'd suggest:**\n\n• Define your goal clearly before starting\n• Set a timeline with 1.3× buffer built in\n• Document everything in writing\n• Price on value delivered, not hours spent\n\nAsk me about proposals, pricing, taxes, emails, contracts, or client management for more specific help.`
}

export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  return NextResponse.json({ answer: getResponse(q) })
}
