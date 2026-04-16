'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Clock, Reply } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  question_program: 'Program',
  scheduling: 'Scheduling',
  payment: 'Payment',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

interface Message {
  id: string
  category: string
  subject: string
  body: string
  recipient_role: string
  admin_reply: string | null
  replied_at: string | null
  read_at: string | null
  created_at: string
}

export function MessageList({ messages }: { messages: Message[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Conversation</h2>

      <div className="space-y-3">
        {messages.map((msg) => {
          const isExpanded = expanded === msg.id
          const hasReply = !!msg.admin_reply
          const isNewReply = hasReply && !msg.read_at

          return (
            <div key={msg.id} className="space-y-2">
              {/* Parent bubble (right-aligned) */}
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : msg.id)}
                className="ml-auto block max-w-[85%] text-left"
              >
                <div className="rounded-xl rounded-tr-sm bg-gradient-to-r from-[#E87450] to-[#F5B041] px-4 py-3 text-white shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{msg.subject}</span>
                    {isNewReply && (
                      <Badge variant="default" className="shrink-0 text-[10px] px-1.5 py-0 bg-white/20 text-white border-0">New reply</Badge>
                    )}
                  </div>
                  {isExpanded && (
                    <p className="mt-1.5 text-sm text-white/90 whitespace-pre-wrap">{msg.body}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-white/60">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-white/15 text-white/80 border-0">
                      {CATEGORY_LABELS[msg.category] || msg.category}
                    </Badge>
                    <span>To {msg.recipient_role === 'admin' ? 'Admin' : 'Coach'}</span>
                    <span>{timeAgo(msg.created_at)}</span>
                  </div>
                </div>
              </button>

              {/* Staff reply bubble (left-aligned) */}
              {isExpanded && hasReply && (
                <div className="mr-auto max-w-[85%]">
                  <div className="rounded-xl rounded-tl-sm border border-border bg-card px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Reply className="size-3 text-primary" />
                      <p className="text-xs font-medium text-primary">
                        Sunrise Tennis {msg.replied_at ? `· ${timeAgo(msg.replied_at)}` : ''}
                      </p>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{msg.admin_reply}</p>
                  </div>
                </div>
              )}

              {/* Awaiting reply indicator */}
              {isExpanded && !hasReply && (
                <div className="mr-auto max-w-[85%]">
                  <div className="flex items-center gap-1.5 rounded-xl rounded-tl-sm border border-border/60 bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    <span>Awaiting reply - we typically respond within 24 hours</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
