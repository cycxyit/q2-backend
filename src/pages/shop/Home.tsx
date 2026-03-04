import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    stock: number;
}

const Home = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [announcement, setAnnouncement] = useState<string | null>(null);
    const [showPopup, setShowPopup] = useState(false);

    const closePopup = () => {
        setShowPopup(false);
        if (announcement) {
            localStorage.setItem('qbit_last_announcement', announcement);
        }
    };

    useEffect(() => {
        // Fetch products and announcement in parallel
        Promise.all([
            axios.get('http://localhost:5000/api/products'),
            axios.get('http://localhost:5000/api/settings/ANNOUNCEMENT_MD').catch(() => null)
        ])
            .then(([productsRes, settingsRes]) => {
                setProducts(productsRes.data);
                if (settingsRes && settingsRes.data && settingsRes.data.value) {
                    const fetchedAnnouncement = settingsRes.data.value;
                    setAnnouncement(fetchedAnnouncement);

                    // Check if it's new or updated
                    const lastSeen = localStorage.getItem('qbit_last_announcement');
                    if (fetchedAnnouncement !== lastSeen) {
                        setShowPopup(true);
                    }
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('[Home] Failed to fetch data:', err);
                const msg = err?.response?.data?.message || err?.message || 'Unknown error';
                setError(`无法加载产品 (${msg})。请确保后端服务器正在运行 (port 5000)`);
                setLoading(false);
            });
    }, []);

    if (loading) return (
        <div className="container fade-in" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-light)' }}>
            ⏳ Loading products...
        </div>
    );

    if (error) return (
        <div className="container fade-in">
            <div style={{
                padding: '2rem',
                marginTop: '2rem',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 'var(--radius-lg)',
                color: '#991B1B',
                textAlign: 'center'
            }}>
                <h3 style={{ marginBottom: '1rem' }}>⚠️ 无法连接到服务器</h3>
                <p style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="btn-primary"
                    style={{ marginTop: '1.5rem' }}
                >
                    重试
                </button>
            </div>
        </div>
    );

    return (
        <div className="fade-in">
            <div style={{
                textAlign: 'center',
                margin: '1.5rem 0 2rem 0',
                padding: '2rem 1.5rem',
                backgroundColor: 'var(--primary)',
                color: 'white',
                borderRadius: 'var(--radius-lg)'
            }}>
                <h1 style={{ fontSize: '2rem', margin: '0 0 0.8rem 0' }}>欢迎来到 承品MEMBER‘S DAY 淘货网</h1>
                <p style={{ fontSize: '1rem', opacity: 0.9, margin: 0 }}>永远保持学习的状态，别因为功成名就，而不屑提问。也别因为知道了很多而停止学习！</p>
            </div>

            {products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-light)' }}>
                    暂无产品，请联系管理员添加产品。
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                    {products.map(p => (
                        <Link
                            to={`/product/${p.id}`}
                            key={p.id}
                            style={{
                                display: 'block',
                                backgroundColor: 'var(--card-bg)',
                                borderRadius: 'var(--radius-lg)',
                                overflow: 'hidden',
                                boxShadow: 'var(--shadow-sm)',
                                transition: 'transform 0.2s',
                                textDecoration: 'none'
                            }}
                        >
                            <img
                                src={p.imageUrl || 'https://placehold.co/400x300?text=No+Image'}
                                alt={p.name}
                                style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                            />
                            <div style={{ padding: '1.5rem' }}>
                                <h3 style={{ margin: '0 0 0.5rem 0' }}>{p.name}</h3>
                                <p style={{ color: 'var(--text-light)', margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
                                    {p.description.length > 60 ? p.description.substring(0, 60) + '...' : p.description}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{p.price}个Q币</span>
                                    <span className="btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>View</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Announcement Popup Modal */}
            {showPopup && announcement && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem', animation: 'fadeIn 0.3s ease-out'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        width: '100%', maxWidth: '600px',
                        maxHeight: '85vh',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        display: 'flex', flexDirection: 'column',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
                    }}>
                        <div style={{
                            padding: '1.2rem', backgroundColor: 'var(--primary)', color: 'white',
                            textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold'
                        }}>
                            📢 最新公告 Special Announcement
                        </div>
                        <div style={{
                            padding: '1.5rem 2rem', overflowY: 'auto',
                            lineHeight: '1.6', fontSize: '0.95rem'
                        }}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                                {announcement}
                            </ReactMarkdown>
                        </div>
                        <div style={{
                            padding: '1.2rem', backgroundColor: '#F8FAFC',
                            borderTop: '1px solid var(--border-color)',
                            display: 'flex', justifyContent: 'center'
                        }}>
                            <button
                                className="btn-primary"
                                style={{ width: '200px', fontSize: '1.1rem', padding: '0.8rem' }}
                                onClick={closePopup}
                            >
                                我知道了 I Know
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
