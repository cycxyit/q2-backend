import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Product {
    id?: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    imageUrl: string;
    images?: string; // JSON string of URL array
}

const MAX_IMAGES = 10;

const AdminProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [form, setForm] = useState<Product>({ name: '', description: '', price: 0, stock: 0, imageUrl: '' });
    const [imageUrls, setImageUrls] = useState<string[]>([]); // holds the uploaded URLs
    const [editingId, setEditingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [newImageUrl, setNewImageUrl] = useState('');

    useEffect(() => { fetchProducts(); }, []);

    const fetchProducts = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/products');
            setProducts(res.data);
            setError(null);
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Unknown error';
            setError(`❌ 无法加载产品列表: ${msg}`);
        }
    };

    const removeImageSlot = (index: number) => {
        setImageUrls(imageUrls.filter((_, i) => i !== index));
    };

    const handleAddUrl = () => {
        if (!newImageUrl.trim()) return;
        if (imageUrls.length >= MAX_IMAGES) {
            setError(`⚠️ 最多只能添加 ${MAX_IMAGES} 张图片`);
            return;
        }
        setImageUrls(prev => [...prev, newImageUrl.trim()]);
        setNewImageUrl('');
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const payload = {
            ...form,
            imageUrl: form.imageUrl || (imageUrls[0] || ''),
            images: imageUrls,
        };
        console.log('[Frontend Submit Payload]', payload);

        try {
            if (editingId) {
                await axios.put(`http://localhost:5000/api/products/${editingId}`, payload, { headers });
                setSuccessMsg(`✅ 产品已更新！`);
            } else {
                const res = await axios.post('http://localhost:5000/api/products', payload, { headers });
                setSuccessMsg(`✅ 产品 "${res.data.name}" (ID: ${res.data.id}) 新增成功！`);
            }
            resetForm();
            await fetchProducts();
        } catch (err: any) {
            const serverMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Unknown error';
            setError(`❌ 操作失败: ${serverMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({ name: '', description: '', price: 0, stock: 0, imageUrl: '' });
        setImageUrls([]);
        setNewImageUrl('');
        setEditingId(null);
        setError(null);
        setSuccessMsg(null);
    };

    const editProduct = (p: Product) => {
        setForm(p);
        try {
            const parsed = p.images ? JSON.parse(p.images) : [];
            // If parsed is empty but p.imageUrl exists, populate it as the first image
            if (parsed.length === 0 && p.imageUrl) {
                setImageUrls([p.imageUrl]);
            } else {
                setImageUrls(parsed);
            }
        } catch {
            setImageUrls(p.imageUrl ? [p.imageUrl] : []);
        }
        setEditingId(p.id!);
        setError(null);
        setSuccessMsg(null);
    };

    const deleteProduct = async (id: number) => {
        if (!window.confirm('确定要删除这个产品吗？')) return;
        try {
            await axios.delete(`http://localhost:5000/api/products/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            await fetchProducts();
        } catch (err: any) {
            setError(`❌ 删除失败: ${err?.response?.data?.message || err?.message}`);
        }
    };

    const inputStyle = { padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', width: '100%', boxSizing: 'border-box' as const };
    const [loading, setLoading] = useState(false);

    return (
        <div className="fade-in">
            <h1 style={{ marginBottom: '2rem' }}>Manage Products</h1>

            {error && (
                <div style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)', color: '#991B1B', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                    {error}
                </div>
            )}
            {successMsg && (
                <div style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-md)', color: '#166534', fontSize: '0.9rem' }}>
                    {successMsg}
                </div>
            )}

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {/* ── ADD/EDIT FORM ─────────────────────────────────── */}
                <div style={{ flex: '1 1 340px', backgroundColor: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', position: 'sticky', top: '2rem' }}>
                    <h3 style={{ marginTop: 0 }}>{editingId ? '✏️ Edit Product' : '➕ Add New Product'}</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input placeholder="Product Name *" required value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
                        <textarea placeholder="Description * (支持 Markdown 语法)" required rows={3} value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} />
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <input type="number" placeholder="Price *" required min="0" step="0.01" value={form.price || ''}
                                onChange={e => setForm({ ...form, price: Number(e.target.value) })} style={{ ...inputStyle, flex: 1 }} />
                            <input type="number" placeholder="Stock *" required min="0" value={form.stock || ''}
                                onChange={e => setForm({ ...form, stock: Number(e.target.value) })} style={{ ...inputStyle, flex: 1 }} />
                        </div>

                        {/* ── MULTI-IMAGE SECTION ──────────────────── */}
                        <div style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: '#F9FAFB' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.6rem', fontSize: '0.92rem' }}>
                                🖼 Product Images ({imageUrls.length}/{MAX_IMAGES})
                                <span style={{ display: 'block', color: 'var(--text-light)', fontWeight: 400, marginTop: '0.2rem', fontSize: '0.8rem' }}>第一张图片将作为商品主封面图。</span>
                            </label>

                            {/* Upload/Add URL Area */}
                            {imageUrls.length < MAX_IMAGES && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex' }}>
                                        <input
                                            type="text"
                                            placeholder="输入图片 URL (Enter Image URL)"
                                            value={newImageUrl}
                                            onChange={e => setNewImageUrl(e.target.value)}
                                            style={{ ...inputStyle, flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddUrl();
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddUrl}
                                            style={{
                                                padding: '0.8rem 1.2rem', backgroundColor: 'var(--primary)', color: 'white', border: '1px solid var(--primary)',
                                                borderTopRightRadius: 'var(--radius-md)', borderBottomRightRadius: 'var(--radius-md)', cursor: 'pointer',
                                                fontWeight: 500, whiteSpace: 'nowrap'
                                            }}
                                        >
                                            添加 URL
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Image Previews */}
                            {imageUrls.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '0.8rem' }}>
                                    {imageUrls.map((url, i) => (
                                        <div key={i} style={{ position: 'relative', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '1', backgroundColor: 'white' }}>
                                            <img src={url} alt={`img-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            {i === 0 && (
                                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.65rem', textAlign: 'center', padding: '2px 0' }}>主图</div>
                                            )}
                                            <button type="button" onClick={() => removeImageSlot(i)}
                                                style={{ position: 'absolute', top: 0, right: 0, width: '20px', height: '20px', backgroundColor: 'rgba(239,68,68,0.9)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#9CA3AF', fontSize: '0.85rem' }}>
                                    尚未上传图片 (No images uploaded)
                                </div>
                            )}
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
                            {loading ? '处理中...' : (editingId ? 'Update' : 'Add') + ' Product'}
                        </button>
                        {editingId && (
                            <button type="button" onClick={resetForm} style={{ padding: '0.7rem', color: 'var(--text-light)', border: 'none', background: 'none', cursor: 'pointer' }}>
                                Cancel
                            </button>
                        )}
                    </form>
                </div>

                {/* ── PRODUCT LIST ──────────────────────────────────── */}
                <div style={{ flex: '2 1 480px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {products.length === 0 && !error && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                                暂无产品，请添加第一个产品。
                            </div>
                        )}
                        {products.map(p => {
                            let imagesArr: string[] = [];
                            try { imagesArr = p.images ? JSON.parse(p.images) : []; } catch { }
                            const thumb = imagesArr[0] || p.imageUrl || '';
                            return (
                                <div key={p.id} style={{ backgroundColor: 'white', padding: '1.2rem 1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                        {thumb ? (
                                            <img src={thumb} alt={p.name} style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
                                        ) : (
                                            <div style={{ width: '56px', height: '56px', backgroundColor: '#F3F4F6', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
                                        )}
                                        <div style={{ minWidth: 0 }}>
                                            <h4 style={{ margin: '0 0 0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h4>
                                            <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>
                                                {p.price}个Q币 &nbsp;|&nbsp; Stock: {p.stock} &nbsp;|&nbsp; {imagesArr.length || (p.imageUrl ? 1 : 0)} image{imagesArr.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                        <button onClick={() => editProduct(p)} style={{ padding: '0.4rem 0.9rem', backgroundColor: '#EFF6FF', color: 'var(--primary)', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                                            Edit
                                        </button>
                                        <button onClick={() => deleteProduct(p.id!)} style={{ padding: '0.4rem 0.9rem', backgroundColor: '#FEF2F2', color: '#EF4444', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProducts;
