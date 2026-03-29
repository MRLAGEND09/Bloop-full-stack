import abandonedCartModel from '../models/abandonedCartModel.js'

const saveAbandonedCart = async (req, res) => {
    try {
        const { userId, items, amount } = req.body
        await abandonedCartModel.findOneAndUpdate(
            { userId },
            { userId, items, amount, createdAt: Date.now(), status: 'abandoned' },
            { upsert: true, new: true }
        )
        res.json({ success: true })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

const clearAbandonedCart = async (req, res) => {
    try {
        const { userId } = req.body
        await abandonedCartModel.findOneAndDelete({ userId })
        res.json({ success: true })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

const getAbandonedCarts = async (req, res) => {
    try {
        const carts = await abandonedCartModel.find({ status: 'abandoned' }).sort({ createdAt: -1 })
        res.json({ success: true, carts })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export { saveAbandonedCart, clearAbandonedCart, getAbandonedCarts }