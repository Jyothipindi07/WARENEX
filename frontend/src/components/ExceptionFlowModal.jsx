import React from 'react'
import { X, AlertOctagon, HelpCircle, ShieldCheck, ArrowDown, Check } from 'lucide-react'

export default function ExceptionFlowModal({ exception, onClose, onResolve }) {
  if (!exception) return null

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-brand-danger/10 text-brand-danger border-brand-danger/20'
      case 'high': return 'bg-brand-warning/10 text-brand-warning border-brand-warning/20'
      default: return 'bg-brand-accent/10 text-brand-accent border-brand-accent/20'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-brand-navy/60 backdrop-blur-xs" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-brand-surface border border-brand-border rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col justify-between">
        
        {/* Header */}
        <div className="p-4 border-b border-brand-border bg-brand-charcoal flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-brand-danger" />
            <span className="font-bold text-sm text-gray-200">Exception Resolver Workflow</span>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 hover:bg-gray-800 p-1 rounded-lg cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* 3-Step Flow Diagram Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">Exception ID: {exception.id}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${getSeverityColor(exception.severity)}`}>
              {exception.severity} Severity
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            {/* Step 1: EXCEPTION */}
            <div className="w-full bg-brand-danger/5 border border-brand-danger/20 rounded-xl p-3.5 flex items-start gap-3">
              <div className="bg-brand-danger/10 p-2 rounded-lg text-brand-danger">
                <AlertOctagon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">1. Exception Detected</h4>
                <p className="text-xs text-gray-300 mt-1 font-semibold leading-relaxed">{exception.type}</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{exception.description}</p>
              </div>
            </div>

            <ArrowDown className="h-4 w-4 text-gray-500 animate-bounce" />

            {/* Step 2: DECISION */}
            <div className="w-full bg-brand-purple/5 border border-brand-purple/20 rounded-xl p-3.5 flex items-start gap-3">
              <div className="bg-brand-purple/10 p-2 rounded-lg text-brand-purple">
                <HelpCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">2. Decision Recommendation</h4>
                <p className="text-xs text-gray-300 mt-1 leading-relaxed">{exception.recommendation}</p>
              </div>
            </div>

            <ArrowDown className="h-4 w-4 text-gray-500" />

            {/* Step 3: RESOLUTION */}
            <div className="w-full bg-brand-success/5 border border-brand-success/20 rounded-xl p-3.5 flex items-start gap-3">
              <div className="bg-brand-success/10 p-2 rounded-lg text-brand-success">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">3. Actionable Resolution</h4>
                <p className="text-xs text-gray-400 mt-1">
                  Apply recommended resolution to reserve backup stock items and recover fulfillment workflow execution logs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="p-4 border-t border-brand-border bg-brand-charcoal flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-brand-border text-gray-400 text-xs py-2.5 rounded-lg hover:bg-gray-800 transition-all font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onResolve(exception.id)}
            className="flex-1 bg-brand-success text-brand-navy text-xs py-2.5 rounded-lg hover:bg-brand-success/90 transition-all font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-brand-success/10"
          >
            <Check className="h-4 w-4" />
            <span>Apply Resolution</span>
          </button>
        </div>

      </div>
    </div>
  )
}
