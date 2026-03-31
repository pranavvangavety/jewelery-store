import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    adminGetProductById,
    adminGetAllCategories,
    adminCreateProduct,
    adminUpdateProduct,
    adminAddVariant,
    adminDeleteVariant,
    adminAddImage,
    adminDeleteImage, adminUpdateVariant,
} from '../../api/adminApi.js'
import './ProductFormPage.css'

const MATERIALS = ['GOLD', 'SILVER', 'PLATINUM', 'ROSE_GOLD', 'WHITE_GOLD', 'PLASTIC']

const EMPTY_VARIANT = { sku: '', color: '', size: '', price: '', images: [] }
const EMPTY_IMAGE   = { url: '', altText: '', displayOrder: 1, primary: false }

export default function ProductFormPage() {
    const { id }   = useParams()
    const navigate = useNavigate()
    const isEdit   = Boolean(id)

    const [step, setStep]       = useState(1)
    const [loading, setLoading] = useState(isEdit)
    const [saving, setSaving]   = useState(false)
    const [error, setError]     = useState(null)

    // Categories for the dropdown
    const [categories, setCategories] = useState([])

    // Step 1
    const [details, setDetails] = useState({
        name: '', description: '', material: 'GOLD', categoryId: ''
    })

    // Step 2 — Variants (local state for new ones)
    // In edit mode, existingVariants holds what's already saved
    const [existingVariants, setExistingVariants] = useState([])
    const [newVariants, setNewVariants]           = useState([{ ...EMPTY_VARIANT, images: [] }])

    const [savedProductId, setSavedProductId] = useState(isEdit ? Number(id) : null)

    useEffect(() => {
        async function load() {
            try {
                const [catsRes, ...rest] = await Promise.all([
                    adminGetAllCategories(),
                    ...(isEdit ? [adminGetProductById(id)] : []),
                ])
                setCategories(catsRes.data)

                if (isEdit && rest[0]) {
                    const p = rest[0].data
                    setDetails({
                        name:        p.name,
                        description: p.description || '',
                        material:    p.material,
                        categoryId:  String(p.category.id),
                    })
                    setExistingVariants(p.variants || [])
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load product.')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    function handleDetailsChange(e) {
        setDetails(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    function handleVariantChange(index, field, value) {
        setNewVariants(prev => prev.map((v, i) =>
            i === index ? { ...v, [field]: value } : v
        ))
    }

    function handleExistingVariantChange(variantId, field, value) {
        setExistingVariants(prev => prev.map(v =>
            v.id === variantId ? { ...v, [field]: value } : v
        ))
    }

    function addVariantRow() {
        setNewVariants(prev => [...prev, { ...EMPTY_VARIANT, images: [] }])
    }

    function removeVariantRow(index) {
        setNewVariants(prev => prev.filter((_, i) => i !== index))
    }

    function handleImageChange(variantIndex, imageIndex, field, value) {
        setNewVariants(prev => prev.map((v, vi) => {
            if (vi !== variantIndex) return v
            const images = v.images.map((img, ii) =>
                ii === imageIndex ? { ...img, [field]: value } : img
            )
            return { ...v, images }
        }))
    }

    async function handleAddImageToExisting(variantId) {
        setExistingVariants(prev => prev.map(v =>
            v.id === variantId
                ? { ...v, _newImages: [...(v._newImages || []), { url: '', altText: '' }] }
                : v
        ))
    }

    function handleExistingNewImageChange(variantId, index, field, value) {
        setExistingVariants(prev => prev.map(v => {
            if (v.id !== variantId) return v
            const imgs = (v._newImages || []).map((img, i) =>
                i === index ? { ...img, [field]: value } : img
            )
            return { ...v, _newImages: imgs }
        }))
    }

    async function handleSaveNewImageToExisting(variantId, index) {
        const variant = existingVariants.find(v => v.id === variantId)
        const img = variant._newImages[index]
        if (!img.url) return
        try {
            const res = await adminAddImage(savedProductId, {
                variantId,
                url:          img.url,
                altText:      img.altText || '',
                displayOrder: (variant.images?.length || 0) + 1,
                primary:      (variant.images?.length || 0) === 0,
            })
            // Update existingVariants with the new image from the response
            const updatedVariant = res.data.variants.find(v => v.id === variantId)
            setExistingVariants(prev => prev.map(v => {
                if (v.id !== variantId) return v
                const newImgs = (v._newImages || []).filter((_, i) => i !== index)
                return { ...updatedVariant, _newImages: newImgs }
            }))
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add image.')
        }
    }

    function addImageRow(variantIndex) {
        setNewVariants(prev => prev.map((v, vi) => {
            if (vi !== variantIndex) return v
            return { ...v, images: [...v.images, { ...EMPTY_IMAGE, displayOrder: v.images.length + 1 }] }
        }))
    }

    function removeImageRow(variantIndex, imageIndex) {
        setNewVariants(prev => prev.map((v, vi) => {
            if (vi !== variantIndex) return v
            return { ...v, images: v.images.filter((_, ii) => ii !== imageIndex) }
        }))
    }

    // Delete variant
    async function handleDeleteExistingVariant(variantId) {
        if (!confirm('Delete this variant? This cannot be undone.')) return
        if (existingVariants.length === 1) {
            alert('A product must have at least one variant.')
            return
        }
        try {
            await adminDeleteVariant(savedProductId, variantId)
            setExistingVariants(prev => prev.filter(v => v.id !== variantId))
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete variant.')
        }
    }

    // ── Delete image
    async function handleDeleteExistingImage(imageId) {
        if (!confirm('Delete this image?')) return
        try {
            await adminDeleteImage(savedProductId, imageId)
            setExistingVariants(prev => prev.map(v => ({
                ...v,
                images: v.images.filter(img => img.id !== imageId)
            })))
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete image.')
        }
    }

    function goNext() { setStep(s => s + 1) }
    function goBack() { setStep(s => s - 1) }

    async function handleSubmit() {
        setSaving(true)
        setError(null)
        try {
            let productId = savedProductId

            if (isEdit) {
                await adminUpdateProduct(productId, {
                    name:        details.name,
                    description: details.description,
                    material:    details.material,
                    categoryId:  Number(details.categoryId),
                    variants:    existingVariants.map(v => ({
                        sku: v.sku, color: v.color, size: v.size, price: v.price
                    })),
                })

                for (const v of existingVariants) {
                    await adminUpdateVariant(productId, v.id, {
                        sku:   v.sku,
                        price: Number(v.price),
                        color: v.color || '',
                        size:  v.size  || '',
                    })
                }
            } else {
                // Create product with first variant
                const res = await adminCreateProduct({
                    name:        details.name,
                    description: details.description,
                    material:    details.material,
                    categoryId:  Number(details.categoryId),
                    variants:    newVariants.map(v => ({
                        sku: v.sku, color: v.color, size: v.size,
                        price: parseFloat(v.price),
                    })),
                })
                productId = res.data.id
                setSavedProductId(productId)

                // res.data.variants are in the same order as newVariants
                const savedVariants = res.data.variants
                for (let vi = 0; vi < newVariants.length; vi++) {
                    const variantId = savedVariants[vi]?.id
                    if (!variantId) continue
                    const images = newVariants[vi].images
                    for (let ii = 0; ii < images.length; ii++) {
                        const img = images[ii]
                        if (!img.url) continue
                        await adminAddImage(productId, {
                            variantId,
                            url:          img.url,
                            altText:      img.altText,
                            displayOrder: ii + 1,
                            primary:      ii === 0,
                        })
                    }
                }
            }

            // In edit mode: add new variants + their images
            if (isEdit) {
                const filledVariants = newVariants.filter(v => v.sku)
                for (const v of filledVariants) {
                    const variantRes = await adminAddVariant(productId, {
                        sku: v.sku, color: v.color, size: v.size,
                        price: parseFloat(v.price),
                    })
                    const newVariantId = variantRes.data.variants.find(
                        sv => sv.sku === v.sku
                    )?.id
                    if (!newVariantId) continue
                    for (let ii = 0; ii < v.images.length; ii++) {
                        const img = v.images[ii]
                        if (!img.url) continue
                        await adminAddImage(productId, {
                            variantId:    newVariantId,
                            url:          img.url,
                            altText:      img.altText,
                            displayOrder: ii + 1,
                            primary:      ii === 0,
                        })
                    }
                }
            }

            navigate('/admin/catalogue')

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save product.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="pf-loading">Loading…</div>

    return (
        <div className="pf-page">

            <div className="pf-header">
                <p className="pf-eyebrow">Admin</p>
                <h1 className="pf-title">{isEdit ? 'Edit Product' : 'New Product'}</h1>
            </div>

            <div className="pf-stepper">
                {['Details', 'Variants', 'Review'].map((label, i) => {
                    const n = i + 1
                    return (
                        <div key={label} className="pf-step-item">
                            <div className={`pf-step-circle ${step === n ? 'pf-step-circle--active' : ''} ${step > n ? 'pf-step-circle--done' : ''}`}>
                                {step > n ? '✓' : n}
                            </div>
                            <span className={`pf-step-label ${step === n ? 'pf-step-label--active' : ''}`}>
                                {label}
                            </span>
                            {i < 2 && <div className="pf-step-line" />}
                        </div>
                    )
                })}
            </div>

            {error && <p className="pf-error">{error}</p>}

            {step === 1 && (
                <div className="pf-card">
                    <p className="pf-card-title">Product Details</p>

                    <div className="pf-field">
                        <label className="pf-label">Name *</label>
                        <input
                            className="pf-input"
                            name="name"
                            value={details.name}
                            onChange={handleDetailsChange}
                            placeholder="e.g. Diamond Solitaire Ring"
                        />
                    </div>

                    <div className="pf-field">
                        <label className="pf-label">Description</label>
                        <textarea
                            className="pf-input pf-textarea"
                            name="description"
                            value={details.description}
                            onChange={handleDetailsChange}
                            placeholder="Product description…"
                            rows={4}
                        />
                    </div>

                    <div className="pf-row">
                        <div className="pf-field">
                            <label className="pf-label">Material *</label>
                            <select
                                className="pf-input pf-select"
                                name="material"
                                value={details.material}
                                onChange={handleDetailsChange}
                            >
                                {MATERIALS.map(m => (
                                    <option key={m} value={m}>{m.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </div>

                        <div className="pf-field">
                            <label className="pf-label">Category *</label>
                            <select
                                className="pf-input pf-select"
                                name="categoryId"
                                value={details.categoryId}
                                onChange={handleDetailsChange}
                            >
                                <option value="">Select category…</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pf-actions">
                        <button
                            className="pf-btn-secondary"
                            onClick={() => navigate('/admin/catalogue')}
                        >
                            Cancel
                        </button>
                        <button
                            className="pf-btn-primary"
                            onClick={goNext}
                            disabled={!details.name || !details.categoryId}
                        >
                            Next: Variants →
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="pf-card">
                    <p className="pf-card-title">Variants</p>

                    {isEdit && existingVariants.length > 0 && (
                        <div className="pf-existing-section">
                            <p className="pf-existing-label">Existing Variants</p>
                            {existingVariants.map(v => (
                                <div key={v.id} className="pf-existing-variant">

                                    <div className="pf-row">
                                        <div className="pf-field">
                                            <label className="pf-label">SKU *</label>
                                            <input
                                                className="pf-input"
                                                value={v.sku}
                                                onChange={e => handleExistingVariantChange(v.id, 'sku', e.target.value)}
                                            />
                                        </div>
                                        <div className="pf-field">
                                            <label className="pf-label">Price *</label>
                                            <input
                                                className="pf-input"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={v.price}
                                                onChange={e => handleExistingVariantChange(v.id, 'price', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="pf-row">
                                        <div className="pf-field">
                                            <label className="pf-label">Color</label>
                                            <input
                                                className="pf-input"
                                                value={v.color || ''}
                                                onChange={e => handleExistingVariantChange(v.id, 'color', e.target.value)}
                                            />
                                        </div>
                                        <div className="pf-field">
                                            <label className="pf-label">Size</label>
                                            <input
                                                className="pf-input"
                                                value={v.size || ''}
                                                onChange={e => handleExistingVariantChange(v.id, 'size', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="pf-images-section">
                                        <p className="pf-images-label">Images</p>
                                        {v.images?.map(img => (
                                            <div key={img.id} className="pf-existing-image-row">
                                                <span className="pf-existing-url" title={img.url}>
                                                    {img.url.length > 50 ? img.url.slice(0, 50) + '…' : img.url}
                                                </span>
                                                {img.primary && <span className="pf-primary-badge">Primary</span>}
                                                <button
                                                    className="pf-delete-btn"
                                                    onClick={() => handleDeleteExistingImage(img.id)}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}

                                        {/* Pending new images for this existing variant */}
                                        {(v._newImages || []).map((img, ii) => (
                                            <div key={ii} className="pf-image-row">
                                                <input
                                                    className="pf-input pf-input--url"
                                                    value={img.url}
                                                    onChange={e => handleExistingNewImageChange(v.id, ii, 'url', e.target.value)}
                                                    placeholder="Image URL"
                                                />
                                                <input
                                                    className="pf-input pf-input--alt"
                                                    value={img.altText}
                                                    onChange={e => handleExistingNewImageChange(v.id, ii, 'altText', e.target.value)}
                                                    placeholder="Alt text"
                                                />
                                                <button
                                                    className="pf-add-image-btn"
                                                    style={{ border: '1px solid var(--gold)', color: 'var(--gold)' }}
                                                    onClick={() => handleSaveNewImageToExisting(v.id, ii)}
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        ))}

                                        <button
                                            className="pf-add-image-btn"
                                            onClick={() => handleAddImageToExisting(v.id)}
                                        >
                                            + Add Image
                                        </button>
                                    </div>

                                    <button
                                        className="pf-delete-btn pf-delete-btn--variant"
                                        onClick={() => handleDeleteExistingVariant(v.id)}
                                    >
                                        Delete Variant
                                    </button>

                                </div>
                            ))}
                        </div>
                    )}

                    <p className="pf-existing-label">
                        {isEdit ? 'Add New Variants' : 'Variants'}
                    </p>

                    {newVariants.map((variant, vi) => (
                        <div key={vi} className="pf-variant-block">
                            <div className="pf-variant-block-header">
                                <span className="pf-variant-block-title">Variant {vi + 1}</span>
                                {newVariants.length > 1 && (
                                    <button
                                        className="pf-delete-btn"
                                        onClick={() => removeVariantRow(vi)}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>

                            <div className="pf-row">
                                <div className="pf-field">
                                    <label className="pf-label">SKU *</label>
                                    <input
                                        className="pf-input"
                                        value={variant.sku}
                                        onChange={e => handleVariantChange(vi, 'sku', e.target.value)}
                                        placeholder="e.g. RING-GOLD-7"
                                    />
                                </div>
                                <div className="pf-field">
                                    <label className="pf-label">Price *</label>
                                    <input
                                        className="pf-input"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={variant.price}
                                        onChange={e => handleVariantChange(vi, 'price', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="pf-row">
                                <div className="pf-field">
                                    <label className="pf-label">Color</label>
                                    <input
                                        className="pf-input"
                                        value={variant.color}
                                        onChange={e => handleVariantChange(vi, 'color', e.target.value)}
                                        placeholder="e.g. Yellow Gold"
                                    />
                                </div>
                                <div className="pf-field">
                                    <label className="pf-label">Size</label>
                                    <input
                                        className="pf-input"
                                        value={variant.size}
                                        onChange={e => handleVariantChange(vi, 'size', e.target.value)}
                                        placeholder="e.g. 7"
                                    />
                                </div>
                            </div>

                            <div className="pf-images-section">
                                <p className="pf-images-label">Images</p>
                                {variant.images.map((img, ii) => (
                                    <div key={ii} className="pf-image-row">
                                        <input
                                            className="pf-input pf-input--url"
                                            value={img.url}
                                            onChange={e => handleImageChange(vi, ii, 'url', e.target.value)}
                                            placeholder="Image URL"
                                        />
                                        <input
                                            className="pf-input pf-input--alt"
                                            value={img.altText}
                                            onChange={e => handleImageChange(vi, ii, 'altText', e.target.value)}
                                            placeholder="Alt text"
                                        />
                                        <button
                                            className="pf-delete-btn"
                                            onClick={() => removeImageRow(vi, ii)}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                <button
                                    className="pf-add-image-btn"
                                    onClick={() => addImageRow(vi)}
                                >
                                    + Add Image
                                </button>
                            </div>
                        </div>
                    ))}

                    <button className="pf-add-variant-btn" onClick={addVariantRow}>
                        + Add Another Variant
                    </button>

                    <div className="pf-actions">
                        <button className="pf-btn-secondary" onClick={goBack}>← Back</button>
                        <button
                            className="pf-btn-primary"
                            onClick={goNext}
                            disabled={newVariants.some(v => !v.sku || !v.price) && !isEdit}
                        >
                            Next: Review →
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="pf-card">
                    <p className="pf-card-title">Review</p>

                    <div className="pf-review-section">
                        <p className="pf-review-heading">Details</p>
                        <div className="pf-review-grid">
                            <span className="pf-review-key">Name</span>
                            <span className="pf-review-val">{details.name}</span>
                            <span className="pf-review-key">Material</span>
                            <span className="pf-review-val">{details.material.replace('_', ' ')}</span>
                            <span className="pf-review-key">Category</span>
                            <span className="pf-review-val">
                                {categories.find(c => String(c.id) === String(details.categoryId))?.name}
                            </span>
                            {details.description && (
                                <>
                                    <span className="pf-review-key">Description</span>
                                    <span className="pf-review-val">{details.description}</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="pf-review-section">
                        <p className="pf-review-heading">
                            {isEdit ? 'New Variants to Add' : 'Variants'}
                        </p>
                        {newVariants.filter(v => v.sku).map((v, i) => (
                            <div key={i} className="pf-review-variant">
                                <span className="pf-review-sku">{v.sku}</span>
                                <span className="pf-review-meta">
                                    {[v.color, v.size, `$${v.price}`].filter(Boolean).join(' · ')}
                                </span>
                                <span className="pf-review-meta">
                                    {v.images.filter(img => img.url).length} image(s)
                                </span>
                            </div>
                        ))}
                        {newVariants.filter(v => v.sku).length === 0 && (
                            <p className="pf-review-empty">No new variants to add.</p>
                        )}
                    </div>

                    <div className="pf-actions">
                        <button className="pf-btn-secondary" onClick={goBack}>← Back</button>
                        <button
                            className="pf-btn-primary"
                            onClick={handleSubmit}
                            disabled={saving}
                        >
                            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
                        </button>
                    </div>
                </div>
            )}

        </div>
    )
}