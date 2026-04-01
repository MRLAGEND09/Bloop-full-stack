import express from 'express'
import { addReview, getProductReviews, getUserReviews, getAllReviews, editReview, deleteReview } from '../controllers/reviewController.js'
import authUser from '../middleware/auth.js'
import adminAuth from '../middleware/adminAuth.js'

const reviewRouter = express.Router()

reviewRouter.post('/add', authUser, addReview)
reviewRouter.post('/product', getProductReviews)
reviewRouter.post('/user', authUser, getUserReviews)

// admin-only actions
reviewRouter.post('/admin/list', adminAuth, getAllReviews)
reviewRouter.post('/admin/edit', adminAuth, editReview)
reviewRouter.post('/admin/delete', adminAuth, deleteReview)

export default reviewRouter