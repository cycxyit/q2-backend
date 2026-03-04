
import { Outlet, Link } from 'react-router-dom';

const AdminLayout = () => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
            {/* Sidebar */}
            <aside style={{ width: '250px', backgroundColor: 'var(--text-dark)', color: 'white', padding: '2rem' }}>
                <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                    <img src="/logo.jpeg" alt="Logo" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '50%', border: '2px solid var(--primary)' }} />
                    <h2 style={{ margin: 0, fontSize: '1.2rem', textAlign: 'center', lineHeight: '1.3' }}>承品MEMBER'S DAY<br /><span style={{ fontSize: '1rem', color: 'var(--primary)' }}>淘货网</span></h2>
                </div>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Link to="/admin" style={{ color: 'white', opacity: 0.8 }}>Dashboard</Link>
                    <Link to="/admin/products" style={{ color: 'white', opacity: 0.8 }}>Products Setup</Link>
                    <Link to="/admin/settings" style={{ color: 'white', opacity: 0.8 }}>Store Settings</Link>
                    {/* Orders are checked in Google Sheets by user */}
                    <a href="https://docs.google.com/spreadsheets" target="_blank" rel="noreferrer" style={{ color: 'white', opacity: 0.8 }}>View Orders (Sheets)</a>
                </nav>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2rem', backgroundColor: 'var(--bg-color)' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
