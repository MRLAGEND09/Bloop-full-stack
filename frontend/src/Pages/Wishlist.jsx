import React, { useContext, useEffect } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title'
import ProductItem from '../components/ProductItem'

const Wishlist = () => {
  const { wishlist, token, navigate } = useContext(ShopContext)

  useEffect(() => {
    if (!token) {
      navigate('/login')
    }
  }, [token, navigate])

  if (!token) {
    return null
  }

  return (
    <div className='border-t pt-16'>
      <div className='text-2xl mb-3'>
        <Title text1={'MY'} text2={'WISHLIST'} />
      </div>

      {wishlist.length === 0 ? (
        <div className='text-center py-20'>
          <p className='text-gray-500 text-lg'>Your wishlist is empty</p>
          <p className='text-gray-400 mt-2'>Add items you love to your wishlist!</p>
        </div>
      ) : (
        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
          {wishlist.map((item) => (
            <ProductItem
              key={item._id}
              id={item.productId._id}
              image={item.productId.image}
              name={item.productId.name}
              price={item.productId.price}
              discount={item.productId.discount}
              discountActive={item.productId.discountActive}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Wishlist