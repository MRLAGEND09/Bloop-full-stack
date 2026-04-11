import userModel from "../models/userModel.js";

const MAX_CART_QTY = 20



// add product to  user cart
const addTocart = async (req, res) => {
    try {
        
        const {userId, itemId, size} = req.body;

        if (!userId || !itemId || !size) {
            return res.json({success: false, message: "Missing required cart fields"})
        }

        const userData = await userModel.findById(userId);
        if (!userData) {
            return res.json({success: false, message: "User not found"})
        }
        let  cartData = await userData.cartData;

      if (cartData[itemId]) {
        if (cartData[itemId][size]) {
            cartData[itemId][size]  += 1
        }
        else {
            cartData[itemId][size] = 1
        }
      }
      else {
        cartData[itemId] = {}
        cartData[itemId][size] = 1
      }

      await userModel.findByIdAndUpdate(userId, {cartData})


      res.json({success: true, message: "Added to cart"})

    } catch (error) {
        console.log(error);
        res.json({success: false,message: error.message})
    }
}

// update  user cart
const updatecart = async (req, res) => {
    try {
        
        const {userId, itemId,size, quantity } = req.body;

        if (!userId || !itemId || !size) {
            return res.json({success: false, message: "Missing required cart fields"})
        }

        const parsedQty = Number(quantity)
        if (!Number.isInteger(parsedQty) || parsedQty < 0 || parsedQty > MAX_CART_QTY) {
            return res.json({success: false, message: "Invalid quantity"})
        }

        const userData = await userModel.findById(userId);
        if (!userData) {
            return res.json({success: false, message: "User not found"})
        }
        let  cartData = await userData.cartData;

        if (!cartData[itemId] || !Object.prototype.hasOwnProperty.call(cartData[itemId], size)) {
            return res.json({success: false, message: "Cart item not found"})
        }

        cartData[itemId][size] = parsedQty

        await userModel.findByIdAndUpdate(userId, {cartData})

        res.json({success: true, message: "Cart Updated"})

    } catch (error) {
        console.log(error);
        res.json({success: false,message: error.message})
    }
}

// get user cart data
const getUserCart = async (req, res) => {
    
    try {
         
        const {userId} = req.body;

        if (!userId) {
            return res.json({success: false, message: "Missing userId"})
        }

        const userData = await userModel.findById(userId);
        if (!userData) {
            return res.json({success: false, message: "User not found"})
        }
        let  cartData = await userData.cartData;

        res.json({success: true, cartData});

    } catch (error) {
        console.log(error);
        res.json({success: false,message: error.message})
    }
}


export { addTocart, updatecart,getUserCart}