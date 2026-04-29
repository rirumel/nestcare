'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './login.module.css'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/dashboard-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setError('Incorrect password. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.icon}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M3 18V9L11 4l8 5v9h-6v-5H9v5H3z" fill="white"/>
          </svg>
        </div>
        <h1 className={styles.title}>NestCare Admin</h1>
        <p className={styles.sub}>Enter your password to access the dashboard</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="password"
            className={`${styles.input} ${error ? styles.inputError : ''}`}
            placeholder="Dashboard password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            autoFocus
          />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.btn} disabled={loading || !password}>
            {loading ? <span className={styles.spinner} /> : 'Access Dashboard →'}
          </button>
        </form>
        <p className={styles.hint}>For demo access, contact the administrator</p>
      </div>
    </div>
  )
}