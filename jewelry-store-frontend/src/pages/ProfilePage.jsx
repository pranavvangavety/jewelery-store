import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext.jsx"
import { useNavigate } from "react-router-dom"
import {
    getMyProfile,
    updateProfile,
    addAddress,
    deleteAddress,
    setDefaultAddress, updateAddress,
} from "../api/userApi.js"
import "./ProfilePage.css"
import {changePassword} from "../api/authApi.js";

export default function ProfilePage() {
    const { user, setCurrentUser } = useAuth()
    const navigate = useNavigate()

    const [profile, setProfile] = useState(null)
    const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '' })
    const [profileLoading, setProfileLoading] = useState(false)
    const [profileSuccess, setProfileSuccess] = useState(false)
    const [profileError, setProfileError] = useState(null)

    const [showAddressForm, setShowAddressForm] = useState(false)
    const [addressForm, setAddressForm] = useState({
        street: '', city: '', state: '', zipCode: '', country: ''
    })
    const [addressLoading, setAddressLoading] = useState(false)
    const [addressError, setAddressError] = useState(null)
    const [editingAddressId, setEditingAddressId] = useState(null)
    const [editForm, setEditForm] = useState({ street: '', city: '', state: '', zipCode: '', country: '' })
    const [editLoading, setEditLoading] = useState(false)
    const [editError, setEditError] = useState(null)

    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
    const [passwordLoading, setPasswordLoading] = useState(false)
    const [passwordError, setPasswordError] = useState(null)
    const [passwordSuccess, setPasswordSuccess] = useState(false)
    const [visible, setVisible] = useState({ currentPassword: false, newPassword: false, confirmPassword: false })
    const [showPasswordForm, setShowPasswordForm] = useState(false)

    useEffect(() => {
        if (!user) {
            navigate('/login')
            return
        }
        fetchProfile()
    }, [user])

    const fetchProfile = async () => {
        try {
            const res = await getMyProfile()
            const p = res.data
            setProfile(p)
            setProfileForm({
                firstName: p.firstName || '',
                lastName: p.lastName || '',
                phone: p.phone || '',
            })
        } catch (err) {
            // nothing
        }
    }

    const handleProfileChange = (e) => {
        setProfileForm({ ...profileForm, [e.target.name]: e.target.value })
    }

    const handleProfileSubmit = async (e) => {
        e.preventDefault()
        setProfileLoading(true)
        setProfileError(null)
        setProfileSuccess(false)
        try {
            const res = await updateProfile(profileForm)
            setProfile(res.data)
            setCurrentUser({ ...user, firstName: profileForm.firstName })
            setProfileSuccess(true)
            setTimeout(() => setProfileSuccess(false), 3000)
        } catch (err) {
            setProfileError(err.response?.data?.message || 'Failed to update profile. Please try again.')
        } finally {
            setProfileLoading(false)
        }
    }

    const handleAddressChange = (e) => {
        setAddressForm({ ...addressForm, [e.target.name]: e.target.value })
    }

    const handleAddAddress = async (e) => {
        e.preventDefault()
        setAddressLoading(true)
        setAddressError(null)
        try {
            await addAddress({
                ...addressForm,
                defaultAddress: profile?.addresses?.length === 0,
            })
            setAddressForm({ street: '', city: '', state: '', zipCode: '', country: '' })
            setShowAddressForm(false)
            await fetchProfile()
        } catch (err) {
            setAddressError(err.response?.data?.message || 'Failed to add address.')
        } finally {
            setAddressLoading(false)
        }
    }

    const handleDeleteAddress = async (addressId) => {
        try {
            await deleteAddress(addressId)
            await fetchProfile()
        } catch (err) {
            // nothing
        }
    }

    const handleSetDefault = async (addressId) => {
        try {
            await setDefaultAddress(addressId)
            await fetchProfile()
        } catch (err) {
            //nothing
        }
    }

    const handleEditClick = (addr) => {
        setEditingAddressId(addr.id)
        setEditForm({
            street: addr.street,
            city: addr.city,
            state: addr.state,
            zipCode: addr.zipCode,
            country: addr.country,
        })
        setEditError(null)
    }

    const handleEditChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value })
    }

    const handleEditSubmit = async (e, addressId) => {
        e.preventDefault()
        setEditLoading(true)
        setEditError(null)
        try {
            await updateAddress(addressId, editForm)
            setEditingAddressId(null)
            await fetchProfile()
        } catch (err) {
            setEditError(err.response?.data?.message || 'Failed to update address.')
        } finally {
            setEditLoading(false)
        }
    }

    const handlePasswordChange = (e) => {
        setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value })
    }
    const toggleVisible = (field) => setVisible(v => ({ ...v, [field]: !v[field] }))

    const handlePasswordSubmit = async (e) => {
        e.preventDefault()
        setPasswordError(null)
        setPasswordSuccess(false)

        if (passwordForm.newPassword.length < 8) {
            setPasswordError('New password must be at least 8 characters')
            return
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('Passwords do not match')
            return
        }

        setPasswordLoading(true)
        try {
            await changePassword(passwordForm.currentPassword, passwordForm.newPassword)
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
            setShowPasswordForm(false)
            setPasswordSuccess(true)
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'Failed to change password. Please try again.')
        } finally {
            setPasswordLoading(false)
        }
    }

    if (!profile) {
        return (
            <div className="profile-loading">
                <p className="profile-loading-text">Loading profile…</p>
            </div>
        )
    }

    return (
        <div className="profile-page">

            <div className="profile-header">
                <p className="profile-eyebrow">Account</p>
                <h1 className="profile-title">My Profile</h1>
                <p className="profile-email">{profile.email}</p>
            </div>

            <div className="profile-body">

                <section className="profile-section">
                    <h2 className="profile-section-title">Personal Information</h2>

                    <form className="profile-form" onSubmit={handleProfileSubmit}>
                        <div className="profile-name-row">
                            <div className="profile-field">
                                <label className="profile-label">First Name</label>
                                <input
                                    className="profile-input"
                                    name="firstName"
                                    value={profileForm.firstName}
                                    onChange={handleProfileChange}
                                    placeholder="First name"
                                />
                            </div>
                            <div className="profile-field">
                                <label className="profile-label">Last Name</label>
                                <input
                                    className="profile-input"
                                    name="lastName"
                                    value={profileForm.lastName}
                                    onChange={handleProfileChange}
                                    placeholder="Last name"
                                />
                            </div>
                        </div>

                        <div className="profile-field">
                            <label className="profile-label">Email</label>
                            <input
                                className="profile-input profile-input--disabled"
                                value={profile.email}
                                disabled
                            />
                        </div>

                        <div className="profile-field">
                            <label className="profile-label">Phone</label>
                            <input
                                className="profile-input"
                                name="phone"
                                value={profileForm.phone}
                                onChange={handleProfileChange}
                                placeholder="Phone number"
                            />
                        </div>

                        {profileError && <p className="profile-error">{profileError}</p>}
                        {profileSuccess && <p className="profile-success">Profile updated successfully.</p>}

                        <button
                            type="submit"
                            className="profile-save-btn"
                            disabled={profileLoading}
                        >
                            {profileLoading ? 'Saving…' : 'Save Changes'}
                        </button>
                    </form>
                </section>

                <section className="profile-section">
                    <div className="profile-section-header">
                        <h2 className="profile-section-title">Saved Addresses</h2>
                        <button
                            className="profile-add-btn"
                            onClick={() => setShowAddressForm(v => !v)}
                        >
                            {showAddressForm ? 'Cancel' : '+ Add Address'}
                        </button>
                    </div>

                    {showAddressForm && (
                        <form className="address-form" onSubmit={handleAddAddress}>
                            <input
                                className="profile-input"
                                name="street"
                                value={addressForm.street}
                                onChange={handleAddressChange}
                                placeholder="Street address"
                                required
                            />
                            <div className="address-city-row">
                                <input
                                    className="profile-input"
                                    name="city"
                                    value={addressForm.city}
                                    onChange={handleAddressChange}
                                    placeholder="City"
                                    required
                                />
                                <input
                                    className="profile-input"
                                    name="state"
                                    value={addressForm.state}
                                    onChange={handleAddressChange}
                                    placeholder="State"
                                    required
                                />
                            </div>
                            <div className="address-city-row">
                                <input
                                    className="profile-input"
                                    name="zipCode"
                                    value={addressForm.zipCode}
                                    onChange={handleAddressChange}
                                    placeholder="ZIP code"
                                    required
                                />
                                <input
                                    className="profile-input"
                                    name="country"
                                    value={addressForm.country}
                                    onChange={handleAddressChange}
                                    placeholder="Country"
                                    required
                                />
                            </div>
                            {addressError && <p className="profile-error">{addressError}</p>}
                            <button
                                type="submit"
                                className="profile-save-btn"
                                disabled={addressLoading}
                            >
                                {addressLoading ? 'Saving…' : 'Save Address'}
                            </button>
                        </form>
                    )}

                    {profile.addresses?.length === 0 && !showAddressForm && (
                        <p className="profile-empty">No saved addresses yet.</p>
                    )}

                    <div className="address-list">
                        {profile.addresses?.map(addr => (
                            <div key={addr.id} className={`address-card ${addr.defaultAddress ? 'address-card--default' : ''}`}>

                                {editingAddressId === addr.id ? (
                                    <form className="address-edit-form" onSubmit={(e) => handleEditSubmit(e, addr.id)}>
                                        <input
                                            className="profile-input"
                                            name="street"
                                            value={editForm.street}
                                            onChange={handleEditChange}
                                            placeholder="Street address"
                                            required
                                        />
                                        <div className="address-city-row">
                                            <input
                                                className="profile-input"
                                                name="city"
                                                value={editForm.city}
                                                onChange={handleEditChange}
                                                placeholder="City"
                                                required
                                            />
                                            <input
                                                className="profile-input"
                                                name="state"
                                                value={editForm.state}
                                                onChange={handleEditChange}
                                                placeholder="State"
                                                required
                                            />
                                        </div>
                                        <div className="address-city-row">
                                            <input
                                                className="profile-input"
                                                name="zipCode"
                                                value={editForm.zipCode}
                                                onChange={handleEditChange}
                                                placeholder="ZIP code"
                                                required
                                            />
                                            <input
                                                className="profile-input"
                                                name="country"
                                                value={editForm.country}
                                                onChange={handleEditChange}
                                                placeholder="Country"
                                                required
                                            />
                                        </div>
                                        {editError && <p className="profile-error">{editError}</p>}
                                        <div className="address-actions">
                                            <button type="submit" className="address-action-btn" disabled={editLoading}>
                                                {editLoading ? 'Saving…' : 'Save'}
                                            </button>
                                            <button
                                                type="button"
                                                className="address-action-btn"
                                                onClick={() => setEditingAddressId(null)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        {addr.defaultAddress && (
                                            <span className="address-default-badge">Default</span>
                                        )}
                                        <p className="address-street">{addr.street}</p>
                                        <p className="address-line">{addr.city}, {addr.state} {addr.zipCode}</p>
                                        <p className="address-line">{addr.country}</p>

                                        <div className="address-actions">
                                            <button
                                                className="address-action-btn"
                                                onClick={() => handleEditClick(addr)}
                                            >
                                                Edit
                                            </button>
                                            {!addr.defaultAddress && (
                                                <button
                                                    className="address-action-btn"
                                                    onClick={() => handleSetDefault(addr.id)}
                                                >
                                                    Set as Default
                                                </button>
                                            )}
                                            <button
                                                className="address-action-btn address-action-btn--delete"
                                                onClick={() => handleDeleteAddress(addr.id)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                <section className="profile-section">
                    <div className="profile-section-header">
                        <button
                            className="profile-add-btn"
                            onClick={() => {
                                setShowPasswordForm(v => !v)
                                setPasswordError(null)
                                setPasswordSuccess(false)
                                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                            }}
                        >
                            {showPasswordForm ? 'Cancel' : 'Change Password'}
                        </button>
                    </div>

                    {passwordSuccess && <p className="profile-success">Password changed successfully.</p>}


                    {showPasswordForm && (
                        <form className="profile-form" onSubmit={handlePasswordSubmit}>
                            <div className="profile-field">
                                <label className="profile-label">Current Password</label>
                                <div className="profile-password-wrap">
                                    <input
                                        className="profile-input"
                                        type={visible.currentPassword ? 'text' : 'password'}
                                        name="currentPassword"
                                        value={passwordForm.currentPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Current password"
                                        required
                                    />
                                    <button type="button" className="profile-show-btn" onClick={() => toggleVisible('currentPassword')}>
                                        {visible.currentPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>

                            <div className="profile-field">
                                <label className="profile-label">New Password</label>
                                <div className="profile-password-wrap">
                                    <input
                                        className="profile-input"
                                        type={visible.newPassword ? 'text' : 'password'}
                                        name="newPassword"
                                        value={passwordForm.newPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="New password"
                                        required
                                    />
                                    <button type="button" className="profile-show-btn" onClick={() => toggleVisible('newPassword')}>
                                        {visible.newPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>

                            <div className="profile-field">
                                <label className="profile-label">Confirm New Password</label>
                                <div className="profile-password-wrap">
                                    <input
                                        className="profile-input"
                                        type={visible.confirmPassword ? 'text' : 'password'}
                                        name="confirmPassword"
                                        value={passwordForm.confirmPassword}
                                        onChange={handlePasswordChange}
                                        placeholder="Confirm new password"
                                        required
                                    />
                                    <button type="button" className="profile-show-btn" onClick={() => toggleVisible('confirmPassword')}>
                                        {visible.confirmPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>

                            {passwordError && <p className="profile-error">{passwordError}</p>}

                            <button
                                type="submit"
                                className="profile-save-btn"
                                disabled={passwordLoading}
                            >
                                {passwordLoading ? 'Saving…' : 'Change Password'}
                            </button>
                        </form>
                    )}
                </section>

            </div>
        </div>
    )
}