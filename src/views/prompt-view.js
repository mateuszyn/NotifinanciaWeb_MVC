export const PromptView = {
	render(assets, user) {
		if (user.isGuest) return '';
		const prompt = `Atue como um analista financeiro sênior especialista na metodologia Barsi e em carteiras previdenciárias de dividendos.

Aqui está a fotografia da minha carteira hoje:
${assets.map(a => `- ${a.ticker} (Qtd: ${a.quantity} cotas): Preço R$ ${(Number(a.currentPrice) || 0).toFixed(2)} | Rentabilidade PM: ${(Number(a.variacaoPm) || 0).toFixed(2)}% | Variação Hoje: ${(Number(a.dailyChange) || 0).toFixed(2)}%`).join('\n')}`;
		return `<div class="d-flex flex-column align-items-center mt-5 mb-5"><button onclick="window.open('https://gemini.google.com/', '_blank')" class="btn btn-primary rounded-pill px-4 py-2 fw-bold d-inline-flex align-items-center justify-content-center gap-2 shadow-sm mb-4" style="background-color: #1a73e8; border: none;">Pergunte ao Gemini</button><div class="text-start bg-dark border border-secondary rounded p-3" style="max-width: 600px; width: 100%;"><div class="d-flex justify-content-between align-items-center mb-2"><span class="text-secondary small fw-bold">Copie o prompt abaixo e cole no Gemini:</span><button id="btn-copy-gemini-prompt" class="btn btn-sm btn-outline-success border-0 px-2 py-1"><i class="bi bi-clipboard"></i> Copiar</button></div><textarea id="gemini-prompt" readonly class="form-control bg-black text-white border-secondary font-monospace" style="height: 180px; font-size: 0.75rem; resize: none;">${prompt}</textarea></div></div>`;
	}
};
