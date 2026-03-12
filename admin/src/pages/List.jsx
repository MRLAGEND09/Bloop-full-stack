import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { bakendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import '@fortawesome/fontawesome-free/css/all.min.css'

const List = ({ token }) => {

  const [list, setList] = useState([]);

  const fetchList = async () => {
    try {
      const response = await axios.get(bakendUrl + '/api/product/list');
      if (response.data.success) {
        setList(response.data.Products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const removeProduct = async (id) => {
    try {
      const response = await axios.post(bakendUrl + '/api/product/remove', { id }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        await fetchList();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  }

  const toggleDiscount = async (item) => {
    try {
      const response = await axios.post(bakendUrl + '/api/product/update-discount', {
        productId: item._id,
        discount: item.discount || 0,
        discountActive: !item.discountActive
      }, { headers: { token } })

      if (response.data.success) {
        toast.success(`Discount ${!item.discountActive ? 'activated' : 'deactivated'}!`)
        await fetchList()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const updateDiscountValue = async (item, newDiscount) => {
    try {
      const response = await axios.post(bakendUrl + '/api/product/update-discount', {
        productId: item._id,
        discount: Number(newDiscount),
        discountActive: item.discountActive
      }, { headers: { token } })

      if (response.data.success) {
        toast.success('Discount updated!')
        await fetchList()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchList();
  }, [])

  return (
    <>
      <p className='mb-2'>All Products List</p>
      <div className='flex flex-col gap-2'>

        {/* Table Header */}
        <div className='hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm'>
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Discount %</b>
          <b>Discount</b>
          <b className='text-center'>Action</b>
        </div>

        {/* Product List */}
        {list.map((item, index) => (
          <div className='grid grid-cols-[1fr_3fr_1fr] md:grid-cols-[1fr_3fr_1fr_1fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm gap-2' key={index}>
            <img className='w-12' src={item.image[0]} alt="" />
            <p>{item.name}</p>
            <p>{item.category}</p>
            <div>
              <p>{currency}{item.price}</p>
              {item.discountActive && item.discount > 0 && (
                <p className='text-green-600 text-xs'>
                  {currency}{(item.price - (item.price * item.discount / 100)).toFixed(2)}
                </p>
              )}
            </div>

            {/* Discount % Input */}
            <div className='flex items-center gap-1'>
              <input
                type='number'
                min='0'
                max='100'
                defaultValue={item.discount || 0}
                className='w-16 px-2 py-1 border text-xs'
                onBlur={(e) => {
                  if (Number(e.target.value) !== item.discount) {
                    updateDiscountValue(item, e.target.value)
                  }
                }}
              />
              <span className='text-xs'>%</span>
            </div>

            {/* Discount Toggle */}
            <div className='flex items-center gap-2'>
              <div
                onClick={() => toggleDiscount(item)}
                className={`w-10 h-5 rounded-full cursor-pointer transition-all ${item.discountActive ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-all ${item.discountActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
              {item.discountActive && item.discount > 0 && (
                <span className='bg-red-500 text-white text-xs px-1 py-0.5 rounded'>{item.discount}% OFF</span>
              )}
            </div>

            <p onClick={() => removeProduct(item._id)} className='text-right md:text-center cursor-pointer text-lg text-red-500'>
              <i className='fas fa-trash'></i>
            </p>
          </div>
        ))}
      </div>
    </>
  )
}

export default List