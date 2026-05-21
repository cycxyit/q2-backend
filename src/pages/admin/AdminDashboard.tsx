
import { Link, useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/admin/login');
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#EF4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        fontWeight: 500
                    }}
                >
                    退出账号
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
                    <h3 style={{ marginTop: 0, color: 'var(--text-light)' }}>Total Products</h3>
                    <p style={{ fontSize: '3rem', fontWeight: 'bold', margin: '1rem 0', color: 'var(--primary)' }}>24</p>
                    <Link to="/admin/products" style={{ color: 'var(--primary)', fontWeight: 500 }}>Manage Products →</Link>
                </div>

                <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
                    <h3 style={{ marginTop: 0, color: 'var(--text-light)' }}>Order Management</h3>
                    <p style={{ margin: '1rem 0', lineHeight: 1.6 }}>Orders are sent directly to your Google Sheet. Please check the sheet to process fulfillments.</p>
                    <a href="https://docs.google.com/spreadsheets" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 500 }}>Open Google Sheets →</a>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
