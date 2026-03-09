import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import {BrowserRouter, Route, Routes} from "react-router-dom";

function App() {

  return (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<div>Home Page</div>} />
            <Route path="/login" element={<div>Home Page</div>}/>
            <Route path="/register" element={<div>Register Page</div>}/>
            <Route path="/products" element={<div>Products Page</div>}/>
            <Route path="/cart" element={<div>Cart Page</div>}/>
        </Routes>
    </BrowserRouter>
  )
}

export default App
