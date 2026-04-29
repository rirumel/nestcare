'use client'

import { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis
} from 'recharts'
import styles from './Dashboard.module.css'
import InsightNarrator from './InsightNarrator'

// ── Types ─────────────────────────────────────────────────────────
interface KPI {
  total_reports: number
  reports_this_month: number
  top_issue: string
  active_anomalies: number
  reports_last_7_days: number
  week_over_week_change: number
}

interface Prediction {
  issue_category: string
  anomaly_detected: boolean
  z_score: number
  predicted_next_occurrence: string | null
  confidence_score: number
  report_count_last_30_days: number
  trend: { direction: string; slope: number; strength: number }
  seasonality: Record<string, number>
}

interface CategoryTotal { category: string; total: number }
interface TimeseriesPoint { date: string; category: string; count: number }
interface RecentReport {
  id: number; ref_number: string; tenant_name: string
  issue_category: string; contact_type: string
  unit_number: string | null; submitted_at: string
}
interface WeeklyPattern { day: string; day_num: number; total: number }

interface Props {
  kpi: KPI
  predictions: Prediction[]
  categoryTotals: CategoryTotal[]
  timeseries: TimeseriesPoint[]
  recentReports: { total: number; reports: RecentReport[] }
  weeklyPattern: WeeklyPattern[]
}

// ── Constants ─────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  'Heating is not functioning': '#e85d3d',
  'Window is damaged':          '#4a9eff',
  'Stove is not working':       '#f5a623',
  'Plumbing issue':             '#7ed6a5',
  'Electrical issue':           '#b088f9',
  'Other issue':                '#8a8780',
}

const CATEGORY_ICONS: Record<string, string> = {
  'Heating is not functioning': '🔥',
  'Window is damaged':          '🪟',
  'Stove is not working':       '🍳',
  'Plumbing issue':             '🚿',
  'Electrical issue':           '⚡',
  'Other issue':                '🔧',
}

const SHORT_LABELS: Record<string, string> = {
  'Heating is not functioning': 'Heating',
  'Window is damaged':          'Window',
  'Stove is not working':       'Stove',
  'Plumbing issue':             'Plumbing',
  'Electrical issue':           'Electric',
  'Other issue':                'Other',
}

// ── Helpers ───────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

function trendIcon(direction: string) {
  if (direction === 'increasing') return '↑'
  if (direction === 'decreasing') return '↓'
  return '→'
}

function trendColor(direction: string) {
  if (direction === 'increasing') return '#e85d3d'
  if (direction === 'decreasing') return '#7ed6a5'
  return '#8a8780'
}

