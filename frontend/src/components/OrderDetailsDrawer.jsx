import React from 'react'
import { X, Clock, DollarSign, Award, AlertTriangle, ShieldCheck, Play, CheckCircle, Package } from 'lucide-react'

export default function OrderDetailsDrawer({ 
  orderId, 
  orderDetails, 
  onClose, 
  onAllocate, 
  onStartPicking, 
  onMoveToPacking, 
  onDispatch 
}) {
  if (!orderId || !orderDetails) return null

  const { order, items, events, priority_explanation, sla_risk } = orderDetails
  const score = priority_explanation?.score || order.priority_score
  const reasons = priority_explanation?.reasons || []
  
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'bg-brand-danger/10 text-brand-danger border-brand-danger/20'
      case 'high': return 'bg-brand-warning/10 text-brand-warning border-brand-warning/20'
      case 'medium': return 'bg-brand-accent/10 text-brand-accent border-brand-accent/20'
      default: return 'bg-gray-800 text-gray-400 border-gray-700'
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'dispatched': return 'bg-brand-success/15 text-brand-success border-brand-success/20'
      case 'qc': return 'bg-brand-purple/15 text-brand-purple border-brand-purple/20'
      case 'packing': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
      case 'picking': return 'bg-brand-accent/15 text-brand-accent border-brand-accent/20'
      case 'allocated': return 'bg-teal-500/10 text-teal-400 border-teal-500/20'
      case 'delayed': return 'bg-brand-danger/10 text-brand-danger border-brand-danger/20'
      default: return 'bg-gray-800 text-gray-400'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-brand-navy/60 backdrop-blur-xs" onClick={onClose}></div>

      {/* Drawer Body */}
      <div className="relative w-full max-w-xl bg-brand-surface border-l border-brand-border h-full flex flex-col justify-between shadow-2xl z-10 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-brand-border flex items-center justify-between bg-brand-charcoal">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-gray-100">{order.id}</h2>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${getPriorityColor(order.priority)}`}>
                {order.priority}
              </span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{order.customer}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Horizontal Workflow Stepper */}
          <div className="bg-brand-navy/30 border border-brand-border/60 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fulfillment Stage Pipeline</span>
              <span className="text-[9px] bg-brand-accent/15 text-brand-accent px-2 py-0.5 rounded border border-brand-accent/25 font-bold uppercase">
                Active State: {order.status}
              </span>
            </div>
            <div className="flex items-center justify-between relative pt-2">
              {['Created', 'Prioritized', 'Allocated', 'Picking', 'Packing', 'QC', 'Dispatch'].map((label, idx) => {
                const stages = ['New', 'Prioritized', 'Allocated', 'Picking', 'Packing', 'QC', 'Dispatched']
                let currentStepIndex = stages.indexOf(order.status)
                if (currentStepIndex === -1) {
                  if (order.status === 'Delayed') currentStepIndex = 5 // QC Exception
                  else if (order.status === 'Partial') currentStepIndex = 2 // Allocated
                  else if (order.status === 'Held') currentStepIndex = 1 // Prioritized
                  else currentStepIndex = 0
                }
                
                const isCompleted = idx < currentStepIndex
                const isCurrent = idx === currentStepIndex
                
                return (
                  <React.Fragment key={label}>
                    {idx > 0 && (
                      <div className={`flex-1 h-0.5 mx-0.5 transition-colors duration-300 ${
                        idx <= currentStepIndex ? 'bg-brand-success' : 'bg-brand-border/40'
                      }`}></div>
                    )}
                    <div className="flex flex-col items-center gap-1.5 relative z-10">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all duration-300 ${
                        isCompleted ? 'bg-brand-success/15 border-brand-success text-brand-success font-bold' :
                        isCurrent ? 'bg-brand-accent text-brand-navy border-brand-accent font-extrabold animate-pulse' :
                        'bg-brand-charcoal border-brand-border/60 text-gray-500'
                      }`}>
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <span className={`text-[9px] font-bold tracking-tight uppercase ${
                        isCurrent ? 'text-brand-accent' : isCompleted ? 'text-gray-300' : 'text-gray-500'
                      }`}>{label}</span>
                    </div>
                  </React.Fragment>
                )
              })}
            </div>
          </div>

          {/* Key metadata grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-brand-navy/40 p-3 rounded-xl border border-brand-border/40 text-center">
              <DollarSign className="h-4 w-4 text-brand-accent mx-auto mb-1" />
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Order Value</p>
              <p className="text-sm font-bold text-gray-200 mt-0.5">${order.value.toFixed(2)}</p>
            </div>
            <div className="bg-brand-navy/40 p-3 rounded-xl border border-brand-border/40 text-center">
              <Clock className="h-4 w-4 text-brand-warning mx-auto mb-1" />
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Time Left</p>
              <p className={`text-sm font-bold mt-0.5 ${sla_risk.risk_level === 'Critical' || sla_risk.risk_level === 'High' ? 'text-brand-danger' : 'text-gray-200'}`}>
                {sla_risk.remaining_minutes > 0 ? `${sla_risk.remaining_minutes}m` : 'EXPIRED'}
              </p>
            </div>
            <div className="bg-brand-navy/40 p-3 rounded-xl border border-brand-border/40 text-center">
              <Award className="h-4 w-4 text-brand-purple mx-auto mb-1" />
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">SLA Risk</p>
              <p className="text-sm font-bold text-gray-200 mt-0.5">{sla_risk.risk_level || 'Low'}</p>
            </div>
          </div>

          {/* Explainable Decision: WHY this priority? */}
          <div className="bg-brand-purple/5 border border-brand-purple/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-brand-purple">
                <Package className="h-4.5 w-4.5" />
                <span className="text-xs font-bold uppercase tracking-wider">Priority Decision Engine</span>
              </div>
              <div className="flex items-center gap-1.5 bg-brand-purple/10 px-2 py-0.5 rounded border border-brand-purple/20 text-brand-purple">
                <span className="text-xs font-black">{score}</span>
                <span className="text-[10px] font-semibold text-brand-purple/80">/100</span>
              </div>
            </div>
            
            <div className="text-xs space-y-1.5 text-gray-300">
              <p className="font-semibold text-gray-200 border-b border-brand-border/30 pb-1.5 mb-1.5">Contributing priority factors:</p>
              {reasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className="text-brand-purple font-bold mt-0.5">•</span>
                  <p className="leading-relaxed">{reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Requested Items Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Requested Inventory</h3>
            <div className="bg-brand-navy/40 border border-brand-border/60 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-charcoal text-gray-400 border-b border-brand-border/60 uppercase text-[9px] tracking-wider">
                  <tr>
                    <th className="p-3">Product (SKU)</th>
                    <th className="p-3 text-center">Req</th>
                    <th className="p-3 text-center">Alloc</th>
                    <th className="p-3 text-center">Pick</th>
                    <th className="p-3 text-center">Pack</th>
                    <th className="p-3 text-center">Dmg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/30 text-gray-300">
                  {items.map((it) => (
                    <tr key={it.sku} className="hover:bg-brand-surface/30">
                      <td className="p-3 font-medium">
                        <div>{it.name}</div>
                        <div className="text-[10px] text-brand-accent mt-0.5 font-mono">{it.sku} @ bin {it.location}</div>
                      </td>
                      <td className="p-3 text-center font-bold text-gray-200">{it.quantity}</td>
                      <td className={`p-3 text-center font-bold ${it.allocated === it.quantity ? 'text-brand-success' : 'text-brand-warning'}`}>{it.allocated}</td>
                      <td className="p-3 text-center">{it.picked}</td>
                      <td className="p-3 text-center">{it.packed}</td>
                      <td className={`p-3 text-center font-bold ${it.damaged > 0 ? 'text-brand-danger' : 'text-gray-500'}`}>{it.damaged}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Trail Workflow events */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Fulfillment Audit Trail</h3>
            <div className="relative pl-6 border-l-2 border-brand-border/60 space-y-4">
              {events.length === 0 ? (
                <p className="text-xs text-gray-500 italic pl-2">No historical events recorded.</p>
              ) : (
                events.map((evt) => (
                  <div key={evt.id} className="relative">
                    {/* Circle marker */}
                    <span className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-brand-border bg-brand-surface flex items-center justify-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-accent"></span>
                    </span>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-200">{evt.event_type}</span>
                        <span className="text-[9px] text-gray-500">{evt.created_at}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{evt.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 border-t border-brand-border bg-brand-charcoal flex gap-3">
          {order.status === 'New' || order.status === 'Prioritized' ? (
            <button
              onClick={() => onAllocate(order.id)}
              className="flex-1 bg-brand-accent text-brand-navy font-bold text-xs py-3 rounded-lg hover:bg-brand-accent/90 transition-all btn-transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Run Allocate Stock Engine</span>
            </button>
          ) : order.status === 'Allocated' ? (
            <button
              onClick={() => onStartPicking(order.id)}
              className="flex-1 bg-brand-accent text-brand-navy font-bold text-xs py-3 rounded-lg hover:bg-brand-accent/90 transition-all btn-transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="h-4 w-4" />
              <span>Assign & Optimize Picking</span>
            </button>
          ) : order.status === 'Picking' ? (
            <button
              onClick={() => onMoveToPacking(order.id)}
              className="flex-1 bg-brand-accent text-brand-navy font-bold text-xs py-3 rounded-lg hover:bg-brand-accent/90 transition-all btn-transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Deliver to Packing Workspace</span>
            </button>
          ) : order.status === 'QC' ? (
            <button
              onClick={() => onDispatch(order.id)}
              className="flex-1 bg-brand-accent text-brand-navy font-bold text-xs py-3 rounded-lg hover:bg-brand-accent/90 transition-all btn-transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Dispatch Shipment</span>
            </button>
          ) : (
            <button
              disabled
              className="flex-1 bg-gray-800 text-gray-500 font-bold text-xs py-3 rounded-lg border border-gray-700 cursor-not-allowed text-center"
            >
              Fulfillment Stage Completed
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
