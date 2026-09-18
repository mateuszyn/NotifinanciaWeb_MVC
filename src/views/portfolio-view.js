import { BROKERS } from '../utils/brokers.js';
import { AssetService } from '../services/asset-service.js';
import { AssetCardView } from './asset-card-view.js';
import { PortfolioHeaderView } from './portfolio-header-view.js';
import { PortfolioSummaryView } from './portfolio-summary-view.js';
import { PromptView } from './prompt-view.js';
import { FooterView } from './footer-view.js';
import { UpdateAssetModalView } from './update-asset-modal-view.js';

export const PortfolioView = {
    render(assets, user) {
        if (window.location.hash !== '' && window.location.hash !== '#/') return;
        const app = document.querySelector('#app');
        const existingDrawer = document.querySelector('#add-asset-drawer');
        const isDrawerOpen = existingDrawer && !existingDrawer.classList.contains('collapsed');
        const portfolioSummary = AssetService.calculatePortfolioSummary(assets);

        app.innerHTML = `
            ${PortfolioHeaderView.render(user)}
            <!-- Adicionado pb-5 extra via style para garantir que o scroll ultrapasse o botão fixo -->
            <div class="container mt-4 mb-5 pb-5 overflow-hidden" style="padding-bottom: 120px !important;">
                ${PortfolioSummaryView.render(portfolioSummary, assets)}
                <div class="row g-3" id="asset-list">
                    ${AssetCardView.renderList(assets, user)}
                </div>
                ${PromptView.render(assets, user)}
            </div>
            ${user.isGuest ? '' : `
            <div id="add-asset-drawer" class="bottom-drawer ${isDrawerOpen ? '' : 'collapsed'}">
                <!-- Adicionado p-3 para dar espaçamento interno e não colar nas bordas -->
                <div class="drawer-header px-3 pb-3 pt-2" id="drawer-toggle">
                    <div class="drag-handle mx-auto mb-2" style="width: 40px; height: 5px; background: #495057; border-radius: 5px;"></div>
                    <!-- Adicionado mb-3 (respiro inferior), shadow-lg (sombra 3D) e border-radius -->
                    <button class="btn btn-success w-100 fw-bold py-3 mt-1 mb-3 shadow-lg fake-add-btn" style="border-radius: 12px; font-size: 1.05rem; letter-spacing: 0.5px;">
                        + NOVO ATIVO
                    </button>
                </div>
                <div class="drawer-content px-3" id="form-container"></div>
            </div>
            `}
            ${user.isGuest ? '' : UpdateAssetModalView.render()}
            ${FooterView.render()}
        `;

        const sortSelect = document.querySelector('#sort-select');
        if (sortSelect && user.sort_by) sortSelect.value = user.sort_by;
        const brokerSelect = document.querySelector('#broker-select');
        if (brokerSelect && !user.isGuest) {
            brokerSelect.addEventListener('change', event => {
                const selected = event.target.value;
                const info = BROKERS[selected] || BROKERS.Nubank;
                brokerSelect.style.backgroundColor = info.color;
                brokerSelect.style.color = info.textColor;
                brokerSelect.dispatchEvent(new CustomEvent('brokerChanged', { detail: selected }));
            });
        }
        
        const drawer = document.querySelector('#add-asset-drawer');
        const drawerHeader = document.querySelector('#drawer-toggle');
        if (drawer && drawerHeader && !user.isGuest) {
            drawerHeader.replaceWith(drawerHeader.cloneNode(true));
            document.querySelector('#drawer-toggle').addEventListener('click', () => drawer.classList.toggle('collapsed'));
        }
    }
};