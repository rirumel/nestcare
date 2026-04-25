import ReportForm from '@/components/ReportForm'
import styles from './page.module.css'

export default function Home() {
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
              Something needs<br />
              <em>fixing?</em>
            </h1>
            <p className={styles.tagline}>
              Tell us what's wrong. We'll notify your property manager instantly and confirm receipt on WhatsApp or email — in seconds.
            </p>
          </div>

          <div className={styles.steps}>
            {[
              { n: '01', label: 'Fill in the form', desc: 'Name, issue and contact' },
              { n: '02', label: 'Instant confirmation', desc: 'You get notified right away' },
              { n: '03', label: 'Manager is alerted', desc: 'They receive full details' },
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
