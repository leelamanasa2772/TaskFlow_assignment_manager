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
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Layers,
  Sparkles,
  BookOpen,
  GraduationCap
} from 'lucide-react'

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
          {data.value} {data.value === 1 ? 'item' : 'items'}
        </p>
      </div>
    )
  }
  return null
}

const FacultyAnalytics = ({ analyticsData, section = 'A' }) => {
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'status' | 'subjects' | 'students'

  const totalAssignments = analyticsData?.totalAssignments || 0
  const totalStudents = analyticsData?.totalStudents || 0
  const actualSubmissions = analyticsData?.actualSubmissions || 0
  const totalPossible = analyticsData?.totalPossibleSubmissions || 0
  const pendingSubmissions = Math.max(0, totalPossible - actualSubmissions)
  const overallRate = analyticsData?.overallSubmissionRate || 0
  const studentRoster = analyticsData?.students || []

  // Status donut for Section submissions
  const submissionStatusData = useMemo(() => {
    return [
      { name: 'Submitted by Students', value: actualSubmissions, color: '#10b981' },
      { name: 'Pending Submissions', value: pendingSubmissions, color: '#f59e0b' },
    ].filter((item) => item.value > 0)
  }, [actualSubmissions, pendingSubmissions])

  // Subject Workload distribution
  const subjectChartData = useMemo(() => {
    return (analyticsData?.subjects || []).map((sub) => ({
      subject: sub.subject,
      count: sub.count,
      submissions: sub.submissions || 0,
    }))
  }, [analyticsData?.subjects])

  return (
    <section className="analytics-card-section faculty-analytics" aria-label="Faculty Data Analytics">
      {/* Header */}
      <div className="analytics-header">
        <div className="analytics-title-group">
          <div className="analytics-icon-badge faculty-badge-icon">
            <BarChart3 size={22} />
          </div>
          <div>
            <h2 className="analytics-heading">
              Faculty Data Analytics — Section {section}
            </h2>
            <p className="analytics-subheading">
              Track section-wide assignment delivery, student submission rates, and workload
            </p>
          </div>
        </div>

        <div className="analytics-tabs" role="tablist">
          <button
            type="button"
            className={`analytics-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <Layers size={15} />
            <span>Overview</span>
          </button>
          <button
            type="button"
            className={`analytics-tab ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <Users size={15} />
            <span>Student Roster ({totalStudents})</span>
          </button>
          <button
            type="button"
            className={`analytics-tab ${activeTab === 'subjects' ? 'active' : ''}`}
            onClick={() => setActiveTab('subjects')}
          >
            <BookOpen size={15} />
            <span>Subjects</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="analytics-kpi-grid">
        <div className="kpi-mini-card total-kpi">
          <div className="kpi-icon total-icon">
            <BookOpen size={18} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Section Assignments</span>
            <div className="kpi-number-row">
              <span className="kpi-value">{totalAssignments}</span>
              <span className="kpi-pill">Active Tasks</span>
            </div>
          </div>
        </div>

        <div className="kpi-mini-card completed-kpi">
          <div className="kpi-icon completed-icon">
            <GraduationCap size={18} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Enrolled Students</span>
            <div className="kpi-number-row">
              <span className="kpi-value">{totalStudents}</span>
              <span className="kpi-pill completed-pill">Section {section}</span>
            </div>
          </div>
        </div>

        <div className="kpi-mini-card pending-kpi">
          <div className="kpi-icon pending-icon">
            <CheckCircle2 size={18} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Submissions</span>
            <div className="kpi-number-row">
              <span className="kpi-value">{actualSubmissions}</span>
              <span className="kpi-pill pending-pill">
                of {totalPossible} possible
              </span>
            </div>
          </div>
        </div>

        <div className="kpi-mini-card rate-kpi">
          <div className="kpi-icon rate-icon">
            <TrendingUp size={18} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Section Submission Rate</span>
            <div className="kpi-number-row">
              <span className="kpi-value">{overallRate}%</span>
              <span className="kpi-pill safe-pill">
                {overallRate >= 70 ? 'High Engagement' : 'Moderate'}
              </span>
            </div>
            <div className="kpi-progress-bar-bg">
              <div
                className="kpi-progress-bar-fill"
                style={{ width: `${overallRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content depending on selected tab */}
      {totalAssignments === 0 ? (
        <div className="analytics-empty-state">
          <div className="empty-chart-illustration">
            <Sparkles size={38} className="empty-sparkle-icon" />
          </div>
          <h3>No Assignments Posted for Section {section}</h3>
          <p>
            Create an assignment using the form below. Once published, section analytics,
            charts, and student completion metrics will immediately render here.
          </p>
        </div>
      ) : (
        <>
          {/* Charts Row */}
          {(activeTab === 'all' || activeTab === 'subjects') && (
            <div className="analytics-charts-grid dual-view">
              {/* Submission Donut */}
              <div className="chart-box status-chart-box">
                <div className="chart-box-header">
                  <div>
                    <h4 className="chart-box-title">Section Submission Distribution</h4>
                    <p className="chart-box-desc">Overall completed vs. pending tasks across students</p>
                  </div>
                  <span className="chart-badge">
                    {actualSubmissions}/{totalPossible} Submissions
                  </span>
                </div>

                <div className="chart-box-canvas">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={submissionStatusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={5}
                      >
                        {submissionStatusData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="donut-center-metric">
                    <span className="donut-rate">{overallRate}%</span>
                    <span className="donut-sublabel">Submitted</span>
                  </div>
                </div>

                <div className="chart-legend-row">
                  <div className="legend-item">
                    <span className="legend-indicator completed-indicator" />
                    <span className="legend-text">
                      Completed <strong>({actualSubmissions})</strong>
                    </span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-indicator pending-indicator" />
                    <span className="legend-text">
                      Pending <strong>({pendingSubmissions})</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Subject Workload Bar Chart */}
              <div className="chart-box subjects-chart-box">
                <div className="chart-box-header">
                  <div>
                    <h4 className="chart-box-title">Subject Workload</h4>
                    <p className="chart-box-desc">Assignments assigned per subject</p>
                  </div>
                  <span className="chart-badge">
                    {subjectChartData.length} Subjects
                  </span>
                </div>

                <div className="chart-box-canvas bar-canvas">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={subjectChartData}
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
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Bar
                        dataKey="count"
                        name="Assignments"
                        fill="url(#facultyBarGradient)"
                        radius={[8, 8, 0, 0]}
                      />
                      <defs>
                        <linearGradient id="facultyBarGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" stopOpacity={1} />
                          <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-legend-row">
                  <div className="legend-item">
                    <span className="legend-indicator subject-indicator" />
                    <span className="legend-text">Course Subject Distribution</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Student Roster Section */}
          {(activeTab === 'all' || activeTab === 'students') && (
            <div className="faculty-roster-box">
              <div className="roster-header">
                <div className="roster-title-group">
                  <Users size={18} className="roster-icon" />
                  <h4>Enrolled Students in Section {section} ({studentRoster.length})</h4>
                </div>
                <span className="roster-subtitle">
                  Real-time individual student assignment completion tracking
                </span>
              </div>

              {studentRoster.length === 0 ? (
                <div className="empty-roster-message">
                  <p>No students have registered in Section {section} yet.</p>
                  <span>When students register with Section {section}, they will appear here automatically.</span>
                </div>
              ) : (
                <div className="student-roster-grid">
                  {studentRoster.map((st) => (
                    <div className="student-roster-card" key={st.id}>
                      <div className="student-avatar">
                        {st.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="student-info">
                        <span className="student-name">{st.name}</span>
                        <span className="student-email">{st.email}</span>
                      </div>
                      <div className="student-progress-col">
                        <div className="student-counts">
                          <span className="completed-badge">
                            ✓ {st.completedCount} / {totalAssignments} done
                          </span>
                          <span className="student-percent">{st.rate}%</span>
                        </div>
                        <div className="student-progress-bar">
                          <div
                            className="student-progress-fill"
                            style={{ width: `${st.rate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default FacultyAnalytics
