import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { bakendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import '@fortawesome/fontawesome-free/css/all.min.css'

const Dashboard = ({ token }) => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    totalSubscribers: 0,
  })

  const fetchStats = async () => {
    if (!token) return
    try {
      const ordersRes = await axios.post(`${bakendUrl}/api/order/list`, {}, { headers: { token } })
      if (ordersRes.data.success) {
        const orders = ordersRes.data.orders
        const totalOrders = orders.length
        const cancelledOrders = orders.filter(o => o.status === 'Cancelled').length
        const pendingOrders = orders.filter(o => o.status === 'Order Placed').length
        const deliveredOrders = orders.filter(o => o.status === 'Delivered').length
        const totalRevenue = orders.reduce((acc, o) => acc + o.amount, 0)

        setStats(prev => ({ ...prev, totalOrders, pendingOrders, deliveredOrders, cancelledOrders, totalRevenue }))
      }

      const subRes = await axios.get(`${bakendUrl}/api/subscriber/list`, { headers: { token } })
      if (subRes.data.success) {
        setStats(prev => ({ ...prev, totalSubscribers: subRes.data.subscribers.length }))
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [token])

  const cards = [
    { title: 'Total Orders', value: stats.totalOrders, bg: 'bg-blue-50', border: 'border-blue-300', icon: 'fas fa-shopping-bag', iconColor: 'text-blue-400' },
    { title: 'Pending Orders', value: stats.pendingOrders, bg: 'bg-yellow-50', border: 'border-yellow-300', icon: 'fas fa-clock', iconColor: 'text-yellow-400' },
    { title: 'Delivered Orders', value: stats.deliveredOrders, bg: 'bg-green-50', border: 'border-green-300', icon: 'fas fa-truck', iconColor: 'text-green-400' },
    { title: 'Cancelled Orders', value: stats.cancelledOrders, bg: 'bg-red-50', border: 'border-red-300', icon: 'fas fa-times-circle', iconColor: 'text-red-400' },
    { title: 'Total Revenue', value: `${currency}${stats.totalRevenue.toFixed(2)}`, bg: 'bg-purple-50', border: 'border-purple-300', icon: 'fas fa-money-bill-wave', iconColor: 'text-purple-400' },
    { title: 'Subscribers', value: stats.totalSubscribers, bg: 'bg-pink-50', border: 'border-pink-300', icon: 'fas fa-bell', iconColor: 'text-pink-400' },
  ]

  return (
    <div className='p-6'>
      <h2 className='text-2xl font-semibold mb-6'>
        <i className="fas fa-chart-line mr-2"></i> Dashboard
      </h2>

      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
        {cards.map((card, index) => (
          <div key={index} className={`${card.bg} border ${card.border} rounded-lg p-4 text-center`}>
            <i className={`${card.icon} ${card.iconColor} text-3xl mb-2`}></i>
            <p className='text-2xl font-bold mt-2'>{card.value}</p>
            <p className='text-sm text-gray-600 mt-1'>{card.title}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Dashboard