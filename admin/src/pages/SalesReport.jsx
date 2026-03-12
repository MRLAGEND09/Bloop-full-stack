import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { bakendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line }  from 'recharts'

const SalesReport = ({ token }) => {
  const [orders, setOrders] = useState([])
  const [view, setView] = useState('daily')
  const [reportType, setReportType] = useState('sales')

  const fetchOrders = async () => {
    try {
      const res = await axios.post(`${bakendUrl}/api/order/list`, {}, { headers: { token } })
      if (res.data.success) {
        setOrders(res.data.orders)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [token])

  const activeOrders = orders.filter(o => o.status !== 'Cancelled')
  const cancelledOrders = orders.filter(o => o.status === 'Cancelled')
  const totalRevenue = activeOrders.reduce((acc, o) => acc + o.amount, 0)
  const cancelledRevenue = cancelledOrders.reduce((acc, o) => acc + o.amount, 0)

  const getDateKey = (date, view) => {
    if (view === 'daily') return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (view === 'weekly') {
      const now = new Date()
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
      const weekNum = Math.floor(diffDays / 7)
      return weekNum < 4 ? `Week ${4 - weekNum}` : null
    }
    if (view === 'monthly') return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    if (view === 'yearly') return date.getFullYear().toString()
    return null
  }

  const getEmptyData = () => {
    if (view === 'daily') {
      const data = {}
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        data[key] = { date: key, value: 0 }
      }
      return data
    }
    if (view === 'weekly') {
      const data = {}
      for (let i = 1; i <= 4; i++) {
        data[`Week ${i}`] = { date: `Week ${i}`, value: 0 }
      }
      return data
    }
    if (view === 'monthly') {
      const data = {}
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        data[key] = { date: key, value: 0 }
      }
      return data
    }
    if (view === 'yearly') {
      const data = {}
      for (let i = 2; i >= 0; i--) {
        const year = (new Date().getFullYear() - i).toString()
        data[year] = { date: year, value: 0 }
      }
      return data
    }
    return {}
  }

  const getData = () => {
    const data = getEmptyData()
    const sourceOrders = reportType === 'sales' ? activeOrders : cancelledOrders

    sourceOrders.forEach(order => {
      const date = new Date(order.date)
      const key = getDateKey(date, view)
      if (key && data[key]) {
        data[key].value += reportType === 'sales' ? order.amount : 1
      }
    })

    return Object.values(data)
  }

  return (
    <div className='p-6'>
      <h2 className='text-2xl font-semibold mb-6'>
        <i className="fas fa-chart-bar mr-2"></i> Sales Report
      </h2>

      {/* Summary Cards */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
        <div className='bg-blue-50 border border-blue-300 rounded-lg p-4 text-center'>
          <p className='text-2xl font-bold'>{orders.length}</p>
          <p className='text-sm text-gray-600'>Total Orders</p>
        </div>
        <div className='bg-green-50 border border-green-300 rounded-lg p-4 text-center'>
          <p className='text-2xl font-bold'>{activeOrders.length}</p>
          <p className='text-sm text-gray-600'>Active Orders</p>
        </div>
        <div className='bg-red-50 border border-red-300 rounded-lg p-4 text-center'>
          <p className='text-2xl font-bold'>{cancelledOrders.length}</p>
          <p className='text-sm text-gray-600'>Cancelled Orders</p>
        </div>
        <div className='bg-purple-50 border border-purple-300 rounded-lg p-4 text-center'>
          <p className='text-2xl font-bold'>{currency}{totalRevenue.toFixed(2)}</p>
          <p className='text-sm text-gray-600'>Net Revenue</p>
        </div>
      </div>

      {/* Lost Revenue */}
      <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center justify-between'>
        <div>
          <p className='text-sm text-gray-600'>Lost Revenue (Cancelled)</p>
          <p className='text-xl font-bold text-red-500'>- {currency}{cancelledRevenue.toFixed(2)}</p>
        </div>
        <i className='fas fa-times-circle text-red-400 text-3xl'></i>
      </div>

      {/* Report Type Toggle */}
      <div className='flex gap-2 mb-4'>
        <button
          onClick={() => setReportType('sales')}
          className={`px-4 py-2 text-sm rounded ${reportType === 'sales' ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}
        >
          <i className='fas fa-chart-line mr-1'></i> Sales Report
        </button>
        <button
          onClick={() => setReportType('cancellation')}
          className={`px-4 py-2 text-sm rounded ${reportType === 'cancellation' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`}
        >
          <i className='fas fa-times-circle mr-1'></i> Cancellation Report
        </button>
      </div>

      {/* View Toggle */}
      <div className='flex gap-2 mb-6'>
        {['daily', 'weekly', 'monthly', 'yearly'].map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 text-sm capitalize rounded ${view === v ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className='bg-white border rounded-lg p-4 mb-6'>
        <h3 className='text-lg font-medium mb-4'>
          {reportType === 'sales' ? 'Revenue' : 'Cancelled Orders'}
          {' — '}
          <span className='capitalize'>{view}</span>
        </h3>
        <ResponsiveContainer width='100%' height={300}>
          <BarChart data={getData()}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='date' tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => reportType === 'sales' ? `${currency}${value.toFixed(2)}` : `${value} orders`} />
            <Legend />
            <Bar
              dataKey='value'
              fill={reportType === 'sales' ? '#8884d8' : '#ef4444'}
              name={reportType === 'sales' ? 'Revenue' : 'Cancelled Orders'}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cancelled Orders List */}
      {reportType === 'cancellation' && (
        <div className='bg-white border rounded-lg p-4'>
          <h3 className='text-lg font-medium mb-4'>Cancelled Orders List</h3>
          <table className='w-full text-sm'>
            <thead className='bg-gray-100'>
              <tr>
                <th className='px-4 py-2 text-left'>#</th>
                <th className='px-4 py-2 text-left'>Customer</th>
                <th className='px-4 py-2 text-left'>Amount</th>
                <th className='px-4 py-2 text-left'>Date</th>
                <th className='px-4 py-2 text-left'>Reason</th>
              </tr>
            </thead>
            <tbody>
              {cancelledOrders.map((order, index) => (
                <tr key={index} className='border-t'>
                  <td className='px-4 py-2'>{index + 1}</td>
                  <td className='px-4 py-2'>{order.address.firstName} {order.address.lastName}</td>
                  <td className='px-4 py-2 text-red-500'>- {currency}{order.amount}</td>
                  <td className='px-4 py-2'>{new Date(order.date).toLocaleDateString()}</td>
                  <td className='px-4 py-2 text-gray-500'>{order.cancelReason || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {cancelledOrders.length === 0 && (
            <p className='text-center text-gray-400 mt-4'>No cancelled orders!</p>
          )}
        </div>
      )}
    </div>
  )
}

export default SalesReport