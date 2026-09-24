import React from 'react';
import { AssetService } from '../services/asset-service.js';

export default function PortfolioSummary({ assets }) {
    if (!assets || assets.length === 0) return null;

    const summary = AssetService.calculatePortfolioSummary(assets);
    
    const formatCurrency = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    const profitClass = summary.profit >= 0 ? 'positive' : 'negative';
    const textProfitClass = summary.profit >= 0 ? 'text-profit-pos' : 'text-profit-neg';
    
    let borderClass = 'border-neutral-portfolio';
    if (summary.profit > 0) borderClass = summary.dailyChangePct >= 0 ? 'border-profit-viva-pos' : 'border-profit-dia-neg';
    else if (summary.profit < 0) borderClass = summary.dailyChangePct >= 0 ? 'border-loss-dia-pos' : 'border-loss-viva-neg';

    return (
        <section className={`portfolio-summary ${borderClass} mb-4`} aria-label="Resumo consolidado da carteira">
            <div className="portfolio-summary-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                <div>
                    <span className="summary-eyebrow">Visão consolidada</span>
                    <h2 className="summary-title">Painel da Carteira</h2>
                </div>
                
                <div className="ticker-squares-grid">
                    {assets.map(asset => {
                        const pmVal = asset.variacaoPm || asset.variacaoPM || 0;
                        const dailyVal = asset.dailyChange || 0;
                        const pmClass = pmVal >= 0 ? 'text-profit-pos' : 'text-profit-neg';
                        const dailyClass = dailyVal >= 0 ? 'text-profit-pos' : 'text-profit-neg';
                        const squareBorderClass = pmVal >= 0 ? 'border-success' : 'border-danger';

                        return (
                            <details key={asset.id || asset.ticker} className="ticker-square-wrapper">
                                <summary className={`ticker-square ${squareBorderClass}`} title={asset.ticker}>
                                    <span className="ticker-symbol">{asset.ticker.replace(/\.SA$/i, '')}</span>
                                </summary>
                                <div className="ticker-popover text-start">
                                    <div className="ticker-popover-title"><strong>{asset.ticker}</strong></div>
                                    <div className="ticker-popover-row">
                                        <span>P.M.:</span> <strong className={pmClass}>{pmVal >= 0 ? '+' : ''}{pmVal.toFixed(2)}%</strong>
                                    </div>
                                    <div className="ticker-popover-row">
                                        <span>Hoje:</span> <strong className={dailyClass}>{dailyVal >= 0 ? '+' : ''}{dailyVal.toFixed(2)}%</strong>
                                    </div>
                                </div>
                            </details>
                        );
                    })}
                </div>
            </div>
            
            <div className="portfolio-summary-grid mt-3">
                <div className="summary-metric summary-metric-highlight">
                    <span>Patrimônio atual</span>
                    <strong>{formatCurrency(summary.currentValue)}</strong>
                </div>
                <div className="summary-metric">
                    <span>Variação global</span>
                    <strong className={textProfitClass}>{formatCurrency(summary.profit)}</strong>
                    <small className={textProfitClass}>{(summary.profitPct || 0) >= 0 ? '+' : ''}{(summary.profitPct || 0).toFixed(2)}%</small>
                </div>
                <div className="summary-metric">
                    <span>DY esperado anual</span>
                    <strong>{formatCurrency(summary.annualDividends)}</strong>
                    <details className="dy-info-wrapper">
                        <summary className="dy-info-btn" aria-label="Informações sobre o cálculo do DY">
                            <i className="bi bi-info-circle-fill"></i>
                        </summary>
                        <div className="dy-info-popover text-start">
                            O Dividend Yield (DY) é baseado nos proventos pagos nos últimos 12 meses, obtidos via Yahoo Finance. Trata-se de uma base estimada e indicativa, <strong>não constituindo garantia</strong> de rendimentos futuros.
                        </div>
                    </details>
                </div>
                <div className="summary-metric">
                    <span>DY médio mensal</span>
                    <strong>{(summary.monthlyYieldPct || 0).toFixed(2)}%</strong>
                    <small>{formatCurrency((summary.annualDividends || 0) / 12)} / mês</small>
                </div>
            </div>
        </section>
    );
}
