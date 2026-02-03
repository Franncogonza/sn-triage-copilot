/**
 * Business Logic Module
 * Funciones puras de lógica de negocio sin dependencias del DOM
 */

// =====================
// String Utilities
// =====================

/**
 * Elimina acentos de un string para normalización
 */
function removeAccents(str) {
    return str.replace(/á/g, 'a')
             .replace(/é/g, 'e')
             .replace(/í/g, 'i')
             .replace(/ó/g, 'o')
             .replace(/ú/g, 'u')
             .replace(/ñ/g, 'n')
             .replace(/Á/g, 'A')
             .replace(/É/g, 'E')
             .replace(/Í/g, 'I')
             .replace(/Ó/g, 'O')
             .replace(/Ú/g, 'U')
             .replace(/Ñ/g, 'N');
}

// =====================
// Ticket Analysis
// =====================

/**
 * Cuenta tickets por estado
 * @param {Array} tickets - Array de tickets
 * @returns {Object} Conteo por estado
 */
function countTicketsByState(tickets) {
    const counts = {
        pruebaSuperada: 0,
        pendienteAclaracion: 0,
        pendienteUATest: 0,
        abierto: 0,
        enCurso: 0,
        rechazado: 0
    };

    tickets.forEach(ticket => {
        const state = removeAccents((ticket.state || '').toLowerCase());

        if (state.includes('prueba superada') || state.includes('superada')) {
            counts.pruebaSuperada++;
        } else if (state.includes('pendiente de aclarac') || state.includes('aclaracion')) {
            counts.pendienteAclaracion++;
        } else if (state.includes('pendiente ua-test') || state.includes('ua-test') || state.includes('uatest')) {
            counts.pendienteUATest++;
        } else if (state.includes('abierto') || state === 'open') {
            counts.abierto++;
        } else if (state.includes('en curso') || state.includes('in progress')) {
            counts.enCurso++;
        } else if (state.includes('rechazado') || state.includes('rejected')) {
            counts.rechazado++;
        }
    });

    return counts;
}

/**
 * Genera reporte de texto con conteo de tickets
 */
function generateReport(tickets, translations) {
    const counts = countTicketsByState(tickets);
    const total = tickets.length;
    const suma = counts.pruebaSuperada + counts.pendienteAclaracion + 
                 counts.pendienteUATest + counts.abierto + counts.enCurso + counts.rechazado;
    
    return `📊 TOTAL: ${total}
✅ Prueba Superada: ${counts.pruebaSuperada}
❓ Pendiente de Aclaración: ${counts.pendienteAclaracion}
🧪 Pendiente UA-Test: ${counts.pendienteUATest}
🔴 Abierto: ${counts.abierto}
🔵 En curso: ${counts.enCurso}
❌ Rechazado: ${counts.rechazado}
${suma !== total ? `\n⚠️ Sin clasificar: ${total - suma}` : ''}`;
}

/**
 * Genera prompt para análisis con GPT
 */
function generateEmailPrompt(tickets, counts, translations) {
    const ticketsData = tickets.map(t => 
        `${t.number}|${t.state}|${t.assigned_to || 'Sin asignar'}|${(t.short_description || '').slice(0, 80)}`
    ).join('\n');

    return `Genera un email ejecutivo profesional. Usa EXACTAMENTE estos números:

Total: ${tickets.length}
✅ Prueba Superada: ${counts.pruebaSuperada}
❓ Pendiente de Aclaración: ${counts.pendienteAclaracion}
🧪 Pendiente UA-Test: ${counts.pendienteUATest}
🔴 Abierto: ${counts.abierto}
🔵 En curso: ${counts.enCurso}
❌ Rechazado: ${counts.rechazado}

Formato del email:
Hola [Nombre],

Comparto el estado operativo actualizado de [Nombre de la operativa] con ${tickets.length} bugs:

📊 TOTAL: ${tickets.length}
✅ Prueba Superada: ${counts.pruebaSuperada}
❓ Pendiente de Aclaración: ${counts.pendienteAclaracion}
🧪 Pendiente UA-Test: ${counts.pendienteUATest}
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
}

// =====================
// Invoice Generation
// =====================

/**
 * Genera email de factura
 */
function generateInvoiceEmail(config, link, translations) {
    const meses = translations.months;
    const fecha = new Date();
    const mesActual = meses[fecha.getMonth()];
    const anioActual = fecha.getFullYear();

    const asunto = `${translations.invoiceSubject} ${mesActual} ${anioActual} - ${config.nombre}`;
    const cuerpo = `${translations.invoiceGreeting} ${translations.invoiceBody} ${mesActual} ${anioActual}
${translations.invoiceLink} ${link}

${translations.invoiceClosing}

${config.nombre}`;

    return { asunto, cuerpo, mesActual, anioActual };
}

/**
 * Genera URL de Gmail compose
 */
function generateGmailUrl(config, asunto, cuerpo) {
    return `https://mail.google.com/mail/u/${config.cuentaIndex}/?view=cm&fs=1&to=${encodeURIComponent(config.destinatario)}&cc=${encodeURIComponent(config.cc)}&su=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}

// =====================
// Validation
// =====================

/**
 * Valida formato de API Key de OpenAI
 */
function validateApiKey(key) {
    const trimmedKey = key.trim();
    
    if (!trimmedKey.startsWith('sk-')) {
        return { valid: false, error: 'API Key debe comenzar con "sk-"' };
    }
    
    if (trimmedKey.length < 20) {
        return { valid: false, error: 'API Key demasiado corta' };
    }
    
    return { valid: true, key: trimmedKey };
}

/**
 * Valida URL (solo http/https)
 */
function validateUrl(url) {
    const sanitizedUrl = url.trim();
    
    try {
        const urlObj = new URL(sanitizedUrl);
        
        if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
            return { valid: false, error: 'Solo se permiten enlaces http:// o https://' };
        }
        
        if (sanitizedUrl.toLowerCase().startsWith('javascript:') || 
            sanitizedUrl.toLowerCase().startsWith('data:') ||
            sanitizedUrl.toLowerCase().startsWith('vbscript:')) {
            return { valid: false, error: 'No se permiten enlaces con código ejecutable' };
        }
        
        return { valid: true, url: sanitizedUrl };
    } catch (e) {
        return { valid: false, error: 'URL inválida. Ingresá una URL completa (ej: https://ejemplo.com/factura.pdf)' };
    }
}

/**
 * Obtiene clase CSS para prioridad
 */
function getPriorityClass(prio) {
    if (!prio) return '';
    const p = prio.toLowerCase();
    if (p.includes('1') || p.includes('crit') || p.includes('high')) return 'prio-high';
    if (p.includes('2') || p.includes('mod')) return 'prio-med';
    return 'prio-low';
}

// Exportar funciones (para uso en popup.js)
if (typeof window !== 'undefined') {
    window.BusinessLogic = {
        removeAccents,
        countTicketsByState,
        generateReport,
        generateEmailPrompt,
        generateInvoiceEmail,
        generateGmailUrl,
        validateApiKey,
        validateUrl,
        getPriorityClass
    };
}
