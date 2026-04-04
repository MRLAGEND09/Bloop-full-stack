import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from 'stripe'
import nodemailer from 'nodemailer'
import PDFDocument from 'pdfkit'

const currency = '৳'
const deliveryCharge = 70

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

// Generate invoice number
const generateInvoice = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `INV-${year}${month}${day}-${random}`
}

// Email styles
const emailStyles = `
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: #000; color: #fff; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
    .body { padding: 30px; }
    .badge { border-radius: 6px; padding: 15px; text-align: center; margin-bottom: 25px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }
    .info-box { background: #f9f9f9; border-radius: 6px; padding: 15px; }
    .info-box h4 { margin: 0 0 8px; color: #666; font-size: 12px; text-transform: uppercase; }
    .info-box p { margin: 0; color: #333; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead { background: #f5f5f5; }
    th { padding: 10px; text-align: left; font-size: 13px; color: #666; }
    .total-section { background: #f9f9f9; border-radius: 6px; padding: 15px; }
    .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; }
    .total-row.final { font-weight: bold; font-size: 16px; border-top: 2px solid #000; padding-top: 10px; margin-top: 5px; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px; }
    .steps { display: flex; justify-content: space-between; margin: 20px 0; }
    .step { text-align: center; flex: 1; }
    .step-circle { width: 30px; height: 30px; border-radius: 50%; margin: 0 auto 5px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; }
    .step-done { background: #4caf50; color: white; }
    .step-active { background: #2196f3; color: white; }
    .step-pending { background: #e0e0e0; color: #999; }
    .step p { font-size: 11px; color: #666; margin: 0; }
`

// Items HTML helper
const getItemsHTML = (items) => items.map(item => `
    <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.size}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${currency}${item.price}</td>
    </tr>
`).join('')

// Total HTML helper
const getTotalHTML = (order) => `
    <div class="total-section">
        <div class="total-row">
            <span>Subtotal</span>
            <span>${currency}${(order.amount - deliveryCharge + (order.couponDiscount || 0)).toFixed(2)}</span>
        </div>
        <div class="total-row">
            <span>Delivery Fee</span>
            <span>${currency}${deliveryCharge}</span>
        </div>
        ${order.couponDiscount > 0 ? `
        <div class="total-row" style="color: green;">
            <span>Coupon Discount</span>
            <span>-${currency}${order.couponDiscount}</span>
        </div>` : ''}
        ${order.productDiscount > 0 ? `
        <div class="total-row" style="color: green;">
            <span>Product Discount</span>
            <span>-${currency}${order.productDiscount}</span>
        </div>` : ''}
        <div class="total-row final">
            <span>Total</span>
            <span>${currency}${order.amount}</span>
        </div>
    </div>
`

