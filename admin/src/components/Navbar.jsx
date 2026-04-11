import React from 'react'
import {assets} from '../assets/assets'



const Navbar = ({onLogout, adminName}) => {
  return (
    <div className='flex items-center py-2 px-[4%] justify-between'>
      <img className='w-[max(10%,80PX)]' src={assets.logo} alt="" />
      <div className='flex items-center gap-3'>
        {adminName && <p className='text-sm text-gray-600'>Logged in as: <span className='font-semibold'>{adminName}</span></p>}
        <button onClick={onLogout} className='bg-gray-600 text-white px-5 py-2 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm'>Logout</button>
      </div>
    </div>
  )
}

export default Navbar
