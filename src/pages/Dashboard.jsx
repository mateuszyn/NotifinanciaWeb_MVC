import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAssets } from '../hooks/useAssets';
import AssetCard from '../components/AssetCard';
import PortfolioSummary from '../components/PortfolioSummary';
import Header from '../components/Header';
import UpdateAssetModal from '../components/UpdateAssetModal';
import AddAssetDrawer from '../components/AddAssetDrawer';

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
        addAsset,
        updateAsset,
        deleteAsset,
        refreshSingleAsset
    } = useAssets();

    const [editingAsset, setEditingAsset] = useState(null);

    const handleSaveEdit = async (id, data) => {
        try {
            await updateAsset(id, data);
            setEditingAsset(null);
            window.Swal.fire({ icon: 'success', title: 'Sucesso!', text: 'Ativo atualizado.', timer: 2000, showConfirmButton: false });
        } catch (err) {
            window.Swal.fire({ icon: 'error', title: 'Erro', text: err.message });
        }
    };

    const handleDelete = (asset) => {
        const isFII = asset.ticker.endsWith('11');
        const lucro = (asset.currentPrice - asset.averagePrice) * asset.quantity;
        const temLucro = lucro > 0;
        const temPrejuizo = lucro < 0;

        const getLastBusinessDay = () => {
            const today = new Date();
            const nextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
            let dayOfWeek = nextMonth.getDay();
            if (dayOfWeek === 0) nextMonth.setDate(nextMonth.getDate() - 2);
            else if (dayOfWeek === 6) nextMonth.setDate(nextMonth.getDate() - 1);
            return `${String(nextMonth.getDate()).padStart(2, '0')}/${String(nextMonth.getMonth() + 1).padStart(2, '0')}/${nextMonth.getFullYear()}`;
        };

        let alertConfig;

        if (isFII && temLucro) {
            const imposto = lucro * 0.20;
            alertConfig = {
                title: 'Atenção: Imposto Devido',
                icon: 'warning',
                html: `
                    <div class="mb-3">
                        Lucro apurado: <b>R$ ${lucro.toFixed(2).replace('.', ',')}</b><br>
                        Imposto a pagar (20%): <b><span class="text-danger">R$ ${imposto.toFixed(2).replace('.', ',')}</span></b>
                    </div>
                    <div class="text-start">
                        <p class="small text-secondary mb-2"><b>1.</b> Efetue a venda na sua corretora.</p>
                        <p class="small text-secondary mb-1"><b>2.</b> Acesse o SicalcWeb e gere o DARF (cód. 6015) até <b>${getLastBusinessDay()}</b>.</p>
                    </div>
                `,
                showCloseButton: true, allowOutsideClick: false, showCancelButton: true,
                confirmButtonColor: '#dc3545', confirmButtonText: 'Sim, remover da carteira', cancelButtonText: 'Cancelar'
            };
        } else if (isFII && temPrejuizo) {
            alertConfig = {
                title: 'Venda com Prejuízo (Sem Imposto)',
                icon: 'info',
                html: `
                    <div class="mb-3">Prejuízo apurado: <b class="text-danger">R$ ${Math.abs(lucro).toFixed(2).replace('.', ',')}</b></div>
                    <div class="text-start">
                        <p class="small text-secondary mb-2">Como a operação gerou prejuízo, não há DARF a pagar sobre essa venda.</p>
                        <p class="small text-secondary mb-1">Recomendamos anotar este prejuízo para abater de futuros lucros com FIIs na sua declaração anual.</p>
                    </div>
                `,
                showCloseButton: true, allowOutsideClick: false, showCancelButton: true,
                confirmButtonColor: '#dc3545', confirmButtonText: 'Entendi, remover ativo', cancelButtonText: 'Cancelar'
            };
        } else {
            alertConfig = {
                title: 'Excluir Ativo?', text: "Você não poderá reverter isso!", icon: 'warning',
                showCancelButton: true, confirmButtonColor: '#dc3545', cancelButtonColor: '#6c757d',
                confirmButtonText: 'Sim, excluir!', cancelButtonText: 'Cancelar'
            };
        }

        window.Swal.fire(alertConfig).then(async (result) => {
            if (result.isConfirmed) {
                window.Swal.fire({ title: 'Excluindo ativo...', allowOutsideClick: false, didOpen: () => window.Swal.showLoading() });
                try {
                    await deleteAsset(asset.id);
                    window.Swal.fire({ title: 'Ativo Removido!', icon: 'success', showConfirmButton: false, timer: 1500 });
                } catch (err) {
                    window.Swal.fire({ icon: 'error', title: 'Erro', text: err.message });
                }
            }
        });
    };

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
                            onEdit={setEditingAsset}
                            onDelete={handleDelete}
                            onRetry={() => refreshSingleAsset(asset.ticker)}
                        />
                    ))}
                </div>
            </div>

            <UpdateAssetModal 
                asset={editingAsset} 
                onClose={() => setEditingAsset(null)} 
                onSave={handleSaveEdit} 
            />
            
            {isAuthenticated && (
                <AddAssetDrawer onAddAsset={addAsset} />
            )}
        </>
    );
}
