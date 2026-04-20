import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { bakendUrl } from '../App'
import { toast } from 'react-toastify'

const SupportMessages = ({ token }) => {
  const [chats, setChats] = useState([])
  const [activeUserId, setActiveUserId] = useState('')
  const [replyText, setReplyText] = useState('')
  const [submittingId, setSubmittingId] = useState('')

  const fetchPendingChats = async () => {
    try {
      const response = await axios.get(`${bakendUrl}/api/admin/chats`, { headers: { token } })
      if (response.data.success) {
        const nextChats = response.data.chats || []
        setChats(nextChats)
        setActiveUserId((current) => current || nextChats[0]?.userId || '')
      } else {
        toast.error(response.data.message || 'Could not load support chats')
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (!token) return
    fetchPendingChats()
    const timer = setInterval(fetchPendingChats, 8000)
    return () => clearInterval(timer)
  }, [token])

  useEffect(() => {
    if (!chats.length) {
      setActiveUserId('')
      return
    }

    if (!chats.some((item) => item.userId === activeUserId)) {
      setActiveUserId(chats[0].userId)
    }
  }, [chats, activeUserId])

  const activeChat = useMemo(() => {
    return chats.find((item) => item.userId === activeUserId) || null
  }, [chats, activeUserId])

  const activeThread = useMemo(() => {
    if (!activeChat) return null
    return [...(activeChat.tickets || [])].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [activeChat])

  const activeComplaint = activeThread?.[activeThread.length - 1] || null

  const buildAvatar = (chat) => {
    if (chat?.userImage) return chat.userImage
    const name = String(chat?.userName || 'U').trim()
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=111827&color=ffffff`
  }

  const handleReply = async () => {
    const reply = String(replyText || '').trim()
    if (!reply) {
      toast.error('Please write a reply first')
      return
    }

    if (!activeComplaint || !activeChat?.userId) {
      toast.error('Please select a conversation first')
      return
    }

    setSubmittingId(activeComplaint.id)
    try {
      const response = await axios.post(
        `${bakendUrl}/api/admin/reply`,
        { id: activeComplaint.id, userId: activeChat.userId, reply },
        { headers: { token } }
      )

      if (response.data.success) {
        toast.success('Reply sent and complaint resolved')
        const resolvedComplaint = response.data.complaint
        setReplyText('')
        setChats((prev) => prev
          .map((chat) => {
            if (chat.userId !== activeChat.userId) return chat

            const nextTickets = (chat.tickets || []).map((item) => item.id === resolvedComplaint.id ? resolvedComplaint : item)
            const stillPending = nextTickets.some((item) => item.status === 'pending_admin')
            return {
              ...chat,
              tickets: nextTickets,
              status: stillPending ? 'pending_admin' : 'resolved',
              updatedAt: resolvedComplaint.updatedAt
            }
          }))
      } else {
        toast.error(response.data.message || 'Reply failed')
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmittingId('')
    }
  }

  const handleResolve = async () => {
    if (!activeComplaint || !activeChat?.userId) {
      toast.error('Please select a conversation first')
      return
    }

    setSubmittingId(activeComplaint.id)
    try {
      const response = await axios.post(
        `${bakendUrl}/api/admin/resolve`,
        { id: activeComplaint.id, userId: activeChat.userId },
        { headers: { token } }
      )

      if (response.data.success) {
        toast.success('Ticket resolved successfully')
        setReplyText('')
        await fetchPendingChats()
      } else {
        toast.error(response.data.message || 'Resolve failed')
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmittingId('')
    }
  }

  return (
    <div className='w-full'>
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-xl font-semibold'>Support Conversations</h2>
        <p className='text-sm text-gray-500'>Active users: <span className='font-semibold'>{chats.length}</span></p>
      </div>

      {chats.length === 0 ? (
        <div className='bg-white rounded border p-8 text-center text-gray-500'>
          No pending complaints right now.
        </div>
      ) : (
        <div className='grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-4 h-[72vh]'>
          <div className='bg-white border rounded-2xl overflow-hidden flex flex-col'>
            <div className='px-4 py-3 border-b bg-gray-50'>
              <p className='text-sm font-semibold text-gray-800'>Customers</p>
            </div>
            <div className='overflow-y-auto flex-1'>
              {chats.map((chat) => {
                const latestComplaint = [...(chat.tickets || [])].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
                const preview = latestComplaint?.messages?.[latestComplaint.messages.length - 1]?.text || 'No messages yet'
                const isActive = chat.userId === activeUserId

                return (
                  <button
                    key={chat.userId}
                    type='button'
                    onClick={() => setActiveUserId(chat.userId)}
                    className={`w-full text-left px-4 py-3 border-b flex items-center gap-3 transition ${isActive ? 'bg-gray-900 text-white' : 'bg-white hover:bg-gray-50 text-gray-800'}`}
                  >
                    <img src={buildAvatar(chat)} alt={chat.userName} className='w-11 h-11 rounded-full object-cover border border-gray-200' />
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center justify-between gap-2'>
                        <p className='font-medium truncate'>{chat.userName || 'Customer'}</p>
                        <span className={`text-[10px] px-2 py-1 rounded-full ${isActive ? 'bg-white/15 text-white' : chat.status === 'pending_admin' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {chat.status === 'pending_admin' ? 'Open' : 'Resolved'}
                        </span>
                      </div>
                      <p className={`text-xs truncate mt-1 ${isActive ? 'text-white/75' : 'text-gray-500'}`}>{preview}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className='bg-white border rounded-2xl overflow-hidden flex flex-col min-h-0'>
            {activeChat ? (
              <>
                <div className='px-5 py-4 border-b flex items-center gap-3 bg-gray-50'>
                  <img src={buildAvatar(activeChat)} alt={activeChat.userName} className='w-12 h-12 rounded-full object-cover border border-gray-200' />
                  <div>
                    <p className='font-semibold text-gray-900'>{activeChat.userName || 'Customer'}</p>
                    <p className='text-sm text-gray-500'>User ID: {activeChat.userId}</p>
                  </div>
                </div>

                <div className='flex-1 overflow-y-auto p-5 space-y-6 bg-[#f7f7f8] min-h-0'>
                  {activeThread?.map((complaint) => (
                    <div key={complaint.id} className='space-y-3'>
                      <div className='text-xs text-gray-500 flex items-center justify-between'>
                        <span>Invoice: {complaint.invoice}</span>
                        <span>{complaint.resolvedAt ? 'Resolved' : 'Open'}</span>
                      </div>

                      {(complaint.messages || []).map((message, index) => {
                        const isAdmin = message.sender === 'admin'
                        return (
                          <div key={`${complaint.id}-${index}`} className={`flex items-end gap-2 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            {!isAdmin && (
                              <img src={buildAvatar(activeChat)} alt={activeChat.userName} className='w-8 h-8 rounded-full object-cover border border-gray-200' />
                            )}
                            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm whitespace-pre-line ${isAdmin ? 'bg-gray-900 text-white rounded-br-md' : 'bg-white text-gray-800 rounded-bl-md border border-gray-200'}`}>
                              <p>{message.text}</p>
                              <p className={`text-[11px] mt-2 ${isAdmin ? 'text-white/70' : 'text-gray-400'}`}>
                                {`${message.day || ''} • ${message.time || ''}`.trim()}
                              </p>
                            </div>
                            {isAdmin && (
                              <div className='w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold'>
                                A
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>

                <div className='border-t p-4 bg-white'>
                  <div className='flex flex-col sm:flex-row gap-3'>
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleReply()
                        }
                      }}
                      className='flex-1 border rounded-xl px-4 py-3 text-sm outline-none'
                      placeholder='Write your reply to this customer...'
                    />
                    <button
                      type='button'
                      onClick={handleReply}
                      disabled={submittingId === activeComplaint?.id}
                      className='bg-black text-white px-5 py-3 rounded-xl text-sm disabled:opacity-60'
                    >
                      {submittingId === activeComplaint?.id ? 'Sending...' : 'Send Reply'}
                    </button>
                    <button
                      type='button'
                      onClick={handleResolve}
                      disabled={submittingId === activeComplaint?.id || activeComplaint?.status === 'resolved'}
                      className='bg-emerald-600 text-white px-5 py-3 rounded-xl text-sm disabled:opacity-60'
                    >
                      {submittingId === activeComplaint?.id ? 'Resolving...' : 'Resolve'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className='flex-1 flex items-center justify-center text-gray-500'>
                Select a customer to view the conversation.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SupportMessages
