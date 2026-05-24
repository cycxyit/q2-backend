import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import GlassSelect from '../../components/GlassSelect';

const Checkout = () => {
    const [cart, setCart] = useState<any[]>([]);
    const [stockMap, setStockMap] = useState<Record<number, number>>({});
    const [stockLoading, setStockLoading] = useState(true);
    const [form, setForm] = useState({ 
        name: '', 
        phone: '', 
        address: '', 
        branch: localStorage.getItem('user_branch') || '全部', 
        remarks: '' 
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [userBalance, setUserBalance] = useState<number | null>(null);
    const [branchList, setBranchList] = useState<string[]>([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('qbit_cart') || '[]');
        setCart(saved);

        const savedBalance = localStorage.getItem('user_qbit_balance');
        if (savedBalance !== null) {
            setUserBalance(parseFloat(savedBalance));
        }

        const fetchStock = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/products');
                const map: Record<number, number> = {};
                res.data.forEach((p: any) => {
                    map[p.id] = p.stock;
                });
                setStockMap(map);
            } catch (err) {
                console.error('Failed to fetch stock for checkout:', err);
            } finally {
                setStockLoading(false);
            }
        };

        const fetchBranchList = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/settings/BRANCH_LIST');
                const list = JSON.parse(res.data.value || '[]');
                setBranchList(list);
            } catch (err) {
                // ignore
            }
        };

        fetchStock();
        fetchBranchList();
        const interval = setInterval(fetchStock, 5000);
        return () => clearInterval(interval);
    }, []);

    // Persist cart to localStorage whenever it changes
    const saveCart = (newCart: any[]) => {
        setCart(newCart);
        localStorage.setItem('qbit_cart', JSON.stringify(newCart));
    };

    const updateQty = (index: number, delta: number) => {
        const newCart = [...cart];
        const productId = newCart[index].productId;
        const currentStock = stockMap[productId];

        let newQty = newCart[index].quantity + delta;
        if (newQty < 1) return; // Don't go below 1
        if (currentStock !== undefined && newQty > currentStock) {
            newQty = currentStock; // Cap at max stock
        }

        newCart[index] = { ...newCart[index], quantity: newQty };
        saveCart(newCart);
    };

    const removeItem = (index: number) => {
        const newCart = cart.filter((_, i) => i !== index);
        saveCart(newCart);
    };

    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const hasInsufficientStock = cart.some(item => {
        const currentStock = stockMap[item.productId];
        return !stockLoading && currentStock !== undefined && item.quantity > currentStock;
    });

    const isOverspending = userBalance !== null && total > userBalance;
    const canSubmit = cart.length > 0 && !loading && !hasInsufficientStock && !isOverspending;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowConfirmModal(true);
    };

    const confirmOrder = async () => {
        setShowConfirmModal(false);
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
                branch: form.branch,
                remarks: form.remarks,
            }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            setOrderId(res.data.orderId);
            setSuccess(true);
            localStorage.removeItem('qbit_cart');
            
            // Deduct from local balance and save it
            if (userBalance !== null) {
                const newBalance = userBalance - total;
                localStorage.setItem('user_qbit_balance', newBalance.toString());
                setUserBalance(newBalance);
            }
            
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
                <h1 style={{ marginBottom: '0.5rem' }}>Order Placed Successfully!</h1>
                <h2 style={{ marginTop: '0', color: 'var(--text-light)', marginBottom: '1.5rem' }}>订单提交成功！</h2>
                
                {userBalance !== null && (
                    <div style={{
                        display: 'inline-block',
                        backgroundColor: '#F0FDF4',
                        border: '1px solid #BBF7D0',
                        color: '#166534',
                        padding: '1rem 2rem',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: '1.5rem',
                        fontSize: '1.1rem'
                    }}>
                        <strong>现有Q币 Remaining Balance:</strong> 
                        <span style={{ fontSize: '1.4rem', fontWeight: 800, marginLeft: '0.8rem' }}>
                            {userBalance.toFixed(2)}个Q币
                        </span>
                    </div>
                )}

                {orderId && (
                    <p style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600, fontSize: '1.1rem' }}>
                        Order ID: {orderId}
                    </p>
                )}
                <p style={{ color: 'var(--text-light)', marginBottom: '2rem', lineHeight: '1.6' }}>
                    Your order has been recorded. Our team will contact you shortly.<br />
                    您的订单已成功记录，我们的团队将很快与您联系。
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
                    <div className="glass" style={{
                        textAlign: 'center', padding: '3rem',
                        borderRadius: 'var(--radius-lg)'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
                        <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>Your cart is empty</p>
                        <button className="btn-primary" onClick={() => navigate('/')}>Browse Products</button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {cart.map((item, i) => {
                            const currentStock = stockMap[item.productId];
                            const isInsufficient = !stockLoading && currentStock !== undefined && item.quantity > currentStock;
                            const isOutOfStock = !stockLoading && currentStock === 0;

                            return (
                                <div className="glass" key={i} style={{
                                    display: 'flex', gap: '1.2rem',
                                    padding: '1rem 1.2rem',
                                    opacity: isInsufficient ? 0.6 : 1,
                                    filter: isInsufficient ? 'grayscale(100%)' : 'none',
                                    borderRadius: 'var(--radius-lg)',
                                    alignItems: 'flex-start'
                                }}>
                                    {/* Product Image */}
                                    <img
                                        src={item.imageUrl || 'https://placehold.co/80x80?text=?'}
                                        alt={item.name}
                                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
                                    />

                                    {/* Product Info & Controls */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        {/* Top: Name & Price */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h4 style={{ margin: '0 0 0.3rem', fontSize: '1rem', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text-orange)' }}>
                                                    {item.name}
                                                </h4>
                                                <p style={{ margin: 0, color: 'var(--text-orange)', fontWeight: 700, fontSize: '0.95rem' }}>
                                                    {item.price}个Q币 <span style={{ color: 'var(--text-light)', fontWeight: 400, fontSize: '0.85rem' }}>each</span>
                                                </p>
                                                {isOutOfStock ? (
                                                    <p style={{ margin: '0.4rem 0 0', color: '#EF4444', fontSize: '0.85rem', fontWeight: 'bold' }}>❌ 已售完</p>
                                                ) : isInsufficient ? (
                                                    <p style={{ margin: '0.4rem 0 0', color: '#EF4444', fontSize: '0.85rem', fontWeight: 'bold' }}>⚠️ 库存不足 (仅剩 {currentStock} 件)</p>
                                                ) : null}
                                            </div>
                                            <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-orange)', whiteSpace: 'nowrap' }}>
                                                {(item.price * item.quantity).toFixed(2)}个Q币
                                            </div>
                                        </div>

                                        {/* Bottom: Quantity & Delete */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.2rem' }}>
                                            {/* Quantity Controls */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                                <button
                                                    onClick={() => updateQty(i, -1)}
                                                    disabled={item.quantity <= 1}
                                                    style={{
                                                        width: '32px', height: '32px', fontSize: '1.2rem', fontWeight: 'bold',
                                                        border: 'none', cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                                                        backgroundColor: item.quantity <= 1 ? '#F9FAFB' : 'white',
                                                        color: item.quantity <= 1 ? '#D1D5DB' : '#374151',
                                                        borderRight: '1px solid var(--border-color)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                >−</button>
                                                <span style={{ minWidth: '40px', textAlign: 'center', fontSize: '0.95rem', fontWeight: 700 }}>
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQty(i, +1)}
                                                    disabled={currentStock !== undefined && item.quantity >= currentStock}
                                                    style={{
                                                        width: '32px', height: '32px', fontSize: '1.2rem', fontWeight: 'bold',
                                                        border: 'none', cursor: (currentStock !== undefined && item.quantity >= currentStock) ? 'not-allowed' : 'pointer',
                                                        backgroundColor: (currentStock !== undefined && item.quantity >= currentStock) ? '#F9FAFB' : 'white',
                                                        color: (currentStock !== undefined && item.quantity >= currentStock) ? '#D1D5DB' : '#374151',
                                                        borderLeft: '1px solid var(--border-color)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                >+</button>
                                            </div>

                                            {/* Delete Button */}
                                            <button
                                                onClick={() => removeItem(i)}
                                                title="Remove item"
                                                style={{
                                                    padding: '0.4rem 0.6rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: 'none', cursor: 'pointer',
                                                    backgroundColor: '#FEE2E2', color: '#EF4444',
                                                    fontSize: '0.85rem', fontWeight: 600,
                                                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                                                    transition: 'background 0.15s'
                                                }}
                                                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FECACA')}
                                                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FEE2E2')}
                                            >
                                                🗑 Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Cart Total Bar */}
                        <div className="glass" style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '1rem 1.2rem',
                            borderRadius: 'var(--radius-lg)',
                            borderTop: '2px solid var(--primary)'
                        }}>
                            <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                                Total ({cart.reduce((acc, i) => acc + i.quantity, 0)} items)
                            </span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-orange)' }}>
                                {total.toFixed(2)}个Q币
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── RIGHT: Contact Form ──────────────────────────────── */}
            <div className="glass" style={{
                flex: '1 1 320px',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                position: 'sticky', top: '5rem'
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
                        { label: 'Your Name 你的名字', key: 'name', type: 'text', required: true, placeholder: '陈小明 F1' },
                        { label: 'Phone Number 电话号码', key: 'phone', type: 'text', required: true, placeholder: '0123456789' },
                    ].map(({ label, key, type, required, placeholder }) => (
                        <div key={key}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>{label}</label>
                            <input
                                className="glass-input"
                                required={required}
                                type={type}
                                placeholder={placeholder}
                                value={(form as any)[key]}
                                onChange={e => setForm({ ...form, [key]: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.95rem', boxSizing: 'border-box' }}
                            />
                        </div>
                    ))}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>补习时间 Tuition Timetable</label>
                        <textarea
                            className="glass-input"
                            required
                            rows={5}
                            value={form.address}
                            onChange={e => setForm({ ...form, address: e.target.value })}
                            placeholder={`F5
星期一 Mandy老师 MM 4pm
星期二 易老师 SEJ 5.30pm
星期三 康老师 SN 4pm`}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', resize: 'vertical', fontSize: '0.95rem', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>补习分院 Tuition Branch</label>
                        <GlassSelect
                            required
                            disabled
                            value={form.branch}
                            onChange={val => setForm({ ...form, branch: val })}
                            placeholder="请选择你的补习分院..."
                            options={branchList.map(b => ({ value: b, label: b }))}
                        />
                        <div style={{ marginTop: '0.3rem', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                            * 分院选项已根据您的初始选择自动锁定。
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Remark 备注 (Optional)</label>
                        <input
                            className="glass-input"
                            type="text"
                            value={form.remarks}
                            onChange={e => setForm({ ...form, remarks: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.95rem', boxSizing: 'border-box' }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={!canSubmit}
                        style={{ marginTop: '0.5rem', padding: '1rem', fontSize: '1.05rem', opacity: !canSubmit ? 0.5 : 1 }}
                    >
                        {loading ? '⏳ Processing...' : hasInsufficientStock ? '⚠️ 购物车中有商品库存不足' : isOverspending ? `⚠️ 超出当前余额 (现有 Q币: ${userBalance})` : `✅ Place Order (${total.toFixed(2)}个Q币)`}
                    </button>
                </form>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem', animation: 'fadeIn 0.3s ease-out'
                }}>
                    <div className="glass" style={{
                        width: '100%', maxWidth: '400px',
                        borderRadius: 'var(--radius-lg)',
                        display: 'flex', flexDirection: 'column',
                        background: 'rgba(255, 255, 255, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.6)'
                    }}>
                        <div style={{
                            padding: '1.2rem', color: 'var(--text-dark)',
                            textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', borderBottom: '1px solid rgba(0,0,0,0.05)',
                            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0'
                        }}>
                            ❓ 确认下单
                        </div>
                        <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '1.05rem', color: 'var(--text-dark)' }}>
                            <p style={{ margin: '0 0 1.5rem 0' }}>是否确认提交此订单？<br/><span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-orange)' }}><br/>{total.toFixed(2)}个Q币</span></p>
                            
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button
                                    onClick={() => setShowConfirmModal(false)}
                                    style={{
                                        padding: '0.8rem 1.5rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-color)',
                                        backgroundColor: 'white',
                                        fontSize: '1rem', cursor: 'pointer', flex: 1,
                                        fontWeight: 600, color: 'var(--text-light)'
                                    }}
                                >
                                    取消 Cancel
                                </button>
                                <button
                                    onClick={confirmOrder}
                                    className="btn-primary"
                                    style={{
                                        padding: '0.8rem 1.5rem',
                                        fontSize: '1rem', flex: 1, margin: 0
                                    }}
                                >
                                    确定 Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Checkout;
