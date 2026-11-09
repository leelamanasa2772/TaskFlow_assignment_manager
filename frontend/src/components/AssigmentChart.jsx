import React, { useState, useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  BarChart3,
  PieChart as PieIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Layers,
  Sparkles,
} from 'lucide-react'

// Custom tooltip for sleek charts
const CustomChartTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="custom-chart-tooltip">
        <p className="tooltip-label">{data.name}</p>
        <p className="tooltip-value">
          <span
            className="tooltip-dot"
            style={{ backgroundColor: data.fill || data.color || '#6366f1' }}
          />
          {data.value} {data.value === 1 ? 'assignment' : 'assignments'}
        </p>
      </div>
    )
  }
  return null
}

const AssignmentChart = ({
  assignments = [],
  completed,
  pending,
  section = '',
}) => {
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'status' | 'subjects'

  // Derive counts accurately
  const total = assignments.length
  const completedCount =
    typeof completed === 'number'
      ? completed
      : assignments.filter((a) => a.completed).length
  const pendingCount =
    typeof pending === 'number'
      ? pending
      : assignments.filter((a) => !a.completed).length

  // Due soon calculation (within 24-48 hours)
  const dueSoonCount = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return assignments.filter((a) => {
      if (a.completed || !a.dueDate) return false
      const due = new Date(`${a.dueDate}T00:00:00`)
      return due >= today && due <= tomorrow
    }).length
  }, [assignments])

  const completionRate =
    total > 0 ? Math.round((completedCount / total) * 100) : 0

  // Status donut data
  const statusData = useMemo(() => {
    return [
      { name: 'Completed', value: completedCount, color: '#10b981' },
      { name: 'Pending', value: pendingCount, color: '#f59e0b' },
    ].filter((item) => item.value > 0)
  }, [completedCount, pendingCount])

  // Subject distribution data
  const subjectData = useMemo(() => {
    const map = {}
    assignments.forEach((item) => {
      const subject = (item.subject || 'General').trim()
      if (!map[subject]) {
        map[subject] = { subject, count: 0, completed: 0, pending: 0 }
      }
      map[subject].count += 1
      if (item.completed) {
        map[subject].completed += 1
      } else {
        map[subject].pending += 1
      }
    })
    return Object.values(map).sort((a, b) => b.count - a.count)
  }, [assignments])

  // Status Colors
  const STATUS_COLORS = {
    Completed: '#10b981',
    Pending: '#f59e0b',
  }

  return (
    <section
      className="analytics-card-section"
      aria-label="Student Assignment Data Analytics"
    >
      {/* Header with Title and View Switcher */}
      <div className="analytics-header">
        <div className="analytics-title-group">
          <div className="analytics-icon-badge">
            <BarChart3 size={22} className="analytics-main-icon" />
          </div>
          <div>
            <h2 className="analytics-heading">
              Student Progress Analytics {section ? `— Section ${section}` : ''}
            </h2>
            <p className="analytics-subheading">
              Personal completion breakdown, pending assignments, and course subject workload
            </p>
          </div>
        </div>

        {total > 0 && (
          <div className="analytics-tabs" role="tablist">
            <button
              type="button"
              className={`analytics-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
              title="Show overview"
            >
              <Layers size={15} />
              <span>Full Analytics</span>
            </button>
            <button
              type="button"
              className={`analytics-tab ${
                activeTab === 'status' ? 'active' : ''
              }`}
              onClick={() => setActiveTab('status')}
              title="Show status distribution"
            >
              <PieIcon size={15} />
              <span>Status</span>
            </button>
            <button
              type="button"
              className={`analytics-tab ${
                activeTab === 'subjects' ? 'active' : ''
              }`}
              onClick={() => setActiveTab('subjects')}
              title="Show subject workload"
            >
              <BarChart3 size={15} />
              <span>Subjects</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Highlight Strip */}
      <div className="analytics-kpi-grid">
        <div className="kpi-mini-card total-kpi">
          <div className="kpi-icon total-icon">
            <Layers size={18} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Assigned by Teachers</span>
            <div className="kpi-number-row">
              <span className="kpi-value">{total}</span>
              <span className="kpi-pill">All Tasks</span>
            </div>
          </div>
        </div>

        <div className="kpi-mini-card completed-kpi">
          <div className="kpi-icon completed-icon">
            <CheckCircle2 size={18} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Completed by You</span>
            <div className="kpi-number-row">
              <span className="kpi-value">{completedCount}</span>
              <span className="kpi-pill completed-pill">
                {completionRate}% Done
              </span>
            </div>
          </div>
        </div>

        <div className="kpi-mini-card pending-kpi">
          <div className="kpi-icon pending-icon">
            <Clock size={18} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Pending</span>
            <div className="kpi-number-row">
              <span className="kpi-value">{pendingCount}</span>
              <span className="kpi-pill pending-pill">Needs Action</span>
            </div>
          </div>
        </div>

        <div className="kpi-mini-card rate-kpi">
          <div className="kpi-icon rate-icon">
            <TrendingUp size={18} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Personal Completion Rate</span>
            <div className="kpi-number-row">
              <span className="kpi-value">{completionRate}%</span>
              {dueSoonCount > 0 ? (
                <span className="kpi-pill urgent-pill">
                  <AlertCircle size={12} /> {dueSoonCount} Due Soon
                </span>
              ) : (
                <span className="kpi-pill safe-pill">On Track</span>
              )}
            </div>
            {/* Visual progress bar */}
            <div className="kpi-progress-bar-bg">
              <div
                className="kpi-progress-bar-fill"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      {total === 0 ? (
        <div className="analytics-empty-state">
          <div className="empty-chart-illustration">
            <Sparkles size={38} className="empty-sparkle-icon" />
          </div>
          <h3>No Assignments in Section {section || ''} Yet</h3>
          <p>
            When teachers in your section post new assignments, your completion
            charts and subject progress analytics will render here.
          </p>
        </div>
      ) : (
        <div
          className={`analytics-charts-grid ${
            activeTab === 'all' ? 'dual-view' : 'single-view'
          }`}
        >
          {/* Donut Chart: Status Distribution */}
          {(activeTab === 'all' || activeTab === 'status') && (
            <div className="chart-box status-chart-box">
              <div className="chart-box-header">
                <div>
                  <h4 className="chart-box-title">Completion Status</h4>
                  <p className="chart-box-desc">Completed vs. Pending Tasks</p>
                </div>
                <span className="chart-badge">
                  {completedCount}/{total} Finished
                </span>
              </div>

              <div className="chart-box-canvas">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={88}
                      paddingAngle={5}
                      stroke="rgba(255,255,255,0.8)"
                      strokeWidth={2}
                    >
                      {statusData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={STATUS_COLORS[entry.name] || '#6366f1'}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center metric inside donut */}
                <div className="donut-center-metric">
                  <span className="donut-rate">{completionRate}%</span>
                  <span className="donut-sublabel">Progress</span>
                </div>
              </div>

              <div className="chart-legend-row">
                <div className="legend-item">
                  <span className="legend-indicator completed-indicator" />
                  <span className="legend-text">
                    Completed <strong>({completedCount})</strong>
                  </span>
                </div>
                <div className="legend-item">
                  <span className="legend-indicator pending-indicator" />
                  <span className="legend-text">
                    Pending <strong>({pendingCount})</strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bar Chart: Subject Workload Distribution */}
          {(activeTab === 'all' || activeTab === 'subjects') && (
            <div className="chart-box subjects-chart-box">
              <div className="chart-box-header">
                <div>
                  <h4 className="chart-box-title">Subject Workload</h4>
                  <p className="chart-box-desc">Assignment distribution per subject</p>
                </div>
                <span className="chart-badge">
                  {subjectData.length}{' '}
                  {subjectData.length === 1 ? 'Subject' : 'Subjects'}
                </span>
              </div>

              <div className="chart-box-canvas bar-canvas">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={subjectData}
                    margin={{ top: 15, right: 15, left: -20, bottom: 25 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="rgba(120, 127, 180, 0.18)"
                    />
                    <XAxis
                      dataKey="subject"
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Bar
                      dataKey="count"
                      name="Total"
                      fill="url(#subjectBarGradient)"
                      radius={[8, 8, 0, 0]}
                    />
                    <defs>
                      <linearGradient
                        id="subjectBarGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                        <stop
                          offset="100%"
                          stopColor="#a855f7"
                          stopOpacity={0.8}
                        />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-legend-row">
                <div className="legend-item">
                  <span className="legend-indicator subject-indicator" />
                  <span className="legend-text">
                    Assignments by Course Topic
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default AssignmentChart