// ── Sub-components ────────────────────────────────────────────────
function KPICard({ label, value, sub, accent = false, warn = false }: {
  label: string; value: string | number; sub?: string; accent?: boolean; warn?: boolean
}) {
  return (
    <div className={`${styles.kpiCard} ${accent ? styles.kpiAccent : ''} ${warn ? styles.kpiWarn : ''}`}>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValue}>{value}</div>
      {sub && <div className={styles.kpiSub}>{sub}</div>}
    </div>
  )
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className={styles.sectionHeader}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <p className={styles.sectionSub}>{sub}</p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────
export default function Dashboard({ kpi, predictions, categoryTotals, timeseries, recentReports, weeklyPattern }: Props) {
  const [reportPage, setReportPage] = useState(0)
  const reportsPerPage = 10

  // Process timeseries into chart format
  const dateMap: Record<string, Record<string, number>> = {}
  timeseries.forEach(({ date, category, count }) => {
    const short = SHORT_LABELS[category] || category
    if (!dateMap[date]) dateMap[date] = {}
    dateMap[date][short] = (dateMap[date][short] || 0) + count
  })
  const timeseriesData = Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, cats]) => ({
      date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      ...cats
    }))

  // Donut chart data
  const donutData = categoryTotals.map(({ category, total }) => ({
    name: SHORT_LABELS[category] || category,
    value: total,
    color: CATEGORY_COLORS[category] || '#8a8780',
    fullName: category,
  }))

  // Weekly pattern
  const weeklyData = weeklyPattern.map(({ day, total }) => ({ day: day.slice(0, 3), total }))

  // Anomaly predictions
  const anomalies = predictions.filter(p => p.anomaly_detected)

  // Radar chart for seasonality of top 3 issues
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const top3Predictions = [...predictions]
    .sort((a, b) => b.report_count_last_30_days - a.report_count_last_30_days)
    .slice(0, 3);
  const normalizeSeasonality = (
    predictions: Prediction[],
    months: string[],
  ) => {
    // Find global min and max across all top3 and all months
    const allValues = top3Predictions.flatMap((p) =>
      months.map((m) => p.seasonality?.[m] ?? 0),
    );
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min || 1;

    return months.map((month) => {
      const entry: Record<string, any> = { month };
      top3Predictions.forEach((p) => {
        const label = SHORT_LABELS[p.issue_category];
        const raw = p.seasonality?.[month] ?? 0;
        // Normalize to 0-100, amplify contrast
        entry[label] = Math.round(((raw - min) / range) * 100);
      });
      return entry;
    });
  };

  const radarData = normalizeSeasonality(predictions, months)

  return (
    <div className={styles.dashboard}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.brandIcon}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 14V6l6-4 6 4v8H11V10H7v4H3z" fill="white" />
            </svg>
          </div>
          <div>
            <h1 className={styles.headerTitle}>
              NestCare <em>Dashboard</em>
            </h1>
            <p className={styles.headerSub}>
              Property Maintenance Intelligence
            </p>
          </div>
        </div>
        <div className={styles.headerRight}>
          {anomalies.length > 0 && (
            <div className={styles.anomalyBadge}>
              ⚠️ {anomalies.length} active anomal
              {anomalies.length === 1 ? "y" : "ies"}
            </div>
          )}
          <a href="/" className={styles.formLink}>
            ← Tenant Form
          </a>
        </div>
      </div>

      <div className={styles.content}>
        {/* ── KPI Row ── */}
        <div className={styles.kpiRow}>
          <KPICard
            label="Total Reports"
            value={kpi.total_reports.toLocaleString()}
            sub="All time"
          />
          <KPICard
            label="This Month"
            value={kpi.reports_this_month}
            sub={`${kpi.week_over_week_change > 0 ? "+" : ""}${kpi.week_over_week_change}% vs last week`}
            accent={kpi.week_over_week_change > 20}
          />
          <KPICard
            label="Last 7 Days"
            value={kpi.reports_last_7_days}
            sub="Recent activity"
          />
          <KPICard
            label="Top Issue"
            value={SHORT_LABELS[kpi.top_issue] || kpi.top_issue}
            sub="Most reported"
            accent
          />
          <KPICard
            label="Active Anomalies"
            value={kpi.active_anomalies}
            sub="Unusual spikes detected"
            warn={kpi.active_anomalies > 0}
          />
        </div>

        {/* ── Anomaly Alerts ── */}
        {anomalies.length > 0 && (
          <div className={styles.section}>
            <SectionHeader
              title="⚠️ Anomaly Alerts"
              sub="Issues with abnormally high report frequency detected by Z-score analysis"
            />
            <div className={styles.alertGrid}>
              {anomalies.map((p) => (
                <div key={p.issue_category} className={styles.alertCard}>
                  <div className={styles.alertIcon}>
                    {CATEGORY_ICONS[p.issue_category]}
                  </div>
                  <div className={styles.alertBody}>
                    <div className={styles.alertTitle}>{p.issue_category}</div>
                    <div className={styles.alertDetail}>
                      Z-score: <strong>{p.z_score}</strong> ·{" "}
                      {p.report_count_last_30_days} reports in last 30 days
                    </div>
                  </div>
                  <div className={styles.alertBadge}>SPIKE</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Charts Row 1: Trend + Donut ── */}
        <div className={styles.chartRow2}>
          <div className={styles.chartCard}>
            <SectionHeader
              title="Report Trends"
              sub="Daily report volume over last 90 days by category"
            />
            <ResponsiveContainer width="100%" height={260}>
              <LineChart
                data={timeseriesData}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#8a8780", fontSize: 10 }}
                  interval={13}
                />
                <YAxis tick={{ fill: "#8a8780", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: "#1a1814",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "white",
                  }}
                />
                {Object.values(SHORT_LABELS).map((label) => (
                  <Line
                    key={label}
                    type="monotone"
                    dataKey={label}
                    stroke={
                      Object.entries(SHORT_LABELS).find(
                        ([, v]) => v === label,
                      )?.[0]
                        ? CATEGORY_COLORS[
                            Object.entries(SHORT_LABELS).find(
                              ([, v]) => v === label,
                            )![0]
                          ]
                        : "#8a8780"
                    }
                    strokeWidth={1.5}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <InsightNarrator
              chartType="trends"
              data={{ topCategories: Object.values(SHORT_LABELS), recentData: timeseriesData.slice(-7) }}
              label="Explain this trend chart"
            />
          </div>
          
          <div className={styles.chartCard}>
            <SectionHeader
              title="Issue Distribution"
              sub="Total reports by category"
            />
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#1a1814",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "white",
                  }}
                  formatter={(value, name) => [value, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.legend}>
              {donutData.map((d) => (
                <div key={d.name} className={styles.legendItem}>
                  <span
                    className={styles.legendDot}
                    style={{ background: d.color }}
                  />
                  <span className={styles.legendLabel}>{d.name}</span>
                  <span className={styles.legendValue}>{d.value}</span>
                </div>
              ))}
            </div>
            <InsightNarrator
              chartType="distribution"
              data={donutData}
              label="Explain this distribution"
            />
          </div>
        </div>

        {/* ── Charts Row 2: Weekly + Seasonality Radar ── */}
        <div className={styles.section}>
          <div className={styles.chartCard}>
            <SectionHeader
              title="Seasonal Patterns"
              sub="Monthly avg reports/day for top 3 issues"
            />
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart
                data={radarData}
                margin={{ top: 10, right: 30, left: 30, bottom: 40 }}
              >
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis
                  dataKey="month"
                  tick={{ fill: "#8a8780", fontSize: 10 }}
                />
                {top3Predictions.slice(0, 3).map((p) => (
                  <Radar
                    key={p.issue_category}
                    name={SHORT_LABELS[p.issue_category]}
                    dataKey={SHORT_LABELS[p.issue_category]}
                    stroke={CATEGORY_COLORS[p.issue_category]}
                    fill={CATEGORY_COLORS[p.issue_category]}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                ))}
                <Tooltip
                  contentStyle={{
                    background: "#1a1814",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "white",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '8px' }}>
              {top3Predictions.map(p => (
                <div key={p.issue_category} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#8a8780' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: CATEGORY_COLORS[p.issue_category], display: 'inline-block' }} />
                  {SHORT_LABELS[p.issue_category]}
                </div>
              ))}
            </div>
          </div>
          <InsightNarrator
            chartType="seasonal"
            data={{ top3: top3Predictions.map(p => ({ category: SHORT_LABELS[p.issue_category], seasonality: p.seasonality })) }}
            label="Explain seasonal patterns"
          />
        </div>

        {/* ── Predictive Maintenance ── */}
        <div className={styles.section}>
          <SectionHeader
            title="Predictive Maintenance Forecast"
            sub="ML-powered next occurrence predictions with confidence scores and trend analysis"
          />
          <div className={styles.predictGrid}>
            {[...predictions]
              .sort(
                (a, b) => (b.confidence_score ?? 0) - (a.confidence_score ?? 0),
              )
              .map((p) => {
                const days = daysUntil(p.predicted_next_occurrence);
                const trend = p.trend;
                return (
                  <div
                    key={p.issue_category}
                    className={`${styles.predictCard} ${p.anomaly_detected ? styles.predictAnomaly : ""}`}
                  >
                    <div className={styles.predictHeader}>
                      <span className={styles.predictIcon}>
                        {CATEGORY_ICONS[p.issue_category]}
                      </span>
                      <div>
                        <div className={styles.predictTitle}>
                          {SHORT_LABELS[p.issue_category]}
                        </div>
                        <div className={styles.predictCount}>
                          {p.report_count_last_30_days} reports / 30d
                        </div>
                      </div>
                      {p.anomaly_detected && (
                        <span className={styles.anomalyTag}>⚠️ Spike</span>
                      )}
                    </div>

                    <div className={styles.predictForecast}>
                      {p.predicted_next_occurrence ? (
                        <>
                          <div className={styles.forecastDate}>
                            {formatDate(p.predicted_next_occurrence)}
                          </div>
                          <div className={styles.forecastLabel}>
                            {days !== null
                              ? days > 0
                                ? `in ${days} days`
                                : days === 0
                                  ? "today"
                                  : `${Math.abs(days)} days ago`
                              : ""}
                          </div>
                        </>
                      ) : (
                        <div
                          className={styles.forecastDate}
                          style={{ fontSize: 14, color: "#8a8780" }}
                        >
                          Insufficient data
                        </div>
                      )}
                    </div>

                    <div className={styles.predictMeta}>
                      <div className={styles.confidenceBar}>
                        <div className={styles.confidenceLabel}>Confidence</div>
                        <div className={styles.confidenceTrack}>
                          <div
                            className={styles.confidenceFill}
                            style={{
                              width: `${(p.confidence_score ?? 0) * 100}%`,
                              background: CATEGORY_COLORS[p.issue_category],
                            }}
                          />
                        </div>
                        <div className={styles.confidenceValue}>
                          {Math.round((p.confidence_score ?? 0) * 100)}%
                        </div>
                      </div>
                      <div className={styles.trendRow}>
                        <span
                          style={{
                            color: trendColor(p.trend?.direction ?? "stable"),
                          }}
                        >
                          {trendIcon(p.trend?.direction ?? "stable")}{" "}
                          {p.trend?.direction ?? "stable"}
                        </span>
                        <span className={styles.trendStrength}>
                          R²={p.trend?.strength ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
          <InsightNarrator
            chartType="predictions"
            data={predictions.map(p => ({ category: SHORT_LABELS[p.issue_category], nextOccurrence: p.predicted_next_occurrence, confidence: p.confidence_score, trend: p.trend?.direction }))}
            label="Explain these predictions"
          />
        </div>

        {/* ── Recent Reports Table ── */}
        <div className={styles.section}>
          <div className={styles.tableHeader}>
            <SectionHeader
              title="Recent Reports"
              sub={`${recentReports.total.toLocaleString()} total submissions`}
            />
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Tenant</th>
                  <th>Issue</th>
                  <th>Unit</th>
                  <th>Contact</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.reports.map((r: RecentReport) => (
                  <tr key={r.id}>
                    <td>
                      <span className={styles.refBadge}>{r.ref_number}</span>
                    </td>
                    <td>{r.tenant_name}</td>
                    <td>
                      <span
                        className={styles.issueBadge}
                        style={{
                          borderColor: CATEGORY_COLORS[r.issue_category] + "40",
                          color: CATEGORY_COLORS[r.issue_category],
                        }}
                      >
                        {CATEGORY_ICONS[r.issue_category]}{" "}
                        {SHORT_LABELS[r.issue_category]}
                      </span>
                    </td>
                    <td>{r.unit_number || "—"}</td>
                    <td>
                      <span className={styles.contactBadge}>
                        {r.contact_type === "whatsapp" ? "📱" : "📧"}{" "}
                        {r.contact_type}
                      </span>
                    </td>
                    <td className={styles.dateCell}>
                      {r.submitted_at ? formatDate(r.submitted_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}