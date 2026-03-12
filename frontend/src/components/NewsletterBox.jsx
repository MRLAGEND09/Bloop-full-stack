import React, { useState, useContext } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { ShopContext } from '../context/ShopContext'

const NewsletterBox = () => {
  const { backendUrl } = useContext(ShopContext)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      const response = await axios.post(backendUrl + '/api/subscriber/subscribe', { email })
      if (response.data.success) {
        toast.success(response.data.message)
        setEmail('')
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error('Something went wrong!')
    }
    setLoading(false)
  }

  return (
    <div className='text-center mt-10'>
      <p className='text-2xl font-medium text-gray-800'>Subscribe Now & 20% Off</p>
      <p className='text-gray-400 mt-3'>Subscribe and get 20% off on your 2nd order!</p>

      <form onSubmit={onSubmitHandler} className='w-full sm:w-1/2 flex items-center gap-3 mx-auto my-6 border pl-3'>
        <input
          className='w-full sm:flex-1 outline-none'
          type="email"
          placeholder='Enter your email'
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type='submit'
          disabled={loading}
          className='bg-black text-white text-xs px-10 py-4'
        >
          {loading ? 'Loading...' : 'SUBSCRIBE'}
        </button>
      </form>
    </div>
  )
}

export default NewsletterBox