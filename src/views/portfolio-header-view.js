import { BROKERS } from '../utils/brokers.js';

export const PortfolioHeaderView = {
    render(user) {
        const rawUserName = user.user_metadata?.full_name || user.email.split('@')[0];
        const avatarUrl = user.user_metadata?.avatar_url || '/favicon-32x32.png';
        const currentBroker = user.preferred_broker || 'Nubank';
        const brokerInfo = BROKERS[currentBroker] || BROKERS.Nubank;
        const bellIcon = user.notifications_enabled ? 'bi-bell-fill text-warning' : 'bi-bell text-secondary';
        const tooltipMessage = user.notifications_enabled
            ? 'Notificações Diárias Ativas (18h)'
            : 'Ative o sininho para receber relatório diário da carteira';
            // Gera uma URL de fallback com a primeira letra do nome em um fundo escuro
        const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(rawUserName)}&background=1a1d29&color=007bff&bold=true`;

        return `
            <header class="bg-dark px-3 py-3 border-bottom border-secondary">
                <div class="header-container container-fluid p-0 d-flex flex-column flex-lg-row align-items-center justify-content-between gap-2 gap-lg-3">
                    <div class="header-brand text-center text-lg-start">
                        <div class="fw-bold text-success title-responsive">NOTIFINANCIA</div>
                        <div class="text-secondary fw-bold subtitle-responsive">Relatórios Diários da Carteira</div>
                    </div>
                    <div class="d-flex flex-row gap-2 justify-content-center filter-container">
                        <select id="sort-select" class="form-select bg-dark text-white border-secondary form-select-sm" ${user.isGuest ? 'disabled' : ''}>
                            <option value="pm_asc">P.M. (Menor %)</option>
                            <option value="pm_desc">P.M. (Maior %)</option>
                            <option value="name_asc">Nome (A-Z)</option>
                            <option value="total_desc">Valor Total</option>
                        </select>
                        <select id="broker-select" class="form-select border-secondary form-select-sm" style="background-color: ${brokerInfo.color}; color: ${brokerInfo.textColor}; font-weight: bold;" ${user.isGuest ? 'disabled' : ''}>
                            <option value="Nubank" ${currentBroker === 'Nubank' ? 'selected' : ''}>Nubank</option>
                            <option value="Inter" ${currentBroker === 'Inter' ? 'selected' : ''}>Inter</option>
                            <option value="XP" ${currentBroker === 'XP' ? 'selected' : ''}>XP</option>
                            <option value="Rico" ${currentBroker === 'Rico' ? 'selected' : ''}>Rico</option>
                        </select>
                    </div>
                    <div class="d-flex align-items-center justify-content-center gap-3 actions-container">
                        <button id="btn-toggle-notif" class="btn btn-link p-0 shadow-none border-0" ${user.isGuest ? 'disabled' : ''} data-bs-toggle="tooltip" title="${tooltipMessage}">
                            <span class="notification-mail-icon" aria-hidden="true"><i class="bi bi-envelope-fill fs-4"></i><i class="${bellIcon} notification-bell-icon"></i></span>
                        </button>
                        ${user.isGuest ? '<button class="btn btn-success btn-sm rounded-pill px-4 fw-bold" data-bs-toggle="modal" data-bs-target="#loginModal">Entrar</button>' : `<details class="user-menu"><summary class="user-menu-trigger" aria-label="Abrir menu da conta"><img src="${avatarUrl}" alt="Foto de ${rawUserName}" class="user-avatar"></summary><div class="user-menu-panel"><div class="user-menu-account"><img src="${avatarUrl}" alt="" class="user-menu-avatar"><div><strong>${rawUserName}</strong><small>${user.email || ''}</small></div></div><class="user-menu-item"><button type="button" id="btn-logout" class="user-menu-item user-menu-logout"><i class="bi bi-box-arrow-right"></i> Sair</button></div></details>`}
                    </div>
                </div>
            </header>`;
    }
};
