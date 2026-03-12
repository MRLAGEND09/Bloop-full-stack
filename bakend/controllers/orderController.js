import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from 'stripe'

const currency = '৳'
const deliveryCharge = 70

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Placing order using COD Method
const placeOrder = async (req, res) => {
  try {
    const { userId, items, address, amount, couponDiscount, couponCode } = req.body;

    // Calculate product discount
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
      date: Date.now()
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
      date: Date.now()
    }

    const newOrder = new orderModel(orderData)
    await newOrder.save()

    const line_items = items.map((item) => ({
      price_data: {
        currency: currency,
        product_data: {
          name: item.name
        },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.quantity
    }))

    line_items.push({
      price_data: {
        currency: currency,
        product_data: {
          name: 'Delivery Charges'
        },
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

export { verifyStripe, allOrders, placeOrder, placeOrderStripe, updateStatus, userOrders }