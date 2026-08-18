import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Copilot from './components/Copilot'
import OrderDetailsDrawer from './components/OrderDetailsDrawer'
import ExceptionFlowModal from './components/ExceptionFlowModal'
import AllocationConflictModal from './components/AllocationConflictModal'
import DecisionExplanationModal from './components/DecisionExplanationModal'

// Pages
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Inventory from './pages/Inventory'
import SmartDecisions from './pages/SmartDecisions'
import Intelligence from './pages/Intelligence'
import Exceptions from './pages/Exceptions'
import Picking from './pages/Picking'
import PackingQC from './pages/PackingQC'
import Dispatch from './pages/Dispatch'
import Analytics from './pages/Analytics'

import { AlertOctagon, HelpCircle, ShieldCheck, Play, ArrowRight, X } from 'lucide-react'

export default function App() {
  const getInitialPage = () => {
    const path = window.location.pathname.replace(/^\/|\/$/g, '')
    if (path === 'intelligence') return 'intelligence'
    if (path === 'orders') return 'orders'
    if (path === 'inventory') return 'inventory'
    if (path === 'smart-decisions' || path === 'smart_decisions') return 'smart_decisions'
    if (path === 'exceptions') return 'exceptions'
    if (path === 'picking') return 'picking'
    if (path === 'packing' || path === 'packing_qc') return 'packing_qc'
    if (path === 'dispatch') return 'dispatch'
    if (path === 'analytics') return 'analytics'
    return 'dashboard'
  }

  const [currentPage, setCurrentPageState] = useState(getInitialPage)

  const setCurrentPage = (page) => {
    let path = '/'
    if (page !== 'dashboard') {
      path = `/${page.replace('_', '-')}`
    }
    window.history.pushState({}, '', path)
    setCurrentPageState(page)
  }
  const [dashboardData, setDashboardData] = useState(null)
  const [orders, setOrders] = useState([])
  const [inventoryData, setInventoryData] = useState(null)
  const [exceptions, setExceptions] = useState([])
  const [notifications, setNotifications] = useState([])
  const [analyticsData, setAnalyticsData] = useState(null)

  // Modals & drawers state
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [orderDetails, setOrderDetails] = useState(null)
  const [activeException, setActiveException] = useState(null)
  const [showAllocationConflict, setShowAllocationConflict] = useState(false)
  const [selectedDecision, setSelectedDecision] = useState(null)
  const [toasts, setToasts] = useState([])
  const [statusFilter, setStatusFilter] = useState('')

  // Demo Stepper State
  const [showDemo, setShowDemo] = useState(false)
  const [demoStep, setDemoStep] = useState(1)
  const [demoStatusText, setDemoStatusText] = useState('Initialize WARENEX hackathon scenario.')
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoFinished, setDemoFinished] = useState(false)

  // Toast helper
  const triggerToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  // Refresh all state from Flask REST APIs
  const refreshAllState = async () => {
    try {
      const [dbData, ordersRes, invRes, expRes, notifRes, analRes] = await Promise.all([
        fetch('/api/dashboard').then(r => r.json()),
        fetch('/api/orders').then(r => r.json()),
        fetch('/api/inventory').then(r => r.json()),
        fetch('/api/exceptions').then(r => r.json()),
        fetch('/api/notifications').then(r => r.json()),
        fetch('/api/analytics').then(r => r.json())
      ])

      setDashboardData(dbData)
      setOrders(ordersRes)
      setInventoryData(invRes)
      setExceptions(expRes)
      setNotifications(notifRes)
      setAnalyticsData(analRes)

      // If drawer is open, refresh detail details
      if (selectedOrderId) {
        const details = await fetch(`/api/orders/${selectedOrderId}`).then(r => r.json())
        setOrderDetails(details)
      }
    } catch (e) {
      console.error('Error fetching live data:', e)
    }
  }

  useEffect(() => {
    refreshAllState()
  }, [selectedOrderId])

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPageState(getInitialPage())
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Notifications mark read
  const handleMarkRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
      refreshAllState()
      triggerToast('Notification marked read')
    } catch (e) {
      console.error(e)
    }
  }

  // Search trigger helper
  const handleSearch = async (query) => {
    try {
      const res = await fetch(`/api/orders?search=${query}`)
      const data = await res.json()
      setOrders(data)
    } catch (e) {
      console.error(e)
    }
  }

  // Action handlings
  const handlePrioritize = async (id) => {
    try {
      const res = await fetch(`/api/orders/${id}/prioritize`, { method: 'POST' })
      const data = await res.json()
      triggerToast(data.message)
      refreshAllState()
    } catch (e) {
      console.error(e)
    }
  }

  const handleAllocate = async (id) => {
    try {
      const res = await fetch(`/api/orders/${id}/allocate`, { method: 'POST' })
      const data = await res.json()
      triggerToast(data.message, data.success ? 'success' : 'warning')
      refreshAllState()
    } catch (e) {
      console.error(e)
    }
  }

  const handleStartPicking = async (id) => {
    try {
      const res = await fetch(`/api/orders/${id}/picking`, { method: 'POST' })
      const data = await res.json()
      triggerToast(data.message)
      refreshAllState()
    } catch (e) {
      console.error(e)
    }
  }

  const handleMoveToPacking = async (id) => {
    try {
      const res = await fetch(`/api/orders/${id}/packing`, { method: 'POST' })
      const data = await res.json()
      triggerToast(data.message)
      refreshAllState()
    } catch (e) {
      console.error(e)
    }
  }

  const handlePassQC = async (id) => {
    try {
      const res = await fetch(`/api/orders/${id}/qc`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ failed: false })
      })
      const data = await res.json()
      triggerToast(data.message)
      refreshAllState()
    } catch (e) {
      console.error(e)
    }
  }

  const handleReportDamage = async (id, sku, qty, reason) => {
    try {
      const res = await fetch(`/api/orders/${id}/qc`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ failed: true, sku, quantity: qty, reason })
      })
      const data = await res.json()
      triggerToast(data.message, 'warning')
      refreshAllState()
    } catch (e) {
      console.error(e)
    }
  }

  const handleDispatch = async (id, carrier = 'FedEx Ground') => {
    try {
      const res = await fetch(`/api/orders/${id}/dispatch`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrier })
      })
      const data = await res.json()
      triggerToast(data.message)
      refreshAllState()
    } catch (e) {
      console.error(e)
    }
  }

  const handleAdjustStock = async (sku, quantity, reason) => {
    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, quantity, reason })
      })
      const data = await res.json()
      triggerToast(data.message)
      refreshAllState()
    } catch (e) {
      console.error(e)
    }
  }

  const handleReorder = async (sku, quantity) => {
    try {
      const res = await fetch('/api/inventory/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, quantity })
      })
      const data = await res.json()
      triggerToast(data.message)
      refreshAllState()
    } catch (e) {
      console.error(e)
    }
  }

  const handleResolveException = async (id, notes = 'Resolved swap buffer stock substitution.') => {
    try {
      const res = await fetch(`/api/exceptions/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })
      const data = await res.json()
      triggerToast(data.message)
      setActiveException(null)
      refreshAllState()
    } catch (e) {
      console.error(e)
    }
  }

  // Dashboard action center button handler
  const handleActionClick = (action) => {
    if (action.type === 'CRITICAL_ALLOCATION_CONFLICT') {
      handleAllocate(action.entity_id)
    } else if (action.type === 'LOW_STOCK') {
      handleReorder(action.entity_id, 30)
    } else if (action.type === 'PICKING_BOTTLENECK') {
      setCurrentPage('picking')
    }
  }

  // Demo Wizard step processor
  const handleDemoStepClick = async () => {
    setDemoLoading(true)
    try {
      const res = await fetch(`/api/demo/step/${demoStep}`, { method: 'POST' })
      const data = await res.json()
      
      setDemoStatusText(data.message)
      setDemoStep(data.next_step)
      refreshAllState()
      triggerToast(`Demo scenario Stage ${demoStep} applied successfully!`)
      
      if (demoStep === 6) {
        // Complete state transition
        triggerToast("Demo flow finished!", "success")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setDemoLoading(false)
    }
  }

  const handleResetDemo = async () => {
    setDemoLoading(true)
    try {
      await fetch('/api/demo/reset', { method: 'POST' })
      setDemoStep(1)
      setDemoStatusText('Initialize WARENEX hackathon scenario.')
      refreshAllState()
      triggerToast('Database reset and seeded to demo start state.')
    } catch (e) {
      console.error(e)
    } finally {
      setDemoLoading(false)
    }
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            dashboardData={dashboardData} 
            setCurrentPage={setCurrentPage} 
            setStatusFilter={setStatusFilter}
            onActionClick={handleActionClick}
            onOpenAllocationConflict={() => setShowAllocationConflict(true)}
            onDecisionClick={(decision) => setSelectedDecision(decision)}
          />
        )
      case 'orders':
        return (
          <Orders 
            orders={orders} 
            onSelectOrder={setSelectedOrderId}
            onPrioritize={handlePrioritize}
            onAllocate={handleAllocate}
            onStartPicking={handleStartPicking}
            onMoveToPacking={handleMoveToPacking}
            onDispatch={handleDispatch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        )
      case 'inventory':
        return (
          <Inventory 
            inventoryData={inventoryData} 
            onAdjustStock={handleAdjustStock} 
            onReorder={handleReorder}
          />
        )
      case 'smart_decisions':
        return <SmartDecisions />
      case 'intelligence':
        return (
          <Intelligence 
            dashboardData={dashboardData}
            onAllocate={handleAllocate}
            onReorder={handleReorder}
            onStartPicking={handleStartPicking}
            refreshAllState={refreshAllState}
            setCurrentPage={setCurrentPage}
          />
        )
      case 'exceptions':
        return <Exceptions exceptions={exceptions} onSelectException={setActiveException} />
      case 'picking':
        return <Picking onOptimizePicking={refreshAllState} />
      case 'packing_qc':
        return (
          <PackingQC 
            orders={orders} 
            onPassQC={handlePassQC} 
            onReportDamage={handleReportDamage} 
          />
        )
      case 'dispatch':
        return <Dispatch orders={orders} onDispatch={handleDispatch} />
      case 'analytics':
        return <Analytics analyticsData={analyticsData} />
      default:
        return (
          <div className="p-8 text-center text-gray-400 select-none">
            <h2 className="text-lg font-bold text-gray-200">Settings Workspace</h2>
            <p className="text-xs text-gray-500 mt-2">Configuration panels, device bindings, and diagnostic controls.</p>
          </div>
        )
    }
  }

  return (
    <div className="h-screen w-screen flex bg-brand-navy overflow-hidden">
      
      {/* Permanent Sidebar */}
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Topbar navigation */}
        <TopBar 
          onSearch={handleSearch} 
          notifications={notifications} 
          onMarkRead={handleMarkRead}
          onTriggerDemo={() => setShowDemo(true)}
        />

        {/* Viewport wrap */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Main workspace */}
          <main className="flex-1 h-full overflow-hidden bg-brand-charcoal relative">
            {renderPage()}
          </main>

          {/* Dynamic intelligence Copilot (Dashboard context) */}
          <Copilot 
            dashboardData={dashboardData} 
            exceptions={exceptions}
            orders={orders}
            onAllocate={handleAllocate}
            onReorder={handleReorder}
            onStartPicking={handleStartPicking}
            refreshAllState={refreshAllState}
            setCurrentPage={setCurrentPage}
            triggerToast={triggerToast}
            onBatchOptimize={async () => {
              // Apply route optimization instantly when clicked from Copilot
              try {
                await fetch('/api/picking/batch', { method: 'POST' })
                refreshAllState()
                triggerToast("Transit route optimized. 38% walk savings applied!", "success")
              } catch (e) {
                console.error(e)
              }
            }} 
            onViewDetails={() => setCurrentPage('orders')}
          />
        </div>
      </div>

      {/* Details Slide Drawer */}
      {selectedOrderId && (
        <OrderDetailsDrawer
          orderId={selectedOrderId}
          orderDetails={orderDetails}
          onClose={() => setSelectedOrderId(null)}
          onAllocate={handleAllocate}
          onStartPicking={handleStartPicking}
          onMoveToPacking={handleMoveToPacking}
          onDispatch={handleDispatch}
        />
      )}

      {/* Allocation Conflict Modal */}
      <AllocationConflictModal
        isOpen={showAllocationConflict}
        onClose={() => {
          setShowAllocationConflict(false)
          refreshAllState()
        }}
        onApplyDecision={async () => {
          await fetch('/api/demo/step/5', { method: 'POST' })
          refreshAllState()
          triggerToast("Allocation conflict resolved successfully!", "success")
        }}
        onSimulateAlternative={() => {
          setShowAllocationConflict(false)
          setCurrentPage('smart_decisions')
        }}
      />

      {/* Decision Explanation Modal */}
      <DecisionExplanationModal
        decision={selectedDecision}
        onClose={() => setSelectedDecision(null)}
      />



      {/* Toasts Stack */}
      <div className="fixed bottom-6 left-6 z-50 space-y-2 select-none">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`px-4.5 py-3 rounded-xl border text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce leading-relaxed ${
              toast.type === 'success' ? 'bg-brand-success/15 border-brand-success/30 text-brand-success' : 'bg-brand-warning/15 border-brand-warning/30 text-brand-warning'
            }`}
          >
            <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Hackathon Interactive Demo Tour Stepper Modal */}
      {showDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          <div className="absolute inset-0 bg-brand-navy/60 backdrop-blur-xs" onClick={() => setShowDemo(false)}></div>
          <div className="relative w-full max-w-lg bg-brand-surface border border-brand-border rounded-xl shadow-2xl p-5 z-10 space-y-4">
            
            {demoFinished ? (
              /* INCIDENT RESOLVED SUMMARY PANEL */
              <div className="space-y-4">
                <div className="flex flex-col items-center text-center space-y-2 pb-2">
                  <div className="h-12 w-12 rounded-full bg-brand-success/15 border border-brand-success/30 flex items-center justify-center text-brand-success">
                    <ShieldCheck className="h-6 w-6 animate-bounce" />
                  </div>
                  <h3 className="text-base font-bold text-gray-100 uppercase tracking-wide">🎉 Incident Resolved</h3>
                  <p className="text-xs text-brand-success font-semibold leading-relaxed">
                    Order fulfilled, Quality Exception resolved, Inventory updated, SLA Risk reduced, and FedEx Shipment dispatched.
                  </p>
                </div>

                <div className="border-t border-brand-border/40 my-3"></div>

                {/* BEFORE VS AFTER IMPACT SUMMARY */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block text-center">Fulfillment Comparison Matrix</span>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Before Column */}
                    <div className="bg-brand-danger/5 border border-brand-danger/25 rounded-xl p-3.5 space-y-2">
                      <h4 className="text-[10px] font-black text-brand-danger uppercase text-center tracking-wider">Before (Manual WMS)</h4>
                      <div className="space-y-1.5 text-[11px] text-gray-300">
                        <div className="flex justify-between">
                          <span>SLA Risk:</span>
                          <span className="text-brand-danger font-bold">🔴 High</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Quality Exception:</span>
                          <span className="text-brand-danger font-bold">⚠️ Active</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Allocation Conflict:</span>
                          <span className="text-brand-danger font-bold">Blocked</span>
                        </div>
                      </div>
                    </div>

                    {/* After Column */}
                    <div className="bg-brand-success/5 border border-brand-success/25 rounded-xl p-3.5 space-y-2">
                      <h4 className="text-[10px] font-black text-brand-success uppercase text-center tracking-wider">After (WARENEX)</h4>
                      <div className="space-y-1.5 text-[11px] text-gray-300">
                        <div className="flex justify-between">
                          <span>SLA Risk:</span>
                          <span className="text-brand-success font-bold">🟢 Low</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Quality Exception:</span>
                          <span className="text-brand-success font-bold">✓ Resolved</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Allocation Conflict:</span>
                          <span className="text-brand-success font-bold">✓ Resolved</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-brand-purple/10 border border-brand-purple/30 rounded-lg p-3 text-center text-xs font-bold text-brand-purple italic tracking-wide">
                  "WARENEX successfully prevented an operational delay."
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={handleResetDemo}
                    className="bg-brand-charcoal hover:bg-gray-800 border border-brand-border text-gray-400 text-xs py-2.5 rounded-lg font-bold flex-1 cursor-pointer"
                  >
                    Restart Demo Flow
                  </button>
                  <button
                    onClick={() => {
                      setShowDemo(false)
                      setDemoFinished(false)
                    }}
                    className="bg-brand-success text-brand-navy text-xs py-2.5 rounded-lg font-bold flex-1 cursor-pointer text-center"
                  >
                    Finish & Close
                  </button>
                </div>
              </div>
            ) : (
              /* ACTIVE STEP FLOW */
              <>
                <div className="flex items-center justify-between border-b border-brand-border/40 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="pulse-dot h-3 w-3 rounded-full bg-brand-purple"></span>
                    <h3 className="font-bold text-sm text-gray-200">Interactive Demo Walkthrough</h3>
                  </div>
                  <button 
                    onClick={() => setShowDemo(false)}
                    className="text-gray-400 hover:text-gray-200 hover:bg-gray-800 p-1 rounded-lg cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed">
                  Experience the smart fulfillment flow: Allocate partial stock, evaluate SLA priorities, resolve QC packaging tears, swap buffer units, and ship packages.
                </p>

                {/* 7-step Stepper indicators */}
                <div className="grid grid-cols-7 gap-1.5 py-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((st) => (
                    <div 
                      key={st} 
                      className={`h-1.5 rounded-full transition-colors duration-300 ${
                        demoStep === st ? 'bg-brand-purple animate-pulse' : 
                        demoStep > st ? 'bg-brand-success' : 'bg-brand-navy'
                      }`}
                    />
                  ))}
                </div>

                {/* Narrative text card */}
                <div className="bg-brand-navy/60 border border-brand-border/60 rounded-xl p-4.5 space-y-3">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-brand-purple">
                    <span>
                      {demoStep === 1 ? 'Step 1: Initialization' :
                       demoStep === 2 ? 'Step 2: Shortage Detection' :
                       demoStep === 3 ? 'Step 3: Priority Engine' :
                       demoStep === 4 ? 'Step 4: Decision Engine' :
                       demoStep === 5 ? 'Step 5: Apply Allocation' :
                       demoStep === 6 ? 'Step 6: QC Check Damage' :
                       'Step 7: Reserve replacement & Ship'}
                    </span>
                    {demoLoading && <span className="text-gray-400 animate-pulse">Running Engine...</span>}
                  </div>
                  
                  <div className="bg-brand-surface p-3 rounded border border-brand-border/40 text-xs leading-relaxed text-gray-300 font-semibold">
                    {demoStatusText}
                  </div>

                  {/* Quality Exception Detail View during Step 6 */}
                  {demoStep === 6 && (
                    <div className="bg-brand-danger/5 border border-brand-danger/25 p-3 rounded-lg space-y-2 text-[11px] leading-relaxed">
                      <div className="flex justify-between items-center text-brand-danger font-bold">
                        <span>🚨 QUALITY CHECK EXCEPTION DETECTED</span>
                        <span>EXP-104-QC-DAMAGE</span>
                      </div>
                      <div className="text-gray-300 space-y-0.5">
                        <p><strong>Order ID:</strong> ORD-104 (Apex Systems)</p>
                        <p><strong>SKU:</strong> P-101 (Wireless Headphones Pro)</p>
                        <p><strong>QC Scan Checklist:</strong> 7 expected units vs <strong className="text-brand-danger">1 damaged unit package reported</strong></p>
                        <p className="text-brand-warning font-semibold">Decision Engine Action: Search buffer stock shelf B-01 for substitution swap.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stepper Buttons Footer */}
                <div className="flex gap-2.5 pt-2 border-t border-brand-border/40">
                  <button
                    onClick={handleResetDemo}
                    className="bg-brand-charcoal hover:bg-gray-800 border border-brand-border text-gray-400 text-xs py-2.5 rounded-lg cursor-pointer font-bold flex-1"
                  >
                    Reset Scenario
                  </button>
                  
                  <button
                    onClick={handleDemoStepClick}
                    disabled={demoLoading}
                    className="bg-brand-purple hover:bg-brand-purple/90 text-white text-xs py-2.5 rounded-lg font-bold flex-1 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-brand-purple/10"
                  >
                    <span>
                      {demoStep === 1 ? 'Start Walkthrough' : 
                       demoStep === 2 ? 'Run Priority Engine' :
                       demoStep === 3 ? 'Recommend Strategy' :
                       demoStep === 4 ? 'Apply Allocation Decision' :
                       demoStep === 5 ? 'Run QC Checklist scan' :
                       demoStep === 6 ? 'Reserve Replacement Swap' :
                       'Confirm Dispatch Shipment'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  )
}
