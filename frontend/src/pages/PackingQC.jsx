import React, { useState } from 'react'
import { Package, PackageCheck, AlertTriangle, ShieldCheck, Check, Info, Box } from 'lucide-react'

export default function PackingQC({ orders, onPassQC, onReportDamage }) {
  const [showQcModal, setShowQcModal] = useState(false)
  const [activeOrderId, setActiveOrderId] = useState('')
  const [activeSku, setActiveSku] = useState('')
  
  // QC Checklist checklist items state
  const [checklist, setChecklist] = useState({
    correctItems: false,
    correctQuantity: false,
    goodCondition: false,
    packagingIntact: false,
    labelVerified: false
  })

  // Damage reporting state
  const [showDamageModal, setShowDamageModal] = useState(false)
  const [damageReason, setDamageReason] = useState('Package visual puncture scan fail')
  const [damageQty, setDamageQty] = useState(1)

  // Filter orders in packing/QC stage
  const packingQueue = orders.filter(o => o.status === 'Packing' || o.status === 'QC' || o.status === 'Delayed')

  const handleOpenQC = (orderId, sku) => {
    setActiveOrderId(orderId)
    setActiveSku(sku)
    setChecklist({
      correctItems: false,
      correctQuantity: false,
      goodCondition: false,
      packagingIntact: false,
      labelVerified: false
    })
    setShowQcModal(true)
  }

  const handleOpenDamage = (orderId, sku) => {
    setActiveOrderId(orderId)
    setActiveSku(sku)
    setDamageQty(1)
    setDamageReason('Retail barcode packaging pull tear')
    setShowDamageModal(true)
  }

  const handlePassQC = () => {
    onPassQC(activeOrderId)
    setShowQcModal(false)
  }

  const handleFailQC = () => {
    onReportDamage(activeOrderId, activeSku, damageQty, damageReason)
    setShowDamageModal(false)
  }

  const allChecked = Object.values(checklist).every(v => v === true)

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full pb-16 select-none relative">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-100">Packing & Quality Control</h2>
        <p className="text-xs text-gray-400 mt-1">
          Perform barcode pack-out verification, validate order quantities, inspect product condition, and clear labels for carrier pickup.
        </p>
      </div>

      {/* Main Packing queue */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packingQueue.length === 0 ? (
          <div className="col-span-full bg-brand-surface border border-brand-border rounded-xl p-8 text-center text-gray-500 italic">
            No orders currently waiting in the Packing queue. Allocate and pick orders to feed queue.
          </div>
        ) : (
          packingQueue.map((order) => (
            <div 
              key={order.id} 
              className="bg-brand-surface border border-brand-border rounded-xl p-4.5 flex flex-col justify-between space-y-4 shadow-md hover:border-gray-700 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-gray-200">{order.id}</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">{order.customer}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                    order.status === 'QC' ? 'bg-brand-success/15 text-brand-success border-brand-success/20' :
                    order.status === 'Delayed' ? 'bg-brand-danger/15 text-brand-danger border-brand-danger/20 animate-pulse' :
                    'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  }`}>
                    {order.status === 'QC' ? 'QC Passed' : order.status === 'Delayed' ? 'QC Exception' : 'Ready to Pack'}
                  </span>
                </div>

                <div className="border-t border-brand-border/40 pt-2.5 space-y-1 text-xs text-gray-300">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400">Box Packaging Size:</span>
                    <span className="font-semibold text-gray-200">Medium Carton (Box #3)</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-400">Target Scale Weight:</span>
                    <span className="font-semibold text-gray-200">1.8 kg</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2.5 pt-2 border-t border-brand-border/40">
                {order.status === 'QC' ? (
                  <div className="w-full bg-brand-success/10 text-brand-success border border-brand-success/20 text-center py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5">
                    <ShieldCheck className="h-4.5 w-4.5" />
                    <span>QC Cleared - Awaiting Dispatch</span>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleOpenQC(order.id, 'P-101')} // default target demo SKU
                      className="flex-1 bg-brand-accent text-brand-navy font-bold text-[10px] py-2 rounded-lg hover:bg-brand-accent/90 transition-all btn-transition cursor-pointer text-center"
                    >
                      Verify QC Scan
                    </button>
                    <button
                      onClick={() => handleOpenDamage(order.id, 'P-101')}
                      className="flex-1 border border-brand-danger/30 text-brand-danger font-semibold text-[10px] py-2 rounded-lg hover:bg-brand-danger/5 transition-all cursor-pointer text-center"
                    >
                      Report Damage
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* QC Verification Modal Checklist */}
      {showQcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-navy/60 backdrop-blur-xs" onClick={() => setShowQcModal(false)}></div>
          <div className="relative w-full max-w-sm bg-brand-surface border border-brand-border rounded-xl shadow-2xl p-5 z-10 space-y-4">
            
            <div className="flex items-center gap-2 text-brand-purple pb-1 border-b border-brand-border/40">
              <PackageCheck className="h-5 w-5" />
              <h3 className="font-bold text-sm text-gray-200">Quality Control Audit: {activeOrderId}</h3>
            </div>

            <p className="text-xs text-gray-400">Clear all physical barcode verify checks below to approve dispatch labels.</p>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 bg-brand-navy/50 p-2.5 rounded-lg border border-brand-border hover:border-gray-600 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checklist.correctItems}
                  onChange={(e) => setChecklist({ ...checklist, correctItems: e.target.checked })}
                  className="rounded text-brand-accent focus:ring-brand-accent"
                />
                <span className="text-xs text-gray-300">Verify correct item SKU profiles</span>
              </label>

              <label className="flex items-center gap-3 bg-brand-navy/50 p-2.5 rounded-lg border border-brand-border hover:border-gray-600 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checklist.correctQuantity}
                  onChange={(e) => setChecklist({ ...checklist, correctQuantity: e.target.checked })}
                  className="rounded text-brand-accent focus:ring-brand-accent"
                />
                <span className="text-xs text-gray-300">Verify items quantity count</span>
              </label>

              <label className="flex items-center gap-3 bg-brand-navy/50 p-2.5 rounded-lg border border-brand-border hover:border-gray-600 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checklist.goodCondition}
                  onChange={(e) => setChecklist({ ...checklist, goodCondition: e.target.checked })}
                  className="rounded text-brand-accent focus:ring-brand-accent"
                />
                <span className="text-xs text-gray-300">Inspect zero physical retail damages</span>
              </label>

              <label className="flex items-center gap-3 bg-brand-navy/50 p-2.5 rounded-lg border border-brand-border hover:border-gray-600 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checklist.packagingIntact}
                  onChange={(e) => setChecklist({ ...checklist, packagingIntact: e.target.checked })}
                  className="rounded text-brand-accent focus:ring-brand-accent"
                />
                <span className="text-xs text-gray-300">Seal protective box cushioning</span>
              </label>

              <label className="flex items-center gap-3 bg-brand-navy/50 p-2.5 rounded-lg border border-brand-border hover:border-gray-600 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={checklist.labelVerified}
                  onChange={(e) => setChecklist({ ...checklist, labelVerified: e.target.checked })}
                  className="rounded text-brand-accent focus:ring-brand-accent"
                />
                <span className="text-xs text-gray-300">Scan & print shipping barcode sticker</span>
              </label>
            </div>

            <div className="flex gap-2 pt-3 border-t border-brand-border/40">
              <button
                onClick={() => setShowQcModal(false)}
                className="flex-1 bg-brand-charcoal border border-brand-border text-gray-400 text-xs py-2.5 rounded-lg cursor-pointer font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handlePassQC}
                disabled={!allChecked}
                className="flex-1 bg-brand-success text-brand-navy text-xs py-2.5 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-brand-success/15"
              >
                <Check className="h-4 w-4" />
                <span>Pass QC Clearance</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Damage Report Modal Popup */}
      {showDamageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-navy/60 backdrop-blur-xs" onClick={() => setShowDamageModal(false)}></div>
          <div className="relative w-full max-w-sm bg-brand-surface border border-brand-border rounded-xl shadow-2xl p-5 z-10 space-y-4">
            
            <div className="flex items-center gap-2 text-brand-danger pb-1 border-b border-brand-border/40">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-bold text-sm text-gray-200">Log QC Failure Exception</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Damaged Count (Units)</label>
                <input
                  type="number"
                  min="1"
                  value={damageQty}
                  onChange={(e) => setDamageQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-brand-navy border border-brand-border rounded-lg text-xs p-2 text-gray-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Failure Reason Details</label>
                <textarea
                  value={damageReason}
                  onChange={(e) => setDamageReason(e.target.value)}
                  className="w-full bg-brand-navy border border-brand-border rounded-lg text-xs p-2 text-gray-300 focus:outline-none h-20"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowDamageModal(false)}
                className="flex-1 bg-brand-charcoal border border-brand-border text-gray-400 text-xs py-2.5 rounded-lg cursor-pointer font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleFailQC}
                className="flex-1 bg-brand-danger text-white text-xs py-2.5 rounded-lg font-bold cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-brand-danger/10"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Submit QC Failure</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
