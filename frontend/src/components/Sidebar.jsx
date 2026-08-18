import React from 'react'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Boxes, 
  BrainCircuit, 
  Brain,
  AlertOctagon, 
  Workflow, 
  PackageCheck, 
  Truck, 
  BarChart3, 
  Settings, 
  Cpu
} from 'lucide-react'

export default function Sidebar({ currentPage, setCurrentPage }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'smart_decisions', label: 'Smart Decisions', icon: BrainCircuit },
    { id: 'intelligence', label: 'WARENEX Intelligence', icon: Brain },
    { id: 'exceptions', label: 'Exceptions', icon: AlertOctagon },
    { id: 'picking', label: 'Picking', icon: Workflow },
    { id: 'packing_qc', label: 'Packing & QC', icon: PackageCheck },
    { id: 'dispatch', label: 'Dispatch', icon: Truck },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ]

  return (
    <aside
      className="w-64 bg-brand-charcoal border-r border-brand-border flex flex-col justify-between h-full select-none"
      aria-label="Application sidebar"
    >
      <div>
        {/* Brand Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-brand-border">
          <div className="bg-brand-accent/10 p-2 rounded-lg text-brand-accent border border-brand-accent/20">
            <Cpu className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-xl font-sans tracking-wide text-brand-accent">WARENEX</h1>
            <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Decision Engine</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto" aria-label="Main navigation">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive 
                    ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20 shadow-md shadow-brand-accent/5' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40 border border-transparent'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-brand-accent' : 'text-gray-400 group-hover:text-gray-200'
                }`} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Bottom Profile/Settings */}
      <div className="p-4 border-t border-brand-border bg-brand-navy/30">
        <button
          onClick={() => setCurrentPage('settings')}
          aria-label="Settings"
          aria-current={currentPage === 'settings' ? 'page' : undefined}
          className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800/40 transition-all duration-200 ${
            currentPage === 'settings' ? 'bg-brand-accent/10 text-brand-accent' : ''
          }`}
        >
          <Settings className="h-4.5 w-4.5" />
          <span>Settings</span>
        </button>
        
        <div className="flex items-center gap-3 mt-4 px-3 py-2 bg-brand-navy/50 rounded-lg border border-brand-border">
          <div className="h-8 w-8 rounded-full bg-brand-accent/20 border border-brand-accent/30 flex items-center justify-center font-bold text-brand-accent text-xs">
            OP
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-gray-200">Operator Tower</p>
            <p className="text-[10px] text-gray-400">Warehouse WH-A</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
