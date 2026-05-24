import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Announcement {
    id?: number;
    content: string;
    branch: string;
}

const AdminAnnouncements = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [form, setForm] = useState<Announcement>({ content: '', branch: '全部' });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [branchList, setBranchList] = useState<string[]>([]);

    useEffect(() => { 
        fetchAnnouncements(); 
        fetchBranchList();
    }, []);

    const fetchBranchList = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/settings/BRANCH_LIST');
            const list = JSON.parse(res.data.value || '[]');
            setBranchList(list);
        } catch (err) {
            // ignore
        }
    };

    const fetchAnnouncements = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/announcements');
            setAnnouncements(res.data);
            setError(null);
        } catch (err: any) {
            setError(`❌ 无法加载公告列表: ${err?.response?.data?.message || err?.message}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        try {
            if (editingId) {
                await axios.put(`http://localhost:5000/api/announcements/${editingId}`, { ...form, isActive: true }, { headers });
                setSuccessMsg(`✅ 公告已更新！`);
            } else {
                await axios.post('http://localhost:5000/api/announcements', form, { headers });
                setSuccessMsg(`✅ 新公告已添加！`);
            }
            resetForm();
            await fetchAnnouncements();
        } catch (err: any) {
            setError(`❌ 操作失败: ${err?.response?.data?.message || err?.message}`);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({ content: '', branch: '全部' });
        setEditingId(null);
        setError(null);
        setSuccessMsg(null);
    };

    const editAnnouncement = (a: Announcement) => {
        setForm(a);
        setEditingId(a.id!);
        setError(null);
        setSuccessMsg(null);
    };

    const deleteAnnouncement = async (id: number) => {
        if (!window.confirm('确定要删除这个公告吗？')) return;
        try {
            await axios.delete(`http://localhost:5000/api/announcements/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            await fetchAnnouncements();
        } catch (err: any) {
            setError(`❌ 删除失败: ${err?.response?.data?.message || err?.message}`);
        }
    };

    const inputStyle = { padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', width: '100%', boxSizing: 'border-box' as const };

    return (
        <div className="fade-in">
            <h1 style={{ marginBottom: '2rem' }}>Manage Announcements</h1>

            {error && (
                <div style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)', color: '#991B1B' }}>
                    {error}
                </div>
            )}
            {successMsg && (
                <div style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-md)', color: '#166534' }}>
                    {successMsg}
                </div>
            )}

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 340px', backgroundColor: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', position: 'sticky', top: '2rem' }}>
                    <h3 style={{ marginTop: 0 }}>{editingId ? '✏️ Edit Announcement' : '➕ Add New Announcement'}</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <select 
                            value={form.branch} 
                            onChange={e => setForm({ ...form, branch: e.target.value })} 
                            style={inputStyle}
                        >
                            <option value="全部">全部 (所有分院)</option>
                            {branchList.map(b => (
                                <option key={b} value={b}>{b}</option>
                            ))}
                            {form.branch && form.branch !== '全部' && !branchList.includes(form.branch) && (
                                <option value={form.branch}>{form.branch}</option>
                            )}
                        </select>
                        <textarea placeholder="公告内容 (支持 Markdown)" required rows={8} value={form.content}
                            onChange={e => setForm({ ...form, content: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} />
                        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
                            {loading ? '处理中...' : (editingId ? 'Update' : 'Add')}
                        </button>
                        {editingId && (
                            <button type="button" onClick={resetForm} style={{ padding: '0.7rem', color: 'var(--text-light)', border: 'none', background: 'none', cursor: 'pointer' }}>
                                Cancel
                            </button>
                        )}
                    </form>
                </div>

                <div style={{ flex: '2 1 480px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {announcements.length === 0 && !error && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
                                暂无公告，请添加第一个公告。
                            </div>
                        )}
                        {announcements.map(a => (
                            <div key={a.id} style={{ backgroundColor: 'white', padding: '1.2rem 1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h4 style={{ margin: '0 0 0.5rem', color: 'var(--primary)' }}>分院: {a.branch}</h4>
                                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-dark)', fontSize: '0.9rem' }}>
                                        {a.content.length > 100 ? a.content.substring(0, 100) + '...' : a.content}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                    <button onClick={() => editAnnouncement(a)} style={{ padding: '0.4rem 0.9rem', backgroundColor: '#EFF6FF', color: 'var(--primary)', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                                        Edit
                                    </button>
                                    <button onClick={() => deleteAnnouncement(a.id!)} style={{ padding: '0.4rem 0.9rem', backgroundColor: '#FEF2F2', color: '#EF4444', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnnouncements;
