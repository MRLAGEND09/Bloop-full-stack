import React, { useContext } from 'react'
import { ShopContext } from '../context/ShopContext'
import { Link } from 'react-router-dom'

const ProductItem = ({ id, image, name, price, discount, discountActive }) => {
  const { currency } = useContext(ShopContext)

  const discountedPrice = discountActive && discount > 0
    ? (price - (price * discount / 100)).toFixed(2)
    : null

  return (
    <Link className='text-gray-700 cursor-pointer' to={`/product/${id}`}>
      <div className='overflow-hidden relative'>
        <img
          className='hover:scale-110 transition ease-in-out'
          src={image[0]}
          alt={name}
        />
        {discountActive && discount > 0 && (
          <span className='absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded'>
            {discount}% OFF
          </span>
        )}
      </div>
      <p className='pt-3 pb-1 text-sm'>{name}</p>
      {discountedPrice ? (
        <div className='flex items-center gap-2'>
          <p className='text-sm font-medium text-red-500'>{currency}{discountedPrice}</p>
          <p className='text-xs text-gray-400 line-through'>{currency}{price}</p>
        </div>
      ) : (
        <p className='text-sm font-medium'>{currency}{price}</p>
      )}
    </Link>
  )
}

export default ProductItem