/**
 * ServiceNow Triage Copilot Pro - Data Extraction Engine
 * Content Script (MV3)
 *
 * Strategies:
 * 1) CSV export (best)
 * 2) Table API (fallback)
 * 3) DOM parsing (last resort)
 *
 * Publishes results to:
 * - chrome.storage.local (if available)
 * - chrome.runtime.sendMessage({ type: "SN_SCRAPE_RESULT", payload })
 * - window.SN_COPILOT_RESULTS (debug fallback)
 */

(() => {
    "use strict";

    // -----------------------------
    // Config
    // -----------------------------
    const CONFIG = {
        INSTANCE_ID: Math.random().toString(36).slice(2, 7),
        VERSION: "1.0.2",
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY_MS: 1000,
        API_LIMIT: 200,
        SUPPORTED_TABLES: ["issue", "incident", "problem", "change_request", "sc_req_item", "sc_task"],
        FIELD_MAPPINGS: {
            number: ["número", "numero", "number", "ticket_id", "incident_id"],
            short_description: [
                "descripción breve",
                "descripcion breve",
                "short description",
                "short_description",
                "description",
                "descripción",
                "title",
            ],
            impact: ["impacto", "impact", "business_impact"],
            priority: ["prioridad", "priority", "urgency"],
            assigned_to: [
                "asignado a",
                "assigned to",
                "asignado",
                "assigned_to",
                "assignment group",
                "assigned",
                "assigned_user",
            ],
            state: ["estado", "state", "status", "ticket_state"],
        },
        TICKET_PREFIXES: ["ISU", "INC", "PRB", "CHG", "RITM", "SCTASK"],
    };

    // -----------------------------
    // Helpers
    // -----------------------------
    const log = (...args) => console.log(`[SN Copilot Pro ${CONFIG.INSTANCE_ID}]`, ...args);
    const warn = (...args) => console.warn(`[SN Copilot Pro ${CONFIG.INSTANCE_ID}]`, ...args);
    const err = (...args) => console.error(`[SN Copilot Pro ${CONFIG.INSTANCE_ID}]`, ...args);

    const normalize = (t) => (t || "").trim().toLowerCase();

    function sleep(ms) {
        return new Promise((r) => setTimeout(r, ms));
    }

    function hasChromeRuntime() {
        return (
            typeof chrome !== "undefined" &&
            chrome?.runtime?.sendMessage &&
            chrome?.storage?.local?.set
        );
    }

    function isTicketNumber(s) {
        const v = (s || "").trim();
        if (!v) return false;
        return CONFIG.TICKET_PREFIXES.some((p) => new RegExp(`^${p}\\d+`, "i").test(v));
    }

    function looksHtml(content) {
        const text = (content || "").toLowerCase();
        return (
            text.includes("<!doctype") ||
            text.includes("<html") ||
            text.includes("<head") ||
            text.includes("<body") ||
            text.includes("<script") ||
            text.includes("<style")
        );
    }

    function buildUrlWithSuffix(url, suffix) {
        return url + (url.includes("?") ? "&" : "?") + suffix;
    }

    // Agrega esto en los Helpers de content.js
    function generateTicketLink(number) {
        if (!number) return "";
        const cleanNum = number.trim();
        // Usamos task.do con query por número. Es el "comodín" de ServiceNow.
        return `${location.origin}/nav_to.do?uri=task.do?sysparm_query=number=${cleanNum}`;
    }
    

    // -----------------------------
    // URL resolution (classic / unified nav / nav_to)
    // -----------------------------
    function getRealListUrl() {
        try {
            const u = new URL(location.href);

            // Direct list pages
            if (u.pathname.endsWith("_list.do")) return u.href;

            // Unified navigation wrapper: /now/nav/ui/classic/params/target/<ENCODED>
            const marker = "/now/nav/ui/classic/params/target/";
            if (u.pathname.includes(marker)) {
                const encoded = u.pathname.split(marker)[1];
                const decoded = decodeURIComponent(encoded); // e.g. "issue_list.do?sysparm_query=..."
                return u.origin + (decoded.startsWith("/") ? decoded : "/" + decoded);
            }

            // nav_to.do?uri=<table>_list.do?...
            if (u.pathname.includes("nav_to.do")) {
                const uri = u.searchParams.get("uri");
                if (uri && uri.includes("_list.do")) {
                    return u.origin + (uri.startsWith("/") ? uri : "/" + uri);
                }
            }

            return null;
        } catch (e) {
            err("URL parsing error:", e);
            return null;
        }
    }

    const realUrl = getRealListUrl();
    if (!realUrl || !realUrl.includes("_list.do")) {
        log("Not a list page, exiting", location.href);
        return;
    }

    log(`v${CONFIG.VERSION} initialized`, { url: location.href, realUrl });

    // -----------------------------
    // Publishing (storage + runtime + debug fallback)
    // -----------------------------
    async function publishResults(result, method) {
        const payload = {
            success: true,
            method,
            ts: new Date().toISOString(),
            pageUrl: location.href,
            realUrl,
            count: result?.count ?? (result?.tickets?.length ?? 0),
            tickets: result?.tickets ?? [],
            meta: {
                version: CONFIG.VERSION,
                instanceId: CONFIG.INSTANCE_ID,
                via: result?.via || method,
            },
            raw: result, // útil para debug
        };

        try {
            // Always store in window as fallback
            window.SN_COPILOT_RESULTS = payload;
            log("Stored in window.SN_COPILOT_RESULTS", payload.count);

            if (hasChromeRuntime()) {
                // Método nuevo: por tab ID
                try {
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (tab?.id) {
                        const key = `SN_DATA_${tab.id}`;
                        await chrome.storage.local.set({
                            [key]: payload,
                            SN_LAST_ACTIVE_TAB: tab.id
                        });
                        log(`Stored in chrome.storage.local with key: ${key}`, payload.count);
                    }
                } catch (tabError) {
                    warn("Could not get tab ID, using legacy method", tabError);
                }

                // Método legacy: compatible
                await chrome.storage.local.set({
                    SN_COPILOT_RESULTS: payload,
                    SN_COPILOT_SAVED_AT: payload.ts,
                });

                chrome.runtime.sendMessage({ type: "SN_SCRAPE_RESULT", payload });
                log("Sent message to background", payload.count);
            }

            log("Results published successfully", { method, count: payload.count });
            return payload;
        } catch (e) {
            err("publish failed", e);
            // fallback para no perder data
            window.SN_COPILOT_RESULTS = payload;
            return payload;
        }
    }

    // -----------------------------
    // Query cleanup for Table API
    // -----------------------------
    function cleanEncodedQuery(query) {
        if (!query) return "";
        return query
            .split("^")
            .filter(Boolean)
            .filter((part) => {
                const upper = part.toUpperCase();
                return (
                    !upper.startsWith("GROUPBY") &&
                    !upper.startsWith("GROUPBYREL") &&
                    !upper.startsWith("ORDERBY") &&
                    !upper.startsWith("HAVING")
                );
            })
            .join("^");
    }

    // -----------------------------
    // CSV parsing
    // -----------------------------
    function parseCSV(text) {
        const rows = [];
        let row = [];
        let cur = "";
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            const next = text[i + 1];

            if (ch === '"' && inQuotes && next === '"') {
                cur += '"';
                i++;
                continue;
            }

            if (ch === '"') {
                inQuotes = !inQuotes;
                continue;
            }

            if (!inQuotes && (ch === "," || ch === "\t")) {
                row.push(cur);
                cur = "";
                continue;
            }

            if (!inQuotes && ch === "\n") {
                row.push(cur);
                rows.push(row);
                row = [];
                cur = "";
                continue;
            }

            if (ch !== "\r") cur += ch;
        }

        if (cur.length || row.length) {
            row.push(cur);
            rows.push(row);
        }
        return rows;
    }

    function mapTicketsFromCSV(rows) {
        if (!rows.length) return { ok: false, error: "Empty CSV data received" };

        const headers = rows[0].map(normalize);
        log("CSV headers detected:", headers);

        const findFieldIndex = (fieldKey) => {
            const candidates = CONFIG.FIELD_MAPPINGS[fieldKey] || [];
            return headers.findIndex((h) =>
                candidates.some((c) => h === normalize(c) || h.includes(normalize(c)) || normalize(c).includes(h))
            );
        };

        const idx = {
            number: findFieldIndex("number"),
            short_description: findFieldIndex("short_description"),
            impact: findFieldIndex("impact"),
            priority: findFieldIndex("priority"),
            assigned_to: findFieldIndex("assigned_to"),
            state: findFieldIndex("state"),
        };

        log("CSV field mapping:", idx);

        if (idx.number < 0) {
            return { ok: false, error: "Can't find number column in CSV", headers };
        }

        const pick = (cols, i) => (i >= 0 ? String(cols[i] ?? "").trim() : "");

        const tickets = [];
        for (let r = 1; r < rows.length; r++) {
            const cols = rows[r];
            const number = pick(cols, idx.number);
            if (!isTicketNumber(number)) continue;

            tickets.push({
                id: number,
                number,
                short_description: pick(cols, idx.short_description),
                impact: pick(cols, idx.impact),
                priority: pick(cols, idx.priority),
                assigned_to: pick(cols, idx.assigned_to),
                state: pick(cols, idx.state),
                href: "",
                pageUrl: realUrl,
                extractionMethod: "csv",
                rowIndex: r,
                link: generateTicketLink(number),
            });
        }

        return {
            ok: true,
            via: "csv",
            count: tickets.length,
            tickets,
            headers,
            fieldMapping: idx,
            totalRows: rows.length - 1,
        };
    }

    async function tryFetchCSV() {
        const strategies = [
            buildUrlWithSuffix(realUrl, "CSV&sysparm_skip_confirm=true&sysparm_encode_utf8=true"),
            buildUrlWithSuffix(realUrl, "sysparm_export=csv&sysparm_skip_confirm=true&sysparm_encode_utf8=true"),
            buildUrlWithSuffix(realUrl, "sysparm_export=csv&sysparm_separator=%2C&sysparm_skip_confirm=true&sysparm_encode_utf8=true"),
            buildUrlWithSuffix(realUrl, "CSV"),
            buildUrlWithSuffix(realUrl, "sysparm_export=csv"),
        ];

        for (let attempt = 0; attempt < CONFIG.RETRY_ATTEMPTS; attempt++) {
            for (const url of strategies) {
                try {
                    log(`CSV attempt ${attempt + 1}/${CONFIG.RETRY_ATTEMPTS}:`, url);

                    const res = await fetch(url, {
                        credentials: "include",
                        headers: {
                            Accept: "text/csv,application/csv,text/plain,*/*",
                            "Cache-Control": "no-cache",
                        },
                    });

                    const contentType = res.headers.get("content-type") || "";
                    const text = await res.text();
                    const head = text.slice(0, 500);

                    log("CSV response:", {
                        url,
                        status: res.status,
                        statusText: res.statusText,
                        contentType,
                        contentLength: text.length,
                        preview: head.replace(/\s+/g, " ").slice(0, 200),
                    });

                    if (!res.ok) continue;
                    if (looksHtml(head)) {
                        warn("CSV response looks like HTML; skipping");
                        continue;
                    }

                    // Heurística: si viene vacío o sin separadores, probablemente no es CSV válido
                    const firstLines = text.split("\n").slice(0, 5);
                    const hasDelims = firstLines.some((l) => l.includes(",") || l.includes("\t"));
                    if (!hasDelims) {
                        warn("CSV response has no delimiters; skipping");
                        continue;
                    }

                    const rows = parseCSV(text);
                    const mapped = mapTicketsFromCSV(rows);

                    if (mapped.ok) {
                        return { ok: true, ...mapped, fetchUrl: res.url, attempt: attempt + 1, strategyUrl: url };
                    }
                } catch (e) {
                    warn("CSV fetch error", { url, message: e?.message });
                }
            }

            if (attempt < CONFIG.RETRY_ATTEMPTS - 1) {
                await sleep(CONFIG.RETRY_DELAY_MS * Math.pow(2, attempt));
            }
        }

        return { ok: false, error: "CSV export failed after retries", attempts: CONFIG.RETRY_ATTEMPTS };
    }

    // -----------------------------
    // Table API fallback
    // -----------------------------
    function deriveTableNameFromRealUrl() {
        try {
            const u = new URL(realUrl);
            const m = u.pathname.match(/\/([^/]+)_list\.do$/);
            if (m?.[1]) {
                const table = m[1];
                return CONFIG.SUPPORTED_TABLES.includes(table) ? table : "issue";
            }
            return "issue";
        } catch {
            return "issue";
        }
    }

    async function tryTableApi() {
        try {
            const u = new URL(realUrl);
            const rawQuery = u.searchParams.get("sysparm_query") || "";
            const cleanedQuery = cleanEncodedQuery(rawQuery);
            const tableName = deriveTableNameFromRealUrl();

            const fields = ["number", "short_description", "impact", "priority", "assigned_to", "state"].join(",");

            const apiUrl =
                `${location.origin}/api/now/table/${tableName}` +
                `?sysparm_query=${encodeURIComponent(cleanedQuery)}` +
                `&sysparm_display_value=true` +
                `&sysparm_exclude_reference_link=true` +
                `&sysparm_fields=${encodeURIComponent(fields)}` +
                `&sysparm_limit=${CONFIG.API_LIMIT}`;

            log("Table API request:", { tableName, apiUrl });

            const res = await fetch(apiUrl, {
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "Cache-Control": "no-cache",
                },
            });

            if (!res.ok) {
                return { ok: false, error: `Table API failed: ${res.status} ${res.statusText}`, apiUrl, tableName };
            }

            const data = await res.json();
            const items = data?.result || [];

            const getFieldValue = (item, fieldName) => {
                const v = item?.[fieldName];
                if (v && typeof v === "object") return v.display_value ?? v.value ?? "";
                return v ?? "";
            };

            const tickets = items
                .map((it, i) => ({
                    id: it.number,
                    number: it.number,
                    short_description: getFieldValue(it, "short_description"),
                    impact: getFieldValue(it, "impact"),
                    priority: getFieldValue(it, "priority"),
                    assigned_to: getFieldValue(it, "assigned_to"),
                    state: getFieldValue(it, "state"),
                    href: "",
                    pageUrl: realUrl,
                    extractionMethod: "table_api",
                    apiIndex: i,
                    tableName,
                    link: generateTicketLink(it.number),
                }))
                .filter((t) => isTicketNumber(t.number));

            return { ok: true, via: "table_api", apiUrl, tableName, count: tickets.length, tickets };
        } catch (e) {
            return { ok: false, error: `Table API exception: ${e?.message}`, stack: e?.stack };
        }
    }

    // -----------------------------
    // DOM fallback (last resort)
    // -----------------------------
    function tryParseFromDOM() {
        try {
            log("Starting DOM parsing...");
            const tables = Array.from(document.querySelectorAll("table"));
            log(`Found ${tables.length} tables`);

            const findHeaderIndex = (headers, fieldKey) => {
                const candidates = CONFIG.FIELD_MAPPINGS[fieldKey] || [];
                return headers.findIndex((h) =>
                    candidates.some((c) => h.includes(normalize(c)) || normalize(c).includes(h))
                );
            };

            for (let t = 0; t < tables.length; t++) {
                const table = tables[t];

                const headerEls = Array.from(
                    table.querySelectorAll("thead th, thead td, tr:first-child th, tr:first-child td")
                );
                const headers = headerEls.map((x) => normalize(x.textContent));
                if (!headers.length) continue;

                const idxNumber = findHeaderIndex(headers, "number");
                if (idxNumber < 0) continue;

                const idxShort = findHeaderIndex(headers, "short_description");
                const idxImpact = findHeaderIndex(headers, "impact");
                const idxPriority = findHeaderIndex(headers, "priority");
                const idxAssigned = findHeaderIndex(headers, "assigned_to");
                const idxState = findHeaderIndex(headers, "state");

                const rows = Array.from(table.querySelectorAll("tbody tr"));
                const tickets = [];

                for (let r = 0; r < rows.length; r++) {
                    const row = rows[r];
                    const tds = Array.from(row.querySelectorAll("td"));
                    if (!tds.length) continue;

                    const numberCell = tds[idxNumber];
                    const number = (numberCell?.textContent || "").trim();
                    if (!isTicketNumber(number)) continue;

                    const pick = (i) => (i >= 0 ? (tds[i]?.textContent || "").trim() : "");
                    const a = numberCell?.querySelector("a");

                    tickets.push({
                        id: number,
                        number,
                        short_description: pick(idxShort),
                        impact: pick(idxImpact),
                        priority: pick(idxPriority),
                        assigned_to: pick(idxAssigned),
                        state: pick(idxState),
                        href: a?.href || "",
                        pageUrl: location.href,
                        extractionMethod: "dom",
                        tableIndex: t + 1,
                        rowIndex: r + 1,
                        link: realHref || generateTicketLink(number),
                    });
                }

                if (tickets.length) {
                    return {
                        ok: true,
                        via: "dom",
                        count: tickets.length,
                        tickets,
                        headers,
                        fieldMapping: {
                            number: idxNumber,
                            short_description: idxShort,
                            impact: idxImpact,
                            priority: idxPriority,
                            assigned_to: idxAssigned,
                            state: idxState,
                        },
                        tableIndex: t + 1,
                        totalTables: tables.length,
                    };
                }
            }

            return { ok: false, error: "No suitable ServiceNow tables found in DOM", tablesScanned: tables.length };
        } catch (e) {
            return { ok: false, error: `DOM parsing failed: ${e?.message}`, stack: e?.stack };
        }
    }

    // -----------------------------
    // Main engine
    // -----------------------------
    async function main() {
        const start = performance.now();
        log("Starting extraction process...");

        try {
            // 1) CSV
            log("=== Strategy 1: CSV Export ===");
            const csv = await tryFetchCSV();
            if (csv.ok) {
                await publishResults(csv, "csv");
                log(`Done in ${(performance.now() - start).toFixed(2)}ms`);
                return;
            }

            // 2) Table API
            log("=== Strategy 2: Table API ===");
            const api = await tryTableApi();
            if (api.ok) {
                await publishResults(api, "table_api");
                log(`Done in ${(performance.now() - start).toFixed(2)}ms`);
                return;
            }

            // 3) DOM
            log("=== Strategy 3: DOM Parsing ===");
            const dom = tryParseFromDOM();
            if (dom.ok) {
                await publishResults(dom, "dom");
                log(`Done in ${(performance.now() - start).toFixed(2)}ms`);
                return;
            }

            // Fail
            err("All strategies failed", {
                csvError: csv.error,
                apiError: api.error,
                domError: dom.error,
            });

            const failPayload = {
                success: false,
                ts: new Date().toISOString(),
                pageUrl: location.href,
                realUrl,
                errors: { csv: csv.error, api: api.error, dom: dom.error },
                meta: { version: CONFIG.VERSION, instanceId: CONFIG.INSTANCE_ID },
            };

            if (hasChromeRuntime()) {
                await chrome.storage.local.set({ SN_COPILOT_RESULTS: failPayload, SN_COPILOT_SAVED_AT: failPayload.ts });
                chrome.runtime.sendMessage({ type: "SN_SCRAPE_RESULT", payload: failPayload });
            } else {
                window.SN_COPILOT_RESULTS = failPayload;
            }

        } catch (e) {
            err("Critical error during extraction", e);

            const crashPayload = {
                success: false,
                ts: new Date().toISOString(),
                pageUrl: location.href,
                realUrl,
                criticalError: { message: e?.message, stack: e?.stack },
                meta: { version: CONFIG.VERSION, instanceId: CONFIG.INSTANCE_ID },
            };

            if (hasChromeRuntime()) {
                await chrome.storage.local.set({ SN_COPILOT_RESULTS: crashPayload, SN_COPILOT_SAVED_AT: crashPayload.ts });
                chrome.runtime.sendMessage({ type: "SN_SCRAPE_RESULT", payload: crashPayload });
            } else {
                window.SN_COPILOT_RESULTS = crashPayload;
            }
        }
    }

    // ---------------------------------------------------------
    // EVENT LISTENERS & INITIALIZATION
    // ---------------------------------------------------------

    // 1. Listen for refresh messages from popup (OUTSIDE main, INSIDE IIFE)
    if (hasChromeRuntime()) {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.type === "REFRESH_DATA") {
                log("Manual refresh requested via Popup");

                // Execute main logic again and acknowledge when done
                main().then(() => {
                    sendResponse({ success: true });
                });

                return true; // Indicates we will send a response asynchronously
            }
        });
    }

    // 2. Initial Run (Automatic)
    main();

})();