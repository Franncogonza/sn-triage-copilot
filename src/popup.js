/**
 * SN Triage Copilot - Popup Script
 * Clean & Functional
 */

document.addEventListener('DOMContentLoaded', async () => {
    // =====================
    // i18n - Internationalization
    // =====================
    let currentLang = await getCurrentLanguage();
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
        await setLanguage(currentLang);
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

    // Initialize UI language
    updateUILanguage();
    
    // Cargar preferencia de Modo Seguro
    chrome.storage.local.get('SAFE_MODE', (result) => {
        safeModeCheckbox.checked = result.SAFE_MODE || false;
    });
    
    // Guardar preferencia de Modo Seguro
    safeModeCheckbox.addEventListener('change', () => {
        chrome.storage.local.set({ SAFE_MODE: safeModeCheckbox.checked });
    });

    // =====================
    // State
    // =====================
    let currentTickets = [];
    let facturaConfig = {
        nombre: 'Franco Gonzalez',
        destinatario: 'Mdprocurement@mindata.es',
        cc: 'gonzalez.francodavid@hotmail.com',
        cuentaIndex: 2
    };

    // =====================
    // Utilities
    // =====================
    function removeAccents(str) {
        return str.replace(/á/g, 'a')
                 .replace(/é/g, 'e')
                 .replace(/í/g, 'i')
                 .replace(/ó/g, 'o')
                 .replace(/ú/g, 'u')
                 .replace(/ñ/g, 'n');
    }

    function countTicketsByState(tickets) {
        const counts = {
            pruebaSuperada: 0,
            pendienteAclaracion: 0,
            pendienteUATest: 0,
            abierto: 0,
            enCurso: 0,
            rechazado: 0
        };

        tickets.forEach(t => {
            const stateNorm = removeAccents((t.state || '').toLowerCase());
            if (stateNorm.includes('superada')) counts.pruebaSuperada++;
            else if (stateNorm.includes('pendiente de aclarac')) counts.pendienteAclaracion++;
            else if (stateNorm.includes('ua-test') || stateNorm.includes('uat')) counts.pendienteUATest++;
            else if (stateNorm.includes('abierto')) counts.abierto++;
            else if (stateNorm.includes('en curso')) counts.enCurso++;
            else if (stateNorm.includes('rechazado')) counts.rechazado++;
        });

        return counts;
    }

    // =====================
    // Helpers
    // =====================
    const setStatus = (msg, type) => {
        statusEl.className = `status ${type}`;
        statusEl.innerHTML = type === 'loading' 
            ? `<div class="loading-spinner"></div><span>${msg}</span>` 
            : `<span>${msg}</span>`;
    };

    const getPrioClass = (prio) => {
        if (!prio) return '';
        const p = prio.toLowerCase();
        if (p.includes('1') || p.includes('crit') || p.includes('high')) return 'prio-high';
        if (p.includes('2') || p.includes('mod')) return 'prio-med';
        return 'prio-low';
    };

    async function getApiKey() {
        const result = await chrome.storage.local.get('OPENAI_API_KEY');
        if (!result.OPENAI_API_KEY) {
            const key = prompt(tr('promptApiKey'));
            if (key) {
                await chrome.storage.local.set({ OPENAI_API_KEY: key });
                return key;
            }
            setStatus(tr('errorApiKeyRequired'), 'error');
            return null;
        }
        return result.OPENAI_API_KEY;
    }

    async function loadFacturaConfig() {
        const result = await chrome.storage.local.get('FACTURA_CONFIG');
        if (result.FACTURA_CONFIG) {
            facturaConfig = result.FACTURA_CONFIG;
        }
    }

    async function saveFacturaConfig() {
        await chrome.storage.local.set({ FACTURA_CONFIG: facturaConfig });
    }

    // =====================
    // Core Functions
    // =====================
    async function loadData() {
        try {
            console.log('[Popup] Cargando datos...');
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab?.id) {
                setStatus('Error: No hay pestaña activa', 'error');
                return;
            }

            // Try new storage key first
            const key = `SN_DATA_${tab.id}`;
            let storage = await chrome.storage.local.get([key]);
            let data = storage[key];

            // Fallback to legacy key
            if (!data?.success) {
                storage = await chrome.storage.local.get(['SN_COPILOT_RESULTS']);
                data = storage.SN_COPILOT_RESULTS;
            }

            if (data?.success && data.tickets?.length > 0) {
                currentTickets = data.tickets;
                setStatus(`✅ ${data.tickets.length} tickets cargados (${data.method || 'auto'})`, 'success');
                renderTickets(data.tickets);
                actions.style.display = 'flex';
            } else {
                setStatus('No hay tickets. Navega a una lista de ServiceNow.', 'error');
                ticketsSection.style.display = 'none';
            }
        } catch (e) {
            console.error('[Popup] Error cargando datos:', e);
            setStatus('Error: ' + e.message, 'error');
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
        if (currentTickets.length === 0) {
            setStatus(tr('errorNoTickets'), 'error');
            return;
        }

    const counts = countTicketsByState(currentTickets);
    const total = currentTickets.length;
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
        if (currentTickets.length === 0) {
            setStatus(tr('errorNoTickets'), 'error');
            return;
        }

        // Hacer conteo primero
        const counts = countTicketsByState(currentTickets);

        // Preparar datos para IA
        const ticketsData = currentTickets.map(t => 
            `${t.number}|${t.state}|${t.assigned_to || 'Sin asignar'}|${(t.short_description || '').slice(0, 80)}`
        ).join('\n');

        const prompt = `Genera un email ejecutivo profesional. Usa EXACTAMENTE estos números:

Total: ${currentTickets.length}
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

Comparto el estado operativo actualizado de [Nombre de la operativa] (${currentTickets.length} bugs):

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
        configNombre.value = facturaConfig.nombre;
        configDestinatario.value = facturaConfig.destinatario;
        configCc.value = facturaConfig.cc;
        configCuentaIndex.value = facturaConfig.cuentaIndex;
        
        // Mostrar panel de settings
        settingsPanel.style.display = 'block';
        analysisResult.style.display = 'none';
    });

    saveSettingsBtn.addEventListener('click', async () => {
        // Guardar configuración
        facturaConfig = {
            nombre: configNombre.value.trim() || 'Franco Gonzalez',
            destinatario: configDestinatario.value.trim() || 'Mdprocurement@mindata.es',
            cc: configCc.value.trim() || 'gonzalez.francodavid@hotmail.com',
            cuentaIndex: parseInt(configCuentaIndex.value) || 2
        };
        
        await saveFacturaConfig();
        setStatus(tr('successConfigSaved'), 'success');
        settingsPanel.style.display = 'none';
    });

    cancelSettingsBtn.addEventListener('click', () => {
        settingsPanel.style.display = 'none';
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
        const asunto = `${tr('invoiceSubject')} ${mesActual} ${anioActual} - ${facturaConfig.nombre}`;
        const cuerpo = `${tr('invoiceGreeting')} ${tr('invoiceBody')} ${mesActual} ${anioActual}
${tr('invoiceLink')} ${sanitizedLink}

${tr('invoiceClosing')}

${facturaConfig.nombre}`;

        // Crear Gmail compose URL con cuenta específica
        const gmailUrl = `https://mail.google.com/mail/u/${facturaConfig.cuentaIndex}/?view=cm&fs=1&to=${encodeURIComponent(facturaConfig.destinatario)}&cc=${encodeURIComponent(facturaConfig.cc)}&su=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;

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