// Send order placed email
const sendOrderConfirmationEmail = async (order, address) => {
    try {
        const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>${emailStyles}</style></head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>BLOOP</h1>
                    <p style="color: #ccc; margin: 5px 0 0;">Fashion & Style</p>
                </div>
                <div class="body">
                    <p style="color: #999; font-size: 13px;">Invoice: ${order.invoiceNumber}</p>
                    <div class="badge" style="background: #e8f5e9; border: 1px solid #4caf50;">
                        <p style="color: #2e7d32; margin: 0; font-size: 16px; font-weight: bold;">✅ Order Received Successfully!</p>
                    </div>
                    <p style="color: #333; font-size: 15px;">Hi <strong>${address.firstName} ${address.lastName}</strong>,</p>
                    <p style="color: #666; font-size: 14px;">Thank you for your order! We have received it and it is awaiting confirmation.</p>
                    <div class="steps">
                        <div class="step"><div class="step-circle step-done">✓</div><p>Placed</p></div>
                        <div class="step"><div class="step-circle step-pending">2</div><p>Confirmed</p></div>
                        <div class="step"><div class="step-circle step-pending">3</div><p>Shipped</p></div>
                        <div class="step"><div class="step-circle step-pending">4</div><p>Delivered</p></div>
                    </div>
                    <div class="info-grid">
                        <div class="info-box"><h4>Order Date</h4><p>${new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
                        <div class="info-box"><h4>Payment Method</h4><p>${order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</p></div>
                        <div class="info-box"><h4>Delivery Address</h4><p>${address.street}, ${address.city}, ${address.country}</p></div>
                        <div class="info-box"><h4>Phone</h4><p>${address.phone}</p></div>
                    </div>
                    <h3 style="color: #333; margin-bottom: 10px;">Order Items</h3>
                    <table>
                        <thead><tr><th>Product</th><th style="text-align:center">Size</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th></tr></thead>
                        <tbody>${getItemsHTML(order.items)}</tbody>
                    </table>
                    ${getTotalHTML(order)}
                </div>
                <div class="footer">
                    <p>Thank you for shopping with BLOOP!</p>
                    <p>Questions? Contact us at ${process.env.EMAIL_USER}</p>
                    <p>Support Phone: ${process.env.SUPPORT_PHONE || '+8801700000000'}</p>
                </div>
            </div>
        </body>
        </html>`

        await transporter.sendMail({
            from: `"BLOOP Fashion" <${process.env.EMAIL_USER}>`,
            to: address.email,
            subject: `✅ Order Received - ${order.invoiceNumber}`,
            html: emailHTML
        })
        console.log('Order placed email sent to:', address.email)
    } catch (error) {
        console.log('Email error:', error)
    }
}

// Send order accepted email
const sendOrderAcceptedEmail = async (order) => {
    try {
        const address = order.address
        const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>${emailStyles}</style></head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>BLOOP</h1>
                    <p style="color: #ccc; margin: 5px 0 0;">Fashion & Style</p>
                </div>
                <div class="body">
                    <p style="color: #999; font-size: 13px;">Invoice: ${order.invoiceNumber}</p>
                    <div class="badge" style="background: #e3f2fd; border: 1px solid #2196f3;">
                        <p style="color: #1565c0; margin: 0; font-size: 16px; font-weight: bold;">🎉 Your Order Has Been Confirmed!</p>
                    </div>
                    <p style="color: #333; font-size: 15px;">Hi <strong>${address.firstName} ${address.lastName}</strong>,</p>
                    <p style="color: #666; font-size: 14px;">Great news! Your order has been confirmed and is being prepared for shipment.</p>
                    <div class="steps">
                        <div class="step"><div class="step-circle step-done">✓</div><p>Placed</p></div>
                        <div class="step"><div class="step-circle step-done">✓</div><p>Confirmed</p></div>
                        <div class="step"><div class="step-circle step-pending">3</div><p>Shipped</p></div>
                        <div class="step"><div class="step-circle step-pending">4</div><p>Delivered</p></div>
                    </div>
                    <div class="info-grid">
                        <div class="info-box"><h4>Order Date</h4><p>${new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
                        <div class="info-box"><h4>Payment Method</h4><p>${order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</p></div>
                        <div class="info-box"><h4>Delivery Address</h4><p>${address.street}, ${address.city}, ${address.country}</p></div>
                        <div class="info-box"><h4>Phone</h4><p>${address.phone}</p></div>
                    </div>
                    <h3 style="color: #333; margin-bottom: 10px;">Order Items</h3>
                    <table>
                        <thead><tr><th>Product</th><th style="text-align:center">Size</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th></tr></thead>
                        <tbody>${getItemsHTML(order.items)}</tbody>
                    </table>
                    ${getTotalHTML(order)}
                </div>
                <div class="footer">
                    <p>Thank you for shopping with BLOOP!</p>
                    <p>Questions? Contact us at ${process.env.EMAIL_USER}</p>
                </div>
            </div>
        </body>
        </html>`

        await transporter.sendMail({
            from: `"BLOOP Fashion" <${process.env.EMAIL_USER}>`,
            to: address.email,
            subject: `🎉 Order Confirmed - ${order.invoiceNumber}`,
            html: emailHTML
        })
        console.log('Order accepted email sent to:', address.email)
    } catch (error) {
        console.log('Email error:', error)
    }
}

// Send invoice/bill voucher email
const sendInvoiceEmail = async (order) => {
    try {
        const address = order.address
        const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>${emailStyles}</style></head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>BLOOP</h1>
                    <p style="color: #ccc; margin: 5px 0 0;">Fashion & Style</p>
                </div>
                <div class="body">
                    <p style="color: #999; font-size: 13px;">Invoice: ${order.invoiceNumber}</p>
                    <div class="badge" style="background: #fff3e0; border: 1px solid #ffb300;">
                        <p style="color: #ef6c00; margin: 0; font-size: 16px; font-weight: bold;">🧾 Bill Voucher Ready!</p>
                    </div>
                    <p style="color: #333; font-size: 15px;">Hi <strong>${address.firstName} ${address.lastName}</strong>,</p>
                    <p style="color: #666; font-size: 14px;">Your payment has been confirmed. Please find your bill voucher details below.</p>
                    <div class="info-grid">
                        <div class="info-box"><h4>Order Date</h4><p>${new Date(order.date).toLocaleDateString()}</p></div>
                        <div class="info-box"><h4>Payment Method</h4><p>${order.paymentMethod}</p></div>
                        <div class="info-box"><h4>Total</h4><p>${currency}${order.amount}</p></div>
                        <div class="info-box"><h4>Payment Status</h4><p>${order.payment ? '✅ Paid' : '⏳ Pending'}</p></div>
                    </div>
                    <h3 style="color: #333; margin-bottom: 10px;">Order Items</h3>
                    <table>
                        <thead><tr><th>Product</th><th style="text-align:center">Size</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th></tr></thead>
                        <tbody>${getItemsHTML(order.items)}</tbody>
                    </table>
                    ${getTotalHTML(order)}
                </div>
                <div class="footer">
                    <p>Thank you for shopping with BLOOP!</p>
                    <p>Questions? Contact us at ${process.env.EMAIL_USER}</p>
                    <p>Support Phone: ${process.env.SUPPORT_PHONE || '+8801700000000'}</p>
                </div>
            </div>
        </body>
        </html>`

        await transporter.sendMail({
            from: `"BLOOP Fashion" <${process.env.EMAIL_USER}>`,
            to: address.email,
            subject: `🧾 Your Bill Voucher - ${order.invoiceNumber}`,
            html: emailHTML
        })
        console.log('Bill voucher email sent to:', address.email)
    } catch (error) {
        console.log('Email error:', error)
    }
}

// Send order delivered email
const sendOrderDeliveredEmail = async (order) => {
    try {
        const address = order.address
        const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><style>${emailStyles}</style></head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>BLOOP</h1>
                    <p style="color: #ccc; margin: 5px 0 0;">Fashion & Style</p>
                </div>
                <div class="body">
                    <p style="color: #999; font-size: 13px;">Invoice: ${order.invoiceNumber}</p>
                    <div class="badge" style="background: #e8f5e9; border: 1px solid #4caf50;">
                        <p style="color: #2e7d32; margin: 0; font-size: 16px; font-weight: bold;">📦 Your Order Has Been Delivered!</p>
                    </div>
                    <p style="color: #333; font-size: 15px;">Hi <strong>${address.firstName} ${address.lastName}</strong>,</p>
                    <p style="color: #666; font-size: 14px;">Your order has been successfully delivered. We hope you love your purchase!</p>
                    <div class="steps">
                        <div class="step"><div class="step-circle step-done">✓</div><p>Placed</p></div>
                        <div class="step"><div class="step-circle step-done">✓</div><p>Confirmed</p></div>
                        <div class="step"><div class="step-circle step-done">✓</div><p>Shipped</p></div>
                        <div class="step"><div class="step-circle step-done">✓</div><p>Delivered</p></div>
                    </div>
                    <div class="info-grid">
                        <div class="info-box"><h4>Order Date</h4><p>${new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
                        <div class="info-box"><h4>Delivered On</h4><p>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
                        <div class="info-box"><h4>Delivery Address</h4><p>${address.street}, ${address.city}, ${address.country}</p></div>
                        <div class="info-box"><h4>Payment</h4><p>${order.payment ? '✅ Paid' : '⏳ ' + (order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Pending')}</p></div>
                    </div>
                    <h3 style="color: #333; margin-bottom: 10px;">Order Items</h3>
                    <table>
                        <thead><tr><th>Product</th><th style="text-align:center">Size</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th></tr></thead>
                        <tbody>${getItemsHTML(order.items)}</tbody>
                    </table>
                    ${getTotalHTML(order)}
                    <div style="background: #fff8e1; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; text-align: center; margin-top: 20px;">
                        <p style="margin: 0; color: #333; font-size: 14px;">⭐ Enjoying your purchase? We'd love to hear from you!</p>
                        <p style="margin: 5px 0 0; color: #666; font-size: 13px;">Visit our website to leave a review.</p>
                    </div>
                </div>
                <div class="footer">
                    <p>Thank you for shopping with BLOOP!</p>
                    <p>Questions? Contact us at ${process.env.EMAIL_USER}</p>
                    <p>Support Phone: ${process.env.SUPPORT_PHONE || '+8801700000000'}</p>
                </div>
            </div>
        </body>
        </html>`

        await transporter.sendMail({
            from: `"BLOOP Fashion" <${process.env.EMAIL_USER}>`,
            to: address.email,
            subject: `📦 Order Delivered - ${order.invoiceNumber}`,
            html: emailHTML
        })
        console.log('Order delivered email sent to:', address.email)
    } catch (error) {
        console.log('Email error:', error)
    }
}

// Send SMS receipt via Twilio
const sendSMSReceipt = async (order, phone, customText) => {
    try {
        if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
            console.log('SMS skipped: Phone number is empty or invalid')
            return false
        }

        // Format Bangladesh phone number
        let formattedPhone = phone.trim()
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '+880' + formattedPhone.slice(1)
        } else if (!formattedPhone.startsWith('+')) {
            formattedPhone = '+880' + formattedPhone
        }

        const baseMessage = `BLOOP Order!\nInvoice: ${order.invoiceNumber}\nItems: ${order.items.map(i => i.name).join(', ')}\nTotal: ${currency}${order.amount}\nThank you for shopping with BLOOP!`
        const smsMessage = customText || baseMessage

        const provider = (process.env.SMS_PROVIDER || 'log').toLowerCase()

        if (provider === 'log') {
            console.log(`\n📱 [SMS LOG MODE] To: ${formattedPhone}`)
            console.log(`📝 Message: ${smsMessage}\n`)
            return true
        }

        if (provider === 'twilio') {
            const accountSid = process.env.TWILIO_ACCOUNT_SID
            const authToken = process.env.TWILIO_AUTH_TOKEN
            const fromNumber = process.env.TWILIO_PHONE_NUMBER

            if (!accountSid || !authToken || !fromNumber) {
                console.log('⚠️ Twilio credentials missing in .env')
                return false
            }

            let twilioModule
            try {
                twilioModule = (await import('twilio')).default
            } catch (e) {
                console.error('Twilio not installed. Run: npm install twilio')
                return false
            }

            const client = twilioModule(accountSid, authToken)
            const result = await client.messages.create({
                body: smsMessage,
                from: fromNumber,
                to: formattedPhone
            })

            console.log(`✅ Twilio SMS sent! SID: ${result.sid} To: ${formattedPhone}`)
            return true
        }

        if (provider === 'nexmo' || provider === 'vonage') {
            let Vonage
            try {
                Vonage = (await import('@vonage/server-sdk')).default
            } catch (e) {
                console.error('Vonage not installed. Run: npm install @vonage/server-sdk')
                return false
            }

            if (!process.env.NEXMO_API_KEY || !process.env.NEXMO_API_SECRET || !process.env.NEXMO_FROM_NUMBER) {
                console.log('⚠️ Nexmo credentials missing in .env')
                return false
            }

            const vonage = new Vonage({
                apiKey: process.env.NEXMO_API_KEY,
                apiSecret: process.env.NEXMO_API_SECRET
            })

            await new Promise((resolve, reject) => {
                vonage.sms.send({
                    to: formattedPhone,
                    from: process.env.NEXMO_FROM_NUMBER,
                    text: smsMessage
                }, (err, responseData) => {
                    if (err) reject(err)
                    else if (responseData.messages[0].status !== '0') reject(new Error(responseData.messages[0]['error-text']))
                    else resolve(responseData)
                })
            })

            console.log(`✅ Nexmo SMS sent to ${formattedPhone}`)
            return true
        }

        console.log(`⚠️ Unknown SMS provider: ${provider}`)
        return false
    } catch (error) {
        console.log('❌ SMS error:', error.message)
        return false
    }
}

