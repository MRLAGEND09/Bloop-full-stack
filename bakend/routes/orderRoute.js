import express from 'express'
import {
    allOrders, placeOrder, placeOrderStripe,
    updateStatus, userOrders, verifyStripe,
    acceptOrder, markAsPaid, getPendingOrders
} from '../controllers/orderController.js'
import adminAuth from '../middleware/adminAuth.js'
import authUser from '../middleware/auth.js'

const orderRouter = express.Router()

// Admin features
orderRouter.post('/list', adminAuth, allOrders)
orderRouter.post('/status', adminAuth, updateStatus)
orderRouter.post('/accept', adminAuth, acceptOrder)
orderRouter.post('/mark-paid', adminAuth, markAsPaid)
orderRouter.post('/pending', adminAuth, getPendingOrders)

// Payment features
orderRouter.post('/place', authUser, placeOrder)
orderRouter.post('/stripe', authUser, placeOrderStripe)

// User features
orderRouter.post('/userorders', authUser, userOrders)

// Verify payment
orderRouter.post('/verifystripe', authUser, verifyStripe)

export default orderRouter