import React, { useState } from 'react'
import { Search, Filter, ShieldCheck, Play, ArrowUpDown, ChevronLeft, ChevronRight, Eye } from 'lucide-react'

export default function Orders({ 
  orders, 
  onSelectOrder, 
  onPrioritize, 
  onAllocate, 
  onStartPicking, 
  onMoveToPacking, 
  onDispatch, 
  statusFilter, 
  setStatusFilter 
}) {
  const [priorityFilter, setPriorityFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('DESC')
  const [currentPage, setCurrentPage] = useState(1)
  
  const ordersPerPage = 10

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortField(field)
      setSortOrder('DESC')
    }
  }

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.customer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === '' || o.status === statusFilter
    const matchesPriority = priorityFilter === '' || o.priority === priorityFilter
    const matchesRisk = riskFilter === '' || o.risk === riskFilter
    return matchesSearch && matchesStatus && matchesPriority && matchesRisk
  })

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let fieldA = a[sortField]
    let fieldB = b[sortField]
    
    if (sortField === 'value' || sortField === 'priority_score') {
      fieldA = Number(fieldA)
      fieldB = Number(fieldB)
    }

    if (fieldA < fieldB) return sortOrder === 'ASC' ? -1 : 1
    if (fieldA > fieldB) return sortOrder === 'ASC' ? 1 : -1
    return 0
  })

  // Paginate orders
  const indexOfLastOrder = currentPage * ordersPerPage
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage
  const currentOrders = sortedOrders.slice(indexOfFirstOrder, indexOfLastOrder)
  const totalPages = Math.ceil(sortedOrders.length / ordersPerPage)

  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return <span className="bg-brand-danger/10 text-brand-danger text-[10px] font-bold px-2 py-0.5 rounded border border-brand-danger/25">🔴 Critical</span>
      case 'high':
        return <span className="bg-brand-warning/10 text-brand-warning text-[10px] font-bold px-2 py-0.5 rounded border border-brand-warning/25">🟠 High</span>
      case 'medium':
        return <span className="bg-brand-accent/10 text-brand-accent text-[10px] font-bold px-2 py-0.5 rounded border border-brand-accent/25">🟡 Medium</span>
      default:
        return <span className="bg-gray-800 text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-700">🟢 Low</span>
    }
  }

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'dispatched': 
        return <span className="bg-brand-success/15 text-brand-success text-[10px] font-bold px-2 py-0.5 rounded border border-brand-success/20">Dispatched</span>
      case 'qc': 
        return <span className="bg-brand-purple/15 text-brand-purple text-[10px] font-bold px-2 py-0.5 rounded border border-brand-purple/20">QC Ready</span>
      case 'packing': 
        return <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-500/20">Packing</span>
      case 'picking': 
        return <span className="bg-brand-accent/15 text-brand-accent text-[10px] font-bold px-2 py-0.5 rounded border border-brand-accent/20">Picking</span>
      case 'allocated': 
        return <span className="bg-teal-500/10 text-teal-400 text-[10px] font-bold px-2 py-0.5 rounded border border-teal-500/20">Allocated</span>
      case 'delayed': 
        return <span className="bg-brand-danger/10 text-brand-danger text-[10px] font-bold px-2 py-0.5 rounded border border-brand-danger/20">Delayed</span>
      default: 
        return <span className="bg-gray-800 text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-700">{status}</span>
    }
  }

  const getRiskBadge = (order) => {
    const risk = order.risk
    if (risk === 'High' || risk === 'Critical') {
      return (
        <div className="flex flex-col items-center gap-0.5 text-[10px] select-none">
          <span className="bg-brand-danger/10 text-brand-danger font-bold px-2 py-0.5 rounded border border-brand-danger/25">🔴 HIGH</span>
          <span className="text-[9px] text-gray-300 font-mono font-semibold">SLA: 42m | Est: 65m</span>
          <span className="text-[8px] text-brand-warning font-semibold italic text-center leading-tight">"Move to priority picking"</span>
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center gap-0.5 text-[10px]">
        <span className="bg-brand-success/15 text-brand-success font-bold px-2 py-0.5 rounded border border-brand-success/20">🟢 Safe</span>
        <span className="text-[9px] text-gray-500 font-mono">SLA Remaining: 4h+</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full pb-16 select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-100">Fulfillment Queue</h2>
          <p className="text-xs text-gray-400 mt-1">Manage and track orders through current warehouse processing stages.</p>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between shadow-md">
        <div className="flex flex-wrap gap-3 items-center flex-1 max-w-3xl">
          {/* Search bar */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search ID or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-brand-navy border border-brand-border rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none w-full"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-brand-navy border border-brand-border px-3 py-1.5 rounded-lg text-xs">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="">All Stages</option>
              <option value="New">New</option>
              <option value="Prioritized">Prioritized</option>
              <option value="Allocated">Allocated</option>
              <option value="Picking">Picking</option>
              <option value="Packing">Packing</option>
              <option value="QC">QC Ready</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 bg-brand-navy border border-brand-border px-3 py-1.5 rounded-lg text-xs">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* SLA Risk Filter */}
          <div className="flex items-center gap-1.5 bg-brand-navy border border-brand-border px-3 py-1.5 rounded-lg text-xs">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-transparent text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="">All SLA Status</option>
              <option value="High">At Risk</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Link */}
        {(searchTerm || statusFilter || priorityFilter || riskFilter) && (
          <button 
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('')
              setPriorityFilter('')
              setRiskFilter('')
            }}
            className="text-xs text-brand-accent hover:underline font-medium cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-brand-charcoal text-gray-400 border-b border-brand-border uppercase text-[9px] tracking-wider select-none">
            <tr>
              <th className="p-3.5 cursor-pointer hover:text-brand-accent transition-colors" onClick={() => handleSort('id')}>
                <div className="flex items-center gap-1">
                  <span>Order ID</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-3.5">Customer</th>
              <th className="p-3.5 text-center">Items</th>
              <th className="p-3.5 cursor-pointer hover:text-brand-accent transition-colors" onClick={() => handleSort('value')}>
                <div className="flex items-center gap-1">
                  <span>Value</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-3.5 cursor-pointer hover:text-brand-accent transition-colors text-center" onClick={() => handleSort('priority_score')}>
                <div className="flex items-center gap-1 justify-center">
                  <span>Priority</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-3.5 cursor-pointer hover:text-brand-accent transition-colors" onClick={() => handleSort('sla_deadline')}>
                <div className="flex items-center gap-1">
                  <span>SLA Deadline</span>
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="p-3.5 text-center">Stage</th>
              <th className="p-3.5 text-center">SLA Risk</th>
              <th className="p-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/30 text-gray-300">
            {currentOrders.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-8 text-center text-gray-500 italic">No orders match the current filter query.</td>
              </tr>
            ) : (
              currentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-brand-surface/40">
                  <td className="p-3.5 font-bold text-gray-200">{order.id}</td>
                  <td className="p-3.5 font-semibold text-gray-100">{order.customer}</td>
                  <td className="p-3.5 text-center font-semibold text-gray-200">{order.total_items}</td>
                  <td className="p-3.5 font-bold">${order.value.toFixed(2)}</td>
                  <td className="p-3.5 text-center">
                    <div className="flex flex-col items-center gap-1">
                      {getPriorityBadge(order.priority)}
                      <span className="text-[9px] text-gray-500 font-mono">Score: {order.priority_score}</span>
                    </div>
                  </td>
                  <td className="p-3.5 text-[10px] text-gray-400 font-mono whitespace-nowrap">{order.sla_deadline}</td>
                  <td className="p-3.5 text-center">{getStatusBadge(order.status)}</td>
                   <td className="p-3.5 text-center">{getRiskBadge(order)}</td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onSelectOrder(order.id)}
                        className="bg-brand-navy hover:bg-gray-800 p-1.5 rounded text-gray-300 border border-brand-border hover:border-gray-600 transition-all cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {(order.status === 'New' || (order.risk === 'High' && order.status !== 'Prioritized' && order.status !== 'QC' && order.status !== 'Dispatched')) && (
                        <button
                          onClick={() => onPrioritize(order.id)}
                          className="bg-brand-purple/20 hover:bg-brand-purple/30 text-brand-purple border border-brand-purple/40 text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer btn-transition animate-pulse"
                          title="Move to priority picking"
                        >
                          Prioritize
                        </button>
                      )}

                      {(order.status === 'New' || order.status === 'Prioritized') && (
                        <button
                          onClick={() => onAllocate(order.id)}
                          className="bg-brand-accent/20 hover:bg-brand-accent/30 text-brand-accent border border-brand-accent/40 text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer btn-transition"
                        >
                          Allocate
                        </button>
                      )}

                      {order.status === 'Allocated' && (
                        <button
                          onClick={() => onStartPicking(order.id)}
                          className="bg-brand-accent/20 hover:bg-brand-accent/30 text-brand-accent border border-brand-accent/40 text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer btn-transition"
                        >
                          Pick
                        </button>
                      )}

                      {order.status === 'Picking' && (
                        <button
                          onClick={() => onMoveToPacking(order.id)}
                          className="bg-brand-accent/20 hover:bg-brand-accent/30 text-brand-accent border border-brand-accent/40 text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer btn-transition"
                        >
                          Pack
                        </button>
                      )}

                      {order.status === 'QC' && (
                        <button
                          onClick={() => onDispatch(order.id)}
                          className="bg-brand-success/20 hover:bg-brand-success/30 text-brand-success border border-brand-success/40 text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer btn-transition"
                        >
                          Ship
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-brand-border/60 pt-4 select-none">
          <span className="text-xs text-gray-400">
            Showing <span className="font-semibold text-gray-200">{indexOfFirstOrder + 1}</span> to{' '}
            <span className="font-semibold text-gray-200">
              {Math.min(indexOfLastOrder, sortedOrders.length)}
            </span>{' '}
            of <span className="font-semibold text-gray-200">{sortedOrders.length}</span> orders
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-brand-surface border border-brand-border p-2 rounded-lg text-gray-400 hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-gray-300 font-semibold px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="bg-brand-surface border border-brand-border p-2 rounded-lg text-gray-400 hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
