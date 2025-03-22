import React from 'react'
import {Routes,Route} from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import SearchBar from './components/SearchBar.jsx'
import Footer from './components/Footer.jsx'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './Pages/Home.jsx'
import Collection from './Pages/Collection.jsx'
import Contact from './Pages/Contact.jsx'
import Login from './Pages/Login.jsx'
import About from './pages/About.jsx'
import Cart from './Pages/Cart.jsx'
import Order from './Pages/Order.jsx'
import Product from './Pages/Product.jsx'
import PlaceOrder from './Pages/PlaceOrder.jsx'
import Verify from './pages/Verify.jsx'
const App = () => {
  return (
    <div className='px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]'>
      <ToastContainer />
      <Navbar />
      <SearchBar />
      <Routes>
       <Route path='/' element={<Home/>} />
       <Route path='/collection' element={<Collection/>} />
       <Route path='/contact' element={<Contact/>} />
       <Route path='/login' element={<Login/>} />
       <Route path='/about' element={<About/>} />
       <Route path='/cart' element={<Cart/>} />
       <Route path='/order' element={<Order/>} />
       <Route path='/product/:productid' element={<Product/>} />
       <Route path='/place-order' element={<PlaceOrder/>} />
       <Route path='/verify' element={<Verify/>} />
      </Routes>
      <Footer/>

    </div>
  )
}

export default App
