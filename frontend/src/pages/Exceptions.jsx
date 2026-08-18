import React from 'react'
import { AlertOctagon, CheckCircle2, ShieldAlert, Clock, Eye } from 'lucide-react'

export default function Exceptions({ exceptions, onSelectException }) {
  const getSeverityStyle = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-brand-danger/10 text-brand-danger border-brand-danger/20'
      case 'high':
        return 'bg-brand-warning/10 text-brand-warning border-brand-warning/20'
      case 'medium':
        return 'bg-brand-accent/10 text-brand-accent border-brand-accent/20'
      default:
        return 'bg-gray-800 text-gray-400 border-gray-700'
    }
  }

  const getStatusStyle = (status) => {
    if (status === 'Resolved') {
      return 'bg-brand-success/15 text-brand-success border-brand-success/20'
    }
    return 'bg-brand-danger/10 text-brand-danger border-brand-danger/20 animate-pulse'
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full pb-16 select-none">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-100">Exception Control Center</h2>
        <p className="text-xs text-gray-400 mt-1">
          Monitor operational anomalies, stockouts, damaged products, and apply automated decision recommendations to restore workflows.
        </p>
      </div>

      {/* Exception list table */}
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-brand-charcoal text-gray-400 border-b border-brand-border uppercase text-[9px] tracking-wider">
            <tr>
              <th className="p-3.5">ID</th>
              <th className="p-3.5">Exception Type</th>
              <th className="p-3.5 text-center">Severity</th>
              <th className="p-3.5">Affected Entity</th>
              <th className="p-3.5">Product SKU</th>
              <th className="p-3.5">Detected At</th>
              <th className="p-3.5 text-center">Status</th>
              <th className="p-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/30 text-gray-300">
            {exceptions.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-gray-500 italic">No exceptions recorded.</td>
              </tr>
            ) : (
              exceptions.map((exp) => (
                <tr key={exp.id} className="hover:bg-brand-surface/40">
                  <td className="p-3.5 font-bold text-gray-200">{exp.id}</td>
                  <td className="p-3.5 font-semibold text-gray-100">{exp.type}</td>
                  <td className="p-3.5 text-center">
                    <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${getSeverityStyle(exp.severity)}`}>
                      {exp.severity}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-brand-accent">{exp.order_id && exp.order_id !== 'None' ? exp.order_id : 'Inventory Grid'}</td>
                  <td className="p-3.5 font-mono text-gray-400">{exp.product_sku && exp.product_sku !== 'None' ? exp.product_sku : 'N/A'}</td>
                  <td className="p-3.5 text-gray-500 text-[10px] font-mono whitespace-nowrap">{exp.detected_at}</td>
                  <td className="p-3.5 text-center">
                    <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusStyle(exp.status)}`}>
                      {exp.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {exp.status === 'Active' ? (
                        <button
                          onClick={() => onSelectException(exp)}
                          className="bg-brand-accent text-brand-navy text-[10px] font-bold px-3 py-1 rounded hover:bg-brand-accent/90 transition-colors cursor-pointer"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-500 font-semibold italic flex items-center gap-1.5 bg-brand-navy/60 px-2 py-1 rounded border border-brand-border/40">
                          <CheckCircle2 className="h-3.5 w-3.5 text-brand-success" />
                          <span>Cleared</span>
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}
