import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext.jsx"
import { useNavigate } from "react-router-dom"
import {
    getMyProfile,
    updateProfile,
    addAddress,
    deleteAddress,
    setDefaultAddress,
} from "../api/userApi.js"
import "./ProfilePage.css"

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
                                {addr.defaultAddress && (
                                    <span className="address-default-badge">Default</span>
                                )}
                                <p className="address-street">{addr.street}</p>
                                <p className="address-line">{addr.city}, {addr.state} {addr.zipCode}</p>
                                <p className="address-line">{addr.country}</p>

                                <div className="address-actions">
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
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    )
}