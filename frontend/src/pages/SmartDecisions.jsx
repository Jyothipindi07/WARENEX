import React, { useState, useEffect } from 'react'
import { Brain, Sparkles, RefreshCw, BarChart2, CheckCircle2, ShieldAlert } from 'lucide-react'

export default function SmartDecisions() {
  const [availableStock, setAvailableStock] = useState(7)
  
  const [orderAQty, setOrderAQty] = useState(10)
  const [orderAPriority, setOrderAPriority] = useState('Critical')
  
  const [orderBQty, setOrderBQty] = useState(5)
  const [orderBPriority, setOrderBPriority] = useState('Low')
  
  const [simulationResult, setSimulationResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const runSimulation = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/decisions/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: 'P-101',
          available_stock: availableStock,
          order_a_qty: orderAQty,
          order_a_priority: orderAPriority,
          order_b_qty: orderBQty,
          order_b_priority: orderBPriority
        })
      })
      const data = await res.json()
      setSimulationResult(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Auto-run simulation when inputs modify
  useEffect(() => {
    runSimulation()
  }, [availableStock, orderAQty, orderAPriority, orderBQty, orderBPriority])

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full pb-16 select-none">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-100">Smart Decision Simulator</h2>
        <p className="text-xs text-gray-400 mt-1">
          Simulate stock allocation conflicts between competing orders to inspect deterministic Priority Engine recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Input Parameters Panel */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 space-y-5 shadow-lg h-fit">
          <div className="flex items-center gap-2 text-brand-purple pb-1 border-b border-brand-border/40">
            <Brain className="h-4.5 w-4.5" />
            <span className="text-xs font-bold uppercase tracking-wider">Simulation Parameters</span>
          </div>

          {/* 1. Available Stock Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 uppercase font-bold block">Available Headphones Stock</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="20"
                value={availableStock}
                onChange={(e) => setAvailableStock(parseInt(e.target.value))}
                className="w-full h-1.5 bg-brand-navy rounded-lg appearance-none cursor-pointer accent-brand-accent"
              />
              <span className="text-sm font-bold text-brand-accent bg-brand-accent/15 px-3 py-1 rounded border border-brand-accent/25 min-w-[40px] text-center font-mono">
                {availableStock}
              </span>
            </div>
          </div>

          <div className="border-t border-brand-border/40 my-3"></div>

          {/* 2. Order A (Critical target) */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wide">Order A (Critical Queue Target)</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 font-bold uppercase">Requested Units</label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={orderAQty}
                  onChange={(e) => setOrderAQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-brand-navy border border-brand-border rounded-lg text-xs p-2 text-gray-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 font-bold uppercase">Priority Tier</label>
                <select
                  value={orderAPriority}
                  onChange={(e) => setOrderAPriority(e.target.value)}
                  className="w-full bg-brand-navy border border-brand-border rounded-lg text-xs p-2 text-gray-300 focus:outline-none"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-brand-border/40 my-3"></div>

          {/* 3. Order B (Competing target) */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wide">Order B (Competing Queue Target)</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 font-bold uppercase">Requested Units</label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={orderBQty}
                  onChange={(e) => setOrderBQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-brand-navy border border-brand-border rounded-lg text-xs p-2 text-gray-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-gray-400 font-bold uppercase">Priority Tier</label>
                <select
                  value={orderBPriority}
                  onChange={(e) => setOrderBPriority(e.target.value)}
                  className="w-full bg-brand-navy border border-brand-border rounded-lg text-xs p-2 text-gray-300 focus:outline-none"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Live Simulation Outcomes Drawer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-5 space-y-6 shadow-lg h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-brand-border/40">
                <div className="flex items-center gap-2 text-brand-accent">
                  <Sparkles className="h-4.5 w-4.5 animate-spin" style={{ animationDuration: '4s' }} />
                  <span className="text-xs font-bold uppercase tracking-wider">Engine Simulation Results</span>
                </div>
                {loading && <RefreshCw className="h-3.5 w-3.5 text-gray-400 animate-spin" />}
              </div>

              {simulationResult && (
                <div className="space-y-6 mt-4">
                  {/* Allocation Visualiser cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {simulationResult.allocations.map((alloc) => (
                      <div 
                        key={alloc.order_id} 
                        className={`border rounded-xl p-4 space-y-3 bg-brand-navy/30 transition-colors ${
                          alloc.status === 'Fully Allocated' ? 'border-brand-success/30' :
                          alloc.status === 'Partially Allocated' ? 'border-brand-warning/30' : 'border-brand-danger/30'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-200">Target Order: {alloc.order_id}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                            alloc.status === 'Fully Allocated' ? 'bg-brand-success/15 text-brand-success border-brand-success/20' :
                            alloc.status === 'Partially Allocated' ? 'bg-brand-warning/15 text-brand-warning border-brand-warning/20' :
                            'bg-brand-danger/15 text-brand-danger border-brand-danger/20'
                          }`}>
                            {alloc.status}
                          </span>
                        </div>

                        {/* Quantitative progress indicator */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-gray-400">
                            <span>Fulfillment allocation:</span>
                            <span className="text-gray-200 font-bold">{alloc.allocated} / {alloc.requested} units</span>
                          </div>
                          <div className="w-full bg-brand-navy h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                alloc.status === 'Fully Allocated' ? 'bg-brand-success' :
                                alloc.status === 'Partially Allocated' ? 'bg-brand-warning' : 'bg-brand-danger'
                              }`}
                              style={{ width: `${(alloc.allocated / alloc.requested) * 100}%` }}
                            ></div>
                          </div>
                        </div>

                        <p className="text-[10px] text-gray-400 leading-relaxed italic mt-1">
                          Reason: {alloc.reason}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Smart Copilot Recommendation Callout */}
                  <div className="bg-brand-purple/5 border border-brand-purple/20 rounded-xl p-4 space-y-3.5">
                    <div className="flex items-center gap-2 text-brand-purple">
                      <Brain className="h-4.5 w-4.5" />
                      <span className="text-xs font-bold uppercase tracking-wider">Explainable Replenishment Strategy</span>
                    </div>

                    <div className="text-xs space-y-2 text-gray-300">
                      {simulationResult.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex gap-2 items-start leading-relaxed">
                          <span className="text-brand-purple font-bold">•</span>
                          <p>{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Expected Impact Summary Footer */}
            {simulationResult && (
              <div className="border-t border-brand-border/40 pt-4 flex items-center justify-between mt-6">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4.5 w-4.5 text-brand-accent" />
                  <span className="text-xs text-gray-400">SLA Risk Impact:</span>
                  <span className="text-xs font-bold text-gray-200">{simulationResult.impact}</span>
                </div>
                <button
                  onClick={runSimulation}
                  className="bg-brand-accent hover:bg-brand-accent/90 text-brand-navy text-xs font-bold px-4 py-2 rounded-lg transition-all btn-transition cursor-pointer"
                >
                  Apply Simulated Values
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
