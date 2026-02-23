import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { toFile } from 'openai'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY not set in environment variables' }, { status: 500 })

    const { imageBase64, mimeType, prompt } = await req.json()
    if (!imageBase64 || !prompt) return NextResponse.json({ error: 'Missing imageBase64 or prompt' }, { status: 400 })

    const openai = new OpenAI({ apiKey })

    // Convert base64 to Buffer then to File for the edits endpoint
    const imageBuffer = Buffer.from(imageBase64, 'base64')
    const imageFile = await toFile(imageBuffer, 'base.png', { type: mimeType || 'image/png' })

    // Use gpt-image-1 edits — the best model for style-consistent variations
    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: imageFile,
      prompt,
      n: 1,
      size: '1024x1024',
    })

    const imageData = response.data[0]

    // gpt-image-1 returns b64_json
    if (imageData.b64_json) {
      return NextResponse.json({ b64: imageData.b64_json })
    }
    if (imageData.url) {
      return NextResponse.json({ url: imageData.url })
    }

    return NextResponse.json({ error: 'No image in response' }, { status: 500 })

  } catch (err: any) {
    console.error('Generate error:', err)

    // Handle specific OpenAI errors
    if (err?.status === 401) return NextResponse.json({ error: 'Invalid API key or no access to gpt-image-1' }, { status: 401 })
    if (err?.status === 429) return NextResponse.json({ error: 'Rate limit hit — wait a moment and retry' }, { status: 429 })
    if (err?.status === 400) return NextResponse.json({ error: 'Prompt rejected by content policy — try different traits' }, { status: 400 })

    return NextResponse.json({ error: err?.message || 'Generation failed' }, { status: 500 })
  }
}
