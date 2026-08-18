import React, { useState, useEffect } from 'react'
import { Bell, Search, MapPin, Calendar, Check, AlertCircle } from 'lucide-react'

export default function TopBar({ 
  onSearch, 
  notifications, 
  onMarkRead, 
  onTriggerDemo 
}) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState('WH-A (Chicago Central)')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }))
    }
    updateTime()
    const timer = setInterval(updateTime, 60000)
    return () => clearInterval(timer)
  }, [])

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    onSearch(e.target.value)
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <header className="h-16 border-b border-brand-border bg-brand-charcoal flex items-center justify-between px-6 select-none z-20 relative">
      {/* Search Bar */}
      <div className="flex-1 max-w-md relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4.5 w-4.5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by Order ID, SKU, Product, or Customer..."
          className="w-full bg-brand-navy border border-brand-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-brand-accent transition-colors"
        />
      </div>

      {/* Control Right Side */}
      <div className="flex items-center gap-6">
        
        {/* Run Demo Button */}
        <button
          onClick={onTriggerDemo}
          className="bg-brand-purple/20 hover:bg-brand-purple/30 text-brand-purple border border-brand-purple/40 px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider btn-transition flex items-center gap-2"
        >
          <span className="pulse-dot h-2.5 w-2.5 rounded-full bg-brand-purple inline-block"></span>
          Run Smart Warehouse Demo
        </button>

        {/* Warehouse Selector */}
        <div className="flex items-center gap-2 bg-brand-navy border border-brand-border px-3 py-1.5 rounded-lg text-xs text-gray-300">
          <MapPin className="h-3.5 w-3.5 text-brand-accent" />
          <select 
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="WH-A (Chicago Central)">WH-A (Chicago)</option>
            <option value="WH-B (Dallas Logistics)">WH-B (Dallas)</option>
            <option value="WH-C (Seattle Dock)">WH-C (Seattle)</option>
          </select>
        </div>

        {/* Time display */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Calendar className="h-3.5 w-3.5 text-gray-500" />
          <span>{currentTime}</span>
        </div>

        {/* Notifications Icon & Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-400 hover:text-gray-200 bg-brand-navy border border-brand-border hover:border-gray-700 rounded-lg transition-colors cursor-pointer"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 bg-brand-danger text-[10px] text-white rounded-full flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-brand-surface border border-brand-border rounded-xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-200">Alert Center</span>
                <span className="text-[10px] bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded font-bold uppercase">
                  {unreadCount} Unread
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-brand-border/40">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500">
                    No active system alerts.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-3 text-xs transition-colors flex items-start justify-between gap-3 ${
                        notif.read ? 'bg-transparent text-gray-400' : 'bg-brand-accent/5 text-gray-200'
                      }`}
                    >
                      <div className="flex gap-2.5">
                        <AlertCircle className={`h-4.5 w-4.5 mt-0.5 flex-shrink-0 ${
                          notif.severity === 'Critical' ? 'text-brand-danger' : 
                          notif.severity === 'Warning' ? 'text-brand-warning' : 'text-brand-accent'
                        }`} />
                        <div>
                          <p className="font-medium leading-relaxed">{notif.message}</p>
                          <span className="text-[9px] text-gray-500 mt-1 block">{notif.created_at}</span>
                        </div>
                      </div>
                      {!notif.read && (
                        <button
                          onClick={() => onMarkRead(notif.id)}
                          title="Mark read"
                          className="p-1 hover:bg-brand-border rounded text-brand-accent hover:text-brand-accent/80 transition-colors"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
