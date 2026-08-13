export const Security = {
    /**
     * Converte caracteres especiais em entidades HTML,
     * impedindo que o navegador interprete o texto como código executável.
     */
    escapeHTML(str) {
        if (!str || typeof str !== 'string') return str;
        
        return str.replace(/[&<>'"]/g, (tag) => {
            const charsToReplace = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            };
            return charsToReplace[tag] || tag;
        });
    }
};