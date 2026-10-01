import React, { useState, useEffect, useRef } from 'react';
import { TickerDictionary } from '../utils/ticker-dictionary.js';
import { AssetService } from '../services/asset-service.js';

export default function AddAssetDrawer({ onAddAsset }) {
    const [isOpen, setIsOpen] = useState(false);
    const [ticker, setTicker] = useState('');
    const [quantity, setQuantity] = useState('');
    const [averagePrice, setAveragePrice] = useState('');
    
    const [suggestions, setSuggestions] = useState([]);
    const [snowballInfo, setSnowballInfo] = useState(null);
    const [isLoadingPrice, setIsLoadingPrice] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validatedTickers, setValidatedTickers] = useState(new Set());
    const suggestionsRef = useRef(null);

    // Filter suggestions when ticker changes
    useEffect(() => {
        const query = ticker.trim().toUpperCase();
        if (!query) {
            setSnowballInfo(null);
            setSuggestions([]);
            return;
        }

        if (query.length >= 2) {
            const results = TickerDictionary.search(query);
            setSuggestions(results);
        } else {
            setSuggestions([]);
        }
    }, [ticker]);

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
                setSuggestions([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDrawer = () => setIsOpen(!isOpen);

    const handleQuickQty = (delta) => {
        setQuantity(prev => {
            const current = parseFloat(prev) || 0;
            return (current + delta).toString();
        });
    };

    const fetchCurrentPrice = async () => {
        const cleanTicker = ticker.toUpperCase().trim();
        if (!cleanTicker || cleanTicker.length < 4) {
            window.Swal.fire({ icon: 'error', title: 'Erro', text: 'Informe um ticker válido antes de buscar o valor atual.' });
            return;
        }

        setIsLoadingPrice(true);
        try {
            const data = await AssetService.getPrice(cleanTicker);
            if (!data || data.price <= 0) throw new Error('Não foi possível obter o valor atual.');

            setAveragePrice(data.price.toFixed(2));
            setValidatedTickers(prev => new Set(prev).add(cleanTicker));

            const yieldAnual = Number(data.yieldPct || 0);
            if (yieldAnual > 0) {
                const rendaMensal = (data.price * (yieldAnual / 100)) / 12;
                setSnowballInfo(rendaMensal > 0 ? Math.ceil(data.price / rendaMensal) : 0);
            } else {
                setSnowballInfo(null);
            }
        } catch (error) {
            window.Swal.fire({ icon: 'error', title: 'Erro', text: error.message });
        } finally {
            setIsLoadingPrice(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const cleanTicker = ticker.toUpperCase().trim();
        const qtyValue = Number(quantity);
        const priceValue = parseFloat(averagePrice);

        if (!cleanTicker || !qtyValue || !priceValue) {
            window.Swal.fire({ icon: 'error', title: 'Erro', text: 'Preencha o Ticker, a Quantidade e o Preço Médio.' });
            return;
        }

        setIsSubmitting(true);
        window.Swal.fire({ title: 'Salvando na carteira...', allowOutsideClick: false, didOpen: () => window.Swal.showLoading() });

        try {
            if (!validatedTickers.has(cleanTicker)) {
                window.Swal.update({ title: 'Buscando e validando ativo...' });
                const isValid = await AssetService.validateTicker(cleanTicker);
                if (!isValid) {
                    window.Swal.fire({ icon: 'error', title: 'Erro', text: `O ticker "${cleanTicker}" não foi encontrado na B3.` });
                    setIsSubmitting(false);
                    return;
                }
                setValidatedTickers(prev => new Set(prev).add(cleanTicker));
                window.Swal.update({ title: 'Salvando na carteira...' });
            }

            await onAddAsset({ ticker: cleanTicker, quantity: qtyValue, averagePrice: priceValue });

            // Limpa form e fecha gaveta
            setTicker('');
            setQuantity('');
            setAveragePrice('');
            setSnowballInfo(null);
            setIsOpen(false);
            
            window.Swal.fire({ icon: 'success', title: 'Sucesso!', text: `${cleanTicker} adicionado com sucesso!`, timer: 2000, showConfirmButton: false });
        } catch (error) {
            window.Swal.fire({ icon: 'error', title: 'Erro', text: 'Erro ao processar sua solicitação.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={`bottom-drawer ${isOpen ? '' : 'collapsed'}`}>
            <div className="drawer-header px-3 pb-3 pt-2" onClick={toggleDrawer} style={{ cursor: 'pointer' }}>
                <div className="drag-handle mx-auto mb-2" style={{ width: '40px', height: '5px', background: '#495057', borderRadius: '5px' }}></div>
                <button className="btn btn-success w-100 fw-bold py-3 mt-1 mb-3 shadow-lg fake-add-btn" style={{ borderRadius: '12px', fontSize: '1.05rem', letterSpacing: '0.5px' }}>
                    + NOVO ATIVO
                </button>
            </div>
            
            <div className="drawer-content px-3">
                <form id="form-asset" className="mt-2" onSubmit={handleSubmit}>
                    <div className="row g-2 align-items-end">
                        
                        {/* Ticker Input */}
                        <div className="form-group mb-3 position-relative" ref={suggestionsRef}>
                            <label className="small text-secondary fw-bold mb-1">Ticker</label>
                            <input 
                                type="text" 
                                className="form-control bg-black text-white border-secondary text-uppercase" 
                                placeholder="Ex: PETR4" 
                                required
                                value={ticker}
                                onChange={(e) => setTicker(e.target.value)}
                            />
                            {suggestions.length > 0 && (
                                <ul className="dropdown-menu w-100 shadow-lg bg-dark border-secondary" style={{ display: 'block', position: 'absolute', top: '100%', zIndex: 1000 }}>
                                    {suggestions.map((s, idx) => (
                                        <li key={idx}>
                                            <a 
                                                className="dropdown-item text-white border-bottom border-secondary py-2 cursor-pointer hover-bg-light" 
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setTicker(s);
                                                    setSuggestions([]);
                                                }}
                                            >
                                                {s}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Average Price Input (Swapped) */}
                        <div className="col-8 col-md-3">
                            <label className="small text-secondary fw-bold mb-1">P. Médio (R$)</label>
                            <div className="input-group input-group-sm">
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    className="form-control bg-black text-white border-secondary" 
                                    placeholder={isLoadingPrice ? "Buscando..." : "0.00"}
                                    value={averagePrice}
                                    onChange={(e) => setAveragePrice(e.target.value)}
                                />
                                <button 
                                    type="button" 
                                    className="btn btn-outline-primary px-2" 
                                    title="Preencher com o valor atual"
                                    onClick={fetchCurrentPrice}
                                    disabled={isLoadingPrice}
                                >
                                    {isLoadingPrice ? <i className="bi bi-arrow-repeat spin-animation"></i> : '$ Atual'}
                                </button>
                            </div>
                        </div>

                        {/* Quantity Input (Swapped) */}
                        <div className="col-8 col-md-4">
                            <label className="small text-secondary fw-bold mb-1 d-flex align-items-center gap-2">
                                Quantidade
                                {snowballInfo && (
                                    <span style={{ color: '#8fe3a7', fontSize: '0.85em', marginLeft: '5px' }}>
                                        (Compre {snowballInfo} para a bola de neve)
                                    </span>
                                )}
                            </label>
                            <div className="input-group input-group-sm">
                                <input 
                                    type="number" 
                                    className="form-control bg-black text-white border-secondary" 
                                    placeholder="0" 
                                    step="any" 
                                    style={{ flex: 1.5 }}
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                />
                                <button type="button" className="btn btn-dark border-secondary px-2" onClick={() => handleQuickQty(1)}>+1</button>
                                <button type="button" className="btn btn-dark border-secondary px-2" onClick={() => handleQuickQty(10)}>+10</button>
                                <button type="button" className="btn btn-dark border-secondary px-2" onClick={() => handleQuickQty(100)}>+100</button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="col-4 col-md-2">
                            <label className="small d-block mb-1" style={{ visibility: 'hidden' }}>Confirmar</label>
                            <button type="submit" className="btn btn-success w-100 fw-bold btn-sm py-2" style={{ height: '40px' }} disabled={isSubmitting}>
                                ADICIONAR
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
