import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  fetchKPI, fetchPredictions, fetchCategoryTotals,
  fetchTimeseries, fetchRecentReports, fetchWeeklyPattern
} from '../../lib/api'
import Dashboard from '../../components/Dashboard'
import styles from './page.module.css'

async function checkAuth() {
  const cookieStore = cookies()
  const auth = cookieStore.get('dashboard_auth')
  return auth?.value === (process.env.DASHBOARD_PASSWORD || 'nestcare2024')
}

export default async function DashboardPage() {
  const isAuthed = await checkAuth()

  if (!isAuthed) {
    redirect('/dashboard/login')
  }

  const [kpi, predictions, categoryTotals, timeseries, recentReports, weeklyPattern] =
    await Promise.all([
      fetchKPI(),
      fetchPredictions(),
      fetchCategoryTotals(),
      fetchTimeseries(),
      fetchRecentReports(),
      fetchWeeklyPattern(),
    ])

  return (
    <div className={styles.page}>
      <Dashboard
        kpi={kpi}
        predictions={predictions}
        categoryTotals={categoryTotals}
        timeseries={timeseries}
        recentReports={recentReports}
        weeklyPattern={weeklyPattern}
      />
    </div>
  )
}