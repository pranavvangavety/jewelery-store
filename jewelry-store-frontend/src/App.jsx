import './App.css'
import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom"
import NavBar from "./components/NavBar.jsx"
import LoginPage from "./pages/LoginPage.jsx"
import RegisterPage from "./pages/RegisterPage.jsx"
import ProductsPage from "./pages/ProductsPage.jsx"
import ProductDetailsPage from "./pages/ProductDetailsPage.jsx"
import CartPage from "./pages/CartPage.jsx"
import CheckoutPage from "./pages/CheckoutPage.jsx"
import OrderConfirmationPage from "./pages/OrderConfirmationPage.jsx"
import OrderHistoryPage from "./pages/OrderHistory.jsx"
import HomePage from "./pages/HomePage.jsx"
import ProfilePage from "./pages/ProfilePage.jsx"
import AdminRoute from "./components/AdminRoute.jsx"
import AdminLayout from "./admin/layout/AdminLayout.jsx"
import DashboardPage from './admin/pages/DashboardPage.jsx'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<><NavBar /><Outlet /></>}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/products/:id" element={<ProductDetailsPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/orders/confirmation/:orderId" element={<OrderConfirmationPage />} />
                    <Route path="/orders/" element={<OrderHistoryPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                </Route>

                <Route path="/admin" element={
                    <AdminRoute>
                        <AdminLayout />
                    </AdminRoute>
                }>
                    <Route index element={<DashboardPage />} />
                    <Route path="products" element={<div>Products (coming soon)</div>} />
                    <Route path="categories" element={<div>Categories (coming soon)</div>} />
                    <Route path="inventory" element={<div>Inventory (coming soon)</div>} />
                    <Route path="orders" element={<div>Orders (coming soon)</div>} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App