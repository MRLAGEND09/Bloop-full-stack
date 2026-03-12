import React, { useContext } from 'react'
import Titel from './Title'
import { ShopContext } from '../context/ShopContext'

const CartTotal = ({ discount = 0 }) => {
  const { currency, delivery_fee, getCartAmount } = useContext(ShopContext)

  const subtotal = getCartAmount()
  const cartWithDelivery = subtotal === 0 ? 0 : subtotal + delivery_fee
  const discountAmount = (cartWithDelivery * discount / 100)
  const total = cartWithDelivery - discountAmount

  return (
    <div className='w-full'>
      <div className='text-2xl'>
        <Titel text1={'CART'} text2={'TOTAL'} />
      </div>

      <div className='flex flex-col gap-2 mt-2 text-sm'>
        <div className='flex justify-between'>
          <p>Subtotal</p>
          <p>{currency} {subtotal}.00</p>
        </div>
        <hr />
        <div className='flex justify-between'>
          <p>Shipping Fee</p>
          <p>{currency} {subtotal === 0 ? 0 : delivery_fee}.00</p>
        </div>
        <hr />
        {discount > 0 && (
          <div className='flex justify-between text-green-500'>
            <p>Discount ({discount}%)</p>
            <p>- {currency} {discountAmount.toFixed(2)}</p>
          </div>
        )}
        {discount > 0 && <hr />}
        <div className='flex justify-between'>
          <b>Total</b>
          <b>{currency} {total.toFixed(2)}</b>
        </div>
      </div>
    </div>
  )
}

export default CartTotal