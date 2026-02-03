# 🚀 ServiceNow Triage Copilot

Chrome Extension (Manifest V3) para análisis inteligente de tickets de ServiceNow con IA.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/Franncogonza/sn-triage-copilot)
[![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-red.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-25%2B-brightgreen.svg)](__tests__)

## ✨ Características

### 📊 Análisis de Tickets
- **Extracción automática** desde listas de ServiceNow (`*_list.do`)
- **Conteo rápido** por estados (Abierto, En curso, Pendiente, etc.)
- **Clasificación inteligente** con OpenAI GPT-4o-mini
- **Soporte multi-idioma** (Español/Inglés)

### 📧 Generación de Emails
- **Email ejecutivo** con resumen profesional
- **Email de factura** con plantilla personalizable
- **Apertura automática** en Gmail con datos pre-llenados

### 🔒 Seguridad
- **Modo Seguro**: Filtra emails, IPs, URLs y datos sensibles
- **Validación de URLs**: Previene inyección de JavaScript
- **API Key validada**: Formato y longitud verificados
- **Sin XSS**: Uso exclusivo de `textContent` y DOM API

### 🌍 Internacionalización
- Interfaz en **Español** e **Inglés**
- Detección automática del idioma del navegador
- Cambio de idioma en tiempo real

### ⚙️ Configuración
- **Multi-usuario**: Configuración personalizable por usuario
- **Límite de tickets**: Configurable (500 por defecto)
- **Gestión de API Key**: Eliminar/rotar desde la UI

## 🚀 Instalación

### Desarrollo (Load unpacked)

1. Clona el repositorio:
```bash
git clone https://github.com/Franncogonza/sn-triage-copilot.git
cd sn-triage-copilot
```

2. Instala dependencias (opcional, solo para tests):
```bash
npm install
```

3. Carga la extensión en Chrome:
   - Abre `chrome://extensions/`
   - Activa **Developer mode**
   - Click en **Load unpacked**
   - Selecciona la carpeta `src/`

4. Genera los iconos (opcional):
   - Abre `generate-icons.html` en tu navegador
   - Descarga los 3 iconos PNG
   - Muévelos a `src/icons/`

## 📖 Uso

### 1. Configuración inicial

1. Abre el popup de la extensión
2. Click en **⚙️ Configuración**
3. Configura:
   - **API Key de OpenAI** (se solicitará al primer uso)
   - **Datos de factura** (nombre, destinatario, CC, cuenta Gmail)

### 2. Análisis de tickets

1. Navega a ServiceNow y abre una lista de tickets
2. Abre el popup de la extensión
3. Opciones disponibles:
   - **📊 Conteo Rápido**: Resumen local sin IA
   - **📧 Generar Email**: Email ejecutivo con IA
   - **📄 Factura**: Email de factura pre-llenado
   - **📋 Copiar Informe**: Copia al portapapeles
   - **🔄 Refrescar Datos**: Recarga los tickets

### 3. Modo Seguro

Activa **� Modo Seguro** para:
- Filtrar emails, IPs, URLs
- Eliminar números de teléfono
- Remover tokens/keys
- Cumplir con GDPR/Compliance

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Watch mode (desarrollo)
npm run test:watch

# Coverage report
npm run test:coverage
```

**Tests implementados:**
- ✅ 25+ tests unitarios
- ✅ Coverage: parseCSV, mapTicketsFromCSV, generateInstanceId
- ✅ Validación de límites de tickets
- ✅ Sanitización de datos

## 🔑 API Key (OpenAI)

### Configuración
1. Obtén tu API Key en [OpenAI Platform](https://platform.openai.com/api-keys)
2. La extensión la solicitará al primer uso
3. Se guarda localmente en `chrome.storage.local`

### Validación
- Debe comenzar con `sk-`
- Longitud mínima: 20 caracteres
- Se sanitiza automáticamente (trim)

### Gestión
- **Eliminar**: Settings → 🗑️ Eliminar API Key
- **Rotar**: Elimina la actual e ingresa una nueva

## 🛠️ Arquitectura

```
sn-triage-copilot/
├── src/
│   ├── manifest.json       # Configuración de la extensión
│   ├── popup.html          # UI del popup
│   ├── popup.js            # Lógica del popup
│   ├── background.js       # Service worker (OpenAI proxy)
│   ├── content.js          # Extracción de datos de ServiceNow
│   ├── styles.css          # Estilos modernos
│   └── i18n.js             # Traducciones EN/ES
├── __tests__/              # Tests unitarios
├── jest.config.js          # Configuración de Jest
└── package.json            # Dependencias y scripts
```

## 🔒 Seguridad

### Implementado
- ✅ Sanitización de API Key
- ✅ Validación de URLs (http/https)
- ✅ Prevención de XSS (sin innerHTML)
- ✅ Modo Seguro con filtros de datos sensibles
- ✅ window.open con noopener,noreferrer
- ✅ Timeout de 45s para requests largos
- ✅ Manejo robusto de errores HTTP

### Datos enviados a OpenAI
- Número de ticket
- Estado
- Descripción breve
- Asignado a

**Modo Seguro** reemplaza datos sensibles con placeholders.

## 🐛 Debugging

### Popup logs
- Click derecho sobre el popup → **Inspect**
- Console mostrará logs de `[Popup]`

### Background logs
- `chrome://extensions/` → Service worker → **Inspect**
- Console mostrará logs de `[Background]`

### Content script logs
- Abre DevTools en la página de ServiceNow
- Console mostrará logs de `[SN Copilot]`

## 📝 Solución de problemas

### La extensión no carga
- Verifica que estés cargando la carpeta `src/`
- Revisa que `manifest.json` sea válido

### No se extraen tickets
- Verifica que estés en una página `*_list.do`
- Abre DevTools y revisa logs del content script
- Intenta con **🔄 Refrescar Datos**

### Error de API Key
- Verifica que comience con `sk-`
- Elimina la key actual y vuelve a ingresarla
- Revisa que tengas créditos en OpenAI

### Timeout en análisis
- Activa **🔒 Modo Seguro** para reducir datos
- Reduce la cantidad de tickets en la lista
- Verifica tu conexión a internet

## 🚀 Próximas mejoras

- [ ] Encriptación de API Key con Web Crypto API
- [ ] Plantillas de prompts configurables
- [ ] Estados de tickets personalizables
- [ ] Exportación de reportes a PDF
- [ ] Integración con más plataformas (Jira, etc.)

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.

## 👤 Autor

**Franco Gonzalez**

- GitHub: [@Franncogonza](https://github.com/Franncogonza)

## 🙏 Agradecimientos

- OpenAI por GPT-4o-mini
- ServiceNow por la plataforma
- Comunidad de Chrome Extensions

## 📜 Licencia

**Copyright © 2026 Franco David Gonzalez - Todos los derechos reservados**

Este código está disponible públicamente **solo con fines educativos y de portfolio**.

**NO está permitido:**
- ❌ Uso comercial
- ❌ Modificación del código
- ❌ Distribución de versiones modificadas
- ❌ Crear trabajos derivados

Para solicitar permisos especiales, contactar: gonzalez.francodavid@hotmail.com

Ver [LICENSE](LICENSE) para más detalles.

---

**⭐ Si te resulta útil, dale una estrella al repo!**
