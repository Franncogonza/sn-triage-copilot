/**
 * State Manager
 * Gestión centralizada del estado de la aplicación con sincronización automática
 */

class AppState {
    constructor() {
        this.tickets = [];
        this.facturaConfig = {
            nombre: 'Franco Gonzalez',
            destinatario: 'Mdprocurement@mindata.es',
            cc: 'gonzalez.francodavid@hotmail.com',
            cuentaIndex: 2
        };
        this.safeMode = false;
        this.currentLang = 'es';
    }

    // =====================
    // Tickets
    // =====================
    
    getTickets() {
        return this.tickets;
    }

    setTickets(tickets) {
        this.tickets = tickets;
    }

    getTicketCount() {
        return this.tickets.length;
    }

    // =====================
    // Factura Config
    // =====================
    
    getFacturaConfig() {
        return this.facturaConfig;
    }

    async loadFacturaConfig() {
        try {
            const result = await chrome.storage.local.get('FACTURA_CONFIG');
            if (result.FACTURA_CONFIG) {
                this.facturaConfig = result.FACTURA_CONFIG;
            }
        } catch (e) {
            console.error('[State] Error loading factura config:', e);
        }
    }

    async saveFacturaConfig(config) {
        this.facturaConfig = config;
        try {
            await chrome.storage.local.set({ FACTURA_CONFIG: config });
        } catch (e) {
            console.error('[State] Error saving factura config:', e);
        }
    }

    // =====================
    // Safe Mode
    // =====================
    
    getSafeMode() {
        return this.safeMode;
    }

    async loadSafeMode() {
        try {
            const result = await chrome.storage.local.get('SAFE_MODE');
            this.safeMode = result.SAFE_MODE || false;
        } catch (e) {
            console.error('[State] Error loading safe mode:', e);
        }
    }

    async setSafeMode(enabled) {
        this.safeMode = enabled;
        try {
            await chrome.storage.local.set({ SAFE_MODE: enabled });
        } catch (e) {
            console.error('[State] Error saving safe mode:', e);
        }
    }

    // =====================
    // Language
    // =====================
    
    getCurrentLang() {
        return this.currentLang;
    }

    async loadLanguage() {
        try {
            const result = await chrome.storage.local.get('APP_LANGUAGE');
            this.currentLang = result.APP_LANGUAGE || this.detectLanguage();
        } catch (e) {
            console.error('[State] Error loading language:', e);
            this.currentLang = this.detectLanguage();
        }
    }

    async setLanguage(lang) {
        this.currentLang = lang;
        try {
            await chrome.storage.local.set({ APP_LANGUAGE: lang });
        } catch (e) {
            console.error('[State] Error saving language:', e);
        }
    }

    detectLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        return browserLang.toLowerCase().startsWith('es') ? 'es' : 'en';
    }

    // =====================
    // API Key
    // =====================
    
    async getApiKey() {
        try {
            const result = await chrome.storage.local.get('OPENAI_API_KEY');
            return result.OPENAI_API_KEY || null;
        } catch (e) {
            console.error('[State] Error loading API key:', e);
            return null;
        }
    }

    async saveApiKey(key) {
        try {
            await chrome.storage.local.set({ OPENAI_API_KEY: key });
        } catch (e) {
            console.error('[State] Error saving API key:', e);
        }
    }

    async deleteApiKey() {
        try {
            await chrome.storage.local.remove('OPENAI_API_KEY');
        } catch (e) {
            console.error('[State] Error deleting API key:', e);
        }
    }

    // =====================
    // Initialization
    // =====================
    
    async initialize() {
        await Promise.all([
            this.loadFacturaConfig(),
            this.loadSafeMode(),
            this.loadLanguage()
        ]);
    }
}

// Exportar para uso en popup.js
if (typeof window !== 'undefined') {
    window.AppState = AppState;
}
