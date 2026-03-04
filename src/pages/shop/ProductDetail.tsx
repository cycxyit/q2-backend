import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState<any>(null);
    const [quantity, setQuantity] = useState(1);
    const [addedMsg, setAddedMsg] = useState('');
    const [activeImg, setActiveImg] = useState(0); // index of currently selected image

    const fetchProduct = useCallback(() => {
        axios.get(`http://localhost:5000/api/products/${id}?t=${Date.now()}`)
            .then(res => {
                setProduct(res.data);
                setQuantity(q => Math.min(q, Math.max(1, res.data.stock)));
            })
            .catch(err => console.error('[ProductDetail] Failed to load product:', err));
    }, [id]);

    useEffect(() => { fetchProduct(); }, [fetchProduct]);

    // Parse stored images JSON  
    const getImages = (p: any): string[] => {
        const arr: string[] = [];
        try {
            if (p.images) {
                const parsed = JSON.parse(p.images);
                if (Array.isArray(parsed)) arr.push(...parsed.filter(Boolean));
            }
        } catch { }
        // Fall back to imageUrl if images array is empty
        if (arr.length === 0 && p.imageUrl) arr.push(p.imageUrl);
        return arr;
    };

    const decreaseQty = () => setQuantity(q => Math.max(1, q - 1));
    const increaseQty = () => setQuantity(q => Math.min(product.stock, q + 1));

    const addToCart = () => {
        const cart = JSON.parse(localStorage.getItem('qbit_cart') || '[]');
        const existing = cart.find((i: any) => i.productId === product.id);
        if (existing) {
            existing.quantity = Math.min(product.stock, existing.quantity + quantity);
        } else {
            const images = getImages(product);
            cart.push({ productId: product.id, name: product.name, price: product.price, quantity, imageUrl: images[0] || product.imageUrl });
        }
        localStorage.setItem('qbit_cart', JSON.stringify(cart));
        setAddedMsg(`✅ Added ${quantity} × ${product.name} to cart!`);
        setTimeout(() => setAddedMsg(''), 2000);
        fetchProduct();
    };

    const buyNow = () => { addToCart(); navigate('/checkout'); };

    if (!product) return (
        <div className="fade-in" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-light)' }}>
            Loading product...
        </div>
    );

    const images = getImages(product);
    const outOfStock = product.stock <= 0;

    return (
        <div className="fade-in" style={{ display: 'flex', gap: '3rem', marginTop: '1rem', flexWrap: 'wrap' }}>

            {/* ── LEFT: Image Gallery ─────────────────────────────── */}
            <div style={{ flex: '1 1 380px' }}>
                {/* Main Image */}
                <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', backgroundColor: '#F9FAFB', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                        src={images[activeImg] || 'https://placehold.co/600x600?text=No+Image'}
                        alt={`${product.name} - image ${activeImg + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.2s' }}
                        key={activeImg}
                    />
                </div>

                {/* Thumbnail Strip (only if more than 1 image) */}
                {images.length > 1 && (
                    <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.8rem', flexWrap: 'wrap' }}>
                        {images.map((img, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveImg(i)}
                                style={{
                                    padding: 0, border: `2px solid ${i === activeImg ? 'var(--primary)' : 'var(--border-color)'}`,
                                    borderRadius: 'var(--radius-md)', cursor: 'pointer', overflow: 'hidden',
                                    width: '68px', height: '68px', flexShrink: 0,
                                    outline: 'none', transition: 'border-color 0.15s',
                                    opacity: i === activeImg ? 1 : 0.7,
                                }}
                            >
                                <img src={img} alt={`thumb-${i + 1}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    onError={e => (e.currentTarget.src = 'https://placehold.co/68x68?text=?')}
                                />
                            </button>
                        ))}
                    </div>
                )}
                {images.length > 1 && (
                    <p style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-light)', textAlign: 'center' }}>
                        {activeImg + 1} / {images.length}
                    </p>
                )}
            </div>

            {/* ── RIGHT: Product Info ──────────────────────────────── */}
            <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.8rem', lineHeight: 1.3 }}>{product.name}</h1>
                <p style={{ fontSize: '2rem', color: 'var(--primary)', fontWeight: 800, marginBottom: '1rem' }}>
                    {product.price}个Q币
                </p>
                <div style={{ color: 'var(--text-light)', lineHeight: '1.7', marginBottom: '1.5rem', fontSize: '0.97rem' }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                        {product.description || ''}
                    </ReactMarkdown>
                </div>

                {/* Stock Status */}
                <p style={{
                    marginBottom: '0.3rem', fontSize: '0.93rem', fontWeight: 600,
                    color: outOfStock ? '#EF4444' : product.stock <= 5 ? '#F59E0B' : '#10B981'
                }}>
                    {outOfStock ? '❌ Out of stock' : product.stock <= 5 ? `⚠️ Only ${product.stock} left!` : `✅ In stock (${product.stock} available)`}
                </p>
                {product.sold > 0 && (
                    <p style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                        🔥 {product.sold} sold
                    </p>
                )}
                {!product.sold && <div style={{ marginBottom: '1.5rem' }} />}

                {/* Quantity Selector */}
                {!outOfStock && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.93rem' }}>Quantity</label>
                        <div style={{ display: 'flex', alignItems: 'center', width: 'fit-content', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                            <button onClick={decreaseQty} disabled={quantity <= 1}
                                style={{ width: '42px', height: '42px', fontSize: '1.3rem', fontWeight: 'bold', border: 'none', borderRight: '1px solid var(--border-color)', cursor: quantity <= 1 ? 'not-allowed' : 'pointer', backgroundColor: quantity <= 1 ? '#F9FAFB' : 'white', color: quantity <= 1 ? '#D1D5DB' : 'var(--primary)' }}>−</button>
                            <span style={{ minWidth: '54px', textAlign: 'center', fontSize: '1.1rem', fontWeight: 700 }}>{quantity}</span>
                            <button onClick={increaseQty} disabled={quantity >= product.stock}
                                style={{ width: '42px', height: '42px', fontSize: '1.3rem', fontWeight: 'bold', border: 'none', borderLeft: '1px solid var(--border-color)', cursor: quantity >= product.stock ? 'not-allowed' : 'pointer', backgroundColor: quantity >= product.stock ? '#F9FAFB' : 'white', color: quantity >= product.stock ? '#D1D5DB' : 'var(--primary)' }}>+</button>
                        </div>
                        <p style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: 'var(--text-light)' }}>
                            Subtotal: <strong>{(product.price * quantity).toFixed(2)}个Q币</strong>
                        </p>
                    </div>
                )}

                {addedMsg && (
                    <div style={{ padding: '0.7rem 1rem', marginBottom: '1rem', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-md)', color: '#166534', fontSize: '0.88rem' }}>
                        {addedMsg}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button className="btn-primary" onClick={addToCart} disabled={outOfStock}
                        style={{ flex: 1, fontSize: '1rem', padding: '0.9rem', opacity: outOfStock ? 0.5 : 1 }}>
                        🛒 Add to Cart
                    </button>
                    <button onClick={buyNow} disabled={outOfStock}
                        style={{ flex: 1, fontSize: '1rem', padding: '0.9rem', backgroundColor: outOfStock ? '#E5E7EB' : '#10B981', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: outOfStock ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                        ⚡ Buy Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
