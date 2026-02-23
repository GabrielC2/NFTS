import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY not set in environment variables' }, { status: 500 })

    const { imageBase64, mimeType } = await req.json()
    if (!imageBase64) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    const openai = new OpenAI({ apiKey })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType || 'image/png'};base64,${imageBase64}`,
              detail: 'low'
            }
          },
          {
            type: 'text',
            text: 'Describe this cartoon character art style in 3 sentences. Focus on: line thickness, coloring technique (flat/gradient/cell shading), character proportions, overall aesthetic, and any distinctive visual features. Be specific and technical so an AI image generator can replicate it.'
          }
        ]
      }]
    })

    const styleDescription = response.choices[0]?.message?.content || 'flat vector cartoon style with clean black outlines, cell shading, and cute proportions'

    return NextResponse.json({ styleDescription })
  } catch (err: any) {
    console.error('Analyze error:', err)
    return NextResponse.json({ error: err?.message || 'Analysis failed' }, { status: 500 })
  }
}
