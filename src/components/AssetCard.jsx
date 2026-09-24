import React from 'react';
import { BROKERS } from '../utils/brokers.js';

export default function AssetCard({ asset, broker, isGuest }) {
    const profitPct = asset.variacaoPm || 0;
    const dailyChange = asset.dailyChange || 0;
    const profitTextClass = profitPct >= 0 ? 'text-profit-pos' : 'text-profit-neg';
    const dailyTextClass = dailyChange >= 0 ? 'text-profit-pos' : 'text-profit-neg';
    
    let borderClass = 'border-neutral-portfolio';
    if (profitPct > 0) borderClass = dailyChange >= 0 ? 'border-profit-viva-pos' : 'border-profit-dia-neg';
    else if (profitPct < 0) borderClass = dailyChange >= 0 ? 'border-loss-dia-pos' : 'border-loss-viva-neg';
    
    const ticker = asset.ticker;
    const brokerName = broker || 'Nubank';
    const brokerInfo = BROKERS[brokerName] || BROKERS.Nubank;
    
    const yieldPct = asset.yieldPct || 0;
    const divMensal = asset.divMensal || 0;
    const currentPrice = Number(asset.currentPrice) || 0;
    const quantity = Number(asset.quantity) || 0;
    
    return (
        <div className="col-12 col-md-6 col-lg-4 mb-4">
            <div className={`asset-card ${borderClass}`}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="m-0 fw-bold">{ticker}</h4>
                    {/* Botões de Ação Aqui */}
                </div>
                
                <div className="row mb-3">
                    <div className="col-12">
                        <p className="price-value mb-0">Total: R$ {(quantity * currentPrice).toFixed(2)}</p>
                        <p className="small text-secondary fw-bold mb-1">QTD: {quantity}</p>
                    </div>
                </div>

                <div className="row border-top border-bottom border-secondary py-2 mb-3">
                    <div className="col-6 border-end border-secondary">
                        <p className="price-label">P. Médio</p>
                        <p className="price-value">R$ {(asset.averagePrice || 0).toFixed(2)} <span className={`${profitTextClass} small`}>({profitPct.toFixed(2)}%)</span></p>
                    </div>
                    <div className="col-6 ps-3">
                        <p className="price-label">Preço Atual</p>
                        <p className="price-value d-flex align-items-center gap-1">R$ {currentPrice.toFixed(2)} <span className={`${dailyTextClass} small`}>({dailyChange >= 0 ? '+' : ''}{dailyChange.toFixed(2)}%)</span></p>
                    </div>
                </div>

                <a href={brokerInfo.appUrl || brokerInfo.webUrl} target="_blank" rel="noopener noreferrer" 
                   className="btn w-100 d-flex align-items-center justify-content-center gap-2" 
                   style={{ backgroundColor: brokerInfo.color, color: brokerInfo.textColor, border: 'none', fontWeight: 'bold', borderRadius: '8px', height: '45px' }}>
                   <i className="bi bi-box-arrow-up-right"></i> Operar na {brokerName}
                </a>
            </div>
        </div>
    );
}
