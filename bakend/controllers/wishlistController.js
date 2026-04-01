import wishlistModel from "../models/wishlistModel.js";
import productModel from "../models/productModel.js";

// Add to wishlist
const addToWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        // Check if already in wishlist
        const existingItem = await wishlistModel.findOne({ userId, productId });
        if (existingItem) {
            return res.json({ success: false, message: "Product already in wishlist" });
        }

        const wishlistItem = new wishlistModel({
            userId,
            productId
        });

        await wishlistItem.save();
        res.json({ success: true, message: "Added to wishlist" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Remove from wishlist
const removeFromWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        await wishlistModel.findOneAndDelete({ userId, productId });
        res.json({ success: true, message: "Removed from wishlist" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get user's wishlist
const getUserWishlist = async (req, res) => {
    try {
        const { userId } = req.body;
        const wishlistItems = await wishlistModel.find({ userId }).populate('productId');
        res.json({ success: true, wishlist: wishlistItems });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Check if product is in wishlist
const checkWishlist = async (req, res) => {
    try {
        const { userId, productId } = req.body;
        const item = await wishlistModel.findOne({ userId, productId });
        res.json({ success: true, inWishlist: !!item });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { addToWishlist, removeFromWishlist, getUserWishlist, checkWishlist };