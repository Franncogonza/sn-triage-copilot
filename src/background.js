/**
 * SN Triage Copilot - Background Service Worker
 */

console.log('[Background] Service Worker iniciado');

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Test connection
  if (msg.type === "TEST_CONNECTION") {
    sendResponse({ success: true, message: 'Background activo' });
    return;
  }
  
  // Save scrape results from content script
  if (msg.type === "SN_SCRAPE_RESULT") {
    (async () => {
      const payload = msg.payload || {};
      const tabId = sender.tab?.id;
      const key = `SN_DATA_${tabId}`;
      
      await chrome.storage.local.set({
        [key]: payload,
        SN_COPILOT_RESULTS: payload,
        SN_LAST_TAB: tabId
      });
      
      console.log(`[Background] Guardados ${payload.count} tickets`);
      sendResponse({ success: true });
    })().catch(e => sendResponse({ success: false, error: e.message }));
    
    return true; // Keep channel alive for async response
  }

  // GPT Analysis proxy
  if (msg.type === "ANALYZE_WITH_GPT") {
    console.log('[Background] Solicitud GPT recibida');
    
    // Sanitizar API key (eliminar espacios, newlines, etc.)
    const sanitizedApiKey = (msg.apiKey || '').trim();
    
    if (!sanitizedApiKey) {
      sendResponse({ success: false, error: 'API Key vacía o inválida' });
      return true;
    }
    
    callOpenAI(msg.prompt, sanitizedApiKey, msg.safeMode)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.message }));
    
    return true; // Async response
  }
});

async function callOpenAI(prompt, apiKey, safeMode = false) {
  console.log('[Background] Llamando OpenAI...', { safeMode });
  
  // Aplicar modo seguro si está habilitado
  const finalPrompt = safeMode ? sanitizePrompt(prompt) : prompt;
  
  // AbortController para timeout (45s para dar más margen)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: finalPrompt }],
        temperature: 0.7,
        max_tokens: 2000
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMsg = `Error ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error?.message) {
          errorMsg = errorData.error.message;
        } else if (errorData.error?.code) {
          errorMsg = `${errorData.error.code}: ${errorData.error.type || 'Error'}`;
        }
      } catch {
        errorMsg = await response.text() || errorMsg;
      }
      
      // Mensajes legibles para errores comunes
      if (response.status === 400) {
        throw new Error('Solicitud inválida. Verificá el formato de los datos.');
      } else if (response.status === 401) {
        throw new Error('API Key inválida o expirada. Verificá tu clave en configuración.');
      } else if (response.status === 404) {
        throw new Error('Modelo no encontrado. Verificá que gpt-4o-mini esté disponible.');
      } else if (response.status === 413) {
        throw new Error('Demasiados datos. Reducí la cantidad de tickets o usá Modo Seguro.');
      } else if (response.status === 429) {
        throw new Error('Límite de requests excedido. Esperá unos minutos e intentá de nuevo.');
      } else if (response.status === 500) {
        throw new Error('Error del servidor de OpenAI. Reintentá en unos segundos.');
      } else if (response.status === 503) {
        throw new Error('Servicio temporalmente no disponible. Reintentá en un momento.');
      }
      
      throw new Error(errorMsg);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Respuesta vacía de OpenAI. Reintentá o reducí la cantidad de datos.');
    }

    console.log('[Background] Respuesta GPT OK');
    return { 
      success: true, 
      analysis: data.choices[0].message.content,
      safeMode: safeMode 
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Timeout: La solicitud tardó más de 45 segundos. Intentá con menos tickets o activá Modo Seguro.');
    }
    throw error;
  }
}

// Sanitizar prompt en modo seguro (eliminar datos sensibles)
function sanitizePrompt(prompt) {
  let sanitized = prompt;
  
  // Eliminar emails
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
  
  // Eliminar IPs
  sanitized = sanitized.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP]');
  
  // Eliminar URLs internas (http/https)
  sanitized = sanitized.replace(/https?:\/\/[^\s]+/g, '[URL]');
  
  // Eliminar teléfonos (formatos comunes)
  sanitized = sanitized.replace(/\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, '[PHONE]');
  
  // Eliminar posibles tokens/keys (strings largos alfanuméricos)
  sanitized = sanitized.replace(/\b[a-zA-Z0-9]{32,}\b/g, '[TOKEN]');
  
  console.log('[Background] Modo seguro aplicado - datos sensibles filtrados');
  return sanitized;
}