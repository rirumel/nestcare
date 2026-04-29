const API_BASE = process.env.NEXT_PUBLIC_PREDICTOR_URL || 'https://nestcare-production.up.railway.app'

export async function fetchKPI() {
  const res = await fetch(`${API_BASE}/dashboard/kpi`, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error('Failed to fetch KPI')
  return res.json()
}

export async function fetchPredictions() {
  const res = await fetch(`${API_BASE}/dashboard/predictions`, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error('Failed to fetch predictions')
  return res.json()
}

export async function fetchCategoryTotals() {
  const res = await fetch(`${API_BASE}/dashboard/category-totals`, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error('Failed to fetch category totals')
  return res.json()
}

export async function fetchTimeseries() {
  const res = await fetch(`${API_BASE}/dashboard/timeseries?days=90`, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error('Failed to fetch timeseries')
  return res.json()
}

export async function fetchRecentReports() {
  const res = await fetch(`${API_BASE}/dashboard/recent-reports?limit=10`, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error('Failed to fetch recent reports')
  return res.json()
}

export async function fetchWeeklyPattern() {
  const res = await fetch(`${API_BASE}/dashboard/weekly-pattern`, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error('Failed to fetch weekly pattern')
  return res.json()
}

export async function fetchMonthlyHeatmap() {
  const res = await fetch(`${API_BASE}/dashboard/monthly-heatmap`, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error('Failed to fetch monthly heatmap')
  return res.json()
}