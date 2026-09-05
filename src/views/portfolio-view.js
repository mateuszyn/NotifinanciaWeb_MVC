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

        app.innerHTML = `${PortfolioHeaderView.render(user)}<div class="container mt-4 mb-5 pb-5">${PortfolioSummaryView.render(portfolioSummary)}<div class="row" id="asset-list">${AssetCardView.renderList(assets, user)}</div>${PromptView.render(assets, user)}</div>${user.isGuest ? '' : `<div id="add-asset-drawer" class="bottom-drawer ${isDrawerOpen ? '' : 'collapsed'}"><div class="drawer-header" id="drawer-toggle"><div class="drag-handle"></div><button class="btn btn-success w-100 fw-bold py-2 mt-3 fake-add-btn">+ NOVO ATIVO</button></div><div class="drawer-content" id="form-container"></div></div>`}${user.isGuest ? '' : UpdateAssetModalView.render()}${FooterView.render()}`;

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
