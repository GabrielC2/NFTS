import { NextRequest, NextResponse } from 'next/server'
import OpenAI, { toFile } from 'openai'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not set in environment variables' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { imageBase64, mimeType, prompt } = body

    if (!imageBase64 || !prompt) {
      return NextResponse.json(
        { error: 'Missing imageBase64 or prompt' },
        { status: 400 }
      )
    }

    const openai = new OpenAI({ apiKey })

    // Convert base64 to Buffer
    const imageBuffer = Buffer.from(imageBase64, 'base64')

    // Convert Buffer to File for OpenAI
    const imageFile = await toFile(imageBuffer, 'base.png', {
      type: mimeType || 'image/png',
    })

    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: imageFile,
      prompt,
      n: 1,
      size: '1024x1024',
    })

    // 🔐 Safe TypeScript handling
    const imageData = response.data?.[0]

    if (!imageData) {
      return NextResponse.json(
        { error: 'No image returned from OpenAI' },
        { status: 500 }
      )
    }

    if (imageData.b64_json) {
      return NextResponse.json({ b64: imageData.b64_json })
    }

    if (imageData.url) {
      return NextResponse.json({ url: imageData.url })
    }

    return NextResponse.json(
      { error: 'Unexpected OpenAI response format' },
      { status: 500 }
    )

  } catch (err: any) {
    console.error('Generate error:', err)

    if (err?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key or no access to gpt-image-1' },
        { status: 401 }
      )
    }

    if (err?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit hit — wait and retry' },
        { status: 429 }
      )
    }

    if (err?.status === 400) {
      return NextResponse.json(
        { error: 'Prompt rejected by content policy' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: err?.message || 'Generation failed' },
      { status: 500 }
    )
  }
}