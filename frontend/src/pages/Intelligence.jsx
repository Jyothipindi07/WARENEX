import React, { useState, useEffect, useRef } from 'react'
import { 
  Send, 
  Brain, 
  Bot, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Info,
  Layers,
  ArrowUpRight
} from 'lucide-react'

export default function Intelligence({ 
  dashboardData, 
  onAllocate, 
  onReorder, 
  onStartPicking,
  refreshAllState,
  setCurrentPage
}) {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef(null)

  const suggestedQuestions = [
    "Which orders are at risk?",
    "Which products need replenishment?",
    "What should I do right now?",
    "Why is ORD-104 at risk?"
  ]

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

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
        await onAllocate(rec.entity_id)
      } else if (rec.type === 'LOW_STOCK') {
        await onReorder(rec.entity_id, 30)
      } else if (rec.type === 'PICKING_BOTTLENECK') {
        await fetch('/api/picking/batch', { method: 'POST' })
      } else if (rec.type === 'PRIORITIZE_ORDER') {
        await fetch(`/api/orders/${rec.entity_id}/prioritize`, { method: 'POST' })
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
      
      refreshAllState()
    } catch (e) {
      console.error('Error applying decision from assistant:', e)
    }
  }

  const handleAlternativeAction = (rec) => {
    if (rec.alternative_label === 'View Order') {
      setCurrentPage('orders')
    } else if (rec.alternative_label === 'View Low Stock') {
      setCurrentPage('inventory')
    } else {
      setCurrentPage('smart_decisions')
    }
  }

  // Parse KPIs from dashboardData prop
  const health = dashboardData?.health_score ?? 90
  const kpis = dashboardData?.kpis ?? {}
  const recentDecisions = dashboardData?.decision_history ?? []

  return (
    <div className="p-6 flex flex-col lg:flex-row gap-6 h-full overflow-hidden select-none pb-12">
      
      {/* Left Area: Chat Dashboard Assistant */}
      <div className="flex-1 flex flex-col bg-brand-surface border border-brand-border rounded-2xl shadow-xl overflow-hidden h-full">
        
        {/* Chat Header */}
        <div className="p-4 border-b border-brand-border/60 bg-brand-navy/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-purple/10 p-2.5 rounded-xl border border-brand-purple/35 text-brand-purple">
              <Brain className="h-5.5 w-5.5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-100 text-sm">WARENEX Intelligence</h3>
              <p className="text-[10px] text-gray-400 font-medium">Context-aware warehouse decision assistant</p>
            </div>
          </div>
          <span className="text-[9px] bg-brand-purple/15 text-brand-purple border border-brand-purple/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <span className="h-1.5 w-1.5 bg-brand-purple rounded-full animate-ping"></span>
            ACTIVE COGNITIVE ENGINE
          </span>
        </div>

        {/* Messages view */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-brand-navy/10">
          {messages.length === 0 ? (
            // Empty State
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
              <div className="bg-brand-purple/10 p-5 rounded-full border border-brand-purple/20 text-brand-purple animate-pulse">
                <Brain className="h-10 w-10" />
              </div>
              <div>
                <h4 className="font-bold text-gray-200 text-base">🧠 WARENEX Intelligence</h4>
                <p className="text-xs text-gray-400 mt-2 max-w-sm mx-auto leading-relaxed">
                  Ask me anything about your warehouse.
                </p>
              </div>

              {/* Clickable suggested questions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg pt-2">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="text-left bg-brand-charcoal hover:bg-brand-navy/60 border border-brand-border/40 hover:border-brand-purple/40 text-[11px] text-gray-300 hover:text-gray-100 p-3 rounded-xl transition-all duration-200 flex items-center justify-between group cursor-pointer shadow-sm"
                  >
                    <span className="font-medium pr-2 truncate">{q}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-gray-500 group-hover:text-brand-purple transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Avatar bubble */}
                  <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-brand-accent/15 border-brand-accent/35 text-brand-accent' 
                      : 'bg-brand-purple/15 border-brand-purple/35 text-brand-purple'
                  }`}>
                    {msg.sender === 'user' ? 'OP' : <Bot className="h-4.5 w-4.5" />}
                  </div>

                  {/* Bubble text content */}
                  <div className="space-y-3.5">
                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed border ${
                      msg.sender === 'user'
                        ? 'bg-brand-accent/5 border-brand-accent/20 text-gray-100 rounded-tr-none'
                        : 'bg-brand-charcoal border-brand-border/80 text-gray-200 rounded-tl-none'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>

                    {/* Decision Support Recommendation Card */}
                    {msg.recommendation && (
                      <div className="bg-brand-charcoal border border-brand-purple/30 rounded-2xl p-4 shadow-xl max-w-sm space-y-3.5 animate-fadeIn">
                        <div className="flex items-center gap-2 text-brand-purple pb-1 border-b border-brand-border/50">
                          <Sparkles className="h-4.5 w-4.5" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">{msg.recommendation.title || "Recommended Decision"}</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-100">{msg.recommendation.action}</p>
                          <p className="text-[10px] text-gray-400 mt-1">Reason: {msg.recommendation.reason}</p>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleActionApply(msg.recommendation, msg.id)}
                            disabled={msg.recommendation.applied}
                            className={`flex-1 font-bold text-[10px] py-2 rounded-lg btn-transition cursor-pointer shadow-md ${
                              msg.recommendation.applied 
                                ? 'bg-brand-success/15 border border-brand-success/20 text-brand-success' 
                                : 'bg-brand-purple hover:bg-brand-purple/90 text-white shadow-brand-purple/10'
                            }`}
                          >
                            {msg.recommendation.applied ? '✓ Decision Applied' : msg.recommendation.action_label || 'Apply Recommendation'}
                          </button>
                          {!msg.recommendation.applied && (
                            <button
                              onClick={() => handleAlternativeAction(msg.recommendation)}
                              className="bg-brand-navy border border-brand-border/80 hover:bg-brand-charcoal text-gray-300 font-bold text-[10px] px-3 py-2 rounded-lg cursor-pointer"
                            >
                              {msg.recommendation.alternative_label || 'Simulate Alternative'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Explanations Grid */}
                    {msg.explanation && (
                      <div className="bg-brand-charcoal/50 border border-brand-border/80 rounded-2xl p-4 max-w-lg space-y-3.5 text-xs animate-fadeIn">
                        <div className="flex items-center gap-2 text-gray-400 pb-1.5 border-b border-brand-border/30">
                          <Info className="h-4 w-4" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Root Cause Diagnostics</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1 bg-brand-navy/35 p-2.5 rounded-lg border border-brand-border/30">
                            <span className="text-[9px] text-brand-danger uppercase font-bold tracking-wider">What Happened?</span>
                            <p className="text-gray-200 text-[10px] leading-relaxed">{msg.explanation.what}</p>
                          </div>
                          <div className="space-y-1 bg-brand-navy/35 p-2.5 rounded-lg border border-brand-border/30">
                            <span className="text-[9px] text-brand-warning uppercase font-bold tracking-wider">Why?</span>
                            <p className="text-gray-200 text-[10px] leading-relaxed">{msg.explanation.why}</p>
                          </div>
                          <div className="space-y-1 bg-brand-navy/35 p-2.5 rounded-lg border border-brand-border/30">
                            <span className="text-[9px] text-brand-accent uppercase font-bold tracking-wider">What Should I Do?</span>
                            <p className="text-gray-200 text-[10px] leading-relaxed">{msg.explanation.how}</p>
                          </div>
                          <div className="space-y-1 bg-brand-navy/35 p-2.5 rounded-lg border border-brand-border/30">
                            <span className="text-[9px] text-brand-success uppercase font-bold tracking-wider">Expected Impact</span>
                            <p className="text-gray-200 text-[10px] leading-relaxed">{msg.explanation.impact}</p>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            ))
          )}

          {/* Loading status */}
          {loading && (
            <div className="flex justify-start w-full animate-pulse">
              <div className="flex gap-3 max-w-[80%] items-center">
                <div className="h-8 w-8 rounded-full bg-brand-purple/15 border border-brand-purple/35 text-brand-purple flex items-center justify-center shadow-sm">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div className="bg-brand-charcoal border border-brand-border/80 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-brand-border bg-brand-navy/20 flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ask WARENEX about your warehouse..."
            className="flex-1 bg-brand-charcoal text-gray-200 text-xs border border-brand-border/80 rounded-xl px-4 py-3.5 focus:outline-none focus:border-brand-purple/50 placeholder:text-gray-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !inputText.trim()}
            className="bg-brand-purple hover:bg-brand-purple/95 disabled:opacity-40 disabled:cursor-not-allowed text-white p-3.5 rounded-xl btn-transition cursor-pointer shadow-md shadow-brand-purple/15 flex items-center justify-center shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

      </div>

      {/* Right Area: Context Panel & Decisions */}
      <div className="w-full lg:w-72 flex flex-col gap-6 shrink-0 h-full overflow-y-auto pb-6">
        
        {/* Context Stats Widget */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="pb-2.5 border-b border-brand-border/60">
            <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-brand-purple" />
              <span>LIVE WAREHOUSE CONTEXT</span>
            </h4>
          </div>

          <div className="space-y-3 font-sans text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-brand-border/20">
              <span className="text-gray-400 font-medium">Health Score</span>
              <span className="font-bold text-brand-purple">{health}/100</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-brand-border/20">
              <span className="text-gray-400 font-medium">Orders Today</span>
              <span className="font-bold text-gray-200">{kpis.orders_today?.value ?? 0}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-brand-border/20">
              <span className="text-gray-400 font-medium">Orders At Risk</span>
              <span className={`font-bold ${kpis.orders_at_risk?.value > 0 ? 'text-brand-danger' : 'text-gray-200'}`}>
                {kpis.orders_at_risk?.value ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-brand-border/20">
              <span className="text-gray-400 font-medium">Low Stock</span>
              <span className="font-bold text-brand-warning">
                {kpis.inventory_health?.trend ? parseInt(kpis.inventory_health.trend) : 0}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-brand-border/20">
              <span className="text-gray-400 font-medium">Out of Stock</span>
              <span className="font-bold text-brand-danger">
                {kpis.out_of_stock?.value ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-brand-border/20">
              <span className="text-gray-400 font-medium">Active Exceptions</span>
              <span className={`font-bold ${kpis.active_exceptions?.value > 0 ? 'text-brand-accent' : 'text-gray-200'}`}>
                {kpis.active_exceptions?.value ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-gray-400 font-medium">Pending Dispatch</span>
              <span className="font-bold text-gray-200">{kpis.pending_dispatch?.value ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Recent Decisions feed */}
        <div className="bg-brand-surface border border-brand-border rounded-2xl p-5 space-y-4 flex-1 shadow-lg overflow-y-auto">
          <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider pb-2 border-b border-brand-border/60 flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-brand-purple" />
            <span>Recent WARENEX Decisions</span>
          </h4>

          <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
            {recentDecisions.length === 0 ? (
              <p className="text-[10px] text-gray-500 italic text-center py-4">No decisions registered yet.</p>
            ) : (
              recentDecisions.map((dec, idx) => (
                <div key={dec.id || idx} className="bg-brand-navy/35 p-3 rounded-xl border border-brand-border/50 text-[10px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-300">{dec.type}</span>
                    <span className="text-[8px] text-gray-400">{dec.created_at?.split(' ')[1]?.slice(0, 5) || '19:05'}</span>
                  </div>
                  <p className="text-gray-400 line-clamp-2 leading-relaxed">Decision: {dec.decision}</p>
                  <div className="flex items-center justify-between text-[8px] pt-1 text-gray-500">
                    <span>Impact: {dec.impact}</span>
                    <span className="text-brand-accent bg-brand-accent/5 px-1 rounded">{dec.entity_id}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
