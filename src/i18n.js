/**
 * Internationalization (i18n) - Multi-language support
 * Supported languages: English (en), Spanish (es)
 */

const translations = {
    en: {
        // Header
        appTitle: 'SN Triage Copilot',
        
        // Status messages
        statusLoading: 'Loading data...',
        statusSuccess: 'Success',
        statusError: 'Error',
        statusNoTickets: 'No tickets found',
        statusGenerating: 'Generating',
        statusAnalyzing: 'Analyzing with AI...',
        statusRefreshing: 'Refreshing...',
        
        // Buttons
        btnQuickCount: '📊 Quick Count',
        btnGenerateEmail: '📧 Generate Email',
        btnInvoice: '📄 Invoice',
        btnCopyReport: '📋 Copy Report',
        btnRefreshData: '🔄 Refresh Data',
        btnSettings: '⚙️ Settings',
        btnSaveSettings: '💾 Save Settings',
        btnCancel: '❌ Cancel',
        btnCopied: '✓ Copied',
        
        // Tickets section
        ticketsTitle: 'Tickets',
        ticketsCount: 'tickets',
        noAssigned: 'Unassigned',
        noTitle: '(No title)',
        
        // Report states
        stateTotal: 'TOTAL',
        stateTestPassed: 'Test Passed',
        statePendingClarification: 'Pending Clarification',
        statePendingUATest: 'Pending UA-Test',
        stateOpen: 'Open',
        stateInProgress: 'In Progress',
        stateRejected: 'Rejected',
        stateUnclassified: 'Unclassified',
        
        // Prompts and dialogs
        promptApiKey: '🔑 Enter your OpenAI API Key:',
        promptInvoiceLink: '📎 Enter the invoice link:',
        
        // Validation messages
        errorApiKeyRequired: '⚠️ API Key required',
        errorLoadingData: 'Error loading data. Please try again.',
        errorNoActiveTab: '⚠️ No active tab found',
        errorNoTickets: '⚠️ No tickets to analyze',
        errorNoLink: '⚠️ No link entered',
        errorNothingToCopy: '⚠️ Nothing to copy',
        errorCopyFailed: '❌ Copy failed',
        errorRefreshFailed: 'Refresh failed',
        errorNameRequired: '⚠️ Name and Recipient are required',
        errorConfigureFirst: '⚠️ Configure your data first (⚙️ button)',
        
        // Success messages
        successReportGenerated: '✅ Report generated',
        successAnalysisCompleted: '✅ Analysis completed',
        successCopied: '✅ Copied to clipboard',
        successGmailOpened: '✅ Gmail opened with email ready',
        successConfigSaved: '✅ Settings saved',
        
        // Settings panel
        settingsTitle: '⚙️ Invoice Settings',
        settingsYourName: 'Your Name:',
        settingsRecipient: 'Recipient (To):',
        settingsCC: 'CC (Copy):',
        settingsGmailIndex: 'Gmail Account Index (0, 1, 2...):',
        settingsGmailIndexHelp: '0 = first account, 1 = second, etc.',
        
        // Placeholders
        placeholderName: 'John Doe',
        placeholderRecipient: 'finance@company.com',
        placeholderCC: 'your.email@example.com (optional)',
        placeholderGmailIndex: '0',
        
        // Invoice email
        invoiceSubject: 'Fees',
        invoiceGreeting: 'Good morning,',
        invoiceBody: 'attached invoice for period:',
        invoiceLink: 'Invoice link:',
        invoiceClosing: 'Regards,',
        
        // Months
        months: ['January', 'February', 'March', 'April', 'May', 'June', 
                 'July', 'August', 'September', 'October', 'November', 'December'],
        
        // Email template
        emailGreeting: 'Hello [Name],',
        emailIntro: 'I share the updated operational status of',
        emailBugs: 'bugs',
        emailOutro: 'I remain available for any adjustments or questions.',
        emailClosing: 'Regards',
        
        // Report labels
        reportTitle: '📊 Report:',
        emailPrepared: '📧 Email prepared:',
        
        // Safe Mode
        safeModeLabel: '🔒 Safe Mode (filters emails, IPs, URLs)',
    },
    
    es: {
        // Header
        appTitle: 'SN Triage Copilot',
        
        // Status messages
        statusLoading: 'Cargando datos...',
        statusSuccess: 'Éxito',
        statusError: 'Error',
        statusNoTickets: 'No se encontraron tickets',
        statusGenerating: 'Generando',
        statusAnalyzing: 'Analizando con IA...',
        statusRefreshing: 'Refrescando...',
        
        // Buttons
        btnQuickCount: '📊 Conteo Rápido',
        btnGenerateEmail: '📧 Generar Email',
        btnInvoice: '📄 Factura',
        btnCopyReport: '📋 Copiar Informe',
        btnRefreshData: '🔄 Refrescar Datos',
        btnSettings: '⚙️ Configuración',
        btnSaveSettings: '💾 Guardar Configuración',
        btnCancel: '❌ Cancelar',
        btnCopied: '✓ Copiado',
        
        // Tickets section
        ticketsTitle: 'Tickets',
        ticketsCount: 'tickets',
        noAssigned: 'Sin asignar',
        noTitle: '(Sin título)',
        
        // Report states
        stateTotal: 'TOTAL',
        stateTestPassed: 'Prueba Superada',
        statePendingClarification: 'Pendiente de Aclaración',
        statePendingUATest: 'Pendiente UA-Test',
        stateOpen: 'Abierto',
        stateInProgress: 'En curso',
        stateRejected: 'Rechazado',
        stateUnclassified: 'Sin clasificar',
        
        // Prompts and dialogs
        promptApiKey: '🔑 Ingresá tu API Key de OpenAI:',
        promptInvoiceLink: '📎 Ingresá el link de la factura:',
        
        // Validation messages
        errorApiKeyRequired: '⚠️ API Key requerida',
        errorLoadingData: 'Error al cargar datos. Intentá de nuevo.',
        errorNoActiveTab: '⚠️ No se encontró una pestaña activa',
        errorNoTickets: '⚠️ No hay tickets para analizar',
        errorNoLink: '⚠️ No ingresaste ningún link',
        errorNothingToCopy: '⚠️ No hay informe para copiar',
        errorCopyFailed: '❌ Error al copiar',
        errorRefreshFailed: 'Error al refrescar',
        errorNameRequired: '⚠️ Nombre y Destinatario son obligatorios',
        errorConfigureFirst: '⚠️ Configurá tus datos primero (botón ⚙️)',
        
        // Success messages
        successReportGenerated: '✅ Informe generado',
        successAnalysisCompleted: '✅ Análisis completado',
        successCopied: '✅ Copiado al portapapeles',
        successGmailOpened: '✅ Gmail abierto con email listo',
        successConfigSaved: '✅ Configuración guardada',
        
        // Settings panel
        settingsTitle: '⚙️ Configuración de Factura',
        settingsYourName: 'Tu Nombre:',
        settingsRecipient: 'Destinatario (Para):',
        settingsCC: 'CC (Con Copia):',
        settingsGmailIndex: 'Índice de Cuenta Gmail (0, 1, 2...):',
        settingsGmailIndexHelp: '0 = primera cuenta, 1 = segunda, etc.',
        
        // Placeholders
        placeholderName: 'Franco Gonzalez',
        placeholderRecipient: 'Mdprocurement@mindata.es',
        placeholderCC: 'gonzalez.francodavid@hotmail.com',
        placeholderGmailIndex: '2',
        
        // Invoice email
        invoiceSubject: 'Honorarios',
        invoiceGreeting: 'Buenos días estimados,',
        invoiceBody: 'adjunto factura periodo:',
        invoiceLink: 'Link de factura:',
        invoiceClosing: 'Saludos,',
        
        // Months
        months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
        
        // Email template
        emailGreeting: 'Hola [Nombre],',
        emailIntro: 'Comparto el estado operativo actualizado de',
        emailBugs: 'bugs',
        emailOutro: 'Quedo atento para cualquier ajuste o consulta.',
        emailClosing: 'Saludos',
        
        // Report labels
        reportTitle: '📊 Informe:',
        emailPrepared: '📧 Email preparado:',
        
        // Safe Mode
        safeModeLabel: '🔒 Modo Seguro (filtra emails, IPs, URLs)',
    }
};

// Detect browser language
function detectLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    // Check if browser language starts with 'es' (es, es-ES, es-AR, etc.)
    return browserLang.toLowerCase().startsWith('es') ? 'es' : 'en';
}

// Set language
async function setLanguage(lang) {
    await chrome.storage.local.set({ APP_LANGUAGE: lang });
}

// Get translation
function t(key, lang = 'en') {
    return translations[lang]?.[key] || translations.en[key] || key;
}

// Get current language from storage or detect
async function getCurrentLanguage() {
    try {
        const result = await chrome.storage.local.get('APP_LANGUAGE');
        return result.APP_LANGUAGE || detectLanguage();
    } catch (e) {
        return detectLanguage();
    }
}

// Exponer en window para acceso seguro desde otros scripts
if (typeof window !== 'undefined') {
    window.I18n = { 
        translations, 
        t, 
        detectLanguage, 
        setLanguage, 
        getCurrentLanguage 
    };
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { translations, detectLanguage, getCurrentLanguage, setLanguage, t };
}
