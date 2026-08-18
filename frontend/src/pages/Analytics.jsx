import React from 'react'
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts'

export default function Analytics({ analyticsData }) {
  if (!analyticsData) {
    return (
      <div className="p-8 text-center text-gray-400">
        <div className="animate-spin h-8 w-8 border-4 border-brand-accent border-t-transparent rounded-full mx-auto mb-4"></div>
        <span>Loading Operations Analytics dashboards...</span>
      </div>
    )
  }

  const {
    orders_by_status,
    orders_by_priority,
    exceptions_by_type,
    inventory_health_distribution,
    sla_risk_distribution,
    workflow_bottlenecks
  } = analyticsData

  // Custom colors matching brand system
  const COLORS = ['#06b6d4', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#4b5563']

  const getStatusChartData = () => {
    return orders_by_status.map(item => ({
      name: item.status,
      count: item.count
    }))
  }

  const getPriorityChartData = () => {
    return orders_by_priority.map(item => ({
      name: item.priority,
      count: item.count
    }))
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full pb-16 select-none">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-100">Operations Control Tower</h2>
        <p className="text-xs text-gray-400 mt-1">Review live performance analytics, bottleneck analysis, and stock safety allocations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Workflow Bottleneck durations (BarChart) */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 space-y-4 shadow-lg">
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Workflow Bottleneck Analysis (Minutes)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workflow_bottlenecks}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="stage" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} 
                  labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                />
                <Bar dataKey="time" name="Avg processing duration" fill="#a855f7" radius={[4, 4, 0, 0]}>
                  {workflow_bottlenecks.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.stage === 'Picking' ? '#ef4444' : '#a855f7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed italic">
            *Picking stage represents 52% of total operational pipeline time, matching route congestion.
          </p>
        </div>

        {/* 2. Inventory Stock Health Distribution (PieChart) */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 space-y-4 shadow-lg">
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">SKU Health Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventory_health_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {inventory_health_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Orders by Priority (BarChart) */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 space-y-4 shadow-lg">
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Fulfillment Priority Counts</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getPriorityChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#06b6d4" name="Volume" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Exceptions by Type (BarChart) */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 space-y-4 shadow-lg">
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Active Exceptions Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={exceptions_by_type}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="type" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#ef4444" name="Alert Incident volume" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}
