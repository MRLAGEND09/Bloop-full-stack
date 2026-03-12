import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { bakendUrl } from '../App'
import { toast } from 'react-toastify'

const Subscribers = ({ token }) => {
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchSubscribers = async () => {
    try {
      const res = await axios.get(`${bakendUrl}/api/subscriber/list`, { headers: { token } })
      if (res.data.success) {
        setSubscribers(res.data.subscribers)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const sendManualCoupon = async (email) => {
    setLoading(true)
    try {
      const res = await axios.post(`${bakendUrl}/api/subscriber/manual-coupon`, { email }, { headers: { token } })
      if (res.data.success) {
        toast.success('New coupon sent to ' + email)
        fetchSubscribers()
      } else {
        toast.error(res.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSubscribers()
  }, [token])

  const getStatus = (subscriber) => {
    if (subscriber.isUsed) return { label: 'Used', color: 'text-gray-400' }
    if (new Date() > new Date(subscriber.expiresAt)) return { label: 'Expired', color: 'text-red-500' }
    return { label: 'Active', color: 'text-green-500' }
  }

  return (
    <div className='p-6'>
      <h2 className='text-2xl font-semibold mb-6'>Subscribers ({subscribers.length})</h2>

      <div className='overflow-x-auto'>
        <table className='w-full text-sm text-left border'>
          <thead className='bg-gray-100'>
            <tr>
              <th className='px-4 py-3'>#</th>
              <th className='px-4 py-3'>Email</th>
              <th className='px-4 py-3'>Coupon Code</th>
              <th className='px-4 py-3'>Status</th>
              <th className='px-4 py-3'>Expires At</th>
              <th className='px-4 py-3'>Action</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map((sub, index) => {
              const status = getStatus(sub)
              return (
                <tr key={index} className='border-t hover:bg-gray-50'>
                  <td className='px-4 py-3'>{index + 1}</td>
                  <td className='px-4 py-3'>{sub.email}</td>
                  <td className='px-4 py-3 font-mono font-bold'>{sub.couponCode}</td>
                  <td className={`px-4 py-3 font-semibold ${status.color}`}>{status.label}</td>
                  <td className='px-4 py-3'>{new Date(sub.expiresAt).toDateString()}</td>
                  <td className='px-4 py-3'>
                    <button
                      onClick={() => sendManualCoupon(sub.email)}
                      disabled={loading}
                      className='bg-black text-white text-xs px-4 py-2 hover:bg-gray-800'
                    >
                      Send New Coupon
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {subscribers.length === 0 && (
          <p className='text-center text-gray-400 mt-10'>No subscribers yet!</p>
        )}
      </div>
    </div>
  )
}

export default Subscribers