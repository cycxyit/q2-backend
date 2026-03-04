
import { Outlet, Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

const ShopLayout = () => {
    return (
        <div className="shop-layout">
            <nav style={{ backgroundColor: 'white', padding: '1rem 2rem', borderBottom: '2px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary)', letterSpacing: '-0.5px' }}>
                    <img src="/logo.jpeg" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%' }} />
                    <span style={{ fontFamily: 'Georgia, serif' }}>承品MEMBER'S DAY <span style={{ fontSize: '1.2rem' }}>淘货网</span></span>
                </Link>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <Link to="/" style={{ fontWeight: 500 }}>Shop</Link>
                    <Link to="/checkout" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                        <ShoppingCart size={20} />
                        <span>Cart</span>
                    </Link>
                </div>
            </nav>

            <main className="container" style={{ padding: '2rem' }}>
                <Outlet />
            </main>

            <footer style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)', marginTop: '4rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'white' }}>
                © 2026 承品MEMBER'S DAY 淘货网. All rights reserved.
            </footer>
        </div>
    );
};

export default ShopLayout;
