'use client'

import { useState, useRef, useCallback } from 'react'

// ─── TRAIT POOLS ─────────────────────────────────────────
const POOLS: Record<string, string[]> = {
  background: [
    'deep space galaxy with colorful nebula background',
    'vibrant neon city at night background',
    'lush tropical jungle background',
    'golden sunset desert dunes background',
    'underwater ocean scene background',
    'snowy mountain peaks background',
    'cherry blossom garden background',
    'cyberpunk alley with neon lights background',
    'abstract colorful geometric pattern background',
    'dark stormy sky with lightning background',
    'bright solid sky blue background',
    'pastel gradient pink to purple background',
  ],
  hat: [
    'wearing a shiny gold crown',
    'wearing a classic black top hat with red band',
    'wearing a brown cowboy hat',
    'wearing a red beanie with white pompom',
    'wearing a navy NY baseball cap',
    'wearing a white chef hat',
    'wearing a viking helmet with horns',
    'wearing a pirate hat with skull',
    'wearing a colorful jester hat',
    'wearing a wizard hat with stars',
    'no hat',
    'no hat',
  ],
  glasses: [
    'wearing sleek black sunglasses',
    'wearing red and blue 3D glasses',
    'wearing round gold wire-frame glasses',
    'wearing heart-shaped pink sunglasses',
    'wearing a golden monocle',
    'wearing futuristic LED glasses',
    'wearing classic aviator sunglasses',
    'no glasses',
    'no glasses',
  ],
  fur: [
    'with vibrant golden yellow fur',
    'with deep blue fur',
    'with bright purple fur',
    'with hot pink fur',
    'with neon green fur',
    'with silver white fur',
    'with original brown fur',
    'with dark crimson red fur',
    'with cyan teal fur',
    'with orange fur',
  ],
  chain: [
    'wearing a thick gold chain with diamond pendant',
    'wearing a silver chain necklace',
    'wearing multiple layered gold chains',
    'wearing a platinum chain with gem',
    'no chain',
    'no chain',
  ],
  expression: [
    'with a big happy toothy smile',
    'with a cool serious expression',
    'with a surprised wide-eyed look',
    'with a laughing open mouth expression',
    'with a winking playful expression',
    'with a determined fierce look',
    'with a smug smirk',
  ],
  clothes: [
    'wearing a black leather biker jacket',
    'wearing a colorful hawaiian shirt',
    'wearing an elegant black tuxedo with bow tie',
    'wearing a red hooded sweatshirt',
    'wearing a traditional japanese kimono',
    'wearing futuristic silver armor',
    'wearing a denim jacket with patches',
    'wearing a suit and tie',
    'no shirt',
  ],
  earring: [
    'with a gold hoop earring',
    'with a diamond stud earring',
    'with no earring',
    'with no earring',
  ],
}

const TRAIT_LABELS: Record<string, string> = {
  background: '🌈 Background',
  hat: '🎩 Hat',
  glasses: '👓 Glasses',
  fur: '🎨 Fur Color',
  chain: '📿 Chain',
  expression: '😀 Expression',
  clothes: '👕 Clothes',
  earring: '💎 Earring',
}

function rnd<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

interface NFTResult {
  id: number
  dataUrl: string
  prompt: string
}

