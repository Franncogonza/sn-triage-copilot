/**
 * SN Triage Copilot - Popup Script
 * Clean & Functional
 */

document.addEventListener('DOMContentLoaded', async () => {
    // =====================
    // Initialize State Manager
    // =====================
    const state = new AppState();
    await state.initialize();
    
    // =====================
    // i18n - Internationalization
    // =====================
    let currentLang = state.getCurrentLang();
    const languageSelector = document.getElementById('language-selector');
    languageSelector.value = currentLang;
    
    // Translation helper
    const tr = (key) => t(key, currentLang);
    
    // Update UI with translations
    function updateUILanguage() {
        // Update button texts
        document.getElementById('generate-report-btn').textContent = tr('btnQuickCount');
        document.getElementById('ai-analysis-btn').textContent = tr('btnGenerateEmail');
        document.getElementById('factura-btn').textContent = tr('btnInvoice');
        document.getElementById('copy-report-btn').textContent = tr('btnCopyReport');
        document.getElementById('refresh-btn').textContent = tr('btnRefreshData');
        document.getElementById('settings-btn').textContent = tr('btnSettings');
        document.getElementById('save-settings-btn').textContent = tr('btnSaveSettings');
        document.getElementById('cancel-settings-btn').textContent = tr('btnCancel');
        
        // Update settings panel
        document.querySelector('#settings-panel h3').textContent = tr('settingsTitle');
        document.querySelectorAll('#settings-panel label')[0].textContent = tr('settingsYourName');
        document.querySelectorAll('#settings-panel label')[1].textContent = tr('settingsRecipient');
        document.querySelectorAll('#settings-panel label')[2].textContent = tr('settingsCC');
        document.querySelectorAll('#settings-panel label')[3].textContent = tr('settingsGmailIndex');
        document.querySelector('#settings-panel small').textContent = tr('settingsGmailIndexHelp');
        
        // Update placeholders
        const config = state.getFacturaConfig();
        configNombre.placeholder = tr('placeholderName');
        configDestinatario.placeholder = tr('placeholderRecipient');
        configCc.placeholder = tr('placeholderCC');
        configCuentaIndex.placeholder = tr('placeholderGmailIndex');
        
        // Update Safe Mode toggle
        document.querySelector('.toggle-text').textContent = tr('safeModeLabel');
    }
    
    // Language selector change
    languageSelector.addEventListener('change', async (e) => {
        currentLang = e.target.value;
        await state.setLanguage(currentLang);
        updateUILanguage();
        setStatus(tr('statusSuccess'), 'success');
    });
    
    // =====================
    // DOM References
    // =====================
    const statusEl = document.getElementById('status');
    const ticketsSection = document.getElementById('tickets-section');
    const ticketsCount = document.getElementById('tickets-count');
    const ticketsList = document.getElementById('tickets-list');
    const actions = document.getElementById('actions');
    const generateReportBtn = document.getElementById('generate-report-btn');
    const aiAnalysisBtn = document.getElementById('ai-analysis-btn');
    const facturaBtn = document.getElementById('factura-btn');
    const copyReportBtn = document.getElementById('copy-report-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const analysisResult = document.getElementById('analysis-result');
    const settingsPanel = document.getElementById('settings-panel');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
    const configNombre = document.getElementById('config-nombre');
    const configDestinatario = document.getElementById('config-destinatario');
    const configCc = document.getElementById('config-cc');
    const configCuentaIndex = document.getElementById('config-cuenta-index');
    const safeModeCheckbox = document.getElementById('safe-mode-checkbox');
    const deleteApiKeyBtn = document.getElementById('delete-api-key-btn');

    // Initialize UI language
    updateUILanguage();
    
    // Cargar preferencia de Modo Seguro
    safeModeCheckbox.checked = state.getSafeMode();
    
    // Guardar preferencia de Modo Seguro
    safeModeCheckbox.addEventListener('change', async () => {
        await state.setSafeMode(safeModeCheckbox.checked);
    });

    // =====================
    // Business Logic (usando módulo externo)
    // =====================
    const { 
        countTicketsByState, 
        generateReport, 
        generateEmailPrompt,
        generateInvoiceEmail,
        generateGmailUrl,
        validateApiKey,
        validateUrl,
        getPriorityClass
    } = window.BusinessLogic;

    // =====================
    // Helpers
    // =====================
    const setStatus = (msg, type) => {
        statusEl.className = `status ${type}`;
        statusEl.textContent = ''; // Limpiar contenido
        
        if (type === 'loading') {
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            statusEl.appendChild(spinner);
        }
        
        const span = document.createElement('span');
        span.textContent = msg;
        statusEl.appendChild(span);
    };

    async function getApiKey() {
        const existingKey = await state.getApiKey();
        if (!existingKey) {
            const key = prompt(tr('promptApiKey'));
            if (key) {
                const validation = validateApiKey(key);
                
                if (!validation.valid) {
                    setStatus(`⚠️ ${validation.error}`, 'error');
                    return null;
                }
                
                await state.saveApiKey(validation.key);
                return validation.key;
            }
            setStatus(tr('errorApiKeyRequired'), 'error');
            return null;
        }
        return existingKey;
    }
    
    async function deleteApiKey() {
        await state.deleteApiKey();
        setStatus('🔑 API Key eliminada. Ingresá una nueva en el próximo análisis.', 'success');
    }

    async function loadFacturaConfig() {
        // Config ya cargado en state.initialize()
        const config = state.getFacturaConfig();
        configNombre.value = config.nombre;
        configDestinatario.value = config.destinatario;
        configCc.value = config.cc;
        configCuentaIndex.value = config.cuentaIndex;
    }

    async function saveFacturaConfig() {
        const config = {
            nombre: configNombre.value || state.getFacturaConfig().nombre,
            destinatario: configDestinatario.value || state.getFacturaConfig().destinatario,
            cc: configCc.value || state.getFacturaConfig().cc,
            cuentaIndex: parseInt(configCuentaIndex.value) || state.getFacturaConfig().cuentaIndex
        };
        await state.saveFacturaConfig(config);
    }

    // =====================
    // Core Functions
    // =====================
    async function loadData() {
        try {
            console.log('[Popup] Cargando datos...');
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab?.id) {
                setStatus(tr('errorNoActiveTab'), 'error');
                return;
            }

            const result = await chrome.storage.local.get('SN_TICKETS');
            
            if (!result.SN_TICKETS || !result.SN_TICKETS.tickets || result.SN_TICKETS.tickets.length === 0) {
                setStatus(tr('statusNoTickets'), 'error');
                ticketsSection.style.display = 'none';
                actions.style.display = 'none';
                return;
            }

            state.setTickets(result.SN_TICKETS.tickets);
            renderTickets(state.getTickets());
            
            setStatus(`${tr('statusSuccess')} - ${state.getTicketCount()} tickets`, 'success');
            ticketsSection.style.display = 'block';
            actions.style.display = 'flex';
        } catch (error) {
            console.error('[Popup] Error:', error);
            setStatus(tr('errorLoadingData'), 'error');
        }
    }

    function renderTickets(tickets) {
        ticketsCount.textContent = tickets.length;
        ticketsList.innerHTML = '';

        tickets.slice(0, 50).forEach(t => {
            const div = document.createElement('div');
            div.className = 'ticket-item';
            
            // Header con link y prioridad
            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            
            const link = document.createElement('a');
            link.href = t.link || '#';
            link.target = '_blank';
            link.className = 'ticket-number-link';
            link.textContent = `${t.number} 🔗`;
            
            const prio = document.createElement('span');
            prio.className = getPrioClass(t.priority);
            prio.textContent = t.priority || '';
            
            header.appendChild(link);
            header.appendChild(prio);
            
            // Descripción
            const desc = document.createElement('div');
            desc.className = 'ticket-desc';
            desc.textContent = t.short_description || '(Sin título)';
            
            // Metadata
            const meta = document.createElement('div');
            meta.className = 'ticket-meta';
            meta.textContent = `${t.state || '-'} | 👤 ${t.assigned_to || 'Sin asignar'}`;
            
            div.appendChild(header);
            div.appendChild(desc);
            div.appendChild(meta);
            ticketsList.appendChild(div);
        });
        ticketsSection.style.display = 'block';
    }

    async function analyzeWithGPT(promptText, title) {
        const apiKey = await getApiKey();
        if (!apiKey) return;

        setStatus(`🤖 Generando: ${title}...`, 'loading');
        generateReportBtn.disabled = true;
        aiAnalysisBtn.disabled = true;
        analysisResult.style.display = 'none';

        try {
            const safeMode = safeModeCheckbox.checked;
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({
                    type: "ANALYZE_WITH_GPT",
                    prompt: promptText,
                    apiKey: apiKey,
                    safeMode: safeMode
                }, (res) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(res);
                    }
                });

                // Timeout
                setTimeout(() => reject(new Error('Timeout - 30s')), 30000);
            });

            if (response?.success) {
                setStatus('✅ Análisis completado', 'success');
                analysisResult.style.whiteSpace = 'pre-wrap';
                analysisResult.textContent = response.analysis;
                analysisResult.style.display = 'block';
            } else {
                throw new Error(response?.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('[Popup] Error análisis:', error);
            setStatus('❌ Error: ' + error.message, 'error');
            analysisResult.style.whiteSpace = 'pre-wrap';
            analysisResult.textContent = `Error: ${error.message}`;
            analysisResult.style.display = 'block';
        } finally {
            generateReportBtn.disabled = false;
            aiAnalysisBtn.disabled = false;
        }
    }

    // =====================
    // Event Listeners
    // =====================

    // Generate Report - Conteo local sin GPT
    generateReportBtn.addEventListener('click', async () => {
        const tickets = state.getTickets();
        if (tickets.length === 0) {
            setStatus(tr('errorNoTickets'), 'error');
            return;
        }

    const counts = countTicketsByState(tickets);
    const total = tickets.length;
    const suma = counts.pruebaSuperada + counts.pendienteAclaracion + counts.pendienteUATest + counts.abierto + counts.enCurso + counts.rechazado;
    
    const report = `📊 TOTAL: ${total}
✅ Prueba Superada: ${counts.pruebaSuperada}
❓ Pendiente de Aclaración: ${counts.pendienteAclaracion}
⏳ Pendiente UA-Test: ${counts.pendienteUATest}
🔴 Abierto: ${counts.abierto}
🔵 En curso: ${counts.enCurso}
❌ Rechazado: ${counts.rechazado}
${suma !== total ? `\n⚠️ Sin clasificar: ${total - suma}` : ''}`;

        setStatus(tr('successReportGenerated'), 'success');
        analysisResult.style.whiteSpace = 'pre-wrap';
        analysisResult.textContent = `${tr('reportTitle')}\n\n${report}`;
        analysisResult.style.display = 'block';
    });

    // AI Analysis
    aiAnalysisBtn.addEventListener('click', async () => {
        const tickets = state.getTickets();
        if (tickets.length === 0) {
            setStatus(tr('errorNoTickets'), 'error');
            return;
        }

        // Hacer conteo primero
        const counts = countTicketsByState(tickets);

        // Preparar datos para IA
        const ticketsData = tickets.map(t => 
            `${t.number}|${t.state}|${t.assigned_to || 'Sin asignar'}|${(t.short_description || '').slice(0, 80)}`
        ).join('\n');

        const prompt = `Genera un email ejecutivo profesional. Usa EXACTAMENTE estos números:

Total: ${tickets.length}
✅ Prueba Superada: ${counts.pruebaSuperada}
❓ Pendiente de Aclaración: ${counts.pendienteAclaracion}
⏳ Pendiente UA-Test: ${counts.pendienteUATest}
🔴 Abierto: ${counts.abierto}
🔵 En curso: ${counts.enCurso}
❌ Rechazado: ${counts.rechazado}

TICKETS (NUMERO|ESTADO|ASIGNADO|DESCRIPCION):
${ticketsData}

Formato EXACTO del email:

Hola [Nombre],

Comparto el estado operativo actualizado de [Nombre de la operativa] (${tickets.length} bugs):

✅ Prueba Superada: ${counts.pruebaSuperada}
❓ Pendiente de Aclaración: ${counts.pendienteAclaracion}
⏳ Pendiente UA-Test: ${counts.pendienteUATest}
🔴 Abierto: ${counts.abierto}
🔵 En curso: ${counts.enCurso}
❌ Rechazado: ${counts.rechazado}

[Agrega UN párrafo destacando puntos importantes como: tickets pendientes de aclaración que generan bloqueos, tickets en curso que requieren atención inmediata, o concentración de trabajo. Sé específico y profesional.]

Quedo atento para cualquier ajuste o consulta.

Saludos

IMPORTANTE:
- NO agregues firma, teléfono, ni datos de contacto
- El párrafo debe ser profesional y específico basado en los datos reales
- Usa "Es importante destacar que..." o similar para iniciar el párrafo`;

        await analyzeWithGPT(prompt, 'Email');
    });

    // Settings
    settingsBtn.addEventListener('click', () => {
        // Cargar valores actuales en el formulario
        const config = state.getFacturaConfig();
        configNombre.value = config.nombre;
        configDestinatario.value = config.destinatario;
        configCc.value = config.cc;
        configCuentaIndex.value = config.cuentaIndex;
        
        // Mostrar panel de settings
        settingsPanel.style.display = 'block';
        analysisResult.style.display = 'none';
    });

    saveSettingsBtn.addEventListener('click', async () => {
        // Guardar configuración
        const config = {
            nombre: configNombre.value.trim() || 'Franco Gonzalez',
            destinatario: configDestinatario.value.trim() || 'Mdprocurement@mindata.es',
            cc: configCc.value.trim() || 'gonzalez.francodavid@hotmail.com',
            cuentaIndex: parseInt(configCuentaIndex.value) || 2
        };
        
        await state.saveFacturaConfig(config);
        setStatus(tr('successConfigSaved'), 'success');
        settingsPanel.style.display = 'none';
    });

    cancelSettingsBtn.addEventListener('click', () => {
        settingsPanel.style.display = 'none';
    });

    // Delete API Key
    deleteApiKeyBtn.addEventListener('click', async () => {
        if (confirm('¿Seguro que querés eliminar la API Key guardada?')) {
            await deleteApiKey();
        }
    });

    // Factura Email
    facturaBtn.addEventListener('click', async () => {
        const link = prompt(tr('promptInvoiceLink'));
        
        if (!link || !link.trim()) {
            setStatus(tr('errorNoLink'), 'error');
            return;
        }

        // Validar que sea una URL válida (http/https) y no código JavaScript
        const sanitizedLink = link.trim();
        
        // Validación de URL
        try {
            const url = new URL(sanitizedLink);
            
            // Solo permitir http y https
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                setStatus('⚠️ URL inválida. Solo se permiten enlaces http:// o https://', 'error');
                return;
            }
            
            // Prevenir javascript: y data: URIs
            if (sanitizedLink.toLowerCase().startsWith('javascript:') || 
                sanitizedLink.toLowerCase().startsWith('data:') ||
                sanitizedLink.toLowerCase().startsWith('vbscript:')) {
                setStatus('⚠️ URL inválida. No se permiten enlaces con código ejecutable.', 'error');
                return;
            }
        } catch (e) {
            setStatus('⚠️ URL inválida. Ingresá una URL completa (ej: https://ejemplo.com/factura.pdf)', 'error');
            return;
        }

        // Obtener mes y año actual
        const meses = translations[currentLang].months;
        const fecha = new Date();
        const mesActual = meses[fecha.getMonth()];
        const anioActual = fecha.getFullYear();

        // Usar configuración guardada
        const config = state.getFacturaConfig();
        const asunto = `${tr('invoiceSubject')} ${mesActual} ${anioActual} - ${config.nombre}`;
        const cuerpo = `${tr('invoiceGreeting')} ${tr('invoiceBody')} ${mesActual} ${anioActual}
${tr('invoiceLink')} ${sanitizedLink}

${tr('invoiceClosing')}

${config.nombre}`;

        // Crear Gmail compose URL con cuenta específica
        const gmailUrl = `https://mail.google.com/mail/u/${config.cuentaIndex}/?view=cm&fs=1&to=${encodeURIComponent(config.destinatario)}&cc=${encodeURIComponent(config.cc)}&su=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;

        // Abrir Gmail con cuenta de Mindata
        window.open(gmailUrl, '_blank', 'noopener,noreferrer');

        setStatus(tr('successGmailOpened'), 'success');
        analysisResult.style.whiteSpace = 'pre-wrap';
        analysisResult.textContent = `${tr('emailPrepared')}\n\n${cuerpo}`;
        analysisResult.style.display = 'block';
    });

    // Copy Report
    copyReportBtn.addEventListener('click', async () => {
        const text = analysisResult.innerText || analysisResult.textContent;
        
        if (!text || !text.trim()) {
            setStatus(tr('errorNothingToCopy'), 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            setStatus(tr('successCopied'), 'success');
            
            // Feedback visual premium
            copyReportBtn.classList.add('btn-copied');
            const originalText = copyReportBtn.textContent;
            copyReportBtn.textContent = tr('btnCopied');
            
            setTimeout(() => {
                copyReportBtn.classList.remove('btn-copied');
                copyReportBtn.textContent = originalText;
            }, 2000);
        } catch (error) {
            setStatus(tr('errorCopyFailed'), 'error');
        }
    });

    // Refresh Data
    refreshBtn.addEventListener('click', async () => {
        setStatus(tr('statusRefreshing'), 'loading');
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            chrome.tabs.sendMessage(tab.id, { type: 'REFRESH_DATA' }, () => {
                if (chrome.runtime.lastError) {
                    setStatus('Error: Recarga la página de ServiceNow', 'error');
                    return;
                }
                setTimeout(loadData, 1500);
            });
        } catch (error) {
            setStatus(tr('errorRefreshFailed'), 'error');
        }
    });

    // =====================
    // Initialize
    // =====================
    console.log('[Popup] SN Triage Copilot');
    loadFacturaConfig();
    loadData();
});
