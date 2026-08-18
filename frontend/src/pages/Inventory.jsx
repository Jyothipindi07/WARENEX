import React, { useState } from 'react'
import { Plus, Minus, RefreshCcw, Search, Filter } from 'lucide-react'

export default function Inventory({ 
  inventoryData, 
  onAdjustStock, 
  onReorder 
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [healthFilter, setHealthFilter] = useState('')
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustSku, setAdjustSku] = useState('')
  const [adjustQty, setAdjustQty] = useState(1)
  const [adjustReason, setAdjustReason] = useState('Manual audit update')

  if (!inventoryData) {
    return (
      <div className="p-8 text-center text-gray-400">
        <div className="animate-spin h-8 w-8 border-4 border-brand-accent border-t-transparent rounded-full mx-auto mb-4"></div>
        <span>Loading Inventory Levels...</span>
      </div>
    )
  }

  const { products, summary } = inventoryData

  // Filter items
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.sku.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === '' || p.category === categoryFilter
    const matchesHealth = healthFilter === '' || p.stock_health === healthFilter
    return matchesSearch && matchesCategory && matchesHealth
  })

  // Get categories for filter dropdown
  const categories = Array.from(new Set(products.map(p => p.category)))

  const getHealthBadge = (health) => {
    switch (health) {
      case 'Out of Stock':
        return <span className="bg-brand-danger/10 text-brand-danger text-[10px] font-bold px-2 py-0.5 rounded border border-brand-danger/25">⚫ Out of Stock</span>
      case 'Low Stock':
        return <span className="bg-brand-warning/10 text-brand-warning text-[10px] font-bold px-2 py-0.5 rounded border border-brand-warning/25">🟡 Low Stock</span>
      case 'Damaged':
        return <span className="bg-orange-500/10 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded border border-orange-500/20">🔴 Damaged</span>
      default:
        return <span className="bg-brand-success/10 text-brand-success text-[10px] font-bold px-2 py-0.5 rounded border border-brand-success/20">🟢 Healthy</span>
    }
  }

  const handleOpenAdjust = (sku) => {
    setAdjustSku(sku)
    setAdjustQty(1)
    setAdjustReason('Physical inventory recount reconciliation')
    setShowAdjustModal(true)
  }

  const submitAdjust = () => {
    onAdjustStock(adjustSku, adjustQty, adjustReason)
    setShowAdjustModal(false)
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full pb-16 select-none relative">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-100">Inventory Management</h2>
        <p className="text-xs text-gray-400 mt-1">Track physical stock, location mapping, safety thresholds, and damaged goods reconciliation.</p>
      </div>

      {/* Summary KPI Panel */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-brand-surface border border-brand-border p-4 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total SKUs</p>
          <p className="text-2xl font-black text-gray-100 mt-1">{summary.total_skus}</p>
        </div>
        <div className="bg-brand-surface border border-brand-border p-4 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Available Units</p>
          <p className="text-2xl font-black text-brand-accent mt-1">{summary.available_units}</p>
        </div>
        <div className="bg-brand-surface border border-brand-border p-4 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Low Stock SKUs</p>
          <p className="text-2xl font-black text-brand-warning mt-1">{summary.low_stock}</p>
        </div>
        <div className="bg-brand-surface border border-brand-border p-4 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Out of Stock</p>
          <p className="text-2xl font-black text-brand-danger mt-1">{summary.out_of_stock}</p>
        </div>
        <div className="bg-brand-surface border border-brand-border p-4 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Damaged Units</p>
          <p className="text-2xl font-black text-orange-400 mt-1">{summary.damaged_units}</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between shadow-md">
        <div className="flex flex-wrap gap-3 items-center flex-1 max-w-2xl">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search SKU or Product Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-brand-navy border border-brand-border rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none w-full"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-brand-navy border border-brand-border px-3 py-1.5 rounded-lg text-xs">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-brand-navy border border-brand-border px-3 py-1.5 rounded-lg text-xs">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={healthFilter}
              onChange={(e) => setHealthFilter(e.target.value)}
              className="bg-transparent text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="">All Health Status</option>
              <option value="Healthy">Healthy</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Damaged">Damaged</option>
            </select>
          </div>
        </div>
        
        {(searchTerm || categoryFilter || healthFilter) && (
          <button 
            onClick={() => {
              setSearchTerm('')
              setCategoryFilter('')
              setHealthFilter('')
            }}
            className="text-xs text-brand-accent hover:underline font-medium cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Inventory Table */}
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-brand-charcoal text-gray-400 border-b border-brand-border uppercase text-[9px] tracking-wider">
            <tr>
              <th className="p-3.5">SKU</th>
              <th className="p-3.5">Product</th>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Location</th>
              <th className="p-3.5 text-center">Available</th>
              <th className="p-3.5 text-center">Reserved</th>
              <th className="p-3.5 text-center">Damaged</th>
              <th className="p-3.5 text-center">Safety Min</th>
              <th className="p-3.5 text-center">Health Status</th>
              <th className="p-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/30 text-gray-300">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="10" className="p-8 text-center text-gray-500 italic">No products found matching filters.</td>
              </tr>
            ) : (
              filteredProducts.map((p) => (
                <tr key={p.sku} className="hover:bg-brand-surface/40">
                  <td className="p-3.5 font-bold font-mono text-brand-accent">{p.sku}</td>
                  <td className="p-3.5 font-semibold text-gray-100">{p.name}</td>
                  <td className="p-3.5 text-gray-400">{p.category}</td>
                  <td className="p-3.5 font-mono text-gray-400">{p.location}</td>
                  <td className="p-3.5 text-center font-bold text-gray-200">{p.available}</td>
                  <td className="p-3.5 text-center font-medium text-gray-400">{p.reserved}</td>
                  <td className={`p-3.5 text-center font-bold ${p.damaged > 0 ? 'text-brand-danger' : 'text-gray-500'}`}>{p.damaged}</td>
                  <td className="p-3.5 text-center text-gray-400">{p.reorder_level}</td>
                  <td className="p-3.5 text-center">{getHealthBadge(p.stock_health)}</td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenAdjust(p.sku)}
                        className="bg-brand-navy hover:bg-gray-800 p-1 rounded text-brand-accent border border-brand-border hover:border-gray-600 transition-all cursor-pointer text-[10px] font-bold px-2 py-1"
                        title="Adjust Stock"
                      >
                        Adjust
                      </button>
                      
                      {p.available <= p.reorder_level && (
                        <button
                          onClick={() => onReorder(p.sku, p.reorder_level * 2)}
                          className="bg-brand-purple/20 hover:bg-brand-purple/30 text-brand-purple border border-brand-purple/40 text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer btn-transition"
                          title="Restock Proposal"
                        >
                          Reorder
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Adjust Stock Modal Popup */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-navy/60 backdrop-blur-xs" onClick={() => setShowAdjustModal(false)}></div>
          <div className="relative w-full max-w-sm bg-brand-surface border border-brand-border rounded-xl shadow-2xl p-5 z-10 space-y-4">
            <h3 className="font-bold text-sm text-gray-200">Adjust Inventory Stock: {adjustSku}</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Adjustment Quantity (Can be negative)</label>
                <div className="flex items-center bg-brand-navy rounded-lg border border-brand-border overflow-hidden">
                  <button 
                    onClick={() => setAdjustQty(prev => prev - 1)}
                    className="p-2.5 text-gray-400 hover:text-gray-200 bg-brand-charcoal cursor-pointer border-r border-brand-border"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                    className="bg-transparent text-center text-xs text-gray-200 focus:outline-none w-full"
                  />
                  <button 
                    onClick={() => setAdjustQty(prev => prev + 1)}
                    className="p-2.5 text-gray-400 hover:text-gray-200 bg-brand-charcoal cursor-pointer border-l border-brand-border"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Reason Description</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-brand-navy border border-brand-border rounded-lg text-xs p-2 text-gray-300 focus:outline-none focus:border-brand-accent"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="flex-1 bg-brand-charcoal hover:bg-gray-800 border border-brand-border text-gray-400 text-xs py-2 rounded-lg cursor-pointer font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={submitAdjust}
                className="flex-1 bg-brand-accent hover:bg-brand-accent/90 text-brand-navy text-xs py-2 rounded-lg font-bold cursor-pointer"
              >
                Apply Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
