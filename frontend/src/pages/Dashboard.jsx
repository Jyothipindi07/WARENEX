import React, { useState } from 'react'
import { 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  AlertOctagon, 
  Truck, 
  Layers, 
  ListTodo,
  CheckCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react'

export default function Dashboard({ 
  dashboardData, 
  setCurrentPage, 
  setStatusFilter, 
  onActionClick,
  onOpenAllocationConflict,
  onDecisionClick
}) {
  if (!dashboardData) {
    return (
      <div className="p-8 text-center text-gray-400">
        <div className="animate-spin h-8 w-8 border-4 border-brand-accent border-t-transparent rounded-full mx-auto mb-4"></div>
        <span>Loading Warehouse Intelligence Command Center...</span>
      </div>
    )
  }

  const { health_score, kpis, pipeline, action_center, next_best_actions, decision_history } = dashboardData

  const pipelineStages = [
    { key: 'NEW', label: 'New' },
    { key: 'PRIORITIZED', label: 'Prioritized' },
    { key: 'ALLOCATED', label: 'Allocated' },
    { key: 'PICKING', label: 'Picking' },
    { key: 'PACKING', label: 'Packing' },
    { key: 'QC', label: 'QC Check' },
    { key: 'DISPATCHED', label: 'Dispatched' }
  ]

  const handleStageClick = (stageLabel) => {
    const statusMap = { 
      'QC Check': 'QC', 
      'New': 'New', 
      'Prioritized': 'Prioritized', 
      'Allocated': 'Allocated', 
      'Picking': 'Picking', 
      'Packing': 'Packing', 
      'Dispatched': 'Dispatched' 
    }
    setStatusFilter(statusMap[stageLabel] || '')
    setCurrentPage('orders')
  }

  // Dynamic health description
  const getHealthDescription = (score) => {
    if (score >= 85) return 'Operationally Healthy'
    if (score >= 75) return 'Operational Attention Required'
    return 'Critical Operational Disruption'
  }

  // Interactive Next Best Actions mapped directly to workflows
  const nextActions = [
    {
      title: "🔴 Resolve ORD-104 allocation conflict",
      impact: "Restores headphones critical order delivery",
      reason: "Apex Systems order holds near-term SLA",
      benefit: "Cuts SLA delay risk by 70%",
      severity: "critical",
      handler: () => onOpenAllocationConflict()
    },
    {
      title: "🟠 Prioritize 4 SLA-risk orders",
      impact: "Avoids SLA breach fines",
      reason: "4 picking tickets nearing deadlines",
      benefit: "Minimizes delay penalties",
      severity: "high",
      handler: () => {
        setStatusFilter('Picking')
        setCurrentPage('orders')
      }
    },
    {
      title: "🟡 Approve 5 replenishment recommendations",
      impact: "Prevents stockouts on core SKUs",
      reason: "5 SKUs below safety thresholds",
      benefit: "Secures inventory continuity",
      severity: "medium",
      handler: () => setCurrentPage('inventory')
    },
    {
      title: "🔵 Optimize Zone A picking",
      impact: "Reduces transit walk time by 38%",
      reason: "Duplicate picker route overlap in A-03",
      benefit: "Saves 160m travel walk distance",
      severity: "info",
      handler: () => setCurrentPage('picking')
    },
    {
      title: "🟢 Dispatch 7 ready shipments",
      impact: "Boosts daily fulfillment count",
      reason: "7 items waiting in carrier bay",
      benefit: "Closes fulfillment loops",
      severity: "low",
      handler: () => setCurrentPage('dispatch')
    }
  ]

  // Dynamic activity feed matching database logs + static live events
  const getLiveActivityFeed = () => {
    const dbActivities = decision_history.slice(0, 3).map(item => {
      const isShortage = item.type.toLowerCase().includes('shortage') || item.type.toLowerCase().includes('fail')
      return {
        time: item.created_at.split(' ')[1]?.slice(0, 5) || '19:05',
        type: isShortage ? 'danger' : 'success',
        text: `${item.type}: ${item.decision}`
      }
    })

    const staticActivities = [
      { time: "19:04", type: "warning", text: "SKU P-101 (Wireless Headphones Pro) reached critical stock" },
      { time: "19:03", type: "info", text: "Order #ORD-118 entered picking queue (Priority: Low)" },
      { time: "19:01", type: "danger", text: "QC exception EXP-104-QC-DAMAGE detected on bench #3" },
      { time: "18:58", type: "success", text: "Order #ORD-1020 successfully dispatched via FedEx" }
    ]

    return [...dbActivities, ...staticActivities].slice(0, 5)
  }

  const activities = getLiveActivityFeed()

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full pb-16 select-none">
      
      {/* Page Header with circular Warehouse Health Score */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 flex items-center justify-between shadow-lg">
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-gray-100">Warehouse Command Center</h2>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full pulse-dot ${health_score >= 85 ? 'bg-brand-success' : 'bg-brand-warning'}`}></span>
            <p className={`text-xs font-semibold ${health_score >= 85 ? 'text-brand-success' : 'text-brand-warning'}`}>
              Your warehouse is {health_score}/100 — "{getHealthDescription(health_score)}"
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-1">{action_center.length} active alerts require operational intervention.</p>
        </div>

        {/* Circular Health Score Widget */}
        <div className="flex items-center gap-4 bg-brand-navy/60 px-5 py-3 rounded-xl border border-brand-border/60">
          <div className="relative h-14 w-14 flex items-center justify-center">
            <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${health_score >= 85 ? 'text-brand-success' : 'text-brand-accent'}`}
                strokeDasharray={`${health_score}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="text-sm font-black text-brand-accent">{health_score}</span>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Health Score</p>
            <p className="text-xs font-semibold text-gray-200 mt-0.5">Fulfillment Quality</p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Card 1: Orders Today */}
        <div className="bg-brand-surface border border-brand-border p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <TrendingUp className="h-4.5 w-4.5 text-brand-accent" />
            <span className="text-[10px] font-semibold text-brand-success bg-brand-success/15 px-2 py-0.5 rounded">Healthy</span>
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Orders Today</p>
          <p className="text-2xl font-black text-gray-100">{kpis.orders_today?.value}</p>
          <p className="text-[10px] text-gray-500">Pipeline total volume</p>
        </div>

        {/* Card 2: Orders At Risk */}
        <div className="bg-brand-surface border border-brand-border p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <AlertTriangle className="h-4.5 w-4.5 text-brand-danger animate-pulse" />
            <span className="text-[10px] font-semibold text-brand-danger bg-brand-danger/15 px-2 py-0.5 rounded">At Risk</span>
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Orders At Risk</p>
          <p className="text-2xl font-black text-brand-danger">{kpis.orders_at_risk?.value}</p>
          <p className="text-[10px] text-gray-500">Nearing SLA deadlines</p>
        </div>

        {/* Card 3: Fulfillment Rate */}
        <div className="bg-brand-surface border border-brand-border p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <ShieldCheck className="h-4.5 w-4.5 text-brand-success" />
            <span className="text-[10px] font-semibold text-brand-success bg-brand-success/15 px-2 py-0.5 rounded">92% Target</span>
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Fulfillment Rate</p>
          <p className="text-2xl font-black text-gray-100">{kpis.fulfillment_rate?.value}</p>
          <p className="text-[10px] text-gray-500">Completed shipments</p>
        </div>

        {/* Card 4: Inventory Health */}
        <div className="bg-brand-surface border border-brand-border p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <Activity className="h-4.5 w-4.5 text-brand-warning" />
            <span className="text-[10px] font-semibold text-brand-warning bg-brand-warning/15 px-2 py-0.5 rounded">Alerts</span>
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Inventory Health</p>
          <p className="text-2xl font-black text-gray-100">{kpis.inventory_health?.value}</p>
          <p className="text-[10px] text-gray-500">{kpis.inventory_health?.trend}</p>
        </div>

        {/* Card 5: Active Exceptions */}
        <div className="bg-brand-surface border border-brand-border p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <AlertOctagon className="h-4.5 w-4.5 text-brand-danger" />
            <span className="text-[10px] font-semibold text-brand-danger bg-brand-danger/15 px-2 py-0.5 rounded">Blockages</span>
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Active Exceptions</p>
          <p className="text-2xl font-black text-brand-danger">{kpis.active_exceptions?.value}</p>
          <p className="text-[10px] text-gray-500">Requires physical check</p>
        </div>

        {/* Card 6: Pending Dispatch */}
        <div className="bg-brand-surface border border-brand-border p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <Truck className="h-4.5 w-4.5 text-brand-accent" />
            <span className="text-[10px] font-semibold text-brand-accent bg-brand-accent/15 px-2 py-0.5 rounded">Carrier Ready</span>
          </div>
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Pending Dispatch</p>
          <p className="text-2xl font-black text-gray-100">{kpis.pending_dispatch?.value}</p>
          <p className="text-[10px] text-gray-500">QC check passed orders</p>
        </div>
      </div>

      {/* Live Order Pipeline Progress Bar */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-5 space-y-4 shadow-md">
        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Live Order Pipeline</h3>
        
        <div className="grid grid-cols-7 gap-1 border border-brand-border/60 rounded-xl overflow-hidden bg-brand-navy/30">
          {pipelineStages.map((stage) => {
            const count = pipeline[stage.key] || 0
            return (
              <button
                key={stage.key}
                onClick={() => handleStageClick(stage.label)}
                className="py-3 px-1 text-center border-r border-brand-border/40 last:border-r-0 hover:bg-brand-surface/40 transition-colors group cursor-pointer"
              >
                <span className="text-[10px] font-bold text-gray-400 uppercase block tracking-wider group-hover:text-brand-accent transition-colors">{stage.label}</span>
                <span className="text-lg font-black text-gray-200 mt-1 block">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Action Required & Next Best Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Action Required Cards (Important Alerts) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <span>Action Required Alerts</span>
            <span className="text-[10px] bg-brand-danger/20 text-brand-danger px-2.5 py-0.5 rounded-full font-bold">{action_center.length} Alerts</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {action_center.map((act) => (
              <div 
                key={act.id} 
                className="bg-brand-surface border border-brand-border rounded-xl p-4.5 flex flex-col justify-between space-y-3.5 shadow-md hover:border-gray-700 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-gray-200 tracking-wide uppercase">{act.title}</h4>
                    <span className="h-2 w-2 rounded-full bg-brand-danger animate-pulse"></span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-semibold">{act.message}</p>
                  <p className="text-[10px] text-gray-400">{act.subtext}</p>
                </div>
                
                <div className="bg-brand-navy/60 rounded-lg p-2.5 border border-brand-border/40 text-[10px] leading-relaxed text-brand-accent font-medium">
                  <span className="text-gray-400 block mb-0.5 uppercase text-[9px] tracking-wider">Decision Recommendation:</span>
                  {act.recommendation}
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button 
                    onClick={() => {
                      if (act.type === 'CRITICAL_ALLOCATION_CONFLICT') {
                        onOpenAllocationConflict()
                      } else {
                        onActionClick(act)
                      }
                    }}
                    className="flex-1 bg-brand-accent text-brand-navy font-bold text-[10px] py-2 rounded-lg hover:bg-brand-accent/90 transition-all btn-transition cursor-pointer text-center uppercase tracking-wide"
                  >
                    {act.action_label}
                  </button>
                  <button 
                    onClick={() => {
                      if (act.type === 'CRITICAL_ALLOCATION_CONFLICT') {
                        setCurrentPage('smart_decisions')
                      } else {
                        setCurrentPage('inventory')
                      }
                    }}
                    className="flex-1 border border-brand-border text-gray-300 font-bold text-[10px] py-2 rounded-lg hover:bg-gray-800 transition-all cursor-pointer text-center uppercase tracking-wide"
                  >
                    {act.alternative_label}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Best Actions (Prioritization queue list) */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <ListTodo className="h-4.5 w-4.5 text-brand-accent" />
            <span>Next Best Actions (Interactive)</span>
          </h3>

          <div className="bg-brand-surface border border-brand-border rounded-xl p-4.5 space-y-3.5 shadow-md">
            {nextActions.map((item, idx) => (
              <button
                key={idx}
                onClick={item.handler}
                className="w-full text-left flex gap-3 bg-brand-navy/40 hover:bg-gray-800 p-3 rounded-lg border border-brand-border/40 hover:border-gray-600 transition-all cursor-pointer"
              >
                <span className={`h-2.5 w-2.5 rounded-full mt-1 flex-shrink-0 ${
                  item.severity === 'critical' ? 'bg-brand-danger animate-pulse' :
                  item.severity === 'high' ? 'bg-brand-warning' : 'bg-brand-accent'
                }`}></span>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-200">{item.title}</p>
                  <div className="text-[10px] text-gray-400 leading-normal space-y-0.5">
                    <p><strong className="text-gray-300">Reason:</strong> {item.reason}</p>
                    <p><strong className="text-gray-300">Impact:</strong> {item.impact}</p>
                    <p className="text-brand-success font-semibold">Benefit: {item.benefit}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2-Column Section: Live Activity Feed & Why WARENEX comparative panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Live Warehouse Activity Feed */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 space-y-4 shadow-md">
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-brand-accent animate-pulse" />
            <span>LIVE WAREHOUSE ACTIVITY</span>
          </h3>

          <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
            {activities.map((act, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs leading-relaxed bg-brand-navy/30 p-2.5 rounded border border-brand-border/30 hover:border-gray-700 transition-all">
                <span className="text-[9px] text-gray-500 font-mono whitespace-nowrap mt-0.5">{act.time}</span>
                <span className={`h-2 w-2 rounded-full flex-shrink-0 mt-1.5 ${
                  act.type === 'success' ? 'bg-brand-success' :
                  act.type === 'danger' ? 'bg-brand-danger animate-pulse' :
                  act.type === 'warning' ? 'bg-brand-warning animate-bounce' : 'bg-brand-accent'
                }`}></span>
                <p className="text-gray-300 font-semibold">{act.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why WARENEX Comparative Panel */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 space-y-4 shadow-md">
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-brand-purple" />
            <span>WHY WARENEX SYSTEM OVER TRADITIONAL WMS?</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs h-full">
            <div className="bg-brand-navy/40 p-4 rounded-xl border border-brand-border/50 flex flex-col justify-between space-y-2">
              <div>
                <h4 className="font-black text-brand-danger uppercase text-[10px] tracking-wider mb-1">Traditional WMS</h4>
                <p className="text-gray-400 leading-relaxed text-[11px]">
                  Acts as a static database. Displays values and quantities but leaves schedule bottlenecks, stock shortage allocations, and QC package failures to manual operator spreadsheet lookups.
                </p>
              </div>
              <div className="text-[10px] text-gray-500 font-bold bg-brand-navy p-1.5 rounded text-center uppercase border border-brand-border/30">
                Data → Display Only
              </div>
            </div>

            <div className="bg-brand-purple/5 p-4 rounded-xl border border-brand-purple/20 flex flex-col justify-between space-y-2">
              <div>
                <h4 className="font-black text-brand-purple uppercase text-[10px] tracking-wider mb-1">WARENEX Intelligent</h4>
                <p className="text-gray-300 leading-relaxed text-[11px] font-medium">
                  Analyzes queues, flags exception alerts, runs deterministic priority allocation engines, explains rationale contextually via copilot, and measures immediate operational SLA benefits.
                </p>
              </div>
              <div className="text-[9px] text-brand-purple font-bold bg-brand-purple/10 p-1.5 rounded text-center uppercase border border-brand-purple/20 leading-none">
                Data → Detect → Decide → Explain → Act → Measure
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Decision Log History (Audit logs) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle className="h-4.5 w-4.5 text-brand-accent" />
            <span>Decision History Log (Click for Explanations)</span>
          </h3>
          <span className="text-[10px] text-gray-500 italic">Click any decision row to open explanation modals</span>
        </div>

        <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-charcoal text-gray-400 border-b border-brand-border uppercase text-[9px] tracking-wider">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Decision</th>
                <th className="p-3">Target</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Action</th>
                <th className="p-3">Impact</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/30 text-gray-300">
              {decision_history.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-gray-500 italic">No decisions logged.</td>
                </tr>
              ) : (
                decision_history.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-brand-surface/40 cursor-pointer transition-colors"
                    onClick={() => onDecisionClick(item)}
                    title="Click to view explanation"
                  >
                    <td className="p-3 text-[10px] text-gray-500 font-medium whitespace-nowrap">{item.created_at}</td>
                    <td className="p-3 font-semibold text-gray-100">{item.type}</td>
                    <td className="p-3 font-mono text-brand-accent font-bold">{item.entity_id}</td>
                    <td className="p-3 text-gray-400 max-w-xs truncate">{item.reason}</td>
                    <td className="p-3 font-semibold">{item.decision}</td>
                    <td className="p-3 text-brand-success font-medium">{item.impact}</td>
                    <td className="p-3 text-center">
                      <span className="bg-brand-success/15 text-brand-success text-[9px] font-bold px-2 py-0.5 rounded border border-brand-success/20">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
