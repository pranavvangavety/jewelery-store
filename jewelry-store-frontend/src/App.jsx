import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import {BrowserRouter, Route, Routes} from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import ProductDetailsPage from "./pages/ProductDetailsPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import OrderConfirmationPage from "./pages/OrderConfirmationPage.jsx";
import OrderHistoryPage from "./pages/OrderHistory.jsx";
import HomePage from "./pages/HomePage.jsx";

function App() {

  return (
    <BrowserRouter>
        <NavBar/>
        <Routes>
            <Route path="/" element={<HomePage/>} />
            <Route path="/login" element={<LoginPage/>}/>
            <Route path="/register" element={<RegisterPage/>}/>
            <Route path="/products" element={<ProductsPage/>}/>
            <Route path="/products/:id" element={<ProductDetailsPage/>}/>
            <Route path="/cart" element={<CartPage/>}/>
            <Route path="/checkout" element={<CheckoutPage/>}/>
            <Route path="/orders/confirmation/:orderId" element={<OrderConfirmationPage/>}/>
            <Route path="/orders/" element={<OrderHistoryPage/>}/>
        </Routes>
    </BrowserRouter>
  )
}

export default App
