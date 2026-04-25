import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, issue, description, contact, contactType } = body

    if (!name || !issue || !contact || !contactType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const webhookUrl = process.env.N8N_WEBHOOK_URL
    if (!webhookUrl) {
      console.error('N8N_WEBHOOK_URL is not set')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const refNumber = `NC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`

    const payload = {
      name,
      firstName: name.trim().split(' ')[0],
      issue,
      description: description || '',
      contact,
      contactType,
      refNumber,
      submittedAt: new Date().toISOString(),
    }

    const n8nRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!n8nRes.ok) {
      console.error('n8n webhook error:', n8nRes.status, await n8nRes.text())
      return NextResponse.json({ error: 'Failed to forward to automation' }, { status: 502 })
    }

    return NextResponse.json({ success: true, refNumber })
  } catch (err) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
