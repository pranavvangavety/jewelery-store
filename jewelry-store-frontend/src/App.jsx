import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import {BrowserRouter, Route, Routes} from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";

function App() {

  return (
    <BrowserRouter>
        <NavBar/>
        <Routes>
            <Route path="/" element={<div>Home Page</div>} />
            <Route path="/login" element={<LoginPage/>}/>
            <Route path="/register" element={<RegisterPage/>}/>
            <Route path="/products" element={<ProductsPage/>}/>
            <Route path="/cart" element={<div>Cart Page</div>}/>
        </Routes>
    </BrowserRouter>
  )
}

export default App
