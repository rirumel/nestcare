import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { chartType, data, language = 'en' } = await req.json()

    const langInstruction = language === 'de'
      ? 'Antworte ausschließlich auf Deutsch. Verwende einfache, klare Sprache.'
      : 'Respond only in English. Use simple, clear language.'

    const prompts: Record<string, string> = {
      trends: `You are a friendly property management analyst. ${langInstruction}
Data: ${JSON.stringify(data)}
In exactly 3 short sentences: what is the most reported issue, whether reports are trending up or down, and one practical recommendation. No bullet points. No jargon.`,

      distribution: `You are a friendly property management analyst. ${langInstruction}
Data: ${JSON.stringify(data)}
In exactly 3 short sentences: which issue dominates, how spread the problems are, and what this tells the landlord. No bullet points. No jargon.`,

      seasonal: `You are a friendly property management analyst. ${langInstruction}
Data: ${JSON.stringify(data)}
In exactly 3 short sentences: which season is worst, which issue is most seasonal, and when the landlord should prepare in advance. No bullet points. No jargon.`,

      weekly: `You are a friendly property management analyst. ${langInstruction}
Data: ${JSON.stringify(data)}
In exactly 3 short sentences: which day is busiest, which is quietest, and what this means for response planning. No bullet points. No jargon.`,

      predictions: `You are a friendly property management analyst. ${langInstruction}
Data: ${JSON.stringify(data)}
In exactly 3 short sentences: which issue needs attention soonest, how confident the prediction is, and one action the landlord should take now. No bullet points. No jargon.`,

      anomalies: `You are a friendly property management analyst. ${langInstruction}
Data: ${JSON.stringify(data)}
In exactly 3 short sentences: what is spiking, why this is unusual, and how urgently the landlord should act. No bullet points. No jargon.`,
    }

    const prompt = prompts[chartType]
    if (!prompt) {
      return NextResponse.json({ error: 'Unknown chart type' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('')

    return NextResponse.json({ explanation: text })
  } catch (err) {
    console.error('Explain API error:', err)
    return NextResponse.json({ error: 'Failed to generate explanation' }, { status: 500 })
  }
}