# ServiceNow Triage Copilot Pro
 
 Chrome Extension (Manifest V3) para extraer tickets desde listas de ServiceNow y generar un informe con IA enfocado en **FRONTEND** o **UX/DISEÑO**.
 
 ## Estado
 
 - **Versión**: 2.0.0
 - **Modo**: Premium
 
 ## Features
 
 - Extracción de tickets desde ServiceNow (`*_list.do`).
 - Análisis con OpenAI (modelo `gpt-4o-mini`) para clasificar tareas **Front** vs **UX/Diseño**.
 - Botón para **copiar el informe** al portapapeles.
 - Botones de test: validación de API Key y test directo a OpenAI.
 
 ## Instalación (Load unpacked)
 
 1. Abre `chrome://extensions/`.
 2. Activa **Developer mode**.
 3. Click en **Load unpacked**.
 4. Selecciona la carpeta del proyecto (la raíz que contiene `src/manifest.json`).
 
 ## Uso
 
 1. Entra a ServiceNow y abre una lista de tickets (por ejemplo `incident_list.do`).
 2. Abre el popup de la extensión.
 3. Click en **🎨 Analizar Front/UX**.
 4. Opcional: **📋 Copiar Informe**.
 
 ## API Key (OpenAI)
 
 - La API key se solicita en el popup si no existe.
 - Se guarda localmente usando `chrome.storage.local` bajo la clave `OPENAI_API_KEY`.
 - No se guarda en el repositorio.
 
 ## Debugging
 
 - **Popup logs**: click derecho sobre el popup -> **Inspect**.
 - **Background logs**: `chrome://extensions/` -> la extensión -> **Service worker** -> Inspect.
 
 ## Seguridad / Privacidad
 
 - El contenido enviado a OpenAI es un resumen textual de los tickets visibles en la lista.
 - Evita ejecutar la extensión sobre listas que contengan información sensible que no debas enviar a terceros.
 
 ## Solución de problemas
 
 - Verifica que la API key esté configurada correctamente.
 - Revisa los logs para identificar errores.
 
 ## Licencia
 
 Este repositorio es **propietario**. Ver archivo `LICENSE`.
