import React from 'react'

const StatsCard = ({ title, count }) => {
  return (
    <div className="stats-card">
      <p>{title}</p>
      <h2>{count}</h2>
    </div>
  )
}

export default StatsCard