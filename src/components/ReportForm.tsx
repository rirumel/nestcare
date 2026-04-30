'use client'

import { useState } from 'react'
import styles from './ReportForm.module.css'
import { useLanguage } from '@/context/LanguageContext'
import ThemeLanguageBar from './ThemeLanguageBar'

const ISSUES = (t: ReturnType<typeof useLanguage>['t']) => [
  { id: 'window', label: t.form.issues.window, sub: t.form.issues.windowSub, value: 'Window is damaged', icon: '🪟' },
  { id: 'stove', label: t.form.issues.stove, sub: t.form.issues.stoveSub, value: 'Stove is not working', icon: '🍳' },
  { id: 'heating', label: t.form.issues.heating, sub: t.form.issues.heatingSub, value: 'Heating is not functioning', icon: '🔥' },
  { id: 'plumbing', label: t.form.issues.plumbing, sub: t.form.issues.plumbingSub, value: 'Plumbing issue', icon: '🚿' },
  { id: 'electric', label: t.form.issues.electricity, sub: t.form.issues.electricitySub, value: 'Electrical issue', icon: '⚡' },
  { id: 'other', label: t.form.issues.other, sub: t.form.issues.otherSub, value: 'Other issue', icon: '🔧' },
]

type ContactType = 'whatsapp' | 'email'
type Step = 'form' | 'success'

export default function ReportForm() {
  const { t } = useLanguage()
  const [step, setStep] = useState<Step>('form')
  const [name, setName] = useState('')
  const [selectedIssue, setSelectedIssue] = useState('')
  const [selectedIssueLabel, setSelectedIssueLabel] = useState('')
  const [description, setDescription] = useState('')
  const [contactType, setContactType] = useState<ContactType>('whatsapp')
  const [contact, setContact] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [refNumber, setRefNumber] = useState('')

  const issues = ISSUES(t)

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = t.form.errors.name
    if (!selectedIssue) e.issue = t.form.errors.issue
    if (!contact.trim()) e.contact = contactType === 'whatsapp' ? t.form.errors.contact : t.form.errors.contactEmail
    if (contactType === 'email' && contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      e.contact = t.form.errors.emailInvalid
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
      setErrors({ submit: err instanceof Error ? err.message : t.form.errors.submit })
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
        <h2 className={styles.successTitle}>{t.form.successTitle}, {firstName}.</h2>
        <p className={styles.successBody}>
          {t.form.successBody1} <strong>{selectedIssueLabel.toLowerCase()}</strong> has been received.
          {contactType === 'whatsapp' ? 'WhatsApp' : t.form.email} {t.form.successBody3}
        </p>
        <div className={styles.refPill}>{refNumber}</div>
        <div className={styles.successMeta}>
          {t.form.successMeta}
        </div>
        <button className={styles.resetBtn} onClick={reset}>{t.form.submitAnother}</button>
      </div>
    )
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.formTopBar}>
        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>{t.form.formTitle}</h2>
          <p className={styles.formSub}>{t.form.formSub}</p>
        </div>
        <ThemeLanguageBar />
      </div>

      {/* Name */}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="name">{t.form.nameLabel}</label>
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
        <label className={styles.label}>{t.form.issueLabel}</label>
        <div className={styles.tiles}>
          {issues.map(issue => (
            <button
              key={issue.id}
              type="button"
              className={`${styles.tile} ${selectedIssue === issue.value ? styles.tileSelected : ''}`}
              onClick={() => { setSelectedIssue(issue.value); setSelectedIssueLabel(issue.label); setErrors(p => ({ ...p, issue: '' })) }}
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
          {t.form.descriptionLabel} <span className={styles.optional}>{t.form.descriptionOptional}</span>
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
        <label className={styles.label}>{t.form.contactLabel}</label>
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
            {t.form.whatsapp}
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${contactType === 'email' ? styles.toggleActive : ''}`}
            onClick={() => { setContactType('email'); setContact(''); setErrors(p => ({ ...p, contact: '' })) }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/>
            </svg>
            {t.form.email}
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
            {t.form.submitBtn}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8h12M9 4l5 4-5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </>
        )}
      </button>

      <p className={styles.privacy}>
        {t.form.privacy}
      </p>
    </form>
  )
}
