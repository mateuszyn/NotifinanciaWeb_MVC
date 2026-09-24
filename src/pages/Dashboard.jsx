import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useAssets } from '../hooks/useAssets';
import AssetCard from '../components/AssetCard';
import PortfolioSummary from '../components/PortfolioSummary';
import Header from '../components/Header';

export default function Dashboard() {
    const { isAuthenticated } = useAuth();
    const {
        assets,
        loading,
        error,
        sortBy,
        broker,
        notificationsEnabled,
        onSortChange,
        onBrokerChange,
        onToggleNotif,
    } = useAssets();

    return (
        <>
            <Header
                sortBy={sortBy}
                onSortChange={onSortChange}
                broker={broker}
                onBrokerChange={onBrokerChange}
                notificationsEnabled={notificationsEnabled}
                onToggleNotif={onToggleNotif}
            />

            <div className="container mt-4 mb-5 pb-5">

                {!isAuthenticated && (
                    <p className="text-warning mb-3">
                        <i className="bi bi-eye me-1"></i> Visualizando dados de demonstração.
                    </p>
                )}

                {loading && (
                    <div className="row">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="col-12 col-md-6 col-lg-4 mb-4">
                                <div className="skeleton-card">
                                    <div className="skeleton-header">
                                        <div className="skeleton-line skeleton-title"></div>
                                        <div className="skeleton-circle"></div>
                                    </div>
                                    <div className="skeleton-block"></div>
                                    <div className="skeleton-row">
                                        <div className="skeleton-block"></div>
                                        <div className="skeleton-block"></div>
                                    </div>
                                    <div className="skeleton-block skeleton-block-lg mt-3"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {error && <p className="text-danger">{error}</p>}

                {!loading && <PortfolioSummary assets={assets} />}

                <div className="row mt-3">
                    {!loading && assets.map(asset => (
                        <AssetCard
                            key={asset.id || asset.ticker}
                            asset={asset}
                            broker={broker}
                            isGuest={!isAuthenticated}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}
