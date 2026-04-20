import express from 'express'
import multer from 'multer'
import authUser from '../middleware/auth.js'
import {
	generateVirtualTryOn
} from '../controllers/aiController.js'
import {
	hybridChatSupport,
	getUserSupportStatus
} from '../controllers/hybridSupportController.js'

const aiRouter = express.Router()
const memoryUpload = multer({ storage: multer.memoryStorage() })

aiRouter.post('/chat', authUser, hybridChatSupport)
aiRouter.post('/chat-status', authUser, getUserSupportStatus)
aiRouter.post('/virtual-tryon', memoryUpload.fields([
	{ name: 'userImage', maxCount: 1 },
	{ name: 'garmentImage', maxCount: 1 }
]), generateVirtualTryOn)

export default aiRouter
