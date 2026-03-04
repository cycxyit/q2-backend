import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Checkout = () => {
    const [cart, setCart] = useState<any[]>([]);
    const [form, setForm] = useState({ name: '', phone: '', address: '', remarks: '' });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [orderId, setOrderId] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('qbit_cart') || '[]');
        setCart(saved);
    }, []);

    // Persist cart to localStorage whenever it changes
    const saveCart = (newCart: any[]) => {
        setCart(newCart);
        localStorage.setItem('qbit_cart', JSON.stringify(newCart));
    };

    const updateQty = (index: number, delta: number) => {
        const newCart = [...cart];
        const newQty = newCart[index].quantity + delta;
        if (newQty < 1) return; // Don't go below 1
        newCart[index] = { ...newCart[index], quantity: newQty };
        saveCart(newCart);
    };

    const removeItem = (index: number) => {
        const newCart = cart.filter((_, i) => i !== index);
        saveCart(newCart);
    };

    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token') || '';
            const res = await axios.post('http://localhost:5000/api/orders', {
                items: cart,
                totalAmount: total,
                customerName: form.name,
                phone: form.phone,
                address: form.address,
                remarks: form.remarks,
            }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            setOrderId(res.data.orderId);
            setSuccess(true);
            localStorage.removeItem('qbit_cart');
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Unknown error';
            const status = err?.response?.status || 'N/A';
            setError(`❌ 下单失败 (HTTP ${status}): ${msg}`);
            console.error('[Checkout] Order failed:', err);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="fade-in" style={{ textAlign: 'center', padding: '5rem 0' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '80px', height: '80px', borderRadius: '50%',
                    backgroundColor: '#10B981', color: 'white', fontSize: '3rem', marginBottom: '2rem'
                }}>✓</div>
                <h1>Order Placed Successfully!</h1>
                {orderId && (
                    <p style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600, fontSize: '1.1rem' }}>
                        Order ID: {orderId}
                    </p>
                )}
                <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>
                    Your order has been recorded. Our team will contact you shortly.
                </p>
                <button className="btn-primary" onClick={() => navigate('/')}>Continue Shopping</button>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

            {/* ── LEFT: Cart Items ──────────────────────────────────── */}
            <div style={{ flex: '2 1 480px' }}>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>🛒 Shopping Cart ({cart.length} items)</h2>

                {cart.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '3rem',
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: 'var(--radius-lg)',
                        border: '2px dashed var(--border-color)'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
                        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>Your cart is empty</p>
                        <button className="btn-primary" onClick={() => navigate('/')}>Browse Products</button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {cart.map((item, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: '1.2rem',
                                padding: '1rem 1.2rem',
                                backgroundColor: 'var(--card-bg)',
                                borderRadius: 'var(--radius-lg)',
                                boxShadow: 'var(--shadow-sm)',
                                border: '1px solid var(--border-color)'
                            }}>
                                {/* Product Image */}
                                <img
                                    src={item.imageUrl || 'https://placehold.co/80x80?text=?'}
                                    alt={item.name}
                                    style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
                                />

                                {/* Product Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h4 style={{ margin: '0 0 0.3rem', fontSize: '1rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {item.name}
                                    </h4>
                                    <p style={{ margin: 0, color: 'var(--primary)', fontWeight: 700, fontSize: '1.05rem' }}>
                                        {item.price}个Q币 <span style={{ color: 'var(--text-light)', fontWeight: 400, fontSize: '0.85rem' }}>each</span>
                                    </p>
                                </div>

                                {/* Quantity Controls */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0 }}>
                                    <button
                                        onClick={() => updateQty(i, -1)}
                                        disabled={item.quantity <= 1}
                                        style={{
                                            width: '36px', height: '36px', fontSize: '1.2rem', fontWeight: 'bold',
                                            border: 'none', cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                                            backgroundColor: item.quantity <= 1 ? '#F9FAFB' : 'white',
                                            color: item.quantity <= 1 ? '#D1D5DB' : '#374151',
                                            borderRight: '1px solid var(--border-color)'
                                        }}
                                    >−</button>
                                    <span style={{ minWidth: '40px', textAlign: 'center', fontSize: '0.95rem', fontWeight: 700, padding: '0 4px' }}>
                                        {item.quantity}
                                    </span>
                                    <button
                                        onClick={() => updateQty(i, +1)}
                                        style={{
                                            width: '36px', height: '36px', fontSize: '1.2rem', fontWeight: 'bold',
                                            border: 'none', cursor: 'pointer',
                                            backgroundColor: 'white', color: '#374151',
                                            borderLeft: '1px solid var(--border-color)'
                                        }}
                                    >+</button>
                                </div>

                                {/* Line Total */}
                                <div style={{ minWidth: '72px', textAlign: 'right', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>
                                    {(item.price * item.quantity).toFixed(2)}个Q币
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={() => removeItem(i)}
                                    title="Remove item"
                                    style={{
                                        width: '34px', height: '34px', borderRadius: '50%',
                                        border: 'none', cursor: 'pointer', flexShrink: 0,
                                        backgroundColor: '#FEE2E2', color: '#EF4444',
                                        fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'background 0.15s'
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FECACA')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FEE2E2')}
                                >
                                    🗑
                                </button>
                            </div>
                        ))}

                        {/* Cart Total Bar */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '1rem 1.2rem',
                            backgroundColor: 'var(--card-bg)',
                            borderRadius: 'var(--radius-lg)',
                            borderTop: '2px solid var(--primary)',
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                                Total ({cart.reduce((acc, i) => acc + i.quantity, 0)} items)
                            </span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                                {total.toFixed(2)}个Q币
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── RIGHT: Contact Form ──────────────────────────────── */}
            <div style={{
                flex: '1 1 320px',
                backgroundColor: 'var(--card-bg)',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
                position: 'sticky', top: '2rem'
            }}>
                <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>📋 Order Details</h3>

                {error && (
                    <div style={{
                        padding: '0.9rem 1rem', marginBottom: '1.2rem',
                        backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
                        borderRadius: 'var(--radius-md)', color: '#991B1B',
                        fontSize: '0.85rem', lineHeight: '1.5'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    {[
                        { label: 'Your Name 你的名字', key: 'name', type: 'text', required: true },
                        { label: 'Phone Number 电话号码', key: 'phone', type: 'text', required: true },
                    ].map(({ label, key, type, required }) => (
                        <div key={key}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>{label}</label>
                            <input
                                required={required}
                                type={type}
                                value={(form as any)[key]}
                                onChange={e => setForm({ ...form, [key]: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.95rem', boxSizing: 'border-box' }}
                            />
                        </div>
                    ))}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>补习时间 Tuition Timetable</label>
                        <textarea
                            required
                            rows={3}
                            value={form.address}
                            onChange={e => setForm({ ...form, address: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', resize: 'vertical', fontSize: '0.95rem', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Remark 备注 (Optional)</label>
                        <input
                            type="text"
                            value={form.remarks}
                            onChange={e => setForm({ ...form, remarks: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.95rem', boxSizing: 'border-box' }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={cart.length === 0 || loading}
                        style={{ marginTop: '0.5rem', padding: '1rem', fontSize: '1.05rem', opacity: cart.length === 0 ? 0.5 : 1 }}
                    >
                        {loading ? '⏳ Processing...' : `✅ Place Order (${total.toFixed(2)}个Q币)`}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Checkout;
