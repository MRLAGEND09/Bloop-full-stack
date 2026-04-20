const complaints = []
const userStates = new Map()
const userProfiles = new Map()

const generateId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

const getTimeData = () => {
    const now = new Date()
    return {
        time: now.toLocaleTimeString(),
        date: now.toLocaleDateString(),
        day: now.toLocaleDateString('en-US', { weekday: 'long' })
    }
}

const getDefaultState = () => ({
    step: 'done',
    invoice: '',
    lastReply: '',
    lastUserMessage: '',
    unclearCount: 0
})

const getUserState = (userId) => {
    if (!userStates.has(userId)) {
        userStates.set(userId, getDefaultState())
    }
    return userStates.get(userId)
}

const setUserState = (userId, updates = {}) => {
    const current = getUserState(userId)
    const nextState = {
        ...current,
        ...updates
    }
    userStates.set(userId, nextState)
    return nextState
}

const setUserProfile = (userId, profile = {}) => {
    const current = userProfiles.get(userId) || { name: '', image: '' }
    const nextProfile = {
        ...current,
        name: String(profile.name || current.name || '').trim(),
        image: String(profile.image || current.image || '').trim()
    }
    userProfiles.set(userId, nextProfile)
    return nextProfile
}

const getUserProfile = (userId) => {
    return userProfiles.get(userId) || { name: '', image: '' }
}

const createComplaint = ({ userId, userName = '', userImage = '', invoice, problem }) => {
    const profile = setUserProfile(userId, { name: userName, image: userImage })
    const createdAt = new Date().toISOString()
    const timeData = getTimeData()
    const item = {
        id: generateId(),
        userId,
        userName: profile.name,
        userImage: profile.image,
        invoice,
        messages: [
            {
                sender: 'user',
                text: String(problem || '').trim(),
                ...timeData,
                timestamp: createdAt
            }
        ],
        status: 'pending_admin',
        adminReply: '',
        createdAt,
        updatedAt: createdAt,
        resolvedAt: null
    }

    complaints.push(item)
    return item
}

const getPendingComplaintByUser = (userId) => {
    return complaints.find((item) => item.userId === userId && item.status === 'pending_admin')
}

const getActiveComplaintByUser = (userId) => {
    return complaints.find((item) => item.userId === userId && item.status === 'pending_admin') || null
}

const getLatestComplaintByUser = (userId) => {
    for (let i = complaints.length - 1; i >= 0; i -= 1) {
        if (complaints[i].userId === userId) return complaints[i]
    }
    return null
}

const getPendingAdminComplaints = () => {
    const grouped = new Map()

    complaints
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .forEach((item) => {
            if (!grouped.has(item.userId)) {
                grouped.set(item.userId, {
                    userId: item.userId,
                    userName: item.userName || getUserProfile(item.userId).name || 'Customer',
                    userImage: item.userImage || getUserProfile(item.userId).image || '',
                    status: item.status,
                    updatedAt: item.updatedAt,
                    tickets: []
                })
            }

            const thread = grouped.get(item.userId)
            thread.updatedAt = item.updatedAt > thread.updatedAt ? item.updatedAt : thread.updatedAt
            thread.tickets.push(item)
        })

    grouped.forEach((thread) => {
        thread.status = thread.tickets.some((item) => item.status === 'pending_admin') ? 'pending_admin' : 'resolved'
    })

    return Array.from(grouped.values()).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

const resolveComplaint = ({ id, userId, reply }) => {
    const complaint = complaints.find((item) => item.id === id && (!userId || item.userId === userId))
    if (!complaint) return null

    complaint.status = 'resolved'
    complaint.adminReply = String(reply || '').trim()
    const messageTime = new Date().toISOString()
    complaint.messages.push({
        sender: 'admin',
        text: complaint.adminReply,
        ...getTimeData(),
        timestamp: messageTime
    })
    complaint.updatedAt = messageTime
    complaint.resolvedAt = messageTime

    return complaint
}

const markComplaintResolved = ({ id, userId }) => {
    const complaint = complaints.find((item) => item.id === id && (!userId || item.userId === userId))
    if (!complaint) return null

    const resolvedTime = new Date().toISOString()
    complaint.status = 'resolved'
    complaint.updatedAt = resolvedTime
    complaint.resolvedAt = resolvedTime

    return complaint
}

const getLastReply = (userId) => {
    const state = getUserState(userId)
    return String(state.lastReply || '')
}

const rememberReply = (userId, reply) => {
    return setUserState(userId, { lastReply: String(reply || '').trim() })
}

const trackUserMessage = (userId, normalizedMessage, { isUnclear = false } = {}) => {
    const state = getUserState(userId)
    const previous = String(state.lastUserMessage || '')
    const nextMessage = String(normalizedMessage || '').trim()
    const isRepeatedMessage = nextMessage && nextMessage === previous
    const nextUnclearCount = (isUnclear || isRepeatedMessage)
        ? Number(state.unclearCount || 0) + 1
        : 0

    setUserState(userId, {
        lastUserMessage: nextMessage,
        unclearCount: nextUnclearCount
    })

    return {
        isRepeatedMessage,
        unclearCount: nextUnclearCount
    }
}

export {
    getUserState,
    setUserState,
    createComplaint,
    setUserProfile,
    getUserProfile,
    getPendingComplaintByUser,
    getActiveComplaintByUser,
    getLatestComplaintByUser,
    getPendingAdminComplaints,
    resolveComplaint,
    markComplaintResolved,
    getLastReply,
    rememberReply,
    trackUserMessage,
    getTimeData
}
