import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { bakendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { assets } from '../assets/assets';
import notificationSound from '../assets/notification.mp3'
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Orders = ({ token, setNewOrderCount }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([])
  const [bulkStatus, setBulkStatus] = useState('Shipped')
  const prevOrderCount = useRef(0)

  const fetchAllOrders = async () => {
    if (!token) return;
    try {
      const response = await axios.post(`${bakendUrl}/api/order/list`, {}, { headers: { token } });
      if (response.data.success) {
        const fetchedOrders = response.data.orders
        const currentCount = fetchedOrders.length
        if (prevOrderCount.current > 0 && currentCount > prevOrderCount.current) {
          const diff = currentCount - prevOrderCount.current
          setNewOrderCount && setNewOrderCount(prev => prev + diff)
          const audio = new Audio(notificationSound)
          audio.play().catch(() => {})
          toast.success(`🛍️ ${diff} new order received!`)
        }
        prevOrderCount.current = currentCount
        setOrders(fetchedOrders.reverse());
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const statusHandler = async (event, orderId) => {
    const selectedStatus = event.target.value;
    let cancelReasonInput = "";

    if (selectedStatus === "Cancelled") {
      cancelReasonInput = prompt("Enter cancellation reason:");
      if (!cancelReasonInput) {
        toast.error("Cancellation reason is required.");
        return;
      }
    }

    try {
      const response = await axios.post(`${bakendUrl}/api/order/status`, {
        orderId,
        status: selectedStatus,
        cancelReason: cancelReasonInput
      }, { headers: { token } });

      if (response.data.success) {
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId
              ? { ...order, status: selectedStatus, cancelReason: cancelReasonInput }
              : order
          )
        );
        toast.success("Order status updated successfully.");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const toggleSelectOrder = (orderId) => {
    setSelectedOrders(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    )
  }

  const selectAllOrders = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(orders.map(o => o._id))
    }
  }

  const bulkStatusUpdate = async () => {
    if (selectedOrders.length === 0) {
      toast.error('Please select at least one order!')
      return
    }

    try {
      await Promise.all(selectedOrders.map(orderId =>
        axios.post(`${bakendUrl}/api/order/status`, {
          orderId,
          status: bulkStatus,
          cancelReason: ''
        }, { headers: { token } })
      ))

      setOrders(prevOrders =>
        prevOrders.map(order =>
          selectedOrders.includes(order._id)
            ? { ...order, status: bulkStatus }
            : order
        )
      )
      setSelectedOrders([])
      toast.success(`${selectedOrders.length} orders updated to "${bulkStatus}"!`)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const generateBillPDF = (order) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text('BLOOP - Bill Voucher', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Order ID: ' + order._id, 20, 35);
    doc.text('Date: ' + new Date(order.date).toLocaleDateString(), 20, 45);

    // Customer Details
    doc.setFontSize(14);
    doc.text('Customer Details:', 20, 60);
    doc.setFontSize(10);
    doc.text('Name: ' + order.address.firstName + ' ' + order.address.lastName, 20, 70);
    doc.text('Address: ' + order.address.street + ', ' + order.address.city + ', ' + order.address.country + ', ' + order.address.zipcode, 20, 80);
    doc.text('Phone: ' + order.address.phone, 20, 90);
    doc.text('Email: ' + order.address.email, 20, 100);

    // Order Items Table
    const tableColumn = ["Item", "Size", "Quantity", "Price", "Total"];
    const tableRows = [];

    order.items.forEach(item => {
      const itemData = [
        item.name,
        item.size,
        item.quantity,
        currency + item.price,
        currency + (item.price * item.quantity)
      ];
      tableRows.push(itemData);
    });

    doc.autoTable(tableColumn, tableRows, { startY: 110 });

    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text('Subtotal: ' + currency + order.amount, 140, finalY);
    if (order.couponDiscount > 0) {
      doc.text('Coupon Discount: -' + currency + order.couponDiscount, 140, finalY + 10);
    }
    doc.setFontSize(12);
    doc.text('Total: ' + currency + (order.amount - (order.couponDiscount || 0)), 140, finalY + 20);

    // Payment Info
    doc.text('Payment Method: ' + order.paymentMethod, 20, finalY + 30);
    doc.text('Payment Status: ' + (order.payment ? 'Paid' : 'Pending'), 20, finalY + 40);
    doc.text('Order Status: ' + order.status, 20, finalY + 50);

    // Footer
    doc.setFontSize(8);
    doc.text('Thank you for shopping with BLOOP!', 105, finalY + 70, { align: 'center' });

    // Save the PDF
    doc.save(`Bill_Voucher_${order._id}.pdf`);
    toast.success('Bill PDF generated successfully!');
  }

  const markPaymentDone = async (orderId, order) => {
    try {
      const response = await axios.post(`${bakendUrl}/api/order/mark-paid`, { orderId }, { headers: { token } });
      if (response.data.success) {
        setOrders(prevOrders =>
          prevOrders.map(o =>
            o._id === orderId
              ? { ...o, payment: true }
              : o
          )
        );

        const sendTo = window.prompt('Send invoice to (type email or phone):', 'email');
        if (sendTo && (sendTo === 'email' || sendTo === 'phone')) {
          try {
            await axios.post(`${bakendUrl}/api/order/send-invoice`, { orderId, method: sendTo }, { headers: { token } })
            toast.success(`Invoice sent by ${sendTo} successfully!`)
          } catch (e) {
            toast.error('Invoice send failed: ' + e.message)
          }
        }

        toast.success("Payment marked as done!");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  }


  const getStatusColor = (status) => {
    switch (status) {
      case 'Order Placed': return 'text-yellow-500'
      case 'Shipped': return 'text-blue-500'
      case 'Out For Delivery': return 'text-orange-500'
      case 'Delivered': return 'text-green-500'
      case 'Cancelled': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  useEffect(() => {
    fetchAllOrders()
    const interval = setInterval(fetchAllOrders, 10000)
    return () => clearInterval(interval)
  }, [token]);

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-xl font-semibold'>Order Page</h3>
        <p className='text-sm text-gray-500'>Total Orders: <span className='font-bold text-black'>{orders.length}</span></p>
      </div>

      {/* Bulk Update Bar */}
      <div className='flex items-center gap-3 bg-gray-100 p-3 rounded mb-4'>
        <input
          type='checkbox'
          onChange={selectAllOrders}
          checked={selectedOrders.length === orders.length && orders.length > 0}
          className='w-4 h-4 cursor-pointer'
        />
        <p className='text-sm text-gray-600'>Select All ({selectedOrders.length} selected)</p>

        {selectedOrders.length > 0 && (
          <>
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className='p-2 text-sm border rounded'
            >
              <option value="Order Placed">Order Placed</option>
              <option value="Shipped">Shipped</option>
              <option value="Out For Delivery">Out For Delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
            <button
              onClick={bulkStatusUpdate}
              className='bg-black text-white text-sm px-4 py-2 rounded'
            >
              ✅ Update {selectedOrders.length} Orders
            </button>
            <button
              onClick={() => setSelectedOrders([])}
              className='bg-gray-400 text-white text-sm px-4 py-2 rounded'
            >
              Clear
            </button>
          </>
        )}
      </div>

      <div>
        {orders.map((order, index) => {
          // Calculate product discount
          const originalAmount = order.items.reduce((acc, item) => {
            return acc + (item.originalPrice || item.price) * item.quantity
          }, 0)
          const productDiscount = originalAmount - (order.amount + (order.couponDiscount || 0) + (order.deliveryCharge || 0))
          const hasProductDiscount = productDiscount > 0.5

          return (
            <div
              className={`grid grid-cols-1 sm:grid-cols-[0.3fr_0.5fr_2fr_1fr_1fr_1fr] gap-3 items-start border-2 p-5 md:p-8 my-3 md:my-4 text-xs sm:text-sm text-gray-700 ${selectedOrders.includes(order._id) ? 'border-black bg-gray-50' : 'border-gray-200'}`}
              key={index}
            >
              <input
                type='checkbox'
                checked={selectedOrders.includes(order._id)}
                onChange={() => toggleSelectOrder(order._id)}
                className='w-4 h-4 cursor-pointer mt-1'
              />
              <img className='w-12' src={assets.parcel_icon} alt="" />

              <div>
                <div>
                  {order.items.map((item, itemIndex) => (
                    <p className='py-0.5' key={itemIndex}>
                      {item.name} x {item.quantity} <span>{item.size}</span>
                      {item.discount > 0 && item.discountActive && (
                        <span className='ml-1 bg-red-100 text-red-500 text-xs px-1 rounded'>
                          {item.discount}% OFF
                        </span>
                      )}
                    </p>
                  ))}
                </div>
                <p className='mt-3 font-medium'>
                  {order.address.firstName + " " + order.address.lastName}
                </p>
                <div>
                  <p>{order.address.street + ","}</p>
                  <p>{order.address.city + ", " + order.address.country + ", " + order.address.zipcode}</p>
                </div>
                <p>{order.address.phone}</p>
                <p className='text-blue-500 mt-1'>
                  📧 {order.address.email}
                </p>
              </div>

              <div>
                <p className='text-sm sm:text-[15px]'>Items: {order.items.length}</p>
                <p className='mt-3'>Method: {order.paymentMethod}</p>
                <p>Payment: {order.payment ? 'Done' : 'Pending'}</p>
                {order.status !== 'Cancelled' && !order.payment && (
                  <button
                    onClick={() => markPaymentDone(order._id)}
                    className='bg-green-500 text-white text-xs px-2 py-1 rounded mt-1 hover:bg-green-600 flex items-center gap-1'
                  >
                    <i className='fas fa-receipt'></i>
                    Mark Paid
                  </button>
                )}
                <p>Date: {new Date(order.date).toLocaleDateString()}</p>
              </div>

              <div>
                <p className='text-sm sm:text-[15px] font-medium'>{currency}{order.amount}</p>
                {hasProductDiscount && (
                  <p className='text-red-500 text-xs mt-1'>
                     Product discount applied
                  </p>
                )}
                {order.couponDiscount > 0 && (
                  <p className='text-blue-500 text-xs mt-1'>
                     Coupon: -{currency}{order.couponDiscount}
                  </p>
                )}
                <p className={`text-xs mt-2 font-semibold ${getStatusColor(order.status)}`}>
                  ● {order.status}
                </p>
              </div>

              <div>
                <select
                  onChange={(event) => statusHandler(event, order._id)}
                  value={order.status || "Order Placed"}
                  className='p-2 font-semibold'
                >
                  <option value="Order Placed">Order Placed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Out For Delivery">Out For Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancel Order</option>
                </select>
                {order.status === "Cancelled" && order.cancelReason && (
                  <p className="text-gray-500 font-semibold mt-2">
                    Reason: {order.cancelReason}
                  </p>
                )}
                <div className='flex flex-wrap gap-2 mt-2'>
                  <button
                    onClick={() => navigate(`/order/${order._id}`)}
                    className='bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700'
                  >
                     View Details
                  </button>
                  <button
                    onClick={() => generateBillPDF(order)}
                    className='bg-blue-500 text-white text-xs px-3 py-1 rounded hover:bg-blue-600'
                  >
                    📋 PDF
                  </button>
                  {order.status !== 'Cancelled' && !order.payment && (
                    <button
                      onClick={() => markPaymentDone(order._id, order)}
                      className='bg-green-500 text-white text-xs px-3 py-1 rounded hover:bg-green-600 flex items-center gap-1'
                    >
                      <i className='fas fa-receipt'></i>
                      ✅ Mark Paid + Send Invoice
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default Orders;