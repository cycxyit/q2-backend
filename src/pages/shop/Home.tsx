import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import GlassSelect from '../../components/GlassSelect';

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    stock: number;
    branch?: string;
}

interface Announcement {
    id: number;
    content: string;
    branch: string;
}

let sessionStarted = false;

const Home = () => {
    const location = useLocation();
    const fromCart = location.state?.fromCart;

    const [products, setProducts] = useState<Product[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [announcement, setAnnouncement] = useState<string | null>(null);
    const [showPopup, setShowPopup] = useState(false);
    const [showBalancePrompt, setShowBalancePrompt] = useState(false);
    const [balanceInput, setBalanceInput] = useState(localStorage.getItem('user_qbit_balance') || '');
    const defaultBranch = localStorage.getItem('user_branch');
    const [branchInput, setBranchInput] = useState(defaultBranch === '全部' ? '' : (defaultBranch || ''));
    const [userBranch, setUserBranch] = useState(defaultBranch === '全部' ? '' : (defaultBranch || ''));
    const [branchList, setBranchList] = useState<string[]>([]);

    const closePopup = () => {
        setShowPopup(false);
    };

    useEffect(() => {
        Promise.all([
            axios.get('http://localhost:5000/api/products'),
            axios.get('http://localhost:5000/api/announcements').catch(() => ({ data: [] })),
            axios.get('http://localhost:5000/api/settings/BRANCH_LIST').catch(() => ({ data: { value: '[]' } }))
        ])
            .then(([productsRes, annRes, branchRes]) => {
                setProducts(productsRes.data);
                const anns = annRes.data || [];
                setAnnouncements(anns);
                
                try {
                    setBranchList(JSON.parse(branchRes.data.value || '[]'));
                } catch(e) {
                    setBranchList([]);
                }

                if (!sessionStarted && !fromCart) {
                    setShowBalancePrompt(true);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('[Home] Failed to fetch data:', err);
                const msg = err?.response?.data?.message || err?.message || 'Unknown error';
                setError(`无法加载产品 (${msg})。请确保后端服务器正在运行 (port 5000)`);
                setLoading(false);
            });
    }, [fromCart]);

    const handleBalanceSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const num = parseFloat(balanceInput);
        if (!isNaN(num) && num >= 0) {
            localStorage.setItem('user_qbit_balance', num.toString());
            localStorage.setItem('user_branch', branchInput);
            setUserBranch(branchInput);
            setShowBalancePrompt(false);
            sessionStarted = true;

            // Check for announcement matching the branch
            const relevantAnn = announcements.find(a => a.branch === branchInput || a.branch === '全部');
            if (relevantAnn) {
                setAnnouncement(relevantAnn.content);
                setShowPopup(true);
            }
        } else {
            alert('请输入有效的Q币金额');
        }
    };

    const filteredProducts = products.filter(p => {
        let productBranches: string[] = [];
        try {
            const parsed = JSON.parse(p.branch || '[]');
            productBranches = Array.isArray(parsed) ? parsed : [p.branch || '全部'];
        } catch {
            productBranches = [p.branch || '全部'];
        }
        return productBranches.includes('全部') || productBranches.includes(userBranch) || productBranches.length === 0;
    });

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
            <div className="glass" style={{
                textAlign: 'center',
                margin: '1.5rem 0 2rem 0',
                padding: '2rem 1.5rem',
                color: 'var(--text-dark)',
                borderRadius: 'var(--radius-lg)'
            }}>
                <h1 style={{ fontSize: '2rem', margin: '0 0 0.8rem 0', color: 'var(--text-orange)' }}>欢迎来到 承品淘货网</h1>
                <p style={{ fontSize: '1rem', opacity: 0.9, margin: 0, color: 'var(--text-light)' }}>承品老师们在班上都看得到你很好的表现<br />奖励你用智力Q币来换去你想要的礼物🎁</p>
            </div>

            {filteredProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-light)' }}>
                    暂无产品，请联系管理员添加产品。
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
                    {filteredProducts.map(p => (
                        <Link
                            className="glass"
                            to={`/product/${p.id}`}
                            key={p.id}
                            style={{
                                display: 'block',
                                borderRadius: 'var(--radius-lg)',
                                overflow: 'hidden',
                                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s',
                                textDecoration: 'none'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <img
                                src={p.imageUrl || 'https://placehold.co/400x300?text=No+Image'}
                                alt={p.name}
                                style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                            />
                            <div style={{ padding: '1.5rem' }}>
                                <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-orange)' }}>{p.name}</h3>
                                <p style={{ color: 'var(--text-light)', margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
                                    {p.description.length > 60 ? p.description.substring(0, 60) + '...' : p.description}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text-orange)' }}>{p.price}个Q币</span>
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
                    <div className="glass" style={{
                        width: '100%', maxWidth: '600px',
                        maxHeight: '85vh',
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
                            📢 最新公告 Special Announcement
                        </div>
                        <div style={{
                            padding: '1.5rem 2rem', overflowY: 'auto',
                            lineHeight: '1.6', fontSize: '0.95rem'
                        }}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                {announcement}
                            </ReactMarkdown>
                        </div>
                        <div style={{
                            padding: '1.2rem',
                            borderTop: '1px solid rgba(0,0,0,0.05)',
                            display: 'flex', justifyContent: 'center',
                            borderRadius: '0 0 var(--radius-lg) var(--radius-lg)'
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

            {/* Balance Prompt Modal */}
            {showBalancePrompt && (
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
                            💰 现有Q币余额
                        </div>
                        <form onSubmit={handleBalanceSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <p style={{ margin: 0, textAlign: 'center', fontSize: '1rem', color: 'var(--text-dark)' }}>请问你现有的Q币：</p>
                            <input
                                type="number"
                                autoFocus
                                required
                                min="0"
                                step="any"
                                value={balanceInput}
                                onChange={e => setBalanceInput(e.target.value)}
                                placeholder="输入现有Q币 (例: 50)"
                                className="glass-input"
                                style={{
                                    width: '100%', padding: '0.8rem', fontSize: '1.1rem',
                                    borderRadius: 'var(--radius-md)',
                                    textAlign: 'center', boxSizing: 'border-box'
                                }}
                            />
                            <p style={{ margin: '-0.3rem 0 0', textAlign: 'center', fontSize: '1rem', color: '#EF4444', fontWeight: 700 }}>若发现报假Q币数量将会拉入黑名单！</p>
                            <p style={{ margin: 0, textAlign: 'center', fontSize: '1rem', color: 'var(--text-dark)', marginTop: '0.5rem' }}>选择分院：</p>
                            <GlassSelect
                                required
                                value={branchInput}
                                onChange={val => setBranchInput(val)}
                                placeholder="请选择您的分院..."
                                options={branchList.map(b => ({ value: b, label: b }))}
                            />
                            <button
                                type="submit"
                                className="btn-primary"
                                style={{ width: '100%', fontSize: '1.1rem', padding: '0.8rem', marginTop: '0.5rem' }}
                            >
                                确认 Confirm
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
