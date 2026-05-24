import React, { useState, useRef, useEffect } from 'react';

interface GlassSelectProps {
    value: string;
    onChange: (val: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
}

const GlassSelect: React.FC<GlassSelectProps> = ({ value, onChange, options, placeholder = "Please select...", required, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value);
    // If the value exists but isn't in options (legacy/cached data), show the value itself
    const displayLabel = selectedOption ? selectedOption.label : (value || placeholder);

    return (
        <div ref={ref} style={{ position: 'relative', width: '100%' }}>
            <div 
                className="glass-input"
                onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
                style={{
                    width: '100%', padding: '0.8rem', fontSize: '1.1rem',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center', boxSizing: 'border-box',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    userSelect: 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: disabled ? 'rgba(243,244,246,0.5)' : undefined,
                    color: disabled ? '#6B7280' : 'inherit',
                    border: isOpen ? '1px solid var(--primary)' : undefined,
                    boxShadow: isOpen ? '0 0 0 3px rgba(255, 188, 153, 0.3)' : undefined,
                }}
            >
                {/* Spacer to keep text perfectly centered */}
                <span style={{ width: '16px' }}></span>
                
                <span style={{ flex: 1, color: value ? 'inherit' : '#9CA3AF' }}>
                    {displayLabel}
                </span>
                
                <span style={{ 
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                    transition: 'transform 0.3s ease', 
                    fontSize: '0.7rem',
                    color: '#9CA3AF',
                    width: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    ▼
                </span>
            </div>

            {isOpen && (
                <div className="glass fade-in" style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    marginTop: '0.4rem',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    zIndex: 99999,
                    maxHeight: '220px', overflowY: 'auto',
                    padding: '0.4rem',
                    display: 'flex', flexDirection: 'column', gap: '0.2rem',
                    animation: 'fadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                    {options.map(opt => {
                        const isSelected = value === opt.value;
                        return (
                            <div 
                                key={opt.value}
                                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                style={{
                                    padding: '0.8rem 1rem',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    borderRadius: '8px',
                                    backgroundColor: isSelected ? 'rgba(255, 188, 153, 0.4)' : 'transparent',
                                    color: isSelected ? 'var(--primary-text)' : 'var(--text-dark)',
                                    fontWeight: isSelected ? 600 : 400,
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={e => {
                                    if (!isSelected) {
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isSelected) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                {opt.label}
                            </div>
                        );
                    })}
                </div>
            )}
            
            {/* Hidden input to enforce 'required' if needed inside a form */}
            {required && (
                <input 
                    type="text" 
                    value={value} 
                    required 
                    style={{ opacity: 0, position: 'absolute', bottom: 0, left: '50%', height: 0, width: 0, padding: 0, margin: 0, border: 'none', pointerEvents: 'none' }} 
                    onChange={() => {}} 
                />
            )}
        </div>
    );
};

export default GlassSelect;
