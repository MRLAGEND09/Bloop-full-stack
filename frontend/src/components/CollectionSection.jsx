import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import ProductItem from './ProductItem'
import Title from './Title'
import { Link } from 'react-router-dom'

const CollectionSection = ({ collectionKey, title1, title2 }) => {
  const { products } = useContext(ShopContext)
  const [items, setItems] = useState([])

  useEffect(() => {
    if (products.length > 0) {
      const filtered = products.filter(p =>
        p.collections && p.collections.includes(collectionKey)
      )
      setItems(filtered.slice(0, 5))
    }
  }, [products, collectionKey])

  if (items.length === 0) return null

  return (
    <div className='my-10'>
      <div className='text-center text-3xl py-8'>
        <Title text1={title1} text2={title2} />
        <p className='w-3/4 m-auto text-xs sm:text-base text-gray-600'>
          Explore our exclusive {title1} {title2} — handpicked just for you.
        </p>
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6'>
        {items.map((item) => (
          <ProductItem
            key={item._id}
            id={item._id}
            image={item.image}
            name={item.name}
            price={item.price}
            discount={item.discount}
            discountActive={item.discountActive}
          />
        ))}
      </div>

      <div className='text-center mt-6'>
        <Link
          to={`/collection?collection=${collectionKey}`}
          className='inline-block border border-black px-8 py-2 text-sm hover:bg-black hover:text-white transition'
        >
          View All
        </Link>
      </div>
    </div>
  )
}

export default CollectionSection