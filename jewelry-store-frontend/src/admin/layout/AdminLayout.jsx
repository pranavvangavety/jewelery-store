import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import './AdminLayout.css'

const NAV_ITEMS = [
    { label: 'Dashboard',  path: '/admin'            },
    { label: 'Catalogue',  path: '/admin/catalogue'  },
    { label: 'Inventory',  path: '/admin/inventory'  },
    { label: 'Orders',     path: '/admin/orders'     },
]

export default function AdminLayout() {
    const { logout } = useAuth()
    const navigate   = useNavigate()

    function handleLogout() {
        logout()
        navigate('/login')
    }

    return (
        <div className="admin-shell">

            <aside className="admin-sidebar">

                <div className="admin-sidebar-top">
                    <p className="admin-sidebar-brand">Trinket Story</p>
                    <p className="admin-sidebar-role">Admin Console</p>
                </div>

                <nav className="admin-sidebar-nav">
                    {NAV_ITEMS.map(({ label, path }) => (
                        <NavLink
                            key={path}
                            to={path}
                            end={path === '/admin'}
                            className={({ isActive }) =>
                                isActive
                                    ? 'admin-nav-link admin-nav-link--active'
                                    : 'admin-nav-link'
                            }
                        >
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="admin-sidebar-bottom">
                    <NavLink to="/" className="admin-nav-link admin-nav-link--subtle">
                        ← Back to Store
                    </NavLink>
                    <button
                        className="admin-nav-link admin-nav-link--subtle admin-logout-btn"
                        onClick={handleLogout}
                    >
                        Sign Out
                    </button>
                </div>

            </aside>

            <main className="admin-main">
                <Outlet />
            </main>

        </div>
    )
}