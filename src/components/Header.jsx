import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { BROKERS } from '../utils/brokers.js';
import { supabase } from '../infrastructure/supabase-client.js';

export default function Header({ sortBy, onSortChange, broker, onBrokerChange, notificationsEnabled, onToggleNotif }) {
    const { user, isAuthenticated, signOut, signInWithGoogle } = useAuth();
    const [showNotifBalloon, setShowNotifBalloon] = useState(false);
    const notifRef = useRef(null);

    const rawUserName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
    const avatarUrl = user?.user_metadata?.avatar_url || '';
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(rawUserName)}&background=1a1d29&color=007bff&bold=true`;

    const currentBroker = broker || 'Nubank';
    const brokerInfo = BROKERS[currentBroker] || BROKERS.Nubank;

    const bellIcon = notificationsEnabled ? 'bi-bell-fill text-warning' : 'bi-bell text-secondary';

    // Fecha o balão ao clicar fora
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifBalloon(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotifClick = () => {
        if (!isAuthenticated) return;
        // Mostra o balão, e depois aciona o toggle
        setShowNotifBalloon(prev => !prev);
        onToggleNotif && onToggleNotif();
    };

    return (
        <header className="bg-dark px-3 py-3 border-bottom border-secondary">
            <div className="header-container container-fluid p-0 d-flex flex-column flex-lg-row align-items-center justify-content-between gap-2 gap-lg-3">
                
                {/* Logo */}
                <div className="header-brand text-center text-lg-start">
                    <div className="fw-bold text-success title-responsive">NOTIFINANCIA</div>
                    <div className="text-secondary fw-bold subtitle-responsive">Relatórios Diários da Carteira</div>
                </div>

                {/* Filtros centrais */}
                <div className="d-flex flex-row gap-2 justify-content-center filter-container">
                    <select
                        id="sort-select"
                        className="form-select bg-dark text-white border-secondary form-select-sm"
                        disabled={!isAuthenticated}
                        value={sortBy || 'pm_asc'}
                        onChange={e => onSortChange && onSortChange(e.target.value)}
                    >
                        <option value="pm_asc">P.M. (Menor %)</option>
                        <option value="pm_desc">P.M. (Maior %)</option>
                        <option value="name_asc">Nome (A-Z)</option>
                        <option value="name_desc">Nome (Z-A)</option>
                        <option value="total_desc">Valor Total ↓</option>
                        <option value="total_asc">Valor Total ↑</option>
                        <option value="day_desc">Dia (Melhor)</option>
                        <option value="day_asc">Dia (Pior)</option>
                    </select>

                    <select
                        id="broker-select"
                        className="form-select border-secondary form-select-sm"
                        style={{ backgroundColor: brokerInfo.color, color: brokerInfo.textColor, fontWeight: 'bold' }}
                        disabled={!isAuthenticated}
                        value={currentBroker}
                        onChange={e => onBrokerChange && onBrokerChange(e.target.value)}
                    >
                        {Object.keys(BROKERS).map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                </div>

                {/* Ações à direita */}
                <div className="d-flex align-items-center justify-content-center gap-3 actions-container">
                    
                    {/* Sino de Notificações com balão mobile */}
                    <div className="position-relative" ref={notifRef}>
                        <button
                            id="btn-toggle-notif"
                            className="btn btn-link p-0 shadow-none border-0"
                            disabled={!isAuthenticated}
                            onClick={handleNotifClick}
                            aria-label="Ativar/desativar notificações"
                        >
                            <span className="notification-mail-icon" aria-hidden="true">
                                <i className="bi bi-envelope-fill fs-4"></i>
                                <i className={`${bellIcon} notification-bell-icon`}></i>
                            </span>
                        </button>

                        {/* Balão de aviso — visível após o clique */}
                        {showNotifBalloon && (
                            <div style={{
                                position: 'absolute',
                                top: 'calc(100% + 10px)',
                                right: 0,
                                zIndex: 1050,
                                background: '#1e2330',
                                border: '1px solid #495057',
                                borderRadius: '10px',
                                padding: '10px 14px',
                                minWidth: '220px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                fontSize: '0.82rem',
                                lineHeight: '1.4',
                                whiteSpace: 'nowrap',
                            }}>
                                {/* Seta apontando para cima */}
                                <div style={{
                                    position: 'absolute',
                                    top: '-7px',
                                    right: '12px',
                                    width: 0,
                                    height: 0,
                                    borderLeft: '7px solid transparent',
                                    borderRight: '7px solid transparent',
                                    borderBottom: '7px solid #495057',
                                }} />
                                {notificationsEnabled ? (
                                    <>
                                        <i className="bi bi-bell-fill text-warning me-2"></i>
                                        <strong className="text-warning">Notificações Ativas</strong>
                                        <p className="text-secondary mb-0 mt-1" style={{ whiteSpace: 'normal' }}>
                                            Você receberá um relatório da carteira diariamente às <strong className="text-white">18h</strong>.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-bell-slash text-secondary me-2"></i>
                                        <strong className="text-secondary">Notificações Desativadas</strong>
                                        <p className="text-secondary mb-0 mt-1" style={{ whiteSpace: 'normal' }}>
                                            Clique no sininho para receber relatórios às <strong className="text-white">18h</strong>.
                                        </p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Menu do Usuário ou Botão Entrar */}
                    {!isAuthenticated ? (
                        <button
                            className="btn btn-success btn-sm rounded-pill px-4 fw-bold"
                            onClick={signInWithGoogle}
                        >
                            Entrar
                        </button>
                    ) : (
                        <details className="user-menu">
                            <summary className="user-menu-trigger" aria-label="Abrir menu da conta">
                                <img
                                    src={avatarUrl || fallbackAvatar}
                                    onError={e => { e.target.onerror = null; e.target.src = fallbackAvatar; }}
                                    alt={`Foto de ${rawUserName}`}
                                    className="user-avatar"
                                />
                            </summary>
                            <div className="user-menu-panel">
                                <div className="user-menu-account">
                                    <img
                                        src={avatarUrl || fallbackAvatar}
                                        onError={e => { e.target.onerror = null; e.target.src = fallbackAvatar; }}
                                        alt=""
                                        className="user-menu-avatar"
                                    />
                                    <div>
                                        <strong>{rawUserName}</strong>
                                        <small>{user?.email || ''}</small>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="user-menu-item"
                                    onClick={signInWithGoogle}
                                >
                                    <i className="bi bi-person-plus"></i> Adicionar conta
                                </button>
                                <button
                                    type="button"
                                    className="user-menu-item user-menu-logout"
                                    onClick={signOut}
                                >
                                    <i className="bi bi-box-arrow-right"></i> Sair
                                </button>
                            </div>
                        </details>
                    )}
                </div>
            </div>
        </header>
    );
}
