'use client'

import { useState } from 'react'
import styles from './ReportForm.module.css'

const ISSUES = [
  { id: 'window', label: 'Window', sub: 'Cracked or broken', value: 'Window is damaged', icon: '🪟' },
  { id: 'stove', label: 'Stove', sub: 'Not functioning', value: 'Stove is not working', icon: '🍳' },
  { id: 'heating', label: 'Heating', sub: 'No heat or loss', value: 'Heating is not functioning', icon: '🔥' },
  { id: 'plumbing', label: 'Plumbing', sub: 'Leak or blockage', value: 'Plumbing issue', icon: '🚿' },
  { id: 'electric', label: 'Electricity', sub: 'Power or wiring', value: 'Electrical issue', icon: '⚡' },
  { id: 'other', label: 'Other', sub: 'Something else', value: 'Other issue', icon: '🔧' },
]

type ContactType = 'whatsapp' | 'email'
type Step = 'form' | 'success'

export default function ReportForm() {
  const [step, setStep] = useState<Step>('form')
  const [name, setName] = useState('')
  const [selectedIssue, setSelectedIssue] = useState('')
  const [description, setDescription] = useState('')
  const [contactType, setContactType] = useState<ContactType>('whatsapp')
  const [contact, setContact] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [refNumber, setRefNumber] = useState('')

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Please enter your full name'
    if (!selectedIssue) e.issue = 'Please select an issue category'
    if (!contact.trim()) e.contact = contactType === 'whatsapp' ? 'Please enter your WhatsApp number' : 'Please enter your email address'
    if (contactType === 'email' && contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      e.contact = 'Please enter a valid email address'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, issue: selectedIssue, description, contact, contactType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setRefNumber(data.refNumber)
      setStep('success')
    } catch (err: unknown) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to send. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setStep('form')
    setName('')
    setSelectedIssue('')
    setDescription('')
    setContact('')
    setErrors({})
    setRefNumber('')
  }

  if (step === 'success') {
    const firstName = name.trim().split(' ')[0]
    const issueLower = selectedIssue.toLowerCase()
    return (
      <div className={styles.successWrap}>
        <div className={styles.successIcon}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M5 14.5l6.5 6.5L23 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className={styles.successTitle}>Got it, {firstName}.</h2>
        <p className={styles.successBody}>
          Your report about the <strong>{issueLower}</strong> has been received.
          We've sent a confirmation to your {contactType === 'whatsapp' ? 'WhatsApp' : 'email'} and
          your property manager has been notified.
        </p>
        <div className={styles.refPill}>{refNumber}</div>
        <div className={styles.successMeta}>
          Expected response within 24 hours
        </div>
        <button className={styles.resetBtn} onClick={reset}>Submit another report</button>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>Report an issue</h2>
        <p className={styles.formSub}>We'll confirm receipt immediately.</p>
      </div>

      {/* Name */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="name">Your full name</label>
        <input
          id="name"
          className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
          type="text"
          placeholder="e.g. Sarah Müller"
          value={name}
          onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
          autoComplete="name"
        />
        {errors.name && <p className={styles.errorMsg}>{errors.name}</p>}
      </div>

      {/* Issue tiles */}
      <div className={styles.field}>
        <label className={styles.label}>Issue category</label>
        <div className={styles.tiles}>
          {ISSUES.map(issue => (
            <button
              key={issue.id}
              type="button"
              className={`${styles.tile} ${selectedIssue === issue.value ? styles.tileSelected : ''}`}
              onClick={() => { setSelectedIssue(issue.value); setErrors(p => ({ ...p, issue: '' })) }}
            >
              <span className={styles.tileIcon}>{issue.icon}</span>
              <span className={styles.tileLabel}>{issue.label}</span>
              <span className={styles.tileSub}>{issue.sub}</span>
            </button>
          ))}
        </div>
        {errors.issue && <p className={styles.errorMsg}>{errors.issue}</p>}
      </div>

      {/* Description */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">
          Description <span className={styles.optional}>(optional)</span>
        </label>
        <textarea
          id="description"
          className={styles.textarea}
          placeholder="Briefly describe the problem, when it started, how severe it is…"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      {/* Contact */}
      <div className={styles.field}>
        <label className={styles.label}>How should we reach you?</label>
        <div className={styles.contactToggle}>
          <button
            type="button"
            className={`${styles.toggleBtn} ${contactType === 'whatsapp' ? styles.toggleActive : ''}`}
            onClick={() => { setContactType('whatsapp'); setContact(''); setErrors(p => ({ ...p, contact: '' })) }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{flexShrink:0}}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.124 1.524 5.855L0 24l6.266-1.504A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.369l-.36-.214-3.724.894.936-3.614-.235-.373A9.818 9.818 0 1112 21.818z"/>
            </svg>
            WhatsApp
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${contactType === 'email' ? styles.toggleActive : ''}`}
            onClick={() => { setContactType('email'); setContact(''); setErrors(p => ({ ...p, contact: '' })) }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
            </svg>
            Email
          </button>
        </div>
        <input
          className={`${styles.input} ${errors.contact ? styles.inputError : ''}`}
          type={contactType === 'email' ? 'email' : 'tel'}
          placeholder={contactType === 'whatsapp' ? '+49 170 000 0000' : 'your@email.com'}
          value={contact}
          onChange={e => { setContact(e.target.value); setErrors(p => ({ ...p, contact: '' })) }}
          autoComplete={contactType === 'email' ? 'email' : 'tel'}
        />
        {errors.contact && <p className={styles.errorMsg}>{errors.contact}</p>}
      </div>

      {errors.submit && (
        <div className={styles.submitError}>{errors.submit}</div>
      )}

      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? (
          <span className={styles.spinner} />
        ) : (
          <>
            Send report
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8h12M9 4l5 4-5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </>
        )}
      </button>

      <p className={styles.privacy}>
        Your contact details are only used to confirm your report and will not be shared.
      </p>
    </form>
  )
}
