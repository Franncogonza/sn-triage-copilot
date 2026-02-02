/**
 * SN Triage Copilot Pro - Background Service Worker
 * Premium Edition
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
    
    callOpenAI(msg.prompt, msg.apiKey)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.message }));
    
    return true; // Async response
  }
});

async function callOpenAI(prompt, apiKey) {
  console.log('[Background] Llamando OpenAI...');
  
  // AbortController para timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
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
      if (response.status === 401) {
        throw new Error('API Key inválida o expirada');
      } else if (response.status === 429) {
        throw new Error('Límite de requests excedido. Esperá unos minutos.');
      } else if (response.status === 500) {
        throw new Error('Error del servidor de OpenAI. Reintentá en unos segundos.');
      }
      
      throw new Error(errorMsg);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Respuesta vacía de OpenAI');
    }

    console.log('[Background] Respuesta GPT OK');
    return { success: true, analysis: data.choices[0].message.content };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Timeout: La solicitud tardó más de 30 segundos');
    }
    throw error;
  }
}