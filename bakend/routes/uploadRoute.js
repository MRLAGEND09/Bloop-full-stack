import express from 'express'
import authUser from '../middleware/auth.js'
import upload from '../middleware/multer.js'
import { uploadAvatarFile } from '../controllers/userController.js'

const uploadRouter = express.Router()

uploadRouter.post('/upload-avatar', authUser, upload.single('avatar'), uploadAvatarFile)

export default uploadRouter
