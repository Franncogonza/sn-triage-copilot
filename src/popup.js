/**
 * SN Triage Copilot Pro - Popup Script
 * Premium Edition - Clean & Functional
 */

document.addEventListener('DOMContentLoaded', async () => {
    // =====================
    // DOM References
    // =====================
    const statusEl = document.getElementById('status');
    const ticketsSection = document.getElementById('tickets-section');
    const ticketsCount = document.getElementById('tickets-count');
    const ticketsList = document.getElementById('tickets-list');
    const actions = document.getElementById('actions');
    const analyzeBtn = document.getElementById('analyze-btn');
    const testApiBtn = document.getElementById('test-api-btn');
    const testDirectBtn = document.getElementById('test-direct-btn');
    const copyReportBtn = document.getElementById('copy-report-btn');
    const refreshBtn = document.getElementById('refresh-btn');
    const analysisResult = document.getElementById('analysis-result');

    // =====================
    // State
    // =====================
    let currentTickets = [];

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

    const getApiKey = async () => {
        let apiKey = '';
        try {
            const stored = await chrome.storage.local.get(['OPENAI_API_KEY']);
            apiKey = stored.OPENAI_API_KEY || '';
        } catch (e) {
            console.warn('[Popup] No se pudo leer API key:', e);
        }
        
        if (!apiKey) {
            apiKey = prompt("🔑 Ingresa tu OpenAI API Key:");
            if (apiKey) {
                try {
                    await chrome.storage.local.set({ OPENAI_API_KEY: apiKey });
                } catch (e) {
                    console.warn('[Popup] No se pudo guardar API key:', e);
                }
            }
        }
        return apiKey;
    };

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
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between;">
                    <a href="${t.link || '#'}" target="_blank" class="ticket-number-link">${t.number} 🔗</a>
                    <span class="${getPrioClass(t.priority)}">${t.priority || ''}</span>
                </div>
                <div class="ticket-desc">${t.short_description || '(Sin título)'}</div>
                <div class="ticket-meta">${t.state || '-'} | 👤 ${t.assigned_to || 'Sin asignar'}</div>
            `;
            ticketsList.appendChild(div);
        });
        ticketsSection.style.display = 'block';
    }

    async function analyzeWithGPT(promptText, title) {
        const apiKey = await getApiKey();
        if (!apiKey) return;

        setStatus(`🤖 Analizando: ${title}...`, 'loading');
        analyzeBtn.disabled = true;
        testApiBtn.disabled = true;
        testDirectBtn.disabled = true;
        analysisResult.style.display = 'none';

        try {
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({
                    type: "ANALYZE_WITH_GPT",
                    prompt: promptText,
                    apiKey: apiKey
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
                analysisResult.innerHTML = `<b>${title}:</b><br/><br/>${response.analysis.replace(/\n/g, '<br>')}`;
                analysisResult.style.display = 'block';
            } else {
                throw new Error(response?.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('[Popup] Error análisis:', error);
            setStatus('❌ Error: ' + error.message, 'error');
            analysisResult.innerHTML = `<b>Error:</b><br/>${error.message}`;
            analysisResult.style.display = 'block';
        } finally {
            analyzeBtn.disabled = false;
            testApiBtn.disabled = false;
            testDirectBtn.disabled = false;
        }
    }

    // =====================
    // Event Listeners
    // =====================

    // Test API Key (via background)
    testApiBtn.addEventListener('click', async () => {
        const apiKey = await getApiKey();
        if (!apiKey) return;

        setStatus('🧪 Probando API Key...', 'loading');
        testApiBtn.disabled = true;

        chrome.runtime.sendMessage({
            type: "ANALYZE_WITH_GPT",
            prompt: "Responde exactamente: '✅ API funcionando correctamente'",
            apiKey: apiKey
        }, (response) => {
            testApiBtn.disabled = false;
            if (response?.success) {
                setStatus('✅ API Key válida', 'success');
                analysisResult.innerHTML = `<b>🧪 Test API:</b><br/><br/>✅ Conexión exitosa<br/><br/>${response.analysis}`;
                analysisResult.style.display = 'block';
            } else {
                setStatus('❌ API Key inválida', 'error');
                analysisResult.innerHTML = `<b>🧪 Test API:</b><br/><br/>❌ Error: ${response?.error || 'Desconocido'}`;
                analysisResult.style.display = 'block';
            }
        });
    });

    // Test Direct (fetch desde popup)
    testDirectBtn.addEventListener('click', async () => {
        const apiKey = await getApiKey();
        if (!apiKey) return;

        setStatus('⚡ Test directo OpenAI...', 'loading');
        testDirectBtn.disabled = true;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: 'Responde: "✅ Test directo OK"' }],
                    max_tokens: 50
                })
            });

            const data = await response.json();
            
            if (data.error) throw new Error(data.error.message);
            
            setStatus('✅ Test directo exitoso', 'success');
            analysisResult.innerHTML = `<b>⚡ Test Directo:</b><br/><br/>✅ Conexión OK<br/><br/>${data.choices[0].message.content}`;
            analysisResult.style.display = 'block';
        } catch (error) {
            setStatus('❌ Error test directo', 'error');
            analysisResult.innerHTML = `<b>⚡ Test Directo:</b><br/><br/>❌ ${error.message}`;
            analysisResult.style.display = 'block';
        } finally {
            testDirectBtn.disabled = false;
        }
    });

    // Analyze Front/UX
    analyzeBtn.addEventListener('click', async () => {
        if (currentTickets.length === 0) {
            setStatus('⚠️ No hay tickets para analizar', 'error');
            return;
        }

        // Preparar resumen de tickets
        const ticketsSummary = currentTickets.map(t => 
            `[${t.number}] Estado: ${t.state || 'N/A'} | Prioridad: ${t.priority || 'N/A'} | Desc: ${(t.short_description || '').slice(0, 100)}`
        ).join('\n');

        const prompt = `Eres un experto en desarrollo web. Analiza estos ${currentTickets.length} tickets de ServiceNow y clasifica ÚNICAMENTE las tareas que son FRONTEND o UX/DISEÑO.

TICKETS:
${ticketsSummary}

INSTRUCCIONES:
- Ignora completamente: soporte técnico, backend, infraestructura, bases de datos, redes, etc.
- Identifica SOLO tareas relacionadas con: UI, UX, diseño, CSS, JavaScript, React, Angular, Vue, HTML, responsive, accesibilidad, etc.

RESPONDE CON:
1. 🎨 **TAREAS FRONTEND** (lista con número de ticket y descripción breve)
2. 🖌️ **TAREAS UX/DISEÑO** (lista con número de ticket y descripción breve)  
3. 📊 **RESUMEN**: Total front: X | Total UX: X | Otros (ignorados): X
4. ⚡ **PRIORIDAD SUGERIDA**: Cuáles hacer primero y por qué

Si no hay tareas Front/UX, indícalo claramente.`;

        await analyzeWithGPT(prompt, '🎨 Análisis Front/UX');
    });

    // Copy Report
    copyReportBtn.addEventListener('click', async () => {
        const text = analysisResult.innerText || analysisResult.textContent;
        
        if (!text || !text.trim()) {
            setStatus('⚠️ No hay informe para copiar', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            setStatus('📋 Informe copiado', 'success');
            
            // Visual feedback
            const original = copyReportBtn.innerHTML;
            copyReportBtn.innerHTML = '✅ Copiado';
            copyReportBtn.style.background = '#28a745';
            
            setTimeout(() => {
                copyReportBtn.innerHTML = original;
                copyReportBtn.style.background = '#6f42c1';
            }, 2000);
        } catch (error) {
            setStatus('❌ Error al copiar', 'error');
        }
    });

    // Refresh Data
    refreshBtn.addEventListener('click', async () => {
        setStatus('🔄 Refrescando...', 'loading');
        
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
            setStatus('Error al refrescar', 'error');
        }
    });

    // =====================
    // Initialize
    // =====================
    console.log('[Popup] SN Triage Copilot Pro - Premium Edition');
    loadData();
});
