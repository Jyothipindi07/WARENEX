import React, { useState } from 'react'
import { Truck, Check, ShieldAlert, Award, FileSpreadsheet } from 'lucide-react'

export default function Dispatch({ orders, onDispatch }) {
  const [selectedCarriers, setSelectedCarriers] = useState({})

  // Orders in QC Ready (status = 'QC') or already shipped (status = 'Dispatched')
  const dispatchQueue = orders.filter(o => o.status === 'QC' || o.status === 'Dispatched')

  const readyCount = orders.filter(o => o.status === 'QC').length
  const shippedToday = orders.filter(o => o.status === 'Dispatched').length

  const handleCarrierChange = (orderId, carrier) => {
    setSelectedCarriers({ ...selectedCarriers, [orderId]: carrier })
  }

  const handleShip = (orderId) => {
    const carrier = selectedCarriers[orderId] || 'FedEx Ground'
    onDispatch(orderId, carrier)
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full pb-16 select-none">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-100">Carrier Dispatch Yard</h2>
        <p className="text-xs text-gray-400 mt-1">
          Assign carrier logistics pipelines, print dock manifest reports, and scan completed shipments into trailers.
        </p>
      </div>

      {/* Yard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-brand-surface border border-brand-border p-4 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Ready to Dispatch</p>
          <p className="text-2xl font-black text-brand-accent mt-1">{readyCount} orders</p>
        </div>
        <div className="bg-brand-surface border border-brand-border p-4 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Dispatched Today</p>
          <p className="text-2xl font-black text-brand-success mt-1">{shippedToday} orders</p>
        </div>
        <div className="bg-brand-surface border border-brand-border p-4 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Carrier Pickups</p>
          <p className="text-2xl font-black text-gray-100 mt-1">4 Scheduled</p>
        </div>
        <div className="bg-brand-surface border border-brand-border p-4 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Dock Delay Risk</p>
          <p className="text-2xl font-black text-brand-success mt-1">0% (Low)</p>
        </div>
      </div>

      {/* Dock queue list */}
      <div className="bg-brand-surface border border-brand-border rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-brand-charcoal text-gray-400 border-b border-brand-border uppercase text-[9px] tracking-wider">
            <tr>
              <th className="p-3.5">Order</th>
              <th className="p-3.5">Customer</th>
              <th className="p-3.5">Carrier Service</th>
              <th className="p-3.5">Shipping Target</th>
              <th className="p-3.5">Dock SLA</th>
              <th className="p-3.5 text-center">Yard Stage</th>
              <th className="p-3.5 text-center">Fulfill Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border/30 text-gray-300">
            {dispatchQueue.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-500 italic">No orders ready for shipping. Clear packing workbench first.</td>
              </tr>
            ) : (
              dispatchQueue.map((order) => {
                const isShipped = order.status === 'Dispatched'
                return (
                  <tr key={order.id} className="hover:bg-brand-surface/40">
                    <td className="p-3.5 font-bold text-gray-200">{order.id}</td>
                    <td className="p-3.5 font-semibold text-gray-100">{order.customer}</td>
                    <td className="p-3.5">
                      {isShipped ? (
                        <span className="text-gray-400 font-medium">DHL/FedEx Ground Courier</span>
                      ) : (
                        <select
                          value={selectedCarriers[order.id] || 'FedEx Ground'}
                          onChange={(e) => handleCarrierChange(order.id, e.target.value)}
                          className="bg-brand-navy border border-brand-border rounded-lg text-xs p-1.5 text-gray-300 focus:outline-none"
                        >
                          <option value="FedEx Ground">FedEx Ground Priority</option>
                          <option value="UPS Worldwide">UPS Worldwide</option>
                          <option value="DHL Express Saver">DHL Express Saver</option>
                          <option value="Local Courier Yard">Local Courier Cargo</option>
                        </select>
                      )}
                    </td>
                    <td className="p-3.5 text-gray-400 font-medium">Zone {order.id.charCodeAt(order.id.length - 1) % 4 + 1} Outbound Dock</td>
                    <td className="p-3.5 text-gray-400 font-mono text-[10px]">{order.sla_deadline}</td>
                    <td className="p-3.5 text-center">
                      <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isShipped ? 'bg-brand-success/15 text-brand-success border-brand-success/20' : 'bg-brand-purple/15 text-brand-purple border-brand-purple/20'
                      }`}>
                        {order.status === 'QC' ? 'Awaiting Scan-out' : 'Dispatched'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      {isShipped ? (
                        <span className="text-[10px] text-gray-500 font-bold italic flex items-center justify-center gap-1">
                          <Check className="h-3.5 w-3.5 text-brand-success" />
                          <span>Manifest Shipped</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleShip(order.id)}
                          className="bg-brand-accent text-brand-navy text-[10px] font-bold px-3.5 py-1.5 rounded hover:bg-brand-accent/90 transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                        >
                          <Truck className="h-3.5 w-3.5" />
                          <span>Dispatch scan</span>
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}
