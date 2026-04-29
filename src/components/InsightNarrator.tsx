'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './InsightNarrator.module.css'

interface Props {
  chartType: string
  data: unknown
  label?: string
}

export default function InsightNarrator({ chartType, data, label = 'What does this mean?' }: Props) {
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>('')

  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'))
      setVoices(available)
      if (available.length > 0) setSelectedVoice(available[0].name)
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
  }, [])

  async function handleExplain() {
    if (explanation) { setOpen(o => !o); return }
    setOpen(true)
    setLoading(true)
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartType, data }),
      })
      const json = await res.json()
      setExplanation(json.explanation || 'Unable to generate explanation.')
    } catch {
      setExplanation('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleSpeak() {
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(explanation)
    utterance.rate = speed
    const voice = voices.find(v => v.name === selectedVoice)
    if (voice) utterance.voice = voice
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  function handleSpeedChange(newSpeed: number) {
    setSpeed(newSpeed)
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(explanation)
        utterance.rate = newSpeed
        const voice = voices.find(v => v.name === selectedVoice)
        if (voice) utterance.voice = voice
        utterance.onend = () => setSpeaking(false)
        window.speechSynthesis.speak(utterance)
        setSpeaking(true)
      }, 100)
    }
  }

  return (
    <div className={styles.wrap}>
      <button className={styles.trigger} onClick={handleExplain}>
        <span className={styles.triggerIcon}>💡</span>
        <span>{open && explanation ? 'Hide explanation' : label}</span>
        <span className={styles.triggerArrow}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className={styles.panel}>
          {loading ? (
            <div className={styles.loading}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.loadingText}>Analysing your data...</span>
            </div>
          ) : (
            <>
              <div className={styles.textWrap}>
                <div className={styles.textLabel}>AI Insight</div>
                <p className={styles.text}>{explanation}</p>
              </div>

              <div className={styles.controls}>
                <div className={styles.controlsLeft}>
                  {/* Play/Stop circular button */}
                  <button
                    className={`${styles.speakBtn} ${speaking ? styles.speakBtnActive : ''}`}
                    onClick={handleSpeak}
                    title={speaking ? 'Stop narration' : 'Listen to this insight'}
                  >
                    {speaking ? '■' : '▶'}
                  </button>

                  {/* Speaking wave animation */}
                  {speaking && (
                    <div className={styles.speakingWave}>
                      <span className={styles.speakingBar} />
                      <span className={styles.speakingBar} />
                      <span className={styles.speakingBar} />
                      <span className={styles.speakingBar} />
                    </div>
                  )}

                  {/* Speed pills */}
                  <div className={styles.speedGroup}>
                    {[0.75, 1, 1.25, 1.5].map(s => (
                      <button
                        key={s}
                        className={`${styles.speedBtn} ${speed === s ? styles.speedBtnActive : ''}`}
                        onClick={() => handleSpeedChange(s)}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.controlsRight}>
                  {/* Voice selector */}
                  {voices.length > 1 && (
                    <select
                      className={styles.voiceSelect}
                      value={selectedVoice}
                      onChange={e => setSelectedVoice(e.target.value)}
                    >
                      {voices.map(v => (
                        <option key={v.name} value={v.name}>{v.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}