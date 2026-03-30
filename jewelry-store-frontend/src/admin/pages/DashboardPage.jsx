import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    adminGetAllProducts,
    adminGetAllInventory,
    adminGetAllOrders,
} from '../../api/adminApi.js'
import './DashboardPage.css'

const LOW_STOCK_THRESHOLD = 5

export default function DashboardPage() {
    const navigate = useNavigate()

    const [stats,        setStats]        = useState(null)
    const [recentOrders, setRecentOrders] = useState([])
    const [lowStock,     setLowStock]     = useState([])
    const [loading,      setLoading]      = useState(true)
    const [error,        setError]        = useState(null)

    useEffect(() => {
        async function load() {
            try {
                const [productsRes, inventoryRes, ordersRes] = await Promise.all([
                    adminGetAllProducts(),
                    adminGetAllInventory(),
                    adminGetAllOrders(),
                ])

                const products  = productsRes.data
                const inventory = inventoryRes.data
                const orders    = ordersRes.data

                const activeProducts = products.filter(p => p.status === 'ACTIVE').length
                
                const ordersByStatus = orders.reduce((acc, o) => {
                    acc[o.orderStatus] = (acc[o.orderStatus] || 0) + 1
                    return acc
                }, {})

                setStats({
                    totalProducts:    products.length,
                    activeProducts,
                    inactiveProducts: products.length - activeProducts,
                    totalOrders:      orders.length,
                    pendingOrders:    ordersByStatus['PENDING']    || 0,
                    confirmedOrders:  ordersByStatus['CONFIRMED']  || 0,
                    shippedOrders:    ordersByStatus['SHIPPED']    || 0,
                    deliveredOrders:  ordersByStatus['DELIVERED']  || 0,
                })

                const sorted = [...orders].sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                )
                setRecentOrders(sorted.slice(0, 5))

                const low = inventory
                    .filter(item => item.availableQuantity <= LOW_STOCK_THRESHOLD)
                    .sort((a, b) => a.availableQuantity - b.availableQuantity)
                setLowStock(low)

            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load dashboard.')
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [])

    if (loading) return <div className="dash-loading">Loading dashboard…</div>
    if (error)   return <div className="dash-error">{error}</div>

    return (
        <div className="dash-page">

            <div className="dash-header">
                <p className="dash-eyebrow">Overview</p>
                <h1 className="dash-title">Dashboard</h1>
            </div>

            <section className="dash-stats">

                <div className="dash-stat-group">
                    <p className="dash-group-label">Products</p>
                    <div className="dash-stat-row">
                        <StatCard value={stats.totalProducts}    label="Total"    />
                        <StatCard value={stats.activeProducts}   label="Active"   accent />
                        <StatCard value={stats.inactiveProducts} label="Inactive" />
                    </div>
                </div>

                <div className="dash-stat-group">
                    <p className="dash-group-label">Orders</p>
                    <div className="dash-stat-row">
                        <StatCard value={stats.totalOrders}     label="Total"     />
                        <StatCard value={stats.pendingOrders}   label="Pending"   warn={stats.pendingOrders > 0} />
                        <StatCard value={stats.confirmedOrders} label="Confirmed" />
                        <StatCard value={stats.shippedOrders}   label="Shipped"   />
                        <StatCard value={stats.deliveredOrders} label="Delivered" accent />
                    </div>
                </div>

            </section>

            <div className="dash-lower">

                <section className="dash-panel">
                    <div className="dash-panel-header">
                        <p className="dash-panel-title">Recent Orders</p>
                        <button className="dash-panel-link" onClick={() => navigate('/admin/orders')}>
                            View all →
                        </button>
                    </div>
                    {recentOrders.length === 0 ? (
                        <p className="dash-empty">No orders yet.</p>
                    ) : (
                        <table className="dash-table">
                            <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Status</th>
                                <th>Total</th>
                            </tr>
                            </thead>
                            <tbody>
                            {recentOrders.map(order => (
                                <tr key={order.id}>
                                    <td className="dash-td-id">#{order.id}</td>
                                    <td>{order.firstName} {order.lastName}</td>
                                    <td>
                                            <span className={`dash-status dash-status--${order.orderStatus.toLowerCase()}`}>
                                                {order.orderStatus}
                                            </span>
                                    </td>
                                    <td>${Number(order.totalAmount).toFixed(2)}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </section>

                <section className="dash-panel">
                    <div className="dash-panel-header">
                        <p className="dash-panel-title">Low Stock</p>
                        <button className="dash-panel-link" onClick={() => navigate('/admin/inventory')}>
                            Manage →
                        </button>
                    </div>
                    {lowStock.length === 0 ? (
                        <p className="dash-empty">All items well stocked.</p>
                    ) : (
                        <table className="dash-table">
                            <thead>
                            <tr>
                                <th>Variant ID</th>
                                <th>Available</th>
                                <th>Reserved</th>
                            </tr>
                            </thead>
                            <tbody>
                            {lowStock.map(item => (
                                <tr key={item.variantId}>
                                    <td className="dash-td-id">#{item.variantId}</td>
                                    <td>
                                            <span className={`dash-stock ${item.availableQuantity === 0 ? 'dash-stock--zero' : 'dash-stock--low'}`}>
                                                {item.availableQuantity}
                                            </span>
                                    </td>
                                    <td>{item.reservedQuantity}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </section>

            </div>

        </div>
    )
}

function StatCard({ value, label, accent, warn }) {
    return (
        <div className={`dash-stat-card ${accent ? 'dash-stat-card--accent' : ''} ${warn ? 'dash-stat-card--warn' : ''}`}>
            <p className="dash-stat-value">{value}</p>
            <p className="dash-stat-label">{label}</p>
        </div>
    )
}