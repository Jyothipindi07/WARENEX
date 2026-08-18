import React, { useState } from 'react'
import { Workflow, User, Clock, Route, CheckSquare, Sparkles, Layers } from 'lucide-react'

export default function Picking({ onOptimizePicking }) {
  const [batched, setBatched] = useState(false)
  const [optimizing, setOptimizing] = useState(false)

  const pickers = [
    { name: 'John Doe', status: 'Active', zone: 'Zone A', items: 'Wireless Headphones (A-03)' },
    { name: 'Jane Smith', status: 'Active', zone: 'Zone B', items: 'Charging Cables (B-01)' },
    { name: 'Robert Chen', status: 'Idle', zone: 'Zone C', items: 'None' },
    { name: 'Sarah Jenkins', status: 'Active', zone: 'Zone E', items: 'Standing Desks (E-01)' },
    { name: 'Michael Patel', status: 'Idle', zone: 'Zone G', items: 'None' }
  ]

  const pickList = [
    { sku: 'P-101', name: 'Wireless Headphones Pro', qty: 7, loc: 'A-03-B-12', order: 'ORD-104', status: 'Allocated' },
    { sku: 'P-102', name: 'Bluetooth Speaker', qty: 2, loc: 'A-05-A-03', order: 'ORD-1031', status: 'Allocated' },
    { sku: 'P-108', name: 'HD Web Camera 1080p', qty: 1, loc: 'A-04-C-10', order: 'ORD-1035', status: 'Allocated' }
  ]

  const [successMessage, setSuccessMessage] = useState('')

  const handleOptimize = async () => {
    setOptimizing(true)
    try {
      const res = await fetch('/api/picking/batch', { method: 'POST' })
      const data = await res.json()
      setBatched(true)
      setSuccessMessage("38% estimated travel reduction applied.")
      if (onOptimizePicking) {
        onOptimizePicking()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setOptimizing(false)
    }
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full pb-16 select-none">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-100">Picking Operations</h2>
        <p className="text-xs text-gray-400 mt-1">Manage picking routes, active picker shifts, and optimize zone transit distance.</p>
      </div>

      {/* Picking Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-brand-surface border border-brand-border p-4 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Active Pickers</p>
          <p className="text-2xl font-black text-gray-100 mt-1">3 / 5</p>
        </div>
        <div className="bg-brand-surface border border-brand-border p-4 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Orders Waiting</p>
          <p className="text-2xl font-black text-brand-accent mt-1">4</p>
        </div>
        <div className="bg-brand-surface border border-brand-border p-4 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Orders Picking</p>
          <p className="text-2xl font-black text-brand-warning mt-1">3</p>
        </div>
        <div className="bg-brand-surface border border-brand-border p-4 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Avg Pick Time</p>
          <p className="text-2xl font-black text-gray-100 mt-1">22 min</p>
        </div>
        <div className="bg-brand-surface border border-brand-border p-4 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Picking Efficiency</p>
          <p className="text-2xl font-black text-brand-success mt-1">87%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Pickers list */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 space-y-4 shadow-lg h-fit">
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
            <User className="h-4.5 w-4.5 text-brand-accent" />
            <span>Picker Status Shift</span>
          </h3>

          <div className="space-y-3">
            {pickers.map((picker, idx) => (
              <div key={idx} className="bg-brand-navy/40 p-3 rounded-lg border border-brand-border/40 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-200">{picker.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{picker.zone} • {picker.items}</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                  picker.status === 'Active' ? 'bg-brand-success/15 text-brand-success' : 'bg-gray-800 text-gray-500'
                }`}>
                  {picker.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Route Optimization and Batch Picking */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-5 space-y-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-brand-border/40 mb-3">
                <div className="flex items-center gap-2 text-brand-purple">
                  <Sparkles className="h-4.5 w-4.5" />
                  <span className="text-xs font-bold uppercase tracking-wider font-sans">Dynamic Batch Route Optimizer</span>
                </div>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">
                The Decision Engine analyzed adjacent pending orders. Batching these picklists prevents duplicate picker trips to Zone A aisles.
              </p>

              {/* Progress bar comparison */}
              <div className="space-y-4 my-5 bg-brand-navy/30 border border-brand-border/50 rounded-xl p-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Individual Travel Distance:</span>
                    <span className="text-gray-200 font-bold">420 meters</span>
                  </div>
                  <div className="w-full bg-brand-navy h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-danger rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Batched Serpentine Routing (Optimized):</span>
                    <span className={`font-bold ${batched ? 'text-brand-success' : 'text-gray-400'}`}>
                      {batched ? '260 meters (-38% Applied)' : '260 meters (Proposed)'}
                    </span>
                  </div>
                  <div className="w-full bg-brand-navy h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${batched ? 'bg-brand-success' : 'bg-brand-purple/40'}`} 
                      style={{ width: batched ? '62%' : '100%' }}
                    ></div>
                  </div>
                  {successMessage && (
                    <div className="text-[10px] text-brand-success font-bold mt-2 flex items-center gap-1">
                      <span>✓</span>
                      <span>{successMessage}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Picking list items details */}
              <div className="space-y-2">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Suggested Picking Batch</span>
                <div className="bg-brand-navy/50 border border-brand-border/60 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-brand-charcoal text-gray-400 border-b border-brand-border/40 text-[9px] uppercase tracking-wider">
                      <tr>
                        <th className="p-2">Location</th>
                        <th className="p-2">Product Name</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2">Ticket Order</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/20 text-gray-300 font-mono">
                      {pickList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-brand-surface/30">
                          <td className="p-2 text-brand-accent font-bold">{item.loc}</td>
                          <td className="p-2 font-sans truncate max-w-[150px]">{item.name}</td>
                          <td className="p-2 text-center font-bold">{item.qty}</td>
                          <td className="p-2 text-gray-400">{item.order}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="border-t border-brand-border/40 pt-4 flex gap-3 mt-4">
              <button
                onClick={handleOptimize}
                disabled={optimizing || batched}
                className="flex-1 bg-brand-purple hover:bg-brand-purple/95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs py-3 rounded-lg btn-transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-brand-purple/10"
              >
                <Route className="h-4 w-4" />
                <span>{optimizing ? 'Generating Serpentine Route...' : batched ? '38% travel reduction applied' : 'APPLY OPTIMIZATION'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
