import React, { useContext, useEffect, useState } from 'react'
import Title from './Title'
import ProductItem from './ProductItem'
import { ShopContext } from '../context/ShopContext'

const BestSeller = () => {
  const { products } = useContext(ShopContext)
  const [bestseller, setBestSeller] = useState([])

  useEffect(() => {
    if (products.length > 0) {
      // Bestseller collection tag দিয়ে filter করো, না থাকলে bestseller flag দিয়ে
      const tagged = products.filter(p => p.collections && p.collections.includes('bestseller'))
      if (tagged.length > 0) {
        setBestSeller(tagged.slice(0, 5))
      } else {
        const byFlag = products.filter(item => item.bestseller)
        setBestSeller(byFlag.slice(0, 5))
      }
    }
  }, [products])

  return (
    <div className='my-10'>
      <div className='text-center text-3xl py-8'>
        <Title text1={'BEST'} text2={'SELLER'} />
        <p className='w-3/4 m-auto text-xs sm:text-base text-gray-600'>
          Our signature pieces — trusted by fashion-forward individuals.
        </p>
      </div>
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
        {bestseller.map((item, index) => (
          <ProductItem
            key={item._id || index}
            id={item._id}
            image={item.image}
            name={item.name}
            price={item.price}
            discount={item.discount}
            discountActive={item.discountActive}
          />
        ))}
      </div>
    </div>
  )
}

export default BestSeller