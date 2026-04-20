import express from 'express'
import adminAuth from '../middleware/adminAuth.js'
import { getPendingAdminChats, replyAdminChat, resolveAdminChat } from '../controllers/hybridSupportController.js'

const adminSupportRouter = express.Router()

adminSupportRouter.get('/chats', adminAuth, getPendingAdminChats)
adminSupportRouter.post('/reply', adminAuth, replyAdminChat)
adminSupportRouter.post('/resolve', adminAuth, resolveAdminChat)

export default adminSupportRouter
