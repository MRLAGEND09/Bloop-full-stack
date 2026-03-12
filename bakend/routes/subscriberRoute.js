import express from 'express'
import { subscribeUser, validateCoupon, useCoupon, getSubscribers, manualCoupon } from '../controllers/subscriberController.js'

const subscriberRouter = express.Router()

subscriberRouter.post('/subscribe', subscribeUser)
subscriberRouter.post('/validate', validateCoupon)
subscriberRouter.post('/use', useCoupon)
subscriberRouter.get('/list', getSubscribers)
subscriberRouter.post('/manual-coupon', manualCoupon)

export default subscriberRouter