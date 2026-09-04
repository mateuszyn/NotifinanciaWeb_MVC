import { BROKERS } from '../utils/brokers.js';

export const PortfolioHeaderView = {
	render(user) {
		const rawUserName = user.user_metadata?.full_name || user.email.split('@')[0];
		const firstName = rawUserName.split(' ')[0];
		const userName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
		const currentBroker = user.preferred_broker || 'Nubank';
		const brokerInfo = BROKERS[currentBroker];
		const bellIcon = user.notifications_enabled ? 'bi-bell-fill text-warning' : 'bi-bell text-secondary';
		const tooltipMessage = user.notifications_enabled
			? 'Notificações Diárias Ativas (18h)'
			: 'Ative o sininho para receber relatório diário da carteira';

		return `
			<header class="bg-dark px-3 py-3 border-bottom border-secondary">
				<div class="header-container container-fluid p-0 d-flex flex-column flex-lg-row align-items-center justify-content-between gap-2 gap-lg-3">
					<div class="header-brand text-center text-lg-start">
						<div class="fw-bold text-success title-responsive">NOTIFINANCIA</div>
						<div class="text-secondary fw-bold subtitle-responsive">Relatórios Diários Sobre Sua Carteira!</div>
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
						<button id="btn-toggle-notif" class="btn btn-link p-0 shadow-none border-0" ${user.isGuest ? 'disabled' : ''} data-bs-toggle="tooltip" data-bs-placement="bottom" title="${tooltipMessage}">
							<i class="${bellIcon} fs-4"></i>
						</button>
						<span class="text-secondary d-none d-md-block small">Olá, <b class="text-white">${user.isGuest ? 'Visitante' : userName}</b></span>
						${user.isGuest ? '<button class="btn btn-success btn-sm rounded-pill px-4 fw-bold" data-bs-toggle="modal" data-bs-target="#loginModal">Entrar</button>' : '<button id="btn-logout" class="btn btn-outline-danger btn-sm rounded-pill px-3">Sair</button>'}
					</div>
				</div>
			</header>`;
	}
};
