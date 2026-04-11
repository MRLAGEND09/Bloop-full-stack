import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: Array, required: true },
    category: { type: String, required: true },
    subCategory: { type: String, required: true },
    sizes: { type: Array, required: true },
    bestseller: { type: Boolean, default: false },
    discount: { type: Number, default: 0 },
    discountActive: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    date: { type: Number, required: true },

    // Collection tags
    collections: { 
        type: [String], 
        default: [],
        enum: ['latest', 'jacket', 'bloop', 'bestseller', 'boss', 'lacoste', 'ralph-lauren', '']
    },

    // Show in Collection page
    showInCollection: { type: Boolean, default: false },
})

const productModel = mongoose.models.product || mongoose.model("product", productSchema);

export default productModel