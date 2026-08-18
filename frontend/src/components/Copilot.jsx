import React, { useState, useEffect, useRef } from 'react'
import { Brain, Bot, Sparkles, Send, ArrowRight, X, ChevronRight, CheckCircle2, AlertTriangle, Layers, Info } from 'lucide-react'

export default function Copilot({ 
  dashboardData, 
  exceptions = [], 
  orders = [], 
  onBatchOptimize, 
  onViewDetails,
  onAllocate,
  onReorder,
  onStartPicking,
  refreshAllState,
  setCurrentPage,
  triggerToast
}) {
  const [isOpen, setIsOpen] = useState(true)
  const [messages, setMessages] = useState([
    {
      id: 'init',
      sender: 'warenex',
      text: "Hello! I am WARENEX Intelligence, your contextual AI copilot.\n\nI can help you monitor stock shortages, resolve bottlenecks, prioritize shipments, and run optimization scripts.\n\nWhat would you like to investigate today?"
    }
  ])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef(null)

  // Suggested quick questions
  const suggestedQuestions = [
    "What should I do right now?",
    "Which products need replenishment?",
    "Which orders are at risk?",
    "Check active exceptions"
  ]

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, isOpen])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-brand-purple hover:bg-brand-purple/90 text-white px-4 py-2.5 rounded-xl shadow-2xl z-40 btn-transition border border-brand-purple/50 animate-pulse cursor-pointer flex items-center gap-2"
        title="Open WARENEX Copilot"
      >
        <Brain className="h-4.5 w-4.5" />
        <span className="text-[11px] font-bold tracking-wider uppercase">Open WARENEX Intelligence</span>
      </button>
    )
  }

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputText).trim()
    if (!query) return

    if (!textToSend) {
      setInputText('')
    }

    // Add user message
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/intelligence/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      const data = await res.json()

      const botMsg = {
        id: Date.now() + 1,
        sender: 'warenex',
        text: data.response || "I couldn't find enough warehouse data to answer that confidently.",
        recommendation: data.recommendation,
        explanation: data.explanation
      }
      setMessages(prev => [...prev, botMsg])
    } catch (e) {
      console.error(e)
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'warenex',
        text: "🚨 Communication delay. I couldn't connect to the decision engine query route. Please ensure the server is fully running."
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend()
    }
  }

  const handleActionApply = async (rec, msgId) => {
    try {
      if (rec.type === 'CRITICAL_ALLOCATION_CONFLICT') {
        if (onAllocate) {
          await onAllocate(rec.entity_id)
        } else {
          await fetch(`/api/orders/${rec.entity_id}/allocate`, { method: 'POST' })
        }
        if (triggerToast) triggerToast("Stock allocated successfully.", "success")
      } else if (rec.type === 'LOW_STOCK') {
        if (onReorder) {
          await onReorder(rec.entity_id, 30)
        } else {
          await fetch(`/api/inventory/reorder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sku: rec.entity_id, quantity: 30 })
          })
        }
        if (triggerToast) triggerToast(`Replenishment request generated for ${rec.entity_id}.`, "success")
      } else if (rec.type === 'PICKING_BOTTLENECK') {
        if (onBatchOptimize) {
          await onBatchOptimize()
        } else {
          await fetch('/api/picking/batch', { method: 'POST' })
          if (triggerToast) triggerToast("Transit route optimized. 38% walk savings applied!", "success")
        }
      } else if (rec.type === 'PRIORITIZE_ORDER') {
        await fetch(`/api/orders/${rec.entity_id}/prioritize`, { method: 'POST' })
        if (triggerToast) triggerToast(`Order ${rec.entity_id} prioritized.`, "success")
      }
      
      // Update message state locally to show action has been completed
      setMessages(prev => prev.map(msg => {
        if (msg.id === msgId) {
          return {
            ...msg,
            recommendation: {
              ...msg.recommendation,
              applied: true
            }
          }
        }
        return msg
      }))
      
      if (refreshAllState) refreshAllState()
    } catch (e) {
      console.error('Error applying decision from assistant:', e)
      if (triggerToast) triggerToast("Error applying recommendation", "danger")
    }
  }

  const handleAlternativeAction = (rec) => {
    if (!setCurrentPage) return
    if (rec.alternative_label === 'View Order') {
      setCurrentPage('orders')
    } else if (rec.alternative_label === 'View Low Stock') {
      setCurrentPage('inventory')
    } else {
      setCurrentPage('smart_decisions')
    }
  }

  return (
    <div className="w-80 bg-brand-charcoal border-l border-brand-border h-full flex flex-col justify-between select-none relative z-30 transition-all duration-300">
      
      {/* Copilot Header */}
      <div className="p-4 border-b border-brand-border bg-brand-surface flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-brand-purple/10 p-1.5 rounded-lg text-brand-purple border border-brand-purple/20">
            <Brain className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-gray-200">WARENEX Intelligence</h2>
            <p className="text-[10px] text-gray-400 font-medium">Interactive AI Assistant</p>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-[10px] text-gray-400 hover:text-gray-200 border border-brand-border px-2 py-1 rounded-lg hover:bg-gray-800 flex items-center gap-0.5 cursor-pointer"
          title="Collapse Panel"
        >
          <span>[ Collapse &lt; ]</span>
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-brand-navy/10 scrollbar-thin">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
            <div className={`flex gap-2 max-w-[90%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar bubble */}
              <div className={`h-7 w-7 rounded-full border flex items-center justify-center shrink-0 shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-brand-accent/15 border-brand-accent/35 text-brand-accent' 
                  : 'bg-brand-purple/15 border-brand-purple/35 text-brand-purple'
              }`}>
                {msg.sender === 'user' ? 'OP' : <Bot className="h-4 w-4" />}
              </div>

              {/* Message Details */}
              <div className="space-y-2 flex-1 min-w-0">
                {/* Bubble Text */}
                <div className={`p-3 rounded-xl text-xs leading-relaxed border shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-brand-accent/5 border-brand-accent/20 text-gray-100 rounded-tr-none'
                    : 'bg-brand-charcoal border-brand-border/80 text-gray-200 rounded-tl-none'
                }`}>
                  <p className="whitespace-pre-wrap select-text">{msg.text}</p>
                </div>

                {/* Recommendation Card */}
                {msg.recommendation && (
                  <div className="bg-brand-surface border border-brand-purple/30 rounded-xl p-3 shadow-lg space-y-2.5 max-w-full">
                    <div className="flex items-center gap-1.5 text-brand-purple pb-1 border-b border-brand-border/40">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">{msg.recommendation.title || "Recommendation"}</span>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-gray-100">{msg.recommendation.action}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Reason: {msg.recommendation.reason}</p>
                    </div>
                    <div className="flex gap-2 pt-0.5">
                      <button
                        onClick={() => handleActionApply(msg.recommendation, msg.id)}
                        disabled={msg.recommendation.applied}
                        className={`flex-1 font-bold text-[9px] py-1.5 rounded btn-transition cursor-pointer shadow-sm ${
                          msg.recommendation.applied 
                            ? 'bg-brand-success/15 border border-brand-success/20 text-brand-success' 
                            : 'bg-brand-purple hover:bg-brand-purple/90 text-white shadow-brand-purple/10'
                        }`}
                      >
                        {msg.recommendation.applied ? '✓ Applied' : msg.recommendation.action_label || 'Apply'}
                      </button>
                      {!msg.recommendation.applied && (
                        <button
                          onClick={() => handleAlternativeAction(msg.recommendation)}
                          className="bg-brand-navy border border-brand-border/80 hover:bg-brand-charcoal text-gray-300 font-bold text-[9px] px-2 py-1.5 rounded cursor-pointer"
                        >
                          {msg.recommendation.alternative_label || 'View'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Explanation Card */}
                {msg.explanation && (
                  <div className="bg-brand-navy/60 border border-brand-border/40 rounded-xl p-3 space-y-1.5 text-[10px] text-gray-400">
                    <div className="text-gray-300 font-bold border-b border-brand-border/20 pb-0.5">Diagnostics:</div>
                    <div className="space-y-1 leading-normal">
                      <p><span className="text-brand-accent font-semibold">What:</span> {msg.explanation.what}</p>
                      <p><span className="text-brand-purple font-semibold">Why:</span> {msg.explanation.why}</p>
                      <p><span className="text-brand-warning font-semibold">Action:</span> {msg.explanation.how}</p>
                      <p><span className="text-brand-success font-semibold">Impact:</span> {msg.explanation.impact}</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-start w-full">
            <div className="flex gap-2 max-w-[90%]">
              <div className="h-7 w-7 rounded-full border border-brand-purple/35 bg-brand-purple/15 text-brand-purple flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-brand-charcoal border border-brand-border/80 p-3 rounded-xl rounded-tl-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-brand-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-brand-purple rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-brand-purple rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Questions Grid */}
      {messages.length < 3 && (
        <div className="p-3 bg-brand-navy/20 border-t border-brand-border/50 shrink-0 space-y-1.5">
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider px-1">Suggested questions:</p>
          <div className="grid grid-cols-1 gap-1.5">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="text-left bg-brand-surface/40 hover:bg-brand-surface border border-brand-border/40 hover:border-brand-purple/40 text-[10px] text-gray-300 hover:text-gray-100 p-2 rounded-lg transition-all duration-150 flex items-center justify-between group cursor-pointer"
              >
                <span className="truncate pr-1">{q}</span>
                <ChevronRight className="h-3 w-3 text-gray-500 group-hover:text-brand-purple transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 border-t border-brand-border bg-brand-surface shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ask WARENEX Intelligence..."
            className="flex-1 bg-brand-navy border border-brand-border rounded-lg px-3 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-purple/60 disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !inputText.trim()}
            className="bg-brand-purple hover:bg-brand-purple/90 text-white p-2 rounded-lg disabled:opacity-40 disabled:hover:bg-brand-purple shrink-0 cursor-pointer flex items-center justify-center transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Footer Health Score */}
      <div className="p-2.5 border-t border-brand-border bg-brand-navy/60 text-center shrink-0">
        <p className="text-[10px] text-gray-400 font-semibold">
          Warehouse Health Score: {dashboardData?.health_score || 86}/100
        </p>
      </div>
    </div>
  )
}
