import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from 'axios'

export const backendUrl = import.meta.env.VITE_BACKEND_URL
export const ShopContext = createContext();

const ShopContextProvider = (props) => {

    const currency = '৳';
    const delivery_fee = 70;
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [products, setProducts] = useState([]);
    const [token, setToken] = useState('');
    const [cartItems, setCartItems] = useState({});
    const [userInfo, setUserInfo] = useState(null);
    const [wishlist, setWishlist] = useState([]);
    const [isAuthLoaded, setIsAuthLoaded] = useState(false);

    const navigate = useNavigate();

    // ----- Add to cart -----
    const addToCart = async (itemId, size) => {
        if (!size) {
            toast.error('Select Product Size');
            return;
        }

        let cartData = structuredClone(cartItems);

        if (cartData[itemId]) {
            if (cartData[itemId][size]) {
                cartData[itemId][size] += 1;
            } else {
                cartData[itemId][size] = 1;
            }
        } else {
            cartData[itemId] = {};
            cartData[itemId][size] = 1;
        }
        setCartItems(cartData)
        toast.success('Item added to cart! 🛍️');

        if (token) {
            try {
                await axios.post(backendUrl + '/api/cart/add', { itemId, size }, { headers: { token } })
            } catch (error) {
                console.log(error);
                toast.error(error.message)
            }
        }
    }

    // ----- Get total cart count -----
    const getCartCount = () => {
        let totalCount = 0;
        for (const items in cartItems) {
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0) {
                        totalCount += cartItems[items][item];
                    }
                } catch (error) { }
            }
        }
        return totalCount;
    }

    // ----- Update product quantity -----
    const updateQuantity = async (itemId, size, quantity) => {
        let cartData = structuredClone(cartItems);
        cartData[itemId][size] = quantity;
        setCartItems(cartData);

        if (token) {
            try {
                await axios.post(backendUrl + '/api/cart/update', { itemId, size, quantity }, { headers: { token } })
            } catch (error) {
                console.log(error);
                toast.error(error.message)
            }
        }
    }

    // ----- Get product price (with discount) -----
    const getProductPrice = (product) => {
        if (product.discountActive && product.discount > 0) {
            return product.price - (product.price * product.discount / 100)
        }
        return product.price
    }

    // ----- Get total cart amount -----
    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items);
            for (const item in cartItems[items]) {
                try {
                    if (cartItems[items][item] > 0) {
                        const price = getProductPrice(itemInfo)
                        totalAmount += price * cartItems[items][item]
                    }
                } catch (error) { }
            }
        }
        return totalAmount;
    }

    // ----- Fetch products -----
    const getProductsData = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/product/list');
            if (response.data.success) {
                setProducts(response.data.Products);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // ----- Fetch user cart -----
    const getUserCart = async (token) => {
        try {
            const response = await axios.post(backendUrl + '/api/cart/get', {}, { headers: { token } })
            if (response.data.success) {
                setCartItems(response.data.cartData)
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message)
        }
    }

    // ----- Fetch user info -----
    const getUserInfo = async (token) => {
        try {
            const response = await axios.post(backendUrl + '/api/user/profile', {}, { headers: { token } })
            if (response.data.success) {
                setUserInfo(response.data.user)
            }
        } catch (error) {
            console.log(error)
        }
    }

    // ----- Wishlist functions -----
    const addToWishlist = async (productId) => {
        if (!token) {
            toast.error('Please login to add to wishlist')
            return
        }

        try {
            const response = await axios.post(backendUrl + '/api/wishlist/add', { productId }, { headers: { token } })
            if (response.data.success) {
                toast.success('Added to wishlist! ❤️')
                getUserWishlist()
            } else {
                toast.error(response.data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const removeFromWishlist = async (productId) => {
        try {
            const response = await axios.post(backendUrl + '/api/wishlist/remove', { productId }, { headers: { token } })
            if (response.data.success) {
                toast.success('Removed from wishlist')
                getUserWishlist()
            } else {
                toast.error(response.data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const getUserWishlist = async () => {
        if (!token) return
        try {
            const response = await axios.post(backendUrl + '/api/wishlist/get', {}, { headers: { token } })
            if (response.data.success) {
                setWishlist(response.data.wishlist)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const isInWishlist = (productId) => {
        return wishlist.some(item => item.productId._id === productId)
    }

    useEffect(() => {
        getProductsData()
    }, [])

    useEffect(() => {
        const existingToken = localStorage.getItem('token')
        if (existingToken) {
            setToken(existingToken)
            getUserCart(existingToken)
            getUserInfo(existingToken)
            getUserWishlist()
        }
        setIsAuthLoaded(true)
    }, [])

    useEffect(() => {
        if (token) {
            getUserInfo(token)
            getUserWishlist()
        }
    }, [token])

    const value = {
        products, currency, delivery_fee,
        search, setSearch, showSearch, setShowSearch,
        cartItems, addToCart, setCartItems,
        getCartCount, updateQuantity,
        getCartAmount, getProductPrice,
        navigate, backendUrl,
        setToken, token,
        userInfo, setUserInfo,
        wishlist, addToWishlist, removeFromWishlist, isInWishlist,
        isAuthLoaded
    }

    return (
        <ShopContext.Provider value={value}>
            {props.children}
        </ShopContext.Provider>
    )
}

export default ShopContextProvider;