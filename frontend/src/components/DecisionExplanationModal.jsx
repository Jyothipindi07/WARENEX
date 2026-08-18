import React from 'react'
import { X, Brain, HelpCircle, CheckCircle, Info } from 'lucide-react'

export default function DecisionExplanationModal({ decision, onClose }) {
  if (!decision) return null

  // Map database logs to plain, non-technical explanations for judge presentation
  const getExplanation = (type, entityId) => {
    const key = `${type}-${entityId}`.toLowerCase()
    
    if (key.includes('stock allocation') || key.includes('partial stock allocation')) {
      return {
        whatHappened: "An inventory shortage was detected for Wireless Headphones Pro. Critical Order ORD-104 requested 10 units, but only 7 units were available in the active warehouse stock.",
        whyDecision: "ORD-104 is a Critical priority order with a near-term delivery SLA. Competing order ORD-118 is a lower priority. Allocating all 7 available units to the critical order protects high-value customer commitments and avoids SLA breach penalty fees.",
        recommendedAction: "Fulfill ORD-104 partially with all 7 available units, put ORD-118 on hold temporarily, and generate a replenishment purchase order for 30 units to restock the warehouse.",
        expectedImpact: "Protects key customer trust, reduces delivery delay risks by 70%, and ensures the restock queue is triggered automatically."
      }
    } else if (key.includes('route') || key.includes('picking')) {
      return {
        whatHappened: "Congestion and travel inefficiencies were identified in picking paths in Zone A. Multiple pickers were walking redundant routes.",
        whyDecision: "Adjacent orders (ORD-1031, ORD-1035, ORD-1042) requested items stored in close proximity (Aisles A-03 and A-05). Consolidation prevents the picker from returning to Zone A multiple times.",
        recommendedAction: "Batch adjacent picking orders together into a single serpentine route layout.",
        expectedImpact: "Reduces total walking travel distance by 38% (from 420m to 260m), speeding up the picking stage dramatically."
      }
    } else if (key.includes('damaged') || key.includes('exception resolution')) {
      return {
        whatHappened: "A packaging tear defect was reported during the Quality Control barcode scan check for Order ORD-104.",
        whyDecision: "1 headphone unit package was damaged. Fulfillment could not proceed without violating delivery quality terms. Search reserve stock to substitute immediately.",
        recommendedAction: "Reserve 1 fresh backup unit from shelf B-01 emergency buffer bin and swap the barcode scans to clear the packing check.",
        expectedImpact: "QC cleared instantly, restoring the fulfillment flow and preventing a dispatch delay."
      }
    } else if (key.includes('reorder') || key.includes('replenishment')) {
      return {
        whatHappened: "Warehouse stock for product SKUs (e.g. Wireless Headphones or Bluetooth Speakers) fell below safe threshold levels.",
        whyDecision: "Safety stock buffers protect against sudden customer demand spikes. Failing to replenish would cause stockouts and future shipment blockages.",
        recommendedAction: "Generate a replenishment request for 30 units and add them to active warehouse stock.",
        expectedImpact: "Replenished inventory, resolved pending stock shortage blockages, and restored safety stock lines."
      }
    } else {
      // Fallback to database details
      return {
        whatHappened: `WARENEX detected an event on ${decision.entity_id || 'Entity'}. Action taken: ${decision.decision}.`,
        whyDecision: `Evaluated operational criteria: ${decision.reason || 'Operational optimization constraints.'}`,
        recommendedAction: `Proceed with applying the system-calculated recommendation.`,
        expectedImpact: decision.impact || 'Improved warehouse flow and minimized SLA risks.'
      }
    }
  }

  const explanation = getExplanation(decision.type, decision.entity_id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-brand-navy/60 backdrop-blur-xs" onClick={onClose}></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-brand-surface border border-brand-border rounded-xl shadow-2xl z-10 overflow-hidden flex flex-col justify-between">
        
        {/* Header */}
        <div className="p-4 border-b border-brand-border bg-brand-charcoal flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-purple">
            <Brain className="h-5 w-5 animate-pulse" />
            <span className="font-bold text-sm text-gray-200">WARENEX Decision Explanation</span>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 hover:bg-gray-800 p-1 rounded-lg cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="flex justify-between items-center text-xs text-gray-400 border-b border-brand-border/30 pb-2 mb-2">
            <span>Decision Run: <strong>{decision.type}</strong></span>
            <span>Target: <strong className="font-mono text-brand-accent">{decision.entity_id}</strong></span>
          </div>

          {/* Section 1: WHAT HAPPENED */}
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-brand-accent" />
              <span>WHAT HAPPENED?</span>
            </h4>
            <p className="text-xs text-gray-200 bg-brand-navy/40 p-3 rounded-lg border border-brand-border/40 leading-relaxed">
              {explanation.whatHappened}
            </p>
          </div>

          {/* Section 2: WHY */}
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-brand-purple" />
              <span>WHY DID WARENEX MAKE THIS DECISION?</span>
            </h4>
            <p className="text-xs text-gray-200 bg-brand-navy/40 p-3 rounded-lg border border-brand-border/40 leading-relaxed">
              {explanation.whyDecision}
            </p>
          </div>

          {/* Section 3: RECOMMENDED ACTION */}
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-brand-warning" />
              <span>WHAT ACTION WAS RECOMMENDED?</span>
            </h4>
            <p className="text-xs text-gray-200 bg-brand-navy/40 p-3 rounded-lg border border-brand-border/40 leading-relaxed font-semibold">
              {explanation.recommendedAction}
            </p>
          </div>

          {/* Section 4: EXPECTED IMPACT */}
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-brand-success" />
              <span>EXPECTED IMPACT</span>
            </h4>
            <p className="text-xs text-brand-success bg-brand-success/5 p-3 rounded-lg border border-brand-success/20 leading-relaxed font-medium">
              {explanation.expectedImpact}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-brand-border bg-brand-charcoal flex justify-end">
          <button
            onClick={onClose}
            className="px-6 bg-brand-purple text-white text-xs py-2.5 rounded-lg hover:bg-brand-purple/90 transition-all font-bold cursor-pointer"
          >
            Acknowledge Explanation
          </button>
        </div>

      </div>
    </div>
  )
}
