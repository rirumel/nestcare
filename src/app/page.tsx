'use client'

import ReportForm from '@/components/ReportForm'
import styles from './page.module.css'
import { useLanguage } from '@/context/LanguageContext'

export default function Home() {
  const { t } = useLanguage()

  return (
    <main className={styles.main}>
      <div className={styles.left}>
        <div className={styles.leftInner}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 17V8L10 3l7 5v9h-5v-5H8v5H3z" fill="white"/>
              </svg>
            </div>
            <span className={styles.brandName}>Nest<em>Care</em></span>
          </div>

          <div className={styles.heroText}>
            <h1 className={styles.headline}>
              {t.form.headline}<br />
              <em>{t.form.headlineItalic}</em>
            </h1>
            <p className={styles.tagline}>
              {t.form.tagline}
            </p>
          </div>

          <div className={styles.steps}>
            {[
              { n: '01', label: t.form.step1label, desc: t.form.step1sub },
              { n: '02', label: t.form.step2label, desc: t.form.step2sub },
              { n: '03', label: t.form.step3label, desc: t.form.step3sub },
            ].map(s => (
              <div key={s.n} className={styles.step}>
                <span className={styles.stepNum}>{s.n}</span>
                <div>
                  <div className={styles.stepLabel}>{s.label}</div>
                  <div className={styles.stepDesc}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <ReportForm />
      </div>
    </main>
  )
}
