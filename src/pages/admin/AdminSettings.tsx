import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AdminSettings = () => {
    const [announcement, setAnnouncement] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchAnnouncement();
    }, []);

    const fetchAnnouncement = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:5000/api/settings/ANNOUNCEMENT_MD');
            setAnnouncement(res.data.value || '');
        } catch (err: any) {
            if (err.response?.status !== 404) {
                setMsg({ type: 'error', text: 'Error fetching announcement: ' + (err.response?.data?.message || err.message) });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMsg(null);
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                'http://localhost:5000/api/settings/ANNOUNCEMENT_MD',
                { value: announcement },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMsg({ type: 'success', text: '✅ 公告保存成功！' });
        } catch (err: any) {
            setMsg({ type: 'error', text: '❌ 保存失败: ' + (err.response?.data?.message || err.message) });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fade-in">
            <h1 style={{ marginBottom: '2rem' }}>Store Settings</h1>

            {msg && (
                <div style={{
                    padding: '1rem 1.5rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem',
                    backgroundColor: msg.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                    border: `1px solid ${msg.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
                    color: msg.type === 'success' ? '#166534' : '#991B1B'
                }}>
                    {msg.text}
                </div>
            )}

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 400px', backgroundColor: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>📢 全局公告设置 (Markdown)</h3>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        在这里编写主页弹窗的公告内容。支持 Markdown 格式编排（加粗、列表、链接等）。
                    </p>

                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>Loading...</div>
                    ) : (
                        <>
                            <textarea
                                value={announcement}
                                onChange={e => setAnnouncement(e.target.value)}
                                rows={12}
                                style={{
                                    width: '100%', padding: '1rem', border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md)', resize: 'vertical', fontFamily: 'monospace',
                                    fontSize: '0.95rem', lineHeight: '1.5', boxSizing: 'border-box', marginBottom: '1rem'
                                }}
                                placeholder="输入公告内容..."
                            />
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="btn-primary"
                            >
                                {saving ? '保存中...' : '💾 保存公告'}
                            </button>
                        </>
                    )}
                </div>

                <div style={{ flex: '1 1 400px', backgroundColor: '#F8FAFC', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-light)' }}>👁️ 公告预览</h3>
                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: 'var(--radius-md)', minHeight: '200px' }}>
                        {announcement ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {announcement}
                            </ReactMarkdown>
                        ) : (
                            <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>暂无内容</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
