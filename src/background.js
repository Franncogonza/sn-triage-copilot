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
    const payload = msg.payload || {};
    const key = `SN_DATA_${sender.tab?.id}`;
    
    chrome.storage.local.set({
      [key]: payload,
      SN_COPILOT_RESULTS: payload,
      SN_LAST_TAB: sender.tab?.id
    }).then(() => {
      console.log(`[Background] Guardados ${payload.count} tickets`);
    });
    return;
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
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error.message);
  }

  console.log('[Background] Respuesta GPT OK');
  return { success: true, analysis: data.choices[0].message.content };
}