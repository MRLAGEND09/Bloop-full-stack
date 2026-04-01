import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const wishlistModel = mongoose.models.wishlist || mongoose.model("wishlist", wishlistSchema);

export default wishlistModel;