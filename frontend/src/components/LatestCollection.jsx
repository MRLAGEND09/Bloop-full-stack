import React, { useContext, useEffect, useState } from 'react'
import Title from './Title'
import ProductItem from './ProductItem'
import { ShopContext } from '../context/ShopContext'

const LatestCollection = () => {
  const { products } = useContext(ShopContext)
  const [latestproducts, setlatestproducts] = useState([])

  useEffect(() => {
    if (products.length > 0) {
      // Latest collection tag দিয়ে filter করো, না থাকলে সর্বশেষ 10টা
      const tagged = products.filter(p => p.collections && p.collections.includes('latest'))
      if (tagged.length > 0) {
        setlatestproducts(tagged.slice(0, 10))
      } else {
        setlatestproducts(products.slice(0, 10))
      }
    }
  }, [products])

  return (
    <div className='my-10'>
      <div className='text-center py-8 text-3xl'>
        <Title text1={'LATEST'} text2={'COLLECTION'} />
        <p className='w-3/4 m-auto text-xs sm:text-base text-gray-600'>
          Step into Bloop’s latest collection — where modern style meets everyday confidence.
        </p>
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
        {latestproducts.map((item, index) => (
          <ProductItem
            key={index}
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

export default LatestCollection