import React, { useState } from 'react'
import { X, AlertTriangle, ShieldCheck, ArrowRight, Brain, Sparkles, Database, BarChart2 } from 'lucide-react'

export default function AllocationConflictModal({ isOpen, onClose, onApplyDecision, onSimulateAlternative }) {
  const [status, setStatus] = useState('pending') // 'pending' | 'applying' | 'success'
  const [allocation104, setAllocation104] = useState(0)
  const [allocation118, setAllocation118] = useState(0)

  if (!isOpen) return null

  const handleApply = async () => {
    setStatus('applying')
    // Animate allocation counting up in UI
    setTimeout(() => {
      setAllocation104(7)
      setAllocation118(0)
    }, 500)

    setTimeout(async () => {
      await onApplyDecision()
      setStatus('success')
    }, 1800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-brand-navy/70 backdrop-blur-xs" onClick={status !== 'applying' ? onClose : undefined}></div>

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-brand-surface border border-brand-border rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col justify-between transition-all duration-300">
        
        {/* Header */}
        <div className="p-4 bg-brand-charcoal border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-danger">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
            <span className="font-bold text-sm text-gray-200 uppercase tracking-wider">Allocation Conflict Detected</span>
          </div>
          {status !== 'applying' && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 p-1 hover:bg-gray-800 rounded-lg cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          )}
        </div>

        {status === 'success' ? (
          /* SUCCESS PANEL & OPERATIONAL IMPACT VIEW */
          <div className="p-6 space-y-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-brand-success/15 border border-brand-success/30 flex items-center justify-center text-brand-success">
                <ShieldCheck className="h-6 w-6 animate-bounce" />
              </div>
              <h3 className="text-base font-bold text-gray-100">Smart Decision Applied</h3>
              <p className="text-xs text-brand-success font-semibold">Critical order protected. 7 available units allocated to ORD-104.</p>
              <p className="text-[11px] text-gray-400">3 units remain required. Replenishment recommendation created (+30 units).</p>
            </div>

            <div className="border-t border-brand-border/40 my-4"></div>

            {/* OPERATIONAL IMPACT SECTION */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="h-4.5 w-4.5 text-brand-success" />
                <span>OPERATIONAL IMPACT MEASURED</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Metric 1 */}
                <div className="bg-brand-navy/40 border border-brand-border p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">SLA Delivery Risk</span>
                    <span className="text-xs font-semibold text-gray-300">ORD-104 Breach Probability</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-brand-danger font-bold line-through">HIGH</span>
                    <ArrowRight className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-brand-success font-bold bg-brand-success/10 px-2 py-0.5 rounded border border-brand-success/20 animate-pulse">MEDIUM</span>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-brand-navy/40 border border-brand-border p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">Critical Protection</span>
                    <span className="text-xs font-semibold text-gray-300">Allocated Quantity Ratio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-brand-danger font-bold line-through">0%</span>
                    <ArrowRight className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-brand-success font-bold bg-brand-success/10 px-2 py-0.5 rounded border border-brand-success/20">70%</span>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-brand-navy/40 border border-brand-border p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">Allocation Efficiency</span>
                    <span className="text-xs font-semibold text-gray-300">Stock Utilization Index</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-bold">Suboptimal</span>
                    <ArrowRight className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-brand-success font-bold">Improved (+38%)</span>
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="bg-brand-navy/40 border border-brand-border p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">Inventory Conflict</span>
                    <span className="text-xs font-semibold text-gray-300">SKU P-101 Allocation status</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-brand-danger font-bold">Blocked</span>
                    <ArrowRight className="h-3 w-3 text-gray-500" />
                    <span className="text-xs text-brand-success font-bold">Resolved (Held)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full bg-brand-success text-brand-navy font-bold text-xs py-3 rounded-lg hover:bg-brand-success/90 transition-all cursor-pointer shadow-lg shadow-brand-success/10"
              >
                Close & Update Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* ALLOCATION CONFLICT DECISION FLOW PANEL */
          <div className="p-5 space-y-5">
            <p className="text-xs text-gray-400 leading-relaxed">
              Fulfillment block on SKU <strong className="text-brand-accent">P-101 (Wireless Headphones Pro)</strong>. The allocation queue has competing requests with limited stock.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Conflict details */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">COMPETING INVENTORY QUEUES</h4>

                {/* Critical Order */}
                <div className="bg-brand-navy/40 border border-brand-danger/30 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-200">ORD-104 (Apex Systems)</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-brand-danger/15 text-brand-danger border border-brand-danger/25">🔴 CRITICAL</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Required Quantity:</span>
                    <span className="text-gray-200 font-bold">10 units</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>SLA Risk:</span>
                    <span className="text-brand-danger font-bold">CRITICAL (Leaves in 2 hours)</span>
                  </div>
                </div>

                {/* Competing Order */}
                <div className="bg-brand-navy/40 border border-brand-border/80 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-200">ORD-118 (Core Solutions)</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">🟢 LOW PRIORITY</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Required Quantity:</span>
                    <span className="text-gray-200 font-bold">5 units</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>SLA Risk:</span>
                    <span className="text-brand-success font-bold">LOW (Leaves in 18 hours)</span>
                  </div>
                </div>

                {/* Warehouse Stock */}
                <div className="bg-brand-charcoal border border-brand-border rounded-xl p-3.5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Database className="h-4.5 w-4.5 text-brand-accent" />
                    <span className="text-xs font-bold text-gray-200">Available Warehouse Stock:</span>
                  </div>
                  <span className="text-sm font-bold text-brand-accent font-mono bg-brand-accent/15 border border-brand-accent/30 px-2.5 py-0.5 rounded">
                    7 units
                  </span>
                </div>
              </div>

              {/* Right Column: Warenex Decision Engine recommendation */}
              <div className="bg-brand-purple/5 border border-brand-purple/20 rounded-xl p-4 flex flex-col justify-between space-y-3.5">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-brand-purple border-b border-brand-purple/20 pb-2">
                    <Brain className="h-4.5 w-4.5 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">WARENEX SYSTEM DECISION</span>
                  </div>

                  <p className="text-xs font-bold text-gray-200 leading-normal bg-brand-surface border border-brand-border/40 p-2.5 rounded-lg text-center">
                    "Allocate all 7 available units to critical order ORD-104."
                  </p>

                  <div className="text-[11px] text-gray-400 space-y-2 leading-relaxed">
                    <p className="font-semibold text-gray-300">Decision Reasoning Rationale:</p>
                    <div className="flex items-start gap-1.5">
                      <span className="text-brand-purple font-bold">•</span>
                      <p><strong>ORD-104 has critical priority:</strong> Premium tier customer contract protection.</p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-brand-purple font-bold">•</span>
                      <p><strong>Nearest SLA deadline:</strong> Fulfillments breach leaves in less than 2 hours.</p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-brand-purple font-bold">•</span>
                      <p><strong>Partial allocation mitigation:</strong> Protects highest value operational outcome ($999.90 value).</p>
                    </div>
                  </div>
                </div>

                <div className="bg-brand-navy/60 border border-brand-border/40 rounded-lg p-2.5 space-y-1.5 text-[10px]">
                  <div className="flex justify-between text-gray-400">
                    <span>Proposed Allocation:</span>
                    <span className="text-brand-success font-bold">ORD-104 → 7 | ORD-118 → 0</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Unresolved Shortage:</span>
                    <span className="text-brand-danger font-bold">ORD-104 → 3 units short</span>
                  </div>
                  <div className="flex justify-between text-gray-400 border-t border-brand-border/30 pt-1 mt-1 text-[9px] text-brand-accent">
                    <span>Replenishment Trigger:</span>
                    <span>Reorder request generated (+30 units)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex gap-2.5 pt-3.5 border-t border-brand-border/40">
              <button
                onClick={onClose}
                disabled={status === 'applying'}
                className="flex-1 bg-brand-charcoal border border-brand-border text-gray-400 text-xs py-3 rounded-lg hover:bg-gray-800 transition-all font-semibold cursor-pointer"
              >
                Reject Recommendation
              </button>

              <button
                onClick={onSimulateAlternative}
                disabled={status === 'applying'}
                className="flex-1 border border-brand-border text-gray-300 hover:bg-gray-800 font-semibold text-xs py-3 rounded-lg transition-all cursor-pointer text-center"
              >
                Simulate Alternative
              </button>

              <button
                onClick={handleApply}
                disabled={status === 'applying'}
                className="flex-1 bg-brand-accent text-brand-navy font-bold text-xs py-3 rounded-lg hover:bg-brand-accent/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-brand-accent/10"
              >
                {status === 'applying' ? (
                  <>
                    <div className="animate-spin h-3.5 w-3.5 border-2 border-brand-navy border-t-transparent rounded-full"></div>
                    <span>Applying Engines...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Apply Smart Decision</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
