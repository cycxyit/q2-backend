import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const AdminSettings = () => {
    const [announcement, setAnnouncement] = useState('');
    const [branches, setBranches] = useState<string[]>([]);
    const [newBranch, setNewBranch] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const [annRes, branchRes] = await Promise.all([
                axios.get('http://localhost:5000/api/settings/ANNOUNCEMENT_MD').catch(() => ({ data: { value: '' } })),
                axios.get('http://localhost:5000/api/settings/BRANCH_LIST').catch(() => ({ data: { value: '[]' } }))
            ]);
            setAnnouncement(annRes.data.value || '');
            try {
                setBranches(JSON.parse(branchRes.data.value || '[]'));
            } catch (e) {
                setBranches([]);
            }
        } catch (err: any) {
            setMsg({ type: 'error', text: 'Error fetching settings: ' + err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (type: 'announcement' | 'branches') => {
        setSaving(true);
        setMsg(null);
        try {
            const token = localStorage.getItem('token');
            if (type === 'announcement') {
                await axios.put(
                    'http://localhost:5000/api/settings/ANNOUNCEMENT_MD',
                    { value: announcement },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setMsg({ type: 'success', text: '✅ 公告保存成功！' });
            } else if (type === 'branches') {
                await axios.put(
                    'http://localhost:5000/api/settings/BRANCH_LIST',
                    { value: JSON.stringify(branches) },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setMsg({ type: 'success', text: '✅ 分院设置保存成功！' });
            }
        } catch (err: any) {
            setMsg({ type: 'error', text: '❌ 保存失败: ' + (err.response?.data?.message || err.message) });
        } finally {
            setSaving(false);
        }
    };

    const addBranch = () => {
        const trimmed = newBranch.trim();
        if (trimmed && !branches.includes(trimmed) && trimmed !== '全部') {
            setBranches([...branches, trimmed]);
            setNewBranch('');
        }
    };

    const removeBranch = (b: string) => {
        setBranches(branches.filter(x => x !== b));
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
                                onClick={() => handleSave('announcement')}
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
                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                {announcement}
                            </ReactMarkdown>
                        ) : (
                            <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>暂无内容</span>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '2rem', backgroundColor: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>🏢 分院下拉选项设置</h3>
                <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    在这里配置系统中的分院名称（例如：总院、A区分院）。保存后，新增产品和前台用户选择分院时，将出现这些下拉选项。系统默认包含“全部”。
                </p>

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-light)' }}>Loading...</div>
                ) : (
                    <>
                        <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem' }}>
                            <input
                                type="text"
                                placeholder="输入新的分院名称..."
                                value={newBranch}
                                onChange={e => setNewBranch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addBranch()}
                                style={{ padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', flex: 1, maxWidth: '300px' }}
                            />
                            <button onClick={addBranch} className="btn-primary" style={{ padding: '0.8rem 1.5rem' }}>➕ 添加</button>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.5rem 1rem', backgroundColor: '#F3F4F6', borderRadius: '20px', fontSize: '0.9rem', color: '#6B7280', display: 'flex', alignItems: 'center' }}>
                                全部 (系统默认)
                            </div>
                            {branches.map(b => (
                                <div key={b} style={{ padding: '0.5rem 1rem', backgroundColor: '#EFF6FF', color: 'var(--primary)', borderRadius: '20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {b}
                                    <button onClick={() => removeBranch(b)} style={{ border: 'none', background: 'none', color: '#60A5FA', cursor: 'pointer', padding: 0, fontSize: '1.2rem', lineHeight: 1 }}>×</button>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => handleSave('branches')} disabled={saving} className="btn-primary">
                            {saving ? '保存中...' : '💾 保存分院设置'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminSettings;
