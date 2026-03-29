import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from 'stripe'

const currency = '৳'
const deliveryCharge = 70

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Generate invoice number
const generateInvoice = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `INV-${year}${month}${day}-${random}`
}

// Placing order using COD Method
const placeOrder = async (req, res) => {
    try {
        const { userId, items, address, amount, couponDiscount, couponCode } = req.body;

        const originalAmount = items.reduce((acc, item) => {
            return acc + (item.originalPrice || item.price) * item.quantity
        }, 0)
        const productDiscount = parseFloat((originalAmount - amount + deliveryCharge + (couponDiscount || 0)).toFixed(2))

        const orderData = {
            userId,
            items,
            address,
            amount,
            couponDiscount: couponDiscount || 0,
            couponCode: couponCode || '',
            productDiscount: productDiscount > 0 ? productDiscount : 0,
            paymentMethod: "COD",
            payment: false,
            date: Date.now(),
            accepted: 'pending',
            invoiceNumber: generateInvoice()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        await userModel.findByIdAndUpdate(userId, { cartData: {} })

        res.json({ success: true, message: "Order Placed" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Placing order using Stripe Method
const placeOrderStripe = async (req, res) => {
    try {
        const { userId, items, address, amount, couponDiscount, couponCode } = req.body;
        const { origin } = req.headers;

        const originalAmount = items.reduce((acc, item) => {
            return acc + (item.originalPrice || item.price) * item.quantity
        }, 0)
        const productDiscount = parseFloat((originalAmount - amount + deliveryCharge + (couponDiscount || 0)).toFixed(2))

        const orderData = {
            userId,
            items,
            address,
            amount,
            couponDiscount: couponDiscount || 0,
            couponCode: couponCode || '',
            productDiscount: productDiscount > 0 ? productDiscount : 0,
            paymentMethod: "stripe",
            payment: false,
            date: Date.now(),
            accepted: 'pending',
            invoiceNumber: generateInvoice()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        const line_items = items.map((item) => ({
            price_data: {
                currency: currency,
                product_data: { name: item.name },
                unit_amount: Math.round(item.price * 100)
            },
            quantity: item.quantity
        }))

        line_items.push({
            price_data: {
                currency: currency,
                product_data: { name: 'Delivery Charges' },
                unit_amount: deliveryCharge * 100
            },
            quantity: 1
        })

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: 'payment'
        })

        res.json({ success: true, session_url: session.url });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Verify stripe
const verifyStripe = async (req, res) => {
    const { orderId, success, userId } = req.body
    try {
        if (success === "true") {
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            await userModel.findByIdAndUpdate(userId, { cartData: {} })
            res.json({ success: true });
        } else {
            await orderModel.findByIdAndDelete(orderId)
            res.json({ success: false })
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// All orders data for admin panel
const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({})
        res.json({ success: true, orders });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// User order data for frontend
const userOrders = async (req, res) => {
    try {
        const { userId } = req.body
        const orders = await orderModel.find({ userId })
        res.json({ success: true, orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Update order status from admin panel
const updateStatus = async (req, res) => {
    try {
        const { orderId, status, cancelReason } = req.body;

        let updateData = { status };
        if (status === "Cancelled" && cancelReason) {
            updateData.cancelReason = cancelReason;
        }
        if (status === "Delivered") {
            updateData.deliveredAt = new Date()
        }

        const updatedOrder = await orderModel.findByIdAndUpdate(
            orderId,
            updateData,
            { new: true }
        );

        res.json({ success: true, message: "Status Updated", order: updatedOrder });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// Accept or Reject order
const acceptOrder = async (req, res) => {
    try {
        const { orderId, accepted, rejectedReason } = req.body;

        let updateData = { accepted }
        if (accepted === 'rejected' && rejectedReason) {
            updateData.rejectedReason = rejectedReason
            updateData.status = 'Cancelled'
            updateData.cancelReason = rejectedReason
        }
        if (accepted === 'accepted') {
            updateData.status = 'Order Placed'
        }

        await orderModel.findByIdAndUpdate(orderId, updateData, { new: true })
        res.json({ success: true, message: `Order ${accepted}` })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Mark order as paid
const markAsPaid = async (req, res) => {
    try {
        const { orderId, paidBy } = req.body;

        await orderModel.findByIdAndUpdate(orderId, {
            payment: true,
            paidAt: new Date(),
            paidBy: paidBy || 'Cash'
        }, { new: true })

        res.json({ success: true, message: 'Order marked as paid' })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// Get pending orders
const getPendingOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({
            accepted: 'pending'
        }).sort({ date: -1 })
        res.json({ success: true, orders })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

export {
    verifyStripe, allOrders, placeOrder, placeOrderStripe,
    updateStatus, userOrders, acceptOrder, markAsPaid, getPendingOrders
}