// ─── COMPONENT ───────────────────────────────────────────
export default function Home() {
  const [baseImage, setBaseImage] = useState<{ b64: string; mime: string; preview: string } | null>(null)
  const [activeTraits, setActiveTraits] = useState<Set<string>>(new Set(['background', 'hat', 'glasses', 'fur', 'chain', 'expression', 'clothes']))
  const [count, setCount] = useState(3)
  const [extraPrompt, setExtraPrompt] = useState('')
  const [results, setResults] = useState<NFTResult[]>([])
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0, status: '' })
  const [modal, setModal] = useState<NFTResult | null>(null)
  const [styleDesc, setStyleDesc] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ─── FILE UPLOAD ─────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    if (file.size > 5 * 1024 * 1024) { alert('Max 5MB'); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const b64 = dataUrl.split(',')[1]
      setBaseImage({ b64, mime: file.type || 'image/png', preview: dataUrl })
      setStyleDesc(null) // reset style cache
    }
    reader.readAsDataURL(file)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  // ─── BUILD PROMPT ────────────────────────────────────────
  const buildPrompt = (style: string) => {
    const parts = [...activeTraits].map(t => rnd(POOLS[t])).filter(Boolean)
    const extra = extraPrompt.trim()
    return `Generate a cartoon NFT monkey character. Art style: ${style}. 
Traits to apply: ${parts.join('; ')}.${extra ? ` Additional style: ${extra}.` : ''}
Keep the same species (monkey/chimp), same cute cartoon aesthetic, same art style. Square format, centered character.`
  }

  // ─── GENERATE ────────────────────────────────────────────
  const generate = async () => {
    if (!baseImage || generating) return
    setGenerating(true)
    setResults([])
    setProgress({ done: 0, total: count, status: 'Analyzing style...' })

    try {
      // Step 1: Analyze style (cached per image)
      let style = styleDesc
      if (!style) {
        const analyzeRes = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: baseImage.b64, mimeType: baseImage.mime })
        })
        const analyzeData = await analyzeRes.json()
        if (!analyzeRes.ok) throw new Error(analyzeData.error || 'Style analysis failed')
        style = analyzeData.styleDescription
        setStyleDesc(style)
      }

      // Step 2: Generate each variation
      for (let i = 0; i < count; i++) {
        setProgress({ done: i, total: count, status: `Generating #${String(i + 1).padStart(3, '0')}...` })

        const prompt = buildPrompt(style!)

        const genRes = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: baseImage.b64,
            mimeType: baseImage.mime,
            prompt
          })
        })

        const genData = await genRes.json()

        if (!genRes.ok) {
          console.error(`NFT #${i + 1} failed:`, genData.error)
          setResults(prev => [...prev, { id: i + 1, dataUrl: '', prompt }])
          continue
        }

        const dataUrl = genData.b64
          ? `data:image/png;base64,${genData.b64}`
          : genData.url

        setResults(prev => [...prev, { id: i + 1, dataUrl, prompt }])
        setProgress({ done: i + 1, total: count, status: `Generated #${String(i + 1).padStart(3, '0')} ✓` })
      }

    } catch (err: any) {
      alert('Error: ' + (err.message || 'Unknown error'))
    } finally {
      setGenerating(false)
      setProgress(p => ({ ...p, status: 'Done!' }))
    }
  }

  // ─── DOWNLOAD ────────────────────────────────────────────
  const download = (r: NFTResult) => {
    const a = document.createElement('a')
    a.href = r.dataUrl
    a.download = `nft-${String(r.id).padStart(3, '0')}.png`
    a.click()
  }

  const pct = progress.total > 0 ? Math.round(progress.done / progress.total * 100) : 0

  // ─── RENDER ──────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0c0c0e', color: '#f2f2f4', fontFamily: 'system-ui,sans-serif' }}>

      {/* HEADER */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 2rem', borderBottom: '1px solid #2a2a30', background: '#141416', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
          Monkey<span style={{ color: '#00e5a0' }}>Gen</span>
        </div>
        <div style={{ background: '#00e5a0', color: '#000', fontSize: '0.55rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          gpt-image-1
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: '#5a5a6e' }}>
          <span>Generated <strong style={{ color: '#f2f2f4' }}>{results.filter(r => r.dataUrl).length}</strong></span>
          <span>~Cost <strong style={{ color: '#f2f2f4' }}>${(results.filter(r => r.dataUrl).length * 0.042).toFixed(2)}</strong></span>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', flex: 1, minHeight: 0 }}>

        {/* SIDEBAR */}
        <aside style={{ background: '#141416', borderRight: '1px solid #2a2a30', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.4rem', overflowY: 'auto', maxHeight: 'calc(100vh - 62px)' }}>

          {/* BASE IMAGE */}
          <div>
            <SectionTitle>Base Image</SectionTitle>
            <div
              onDrop={onDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              style={{ border: '1.5px dashed #2a2a30', borderRadius: '6px', padding: '1.2rem', textAlign: 'center', cursor: 'pointer', background: '#1a1a1e', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#00e5a0')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a30')}
            >
              {baseImage ? (
                <img src={baseImage.preview} alt="base" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '4px' }} />
              ) : (
                <div style={{ color: '#5a5a6e', fontSize: '0.8rem', lineHeight: 1.6 }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>🐒</div>
                  Drop or click to upload base NFT<br />
                  <small style={{ opacity: 0.5 }}>PNG · JPG · max 5MB</small>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>

          {/* COUNT */}
          <div>
            <SectionTitle>Quantity</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '0.35rem' }}>
              {[1, 3, 5, 10, 20].map(n => (
                <button key={n} onClick={() => setCount(n)} style={{ background: count === n ? '#00e5a0' : '#1a1a1e', border: `1px solid ${count === n ? '#00e5a0' : '#2a2a30'}`, color: count === n ? '#000' : '#5a5a6e', borderRadius: '6px', padding: '0.5rem', fontSize: '0.82rem', fontWeight: count === n ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {n}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '0.65rem', color: '#5a5a6e', marginTop: '0.4rem' }}>💡 Start with 1–3 to test before generating more</p>
          </div>

          {/* TRAITS */}
          <div>
            <SectionTitle>Traits to Vary</SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {Object.entries(TRAIT_LABELS).map(([id, label]) => {
                const on = activeTraits.has(id)
                return (
                  <button key={id} onClick={() => {
                    setActiveTraits(prev => {
                      const n = new Set(prev)
                      n.has(id) ? n.delete(id) : n.add(id)
                      return n
                    })
                  }} style={{ background: on ? 'rgba(0,229,160,0.1)' : '#1a1a1e', border: `1px solid ${on ? '#00e5a0' : '#2a2a30'}`, color: on ? '#00e5a0' : '#5a5a6e', borderRadius: '20px', padding: '0.28rem 0.75rem', fontSize: '0.72rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* EXTRA PROMPT */}
          <div>
            <SectionTitle>Extra Prompt (optional)</SectionTitle>
            <textarea
              value={extraPrompt}
              onChange={e => setExtraPrompt(e.target.value)}
              placeholder="e.g. cyberpunk, neon, dark art, pixel style..."
              style={{ background: '#1a1a1e', border: '1px solid #2a2a30', borderRadius: '6px', color: '#f2f2f4', padding: '0.6rem 0.85rem', fontFamily: 'inherit', fontSize: '0.78rem', outline: 'none', width: '100%', resize: 'vertical', minHeight: '65px', lineHeight: 1.5 }}
              onFocus={e => (e.target.style.borderColor = '#00e5a0')}
              onBlur={e => (e.target.style.borderColor = '#2a2a30')}
            />
          </div>

          {/* COST */}
          <div style={{ background: 'rgba(0,184,255,0.06)', border: '1px solid rgba(0,184,255,0.2)', borderRadius: '6px', padding: '0.6rem 0.85rem', fontSize: '0.72rem', color: '#00b8ff', display: 'flex', justifyContent: 'space-between' }}>
            <span>Estimated cost</span>
            <strong>~${(count * 0.042).toFixed(2)}</strong>
          </div>

          {/* GENERATE BUTTON */}
          <button
            onClick={generate}
            disabled={!baseImage || generating}
            style={{ background: (!baseImage || generating) ? '#2a2a30' : '#00e5a0', color: (!baseImage || generating) ? '#5a5a6e' : '#000', border: 'none', borderRadius: '6px', padding: '0.9rem', fontSize: '1rem', fontWeight: 700, cursor: (!baseImage || generating) ? 'not-allowed' : 'pointer', width: '100%', letterSpacing: '0.05em', transition: 'all 0.2s', marginTop: 'auto' }}
          >
            {generating ? `⏳ ${progress.status}` : '⚡ GENERATE'}
          </button>

        </aside>

        {/* GALLERY */}
        <main style={{ display: 'flex', flexDirection: 'column' }}>

          {/* TOOLBAR */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.8rem 1.3rem', borderBottom: '1px solid #2a2a30', background: '#141416' }}>
            <div style={{ background: 'rgba(0,229,160,0.08)', border: '1px solid #00e5a0', color: '#00e5a0', padding: '0.3rem 0.9rem', borderRadius: '20px', fontSize: '0.72rem' }}>
              All ({results.filter(r => r.dataUrl).length})
            </div>
          </div>

          {/* PROGRESS */}
          {generating && (
            <div style={{ padding: '0.55rem 1.3rem', borderBottom: '1px solid #2a2a30' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#5a5a6e', marginBottom: '0.28rem' }}>
                <span>{progress.status}</span>
                <span>{pct}%</span>
              </div>
              <div style={{ height: '2px', background: '#2a2a30', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg,#00e5a0,#00b8ff)', width: `${pct}%`, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}

          {/* GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '2px', background: '#2a2a30', padding: '2px', flex: 1, alignContent: 'start', overflowY: 'auto' }}>

            {results.length === 0 && !generating && (
              <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1rem', color: '#5a5a6e' }}>
                <div style={{ fontSize: '3rem', opacity: 0.2 }}>🎨</div>
                <p style={{ fontSize: '0.82rem', textAlign: 'center', lineHeight: 1.7 }}>
                  Upload your base NFT and<br />generate real AI variations
                </p>
              </div>
            )}

            {/* Skeleton loaders during generation */}
            {generating && Array.from({ length: count - results.length }).map((_, i) => (
              <div key={`skel-${i}`} style={{ background: '#1a1a1e', aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                <div style={{ width: '28px', height: '28px', border: '2px solid #2a2a30', borderTopColor: '#00e5a0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <div style={{ fontSize: '0.58rem', color: '#5a5a6e' }}>generating...</div>
              </div>
            ))}

            {/* Results */}
            {results.map(r => (
              <div key={r.id} onClick={() => r.dataUrl && setModal(r)} style={{ background: '#1a1a1e', aspectRatio: '1', position: 'relative', overflow: 'hidden', cursor: r.dataUrl ? 'pointer' : 'default', group: 'true' } as any}>
                {r.dataUrl ? (
                  <>
                    <img src={r.dataUrl} alt={`NFT #${r.id}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', color: '#00e5a0', fontSize: '0.58rem', fontWeight: 600, padding: '2px 7px', borderRadius: '3px' }}>
                      #{String(r.id).padStart(3, '0')}
                    </div>
                    <div className="card-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.85) 0%,transparent 55%)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'flex-end', padding: '0.6rem', gap: '0.35rem' }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                    >
                      <button onClick={ev => { ev.stopPropagation(); setModal(r) }} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontSize: '0.6rem', padding: '0.32rem', borderRadius: '4px', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>VIEW</button>
                      <button onClick={ev => { ev.stopPropagation(); download(r) }} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', fontSize: '0.6rem', padding: '0.32rem', borderRadius: '4px', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>⬇ DL</button>
                    </div>
                  </>
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'rgba(255,80,50,0.07)' }}>
                    <div style={{ fontSize: '1.5rem' }}>❌</div>
                    <div style={{ fontSize: '0.58rem', color: '#ff6b35' }}>Failed</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* MODAL */}
      {modal && (
        <div onClick={() => setModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#141416', border: '1px solid #2a2a30', borderRadius: '10px', width: '100%', maxWidth: '480px', padding: '1.8rem', position: 'relative' }}>
            <button onClick={() => setModal(null)} style={{ position: 'absolute', top: '0.9rem', right: '0.9rem', background: '#1a1a1e', border: '1px solid #2a2a30', color: '#5a5a6e', width: '26px', height: '26px', borderRadius: '50%', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            <div style={{ color: '#00e5a0', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>NFT #{String(modal.id).padStart(3, '0')}</div>
            <img src={modal.dataUrl} alt="" style={{ width: '100%', borderRadius: '8px', border: '1px solid #2a2a30', marginBottom: '0.75rem' }} />
            <div style={{ background: '#1a1a1e', border: '1px solid #2a2a30', borderRadius: '4px', padding: '0.6rem 0.8rem', fontSize: '0.68rem', color: '#5a5a6e', lineHeight: 1.5, maxHeight: '80px', overflowY: 'auto', marginBottom: '0.9rem' }}>
              {modal.prompt}
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button onClick={() => download(modal)} style={{ flex: 2, background: '#00e5a0', border: 'none', color: '#000', padding: '0.65rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>⬇ Download PNG</button>
              <button onClick={() => setModal(null)} style={{ flex: 1, background: '#1a1a1e', border: '1px solid #2a2a30', color: '#f2f2f4', padding: '0.65rem', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        button { font-family: inherit; }
      `}</style>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#00e5a0', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
      {children}
      <div style={{ flex: 1, height: '1px', background: '#2a2a30' }} />
    </div>
  )
}