// Placing order using COD Method
const placeOrder = async (req, res) => {
    try {
        const { userId, items, address, amount, couponDiscount, couponCode } = req.body

        const originalAmount = items.reduce((acc, item) => {
            return acc + (item.originalPrice || item.price) * item.quantity
        }, 0)
        const productDiscount = parseFloat((originalAmount - amount + deliveryCharge + (couponDiscount || 0)).toFixed(2))

        const orderData = {
            userId, items, address, amount,
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
        await sendOrderConfirmationEmail(newOrder, address)
        await sendSMSReceipt(newOrder, address.phone)

        res.json({ success: true, message: "Order Placed" })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Placing order using Stripe Method
const placeOrderStripe = async (req, res) => {
    try {
        const { userId, items, address, amount, couponDiscount, couponCode } = req.body
        const { origin } = req.headers

        const originalAmount = items.reduce((acc, item) => {
            return acc + (item.originalPrice || item.price) * item.quantity
        }, 0)
        const productDiscount = parseFloat((originalAmount - amount + deliveryCharge + (couponDiscount || 0)).toFixed(2))

        const orderData = {
            userId, items, address, amount,
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
        await sendOrderConfirmationEmail(newOrder, address)
        await sendSMSReceipt(newOrder, address.phone)

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

        res.json({ success: true, session_url: session.url })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Verify stripe
const verifyStripe = async (req, res) => {
    const { orderId, success, userId } = req.body
    try {
        if (success === "true") {
            await orderModel.findByIdAndUpdate(orderId, { payment: true })
            await userModel.findByIdAndUpdate(userId, { cartData: {} })
            res.json({ success: true })
        } else {
            await orderModel.findByIdAndDelete(orderId)
            res.json({ success: false })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// All orders data for admin panel
const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({})
        res.json({ success: true, orders })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// User order data for frontend
const userOrders = async (req, res) => {
    try {
        const { userId } = req.body
        const orders = await orderModel.find({ userId })
        res.json({ success: true, orders })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Update order status from admin panel
const updateStatus = async (req, res) => {
    try {
        const { orderId, status, cancelReason } = req.body

        let updateData = { status }
        if (status === "Cancelled" && cancelReason) {
            updateData.cancelReason = cancelReason
        }
        if (status === "Delivered") {
            updateData.deliveredAt = new Date()
        }

        const updatedOrder = await orderModel.findByIdAndUpdate(
            orderId, updateData, { new: true }
        )

        if (status === 'Delivered' && updatedOrder) {
            await sendOrderDeliveredEmail(updatedOrder)
        }

        res.json({ success: true, message: "Status Updated", order: updatedOrder })
    } catch (error) {
        console.error(error)
        res.json({ success: false, message: error.message })
    }
}

// Accept or Reject order
const acceptOrder = async (req, res) => {
    try {
        const { orderId, accepted, rejectedReason, notify } = req.body

        let updateData = { accepted }
        if (accepted === 'rejected' && rejectedReason) {
            updateData.rejectedReason = rejectedReason
            updateData.status = 'Cancelled'
            updateData.cancelReason = rejectedReason
        }
        if (accepted === 'accepted') {
            updateData.status = 'Order Placed'
        }

        const updatedOrder = await orderModel.findByIdAndUpdate(orderId, updateData, { new: true })

        if (accepted === 'accepted' && updatedOrder) {
            if (notify === 'email') {
                await sendOrderAcceptedEmail(updatedOrder)
            } else if (notify === 'phone') {
                if (updatedOrder.address?.phone) {
                    await sendSMSReceipt(
                        updatedOrder,
                        updatedOrder.address.phone,
                        `BLOOP: Your order ${updatedOrder.invoiceNumber} is confirmed! Total: ${currency}${updatedOrder.amount}. Thank you for shopping with BLOOP!`
                    )
                }
            }
        }

        res.json({ success: true, message: `Order ${accepted}` })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Mark order as paid
const markAsPaid = async (req, res) => {
    try {
        const { orderId, paidBy } = req.body
        await orderModel.findByIdAndUpdate(orderId, {
            payment: true,
            paidAt: new Date(),
            paidBy: paidBy || 'Cash'
        }, { new: true })
        res.json({ success: true, message: 'Order marked as paid' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Send invoice via email (with PDF) or SMS

const sendInvoice = async (req, res) => {
    try {
        const { orderId, method } = req.body
        if (!orderId) return res.json({ success: false, message: 'orderId is required' })

        const order = await orderModel.findById(orderId)
        if (!order) return res.json({ success: false, message: 'Order not found' })

        if (method === 'sms') {
            if (!order.address?.phone) return res.json({ success: false, message: 'Phone number not found' })
            await sendSMSReceipt(
                order,
                order.address.phone,
                `BLOOP Bill Voucher!\nInvoice: ${order.invoiceNumber}\nTotal: ৳${order.amount}\nPayment: ${order.payment ? 'Paid' : 'Pending'}\nThank you!`
            )
        } else {
            // Generate PDF and send via email
            const pdfBuffer = await generatePDFBuffer(order)
            const address = order.address

            const emailHTML = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><style>${emailStyles}</style></head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>BLOOP</h1>
                        <p style="color: #ccc; margin: 5px 0 0;">Fashion & Style</p>
                    </div>
                    <div class="body">
                        <p style="color: #999; font-size: 13px;">Invoice: ${order.invoiceNumber}</p>
                        <div class="badge" style="background: #fff3e0; border: 1px solid #ffb300;">
                            <p style="color: #ef6c00; margin: 0; font-size: 16px; font-weight: bold;">🧾 Your Bill Voucher is Ready!</p>
                        </div>
                        <p style="color: #333; font-size: 15px;">Hi <strong>${address.firstName} ${address.lastName}</strong>,</p>
                        <p style="color: #666; font-size: 14px;">Please find your bill voucher attached as PDF.</p>
                        <div class="info-grid">
                            <div class="info-box"><h4>Invoice</h4><p>${order.invoiceNumber}</p></div>
                            <div class="info-box"><h4>Total</h4><p>৳${order.amount}</p></div>
                            <div class="info-box"><h4>Payment</h4><p>${order.payment ? '✅ Paid' : '⏳ Pending'}</p></div>
                            <div class="info-box"><h4>Method</h4><p>${order.paymentMethod}</p></div>
                        </div>
                        <h3 style="color: #333; margin-bottom: 10px;">Order Items</h3>
                        <table>
                            <thead><tr><th>Product</th><th style="text-align:center">Size</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th></tr></thead>
                            <tbody>${getItemsHTML(order.items)}</tbody>
                        </table>
                        ${getTotalHTML(order)}
                    </div>
                    <div class="footer">
                        <p>Thank you for shopping with BLOOP!</p>
                        <p>Questions? Contact us at ${process.env.EMAIL_USER}</p>
                    </div>
                </div>
            </body>
            </html>`

            await transporter.sendMail({
                from: `"BLOOP Fashion" <${process.env.EMAIL_USER}>`,
                to: address.email,
                subject: `🧾 Bill Voucher - ${order.invoiceNumber}`,
                html: emailHTML,
                attachments: [
                    {
                        filename: `Invoice_${order.invoiceNumber}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }
                ]
            })
            console.log('Bill voucher email with PDF sent to:', address.email)
        }

        return res.json({ success: true, message: 'Invoice sent successfully' })
    } catch (error) {
        console.error(error)
        return res.json({ success: false, message: error.message })
    }
}

// Get pending orders
const getPendingOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({ accepted: 'pending' }).sort({ date: -1 })
        res.json({ success: true, orders })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Generate PDF buffer
const generatePDFBuffer = (order) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 })
        const buffers = []

        doc.on('data', chunk => buffers.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(buffers)))
        doc.on('error', reject)

        // Header
        doc.rect(0, 0, 612, 80).fill('#000000')
        doc.fillColor('#ffffff').fontSize(24).text('BLOOP', 50, 25, { align: 'center' })
        doc.fontSize(10).text('Fashion & Style', 50, 52, { align: 'center' })

        // Reset color
        doc.fillColor('#000000')

        // Invoice info
        doc.fontSize(10)
        doc.text(`Invoice: ${order.invoiceNumber}`, 50, 100)
        doc.text(`Date: ${new Date(order.date).toLocaleDateString()}`, 50, 115)
        doc.text(`Status: ${order.status}`, 50, 130)
        doc.text(`Payment: ${order.payment ? 'Paid' : 'Pending'}`, 350, 100)
        doc.text(`Method: ${order.paymentMethod}`, 350, 115)

        // Divider
        doc.moveTo(50, 150).lineTo(562, 150).stroke('#cccccc')

        // Customer info
        doc.fontSize(12).font('Helvetica-Bold').text('Customer Details', 50, 165)
        doc.font('Helvetica').fontSize(10)
        doc.text(`Name: ${order.address.firstName} ${order.address.lastName}`, 50, 182)
        doc.text(`Address: ${order.address.street}, ${order.address.city}, ${order.address.country} - ${order.address.zipcode}`, 50, 197)
        doc.text(`Phone: ${order.address.phone}`, 50, 212)
        doc.text(`Email: ${order.address.email}`, 50, 227)

        // Divider
        doc.moveTo(50, 245).lineTo(562, 245).stroke('#cccccc')

        // Table header
        doc.fontSize(10).font('Helvetica-Bold')
        doc.rect(50, 255, 512, 20).fill('#000000')
        doc.fillColor('#ffffff')
        doc.text('Product', 55, 260)
        doc.text('Size', 280, 260)
        doc.text('Qty', 340, 260)
        doc.text('Price', 400, 260)
        doc.text('Total', 470, 260)
        doc.fillColor('#000000').font('Helvetica')

        // Table rows
        let y = 280
        order.items.forEach((item, i) => {
            if (i % 2 === 0) {
                doc.rect(50, y - 3, 512, 18).fill('#f5f5f5')
            }
            doc.fillColor('#000000').fontSize(9)
            doc.text(item.name.substring(0, 30), 55, y)
            doc.text(item.size, 280, y)
            doc.text(item.quantity.toString(), 340, y)
            doc.text(`৳${item.price}`, 400, y)
            doc.text(`৳${(item.price * item.quantity).toFixed(2)}`, 470, y)
            y += 20
        })

        // Totals
        y += 10
        doc.moveTo(50, y).lineTo(562, y).stroke('#cccccc')
        y += 10

        doc.fontSize(10)
        const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0)
        doc.text(`Subtotal: ৳${subtotal.toFixed(2)}`, 350, y)
        y += 15
        doc.text(`Delivery: ৳70`, 350, y)
        y += 15

        if (order.couponDiscount > 0) {
            doc.fillColor('#00aa00').text(`Coupon: -৳${order.couponDiscount}`, 350, y)
            doc.fillColor('#000000')
            y += 15
        }

        if (order.productDiscount > 0) {
            doc.fillColor('#00aa00').text(`Product Discount: -৳${order.productDiscount}`, 350, y)
            doc.fillColor('#000000')
            y += 15
        }

        doc.font('Helvetica-Bold').fontSize(12)
        doc.text(`Total: ৳${order.amount}`, 350, y + 5)
        doc.font('Helvetica')

        // Footer
        y += 40
        doc.moveTo(50, y).lineTo(562, y).stroke('#cccccc')
        doc.fontSize(9).fillColor('#999999')
        doc.text('Thank you for shopping with BLOOP!', 50, y + 10, { align: 'center' })
        doc.text(`Support: ${process.env.EMAIL_USER}`, 50, y + 22, { align: 'center' })

        doc.end()
    })
}




export {
    verifyStripe, allOrders, placeOrder, placeOrderStripe,
    updateStatus, userOrders, acceptOrder, markAsPaid,
    getPendingOrders, sendInvoice
}