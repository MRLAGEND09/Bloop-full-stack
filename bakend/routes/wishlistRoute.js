import express from 'express'
import { addToWishlist, removeFromWishlist, getUserWishlist, checkWishlist } from '../controllers/wishlistController.js'
import authUser from '../middleware/auth.js'

const wishlistRouter = express.Router()

wishlistRouter.post('/add', authUser, addToWishlist)
wishlistRouter.post('/remove', authUser, removeFromWishlist)
wishlistRouter.post('/get', authUser, getUserWishlist)
wishlistRouter.post('/check', authUser, checkWishlist)

export default wishlistRouter