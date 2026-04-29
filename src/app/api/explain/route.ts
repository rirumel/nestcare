import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { chartType, data } = await req.json()

    const prompts: Record<string, string> = {
      trends: `You are a friendly property management analyst explaining data to a non-technical landlord.
Here is the daily report trend data for the last 90 days: ${JSON.stringify(data)}
In exactly 3 short sentences, explain: what is the most reported issue, whether reports are going up or down, and one practical recommendation. Use simple everyday language. No technical jargon. No bullet points.`,

      distribution: `You are a friendly property management analyst explaining data to a non-technical landlord.
Here is the breakdown of maintenance issues by category: ${JSON.stringify(data)}
In exactly 3 short sentences, explain: which issue dominates, how spread out the problems are, and what this tells the landlord about their property. Use simple everyday language. No technical jargon. No bullet points.`,

      seasonal: `You are a friendly property management analyst explaining data to a non-technical landlord.
Here is seasonal pattern data showing which months have more maintenance issues: ${JSON.stringify(data)}
In exactly 3 short sentences, explain: which season is worst, which issue is most seasonal, and when the landlord should prepare in advance. Use simple everyday language. No technical jargon. No bullet points.`,

      weekly: `You are a friendly property management analyst explaining data to a non-technical landlord.
Here is the data showing which days of the week get the most maintenance reports: ${JSON.stringify(data)}
In exactly 3 short sentences, explain: which day is busiest, which day is quietest, and what this means for staffing or response planning. Use simple everyday language. No technical jargon. No bullet points.`,

      predictions: `You are a friendly property management analyst explaining data to a non-technical landlord.
Here is predictive maintenance forecast data: ${JSON.stringify(data)}
In exactly 3 short sentences, explain: which issue needs attention soonest, how confident the prediction is, and one action the landlord should take now. Use simple everyday language. No technical jargon. No bullet points.`,

      anomalies: `You are a friendly property management analyst explaining data to a non-technical landlord.
Here is anomaly detection data showing unusual spikes in maintenance reports: ${JSON.stringify(data)}
In exactly 3 short sentences, explain: what is spiking, why this is unusual compared to normal, and how urgently the landlord should act. Use simple everyday language. No technical jargon. No bullet points.`,
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