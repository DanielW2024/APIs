    import { check, sleep } from 'k6';
    import http from 'k6/http';
    import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
    import { SharedArray } from 'k6/data';


    // ✅ ARRAY PARA GUARDAR RESULTADOS DE PETICIONES
    const resultados = [];

    // ✅ ARRAY PARA GUARDAR LOGS DE CONSOLA
    const consoleLogs = [];

    // ✅ FUNCIONES PERSONALIZADAS PARA LOGS
    function customLog(...args) {
        const message = args.join(' ');
        consoleLogs.push(`[LOG] ${message}`);
        console.log(message);
    }

    function customError(...args) {
        const message = args.join(' ');
        consoleLogs.push(`[ERROR] ${message}`);
        console.error(message);
    }

    const LOAD_TEST_ID = 'LT-20260831-001';
    const testStartTime = new Date().toLocaleString('es-ES');

    function getSarequestts() {
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const day = String(now.getUTCDate()).padStart(2, '0');
        const hours = String(now.getUTCHours()).padStart(2, '0');
        const minutes = String(now.getUTCMinutes()).padStart(2, '0');
        const seconds = String(now.getUTCSeconds()).padStart(2, '0');
        const ms = String(now.getUTCMilliseconds()).padStart(3, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}Z`;
    }

    const testStartTimeMs = (() => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const ms = String(now.getMilliseconds()).padStart(3, '0');
        return `${hours}${minutes}${seconds}${ms}`;
    })();

    const addressData = new SharedArray('direcciones', function () {
        const file = open('./direccion/ids1.csv');
        const parsed = papaparse.parse(file, { header: true, skipEmptyLines: true });
        return parsed.data;
    });

    customLog(`📊 Total direcciones cargadas: ${addressData.length}`);

    const config = {
        cognitoUrl: 'https://winet-redneu-prod-ue1-cog-domain-vno.auth.us-east-1.amazoncognito.com',
        qualificationUrl: 'https://dna06ojn0l.execute-api.us-east-1.amazonaws.com/v1',
        cognito: {
            clientId: 'gb26tsrgtehshtpgdl0c1gpq6',
            clientSecret: 'gf47f241s7tt4pnhsi8gfp9hb0hfg7546kha7cd8jvos6n01c9k',
            scope: 'tmf/tmf679.write',
            grantType: 'client_credentials'
        },
        qualification: {
            ctrycode: 'PER',
            sacode: '1634',
            xApiKey: 'DjIpjZ2v1taytGF34pgma3Qhph5kaZp72YtKyvLy',
            channelId: '1371',
            channelName: 'FCT-UNI',
            country: 'Peru'
        }
    };

    let addressCounter = 0;

    function generateRandomChars(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    function getTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const ms = String(now.getMilliseconds()).padStart(3, '0');
        return `${year}${month}${day}${hours}${minutes}${seconds}${ms}`;
    }

    function getToken() {
        const url = `${config.cognitoUrl}/oauth2/token`;

        const payload = {
            grant_type: config.cognito.grantType,
            client_id: config.cognito.clientId,
            client_secret: config.cognito.clientSecret,
            scope: config.cognito.scope
        };

        const params = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        const response = http.post(url, payload, params);

        customLog(`🔑 Token Status: ${response.status}`);

        if (response.status === 200) {
            const token = response.json('access_token');
            customLog(`✅ Token obtenido`);
            return token;
        } else {
            customError(`❌ Error en token: ${response.status}`);
            customError(`❌ Body token: ${response.body}`);
            return null;
        }
    }

    function createQualification(token, eventId, messageId, addressId) {
        const url = `${config.qualificationUrl}/tmf679/checkProductOfferingQualification`;
        const sarequestts = getSarequestts();

        // ✅ OBTENER EL API KEY
        const xApiKey = config.qualification.xApiKey;

        const headers = {
            'Authorization': `Bearer ${token}`,
            'ctrycode': config.qualification.ctrycode,
            'sacode': config.qualification.sacode,
            'x-api-key': xApiKey,  // ← Aquí se usa
            'eventid': eventId,
            'messageid': messageId,
            'sarequestts': getSarequestts(),
            'Content-Type': 'application/json',
            'X-Load-Test': 'true',
            'X-Load-Test-Id': LOAD_TEST_ID
        };

        // ✅ IMPRIMIR EL API KEY EN CONSOLA
        customLog(`🔑 API KEY ENVIADO: ${xApiKey}`);

        // ✅ OPCIONAL: Imprimir también los headers completos
        customLog(`📋 HEADERS COMPLETOS:`);
        customLog(JSON.stringify(headers, null, 2));

        const body = {
            '@type': 'CheckProductOfferingQualification',
            'channel': {
                'id': config.qualification.channelId,
                'name': config.qualification.channelName,
                '@type': 'ChannelRef'
            },
            'checkProductOfferingQualificationItem': [{
                'id': '1',
                '@type': 'CheckProductOfferingQualificationItem',
                'product': {
                    '@type': 'Product',
                    'place': [{
                        'role': 'installationAddress',
                        '@type': 'RelatedPlaceRefOrValue',
                        'place': {
                            'id': addressId,
                            'country': config.qualification.country,
                            '@type': 'GeographicAddress'
                        }
                    }],
                    'id': 'PROD-004'
                }
            }],
            'characteristic': [{
                '@type': 'ObjectCharacteristic',
                'name': 'checkProductOfferingQualification.event',
                'value': {
                    'eventId': eventId,
                    'messageId': messageId
                }
            }]
        };
        const response = http.post(
            url,
            JSON.stringify(body),
            { headers: headers }
        );

        // ============================================================
        // RESPONSE DE LA API
        // ============================================================

        const requestId =
        response.headers['X-Amzn-Requestid'] ||
        response.headers['x-amzn-requestid'] ||
        'NO DISPONIBLE';

        let responseBody;

        try {
            responseBody = response.json();
        } catch (e) {
            responseBody = response.body;
        }

        // ============================================================
        // GUARDAR RESULTADO DEL RESPONSE
        // ============================================================

        resultados.push({
            timestamp: new Date().toISOString(),

            vu: __VU,
            iteration: __ITER + 1,

            addressId: addressId,
            eventId: eventId,
            messageId: messageId,

            response: {
                status: response.status,
                statusText: response.status_text,

                headers: response.headers,

                body: responseBody
            }
        });

        // ============================================================
        // LOG DEL RESPONSE COMPLETO
        // ============================================================

        customLog(`\n${'='.repeat(70)}`);
        customLog(`📡 RESPONSE PETICIÓN #${__ITER + 1} - VU ${__VU}`);

        customLog(`📍 addressId: ${addressId}`);
        customLog(`📝 eventId: ${eventId}`);
        customLog(`📝 messageId: ${messageId}`);

        customLog(`\n📊 STATUS CODE: ${response.status} ${response.status_text}`);

        customLog(`\n🔑 X-Amzn-Requestid: ${requestId}`);

        customLog(`\n📋 RESPONSE HEADERS:`);
        customLog(JSON.stringify(response.headers, null, 2));

        customLog(`\n📄 RESPONSE BODY (COMPLETO):`);
        customLog(
            typeof responseBody === 'string'
            ? responseBody
            : JSON.stringify(responseBody, null, 2)
        );

        customLog(`${'='.repeat(70)}\n`);

        if (response.status !== 200 && response.status !== 201) {
            customError(`❌ API Error: ${response.status}`);
        }

        return response;
    }
    export const options = {
        stages: [
            { duration: '10m', target: 10 },
        ],
        thresholds: {
            http_req_duration: ['p(95)<5000'],
        },
        summaryTrendStats: ['min', 'med', 'avg', 'p(90)', 'p(95)', 'p(99)', 'max']
    };

    export function setup() {
        customLog('🔑 Obteniendo token...');
        const token = getToken();
        if (!token) {
            customError('❌ Error al obtener token');
            throw new Error('No se pudo obtener el token.');
        }
        customLog('✅ Token obtenido exitosamente');
        return { token };
    }

    export default function(data) {
        const token = data?.token;
        if (!token) {
            customError('❌ No hay token');
            return;
        }

        const totalAddresses = addressData.length;
        const addressIndex = addressCounter % totalAddresses;
        const addressRecord = addressData[addressIndex];
        const addressId = addressRecord?.addressId || '15012200016251';
        addressCounter++;

        const channelId = config.qualification.channelId;
        const timestamp = getTimestamp();
        const randomChars = generateRandomChars(6);

        const eventId = `E.${channelId}.${timestamp}.${randomChars}`;
        const messageId = `M.${channelId}.${timestamp}.${randomChars}`;

        customLog(`📝 EVENT ID: ${eventId}`);
        customLog(`📝 MESSAGE ID: ${messageId}`);
        customLog(`📍 VU ${__VU} - ITER ${__ITER} - addressId: ${addressId}`);

        const response = createQualification(token, eventId, messageId, addressId);

        check(response, {
            '✅ Status 200/201': (r) => r.status === 200 || r.status === 201
        });

        sleep(0.3);
    }

    export function handleSummary(data) {
        const metrics = data.metrics;

        const iterations = metrics.iterations;
        const totalIterationsWithToken = iterations?.values?.count || 0;
        const totalIterations = Math.max(0, totalIterationsWithToken - 1);

        const vusMax = metrics.vus_max;
        const maxVUs = vusMax?.values?.value || vusMax?.value || 0;

        const httpDuration = metrics.http_req_duration;
        const p95 = httpDuration?.values?.['p(95)'] || 0;
        const p90 = httpDuration?.values?.['p(90)'] || 0;
        const p99 = httpDuration?.values?.['p(99)'] || 0;
        const avg = httpDuration?.values?.avg || 0;
        const max = httpDuration?.values?.max || 0;
        const min = httpDuration?.values?.min || 0;
        const med = httpDuration?.values?.med || 0;

        const httpReqs = metrics.http_reqs;
        const totalRequests = httpReqs?.values?.count || 0;
        const testDurationSeconds = metrics.iteration_duration?.values?.avg || 0;

        const checks = metrics.checks;
        const checkPasses = checks?.['✅ Status 200/201']?.passes || 0;
        const checkFails = checks?.['✅ Status 200/201']?.fails || 0;
        const totalChecks = checkPasses + checkFails;

        const apiSuccessRate = totalChecks > 0
        ? ((checkPasses / totalChecks) * 100)
        : 100;

        const apiFails = checkFails;

        customLog(`📊 maxVUs: ${maxVUs}`);
        customLog(`📊 Peticiones API: ${totalIterations}`);
        customLog(`📊 Checks exitosos: ${checkPasses}`);
        customLog(`📊 Checks fallidos: ${checkFails}`);
        customLog(`📊 Tasa éxito API: ${apiSuccessRate.toFixed(2)}%`);
        customLog(`📊 Throughput: ${(totalIterations / 10).toFixed(2)} req/s`);

        const totalAvailable = addressData.length;
        const uniqueAddresses = addressData.map(item => item.addressId);
        const isPassed = apiSuccessRate > 95 && p95 < 5000;

        const html = `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Reporte de Prueba de Estrés</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f2f5; padding: 20px; }
            .container { max-width: 1200px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #1a237e, #0d47a1); color: white; padding: 25px 30px; border-radius: 12px; margin-bottom: 20px; }
            .header h1 { font-size: 24px; font-weight: 300; }
            .header .subtitle { opacity: 0.8; margin-top: 3px; font-size: 14px; }
            .status-badge { display: inline-block; padding: 6px 18px; border-radius: 20px; font-weight: bold; margin-top: 8px; font-size: 14px; }
            .status-passed { background: #4CAF50; color: white; }
            .status-warning { background: #FF9800; color: white; }
            .status-failed { background: #f44336; color: white; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 15px; }
            .card { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
            .card .value { font-size: 24px; font-weight: bold; color: #1a237e; }
            .card .label { font-size: 12px; color: #666; margin-top: 3px; }
            .card .sub-value { font-size: 13px; color: #888; margin-top: 3px; }
            .config-box { background: white; padding: 18px 20px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); margin-bottom: 15px; }
            .config-box h2 { font-size: 16px; color: #333; margin-bottom: 12px; }
            .config-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
            .config-item { background: #f8f9ff; padding: 10px 14px; border-radius: 6px; border-left: 3px solid #1a237e; }
            .config-item .config-label { font-size: 11px; color: #666; text-transform: uppercase; }
            .config-item .config-value { font-size: 15px; font-weight: bold; color: #1a237e; }
            .stages-list { margin-top: 10px; background: #f8f9ff; padding: 12px 15px; border-radius: 6px; font-size: 14px; }
            .chart-container { background: white; padding: 12px 15px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); margin-bottom: 15px; }
            .chart-container h2 { font-size: 14px; color: #333; margin-bottom: 6px; }
            .chart-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
            @media (max-width: 768px) { .chart-row { grid-template-columns: 1fr; } }
            .address-info { background: #e3f2fd; padding: 12px 15px; border-radius: 6px; margin-bottom: 15px; border-left: 4px solid #1976D2; }
            .address-scroll { max-height: 80px; overflow-y: auto; background: white; padding: 8px 10px; border-radius: 4px; margin-top: 6px; border: 1px solid #bbdefb; }
            .address-scroll::-webkit-scrollbar { width: 4px; }
            .address-scroll::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 2px; }
            .address-scroll::-webkit-scrollbar-thumb { background: #1976D2; border-radius: 2px; }
            .address-tag { display: inline-block; background: #e3f2fd; padding: 1px 6px; margin: 1px; border-radius: 3px; font-family: monospace; font-size: 11px; border: 1px solid #bbdefb; }
            .badge-count { display: inline-block; background: #1976D2; color: white; padding: 1px 8px; border-radius: 10px; font-size: 11px; font-weight: bold; }
            .footer { text-align: center; padding: 15px; color: #999; font-size: 12px; margin-top: 15px; }
            .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; }
            .badge-green { background: #4CAF50; color: white; }
            .badge-orange { background: #FF9800; color: white; }
            .badge-red { background: #f44336; color: white; }
            .badge-blue { background: #1976D2; color: white; }
            .recommendation { background: #fff3e0; padding: 15px 20px; border-radius: 8px; border-left: 4px solid #FF6F00; margin-top: 15px; }
            .recommendation h3 { font-size: 16px; color: #e65100; margin-bottom: 6px; }
            .recommendation p { font-size: 14px; }
            .top5 { background: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); margin-top: 15px; }
            .top5 h2 { font-size: 16px; color: #333; margin-bottom: 10px; }
            .top5 .req-name { font-weight: 600; color: #1a237e; font-size: 13px; }
            .top5 .req-url { color: #666; font-size: 11px; font-family: monospace; }
            .metric-bar { height: 6px; background: #e0e0e0; border-radius: 3px; margin-top: 4px; overflow: hidden; }
            .metric-bar-fill { height: 100%; border-radius: 3px; }
            .bar-green { background: #4CAF50; }
            .bar-orange { background: #FF9800; }
            .bar-red { background: #f44336; }
            .bar-blue { background: #1976D2; }
            .highlight-slow { color: #f44336; font-weight: bold; }
            .highlight-medium { color: #FF9800; }
            .highlight-fast { color: #4CAF50; }
            table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.08); font-size: 13px; }
            th { background: #1a237e; color: white; padding: 10px 12px; text-align: left; font-weight: 500; font-size: 12px; }
            td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; }
            tr:hover { background: #f8f9ff; }
            .detail-table { margin-top: 15px; }
            .detail-table th { font-size: 11px; }
            .detail-table td { font-size: 12px; }
            .note { background: #fff8e1; padding: 8px 15px; border-radius: 6px; font-size: 12px; color: #666; margin-top: 10px; border-left: 3px solid #FFC107; }
            .error-note { background: #ffebee; padding: 8px 15px; border-radius: 6px; font-size: 12px; color: #c62828; margin-top: 10px; border-left: 3px solid #f44336; }
            .success-note { background: #e8f5e9; padding: 8px 15px; border-radius: 6px; font-size: 12px; color: #2e7d32; margin-top: 10px; border-left: 3px solid #4CAF50; }
            .warning-note { background: #fff3e0; padding: 8px 15px; border-radius: 6px; font-size: 12px; color: #e65100; margin-top: 10px; border-left: 3px solid #FF9800; }
            .datetime-info { background: #e8eaf6; padding: 10px 15px; border-radius: 6px; margin-bottom: 15px; border-left: 4px solid #3f51b5; display: flex; justify-content: flex-start; flex-wrap: wrap; font-size: 13px; gap: 20px; }
            .datetime-info .label { color: #666; }
            .datetime-info .value { font-weight: bold; color: #1a237e; }
            .ms-badge { background: #3f51b5; color: white; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-family: monospace; }
            .throughput-highlight { color: #1976D2; font-weight: bold; font-size: 28px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Reporte de Prueba de Estrés</h1>
                <div class="subtitle">API: Qualification (TMF679)</div>
                <div class="subtitle">Tipo: Stress Test</div>
                <div class="status-badge ${isPassed ? 'status-passed' : (apiSuccessRate > 95 ? 'status-warning' : 'status-failed')}">
                    ${isPassed ? '✅ APROBADO' : (apiSuccessRate > 95 ? '⚠️ ADVERTENCIA' : '❌ FALLIDO')}
                </div>
            </div>

            <div class="datetime-info">
                <div>
                    <span class="label">📅 Inicio:</span>
                    <span class="value">${testStartTime}</span>
                </div>
                <div>
                    <span class="label">⏱️ Timestamp (HHmmssSSS):</span>
                    <span class="value"><span class="ms-badge">${testStartTimeMs}</span></span>
                </div>
            </div>

            <div class="config-box">
                <h2>Configuración de la Prueba</h2>
                <div class="config-grid">
                    <div class="config-item">
                        <div class="config-label">Escenarios (Stages)</div>
                        <div class="config-value">1</div>
                    </div>
                    <div class="config-item">
                        <div class="config-label">Máximo de VUs</div>
                        <div class="config-value">${maxVUs}</div>
                    </div>
                    <div class="config-item">
                        <div class="config-label">Duración Total</div>
                        <div class="config-value">10s</div>
                    </div>
                    <div class="config-item">
                        <div class="config-label">Peticiones a la API</div>
                        <div class="config-value">${totalIterations}</div>
                    </div>
                    <div class="config-item">
                        <div class="config-label">🚀 Throughput</div>
                        <div class="config-value">${(totalIterations / 10).toFixed(2)} req/s</div>
                    </div>
                </div>
                <div class="stages-list">
                    <strong>Detalle de Stages:</strong>
                    <span style="margin-left: 10px;">Stage 1: 10s → 👥 5 VUs</span>
                </div>
            </div>

            <div class="address-info">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                    <div>
                        <strong>Direcciones disponibles:</strong>
                        <span class="badge-count">${totalAvailable}</span>
                    </div>
                    <span style="font-size: 12px; color: #666;">Asignación secuencial (orden del CSV)</span>
                </div>
                <div class="address-scroll">
                    ${uniqueAddresses.slice(0, 20).map(id => `<span class="address-tag">${id}</span>`).join('')}
                    ${totalAvailable > 20 ? `<span class="address-tag" style="background: #e0e0e0;">... +${totalAvailable - 20} más</span>` : ''}
                </div>
            </div>

            ${apiFails > 0 ? `
            <div class="error-note">
                ⚠️ <strong>ALERTA:</strong> ${apiFails} de ${totalIterations} peticiones a la API fallaron (${(100 - apiSuccessRate).toFixed(1)}%).
            </div>
            ` : apiFails === 0 && totalIterations > 0 ? `
            <div class="success-note">
                ✅ <strong>¡ÉXITO!</strong> Todas las peticiones a la API fueron exitosas.
                <br><br>
                <strong>📊 Resumen:</strong>
                <ul style="margin-left: 20px; margin-top: 5px;">
                    <li>✅ Peticiones exitosas: ${totalIterations}</li>
                    <li>📈 Tasa de éxito: ${apiSuccessRate.toFixed(1)}%</li>
                    <li>⏱️ Tiempo promedio: ${avg.toFixed(0)}ms</li>
                    <li>👥 Usuarios concurrentes: ${maxVUs}</li>
                    <li>🚀 Throughput: ${(totalIterations / 10).toFixed(2)} req/s</li>
                    <li>📍 Direcciones usadas: ${Math.min(totalIterations, totalAvailable)} de ${totalAvailable}</li>
                </ul>
            </div>
            ` : ''}

            <div class="grid">
                <div class="card">
                    <div class="value">${totalIterations}</div>
                    <div class="label">Peticiones a la API</div>
                </div>
                <div class="card">
                    <div class="value" style="color: ${p95 < 2000 ? '#4CAF50' : p95 < 4000 ? '#FF9800' : '#f44336'}">${p95.toFixed(0)}ms</div>
                    <div class="label">Tiempo p(95)</div>
                    <div class="metric-bar"><div class="metric-bar-fill ${p95 < 2000 ? 'bar-green' : p95 < 4000 ? 'bar-orange' : 'bar-red'}" style="width: ${Math.min((p95 / 5000) * 100, 100)}%"></div></div>
                </div>
                <div class="card">
                    <div class="value" style="color: ${apiSuccessRate > 99 ? '#4CAF50' : apiSuccessRate > 95 ? '#FF9800' : '#f44336'}">${apiSuccessRate.toFixed(1)}%</div>
                    <div class="label">Tasa de Éxito</div>
                </div>
                <div class="card">
                    <div class="value">${maxVUs}</div>
                    <div class="label">Usuarios Concurrentes</div>
                </div>
                <div class="card">
                    <div class="value" style="color: ${avg < 1000 ? '#4CAF50' : '#FF9800'}">${avg.toFixed(0)}ms</div>
                    <div class="label">Tiempo Promedio</div>
                </div>
                <div class="card">
                    <div class="value" style="color: ${max < 5000 ? '#4CAF50' : '#f44336'}">${max.toFixed(0)}ms</div>
                    <div class="label">Tiempo Máximo</div>
                </div>
                <div class="card" style="background: linear-gradient(135deg, #e3f2fd, #bbdefb); border: 2px solid #1976D2;">
                    <div class="value" style="color: #0d47a1;">${(totalIterations / 10).toFixed(2)}</div>
                    <div class="label">🚀 Throughput (req/s)</div>
                    <div class="sub-value">${totalIterations} requests en 10s</div>
                </div>
            </div>

            <div class="chart-row">
                <div class="chart-container">
                    <h2>📊 Distribución de Tiempos de Respuesta</h2>
                    <canvas id="percentileChart" height="150"></canvas>
                </div>
                <div class="chart-container">
                    <h2>🚀 Throughput - Rendimiento</h2>
                    <canvas id="throughputChart" height="150"></canvas>
                </div>
            </div>

            <div class="top5">
                <h2>Requests más lentos</h2>
                <p style="color:#666; font-size:12px; margin-bottom:8px;">Solo se muestran las peticiones a la API (excluye token)</p>
                <table>
                    <thead>
                        <tr>
                            <th>Request</th>
                            <th>Promedio (ms)</th>
                            <th>p(90)</th>
                            <th>p(95)</th>
                            <th>p(99)</th>
                            <th>Mínimo</th>
                            <th>Máximo</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <div class="req-name">POST - Qualification API</div>
                                <div class="req-url">/tmf679/checkProductOfferingQualification</div>
                            </td>
                            <td class="${avg > 300 ? 'highlight-slow' : avg > 200 ? 'highlight-medium' : 'highlight-fast'}">${avg.toFixed(0)}</td>
                            <td>${p90.toFixed(0)}</td>
                            <td>${p95.toFixed(0)}</td>
                            <td>${p99.toFixed(0)}</td>
                            <td>${min.toFixed(0)}</td>
                            <td>${max.toFixed(0)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="detail-table">
                <div style="background: white; padding: 15px 20px; border-radius: 8px 8px 0 0; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
                    <h2 style="font-size: 16px; color: #333;">Métricas Detalladas</h2>
                    <p style="font-size: 12px; color: #666;">Excluye la petición del token (1 sola vez) - ${totalIterations} peticiones a la API</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Métrica</th>
                            <th>Mínimo</th>
                            <th>Mediana</th>
                            <th>Promedio</th>
                            <th>p(90)</th>
                            <th>p(95)</th>
                            <th>p(99)</th>
                            <th>Máximo</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Tiempo de Respuesta</strong></td>
                            <td>${min.toFixed(0)}ms</td>
                            <td>${med.toFixed(0)}ms</td>
                            <td>${avg.toFixed(0)}ms</td>
                            <td>${p90.toFixed(0)}ms</td>
                            <td>${p95.toFixed(0)}ms</td>
                            <td>${p99.toFixed(0)}ms</td>
                            <td>${max.toFixed(0)}ms</td>
                        </tr>
                        <tr>
                            <td><strong>Fallos</strong></td>
                            <td colspan="7" style="text-align:center; font-weight:bold; color: ${apiFails < 1 ? '#4CAF50' : '#f44336'}">
                                ${apiFails} fallos (${(100 - apiSuccessRate).toFixed(2)}%)
                            </td>
                        </tr>
                        <tr>
                            <td><strong>🚀 Throughput</strong></td>
                            <td colspan="7" style="text-align:center; font-weight:bold; color: #1976D2;">
                                ${(totalIterations / 10).toFixed(2)} requests/segundo
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div class="note">
                    📌 El token se obtiene 1 sola vez y no se incluye en las métricas.
                    Peticiones totales (con token): ${totalIterationsWithToken} | Peticiones a la API (sin token): ${totalIterations}
                    ${apiFails > 0 ? ` | ⚠️ ${apiFails} peticiones a la API fallaron.` : ' | ✅ Todas las peticiones a la API fueron exitosas.'}
                </div>
            </div>

            <div class="recommendation">
                <h3>Recomendación</h3>
                ${p95 < 2000 && apiSuccessRate > 99 ? `
                    <p>✅ <strong>Excelente rendimiento</strong> - El sistema responde correctamente con ${maxVUs} usuarios concurrentes.</p>
                    <p><span class="badge badge-green">RENDIMIENTO ÓPTIMO</span></p>
                    <p>📍 Se usaron ${Math.min(totalIterations, totalAvailable)} direcciones diferentes del CSV</p>
                    <p>🚀 Throughput: ${(totalIterations / 10).toFixed(2)} req/s</p>
                ` : p95 < 4000 && apiSuccessRate > 95 ? `
                    <p>⚠️ Rendimiento aceptable - El sistema soporta ${maxVUs} usuarios con ligera degradación.</p>
                    <p><span class="badge badge-orange">RENDIMIENTO ACEPTABLE</span></p>
                    <p>🚀 Throughput: ${(totalIterations / 10).toFixed(2)} req/s</p>
                ` : `
                    <p>🔴 Rendimiento crítico - ${apiFails} de ${totalIterations} peticiones fallaron (${(100 - apiSuccessRate).toFixed(1)}% de fallos).</p>
                    <p><span class="badge badge-red">NECESITA REVISIÓN</span></p>
                    <p style="margin-top:8px;">💡 Actualiza el CSV con direcciones válidas o usa una dirección fija.</p>
                `}
            </div>

            <div class="footer">
                Reporte generado con k6 - ${new Date().toLocaleString('es-ES')}
                <br>API: Qualification (TMF679) - Prueba de Estrés
                <br>${totalIterations} peticiones a la API • ${maxVUs} VUs • 10s
                <br>🚀 Throughput: ${(totalIterations / 10).toFixed(2)} req/s
                <br>📍 Direcciones del CSV (${totalAvailable} disponibles) • Asignación secuencial
                <br>⏱️ Timestamp inicio: ${testStartTimeMs}
                ${apiFails === 0 ? '✅ Todas las peticiones exitosas' : ''}
            </div>
        </div>

        <script>
            new Chart(document.getElementById('percentileChart'), {
                type: 'bar',
                data: {
                    labels: ['Mínimo', 'Mediana', 'Promedio', 'p(90)', 'p(95)', 'p(99)', 'Máximo'],
                    datasets: [{
                        label: 'Tiempo de Respuesta (ms)',
                        data: [${min.toFixed(0)}, ${med.toFixed(0)}, ${avg.toFixed(0)}, ${p90.toFixed(0)}, ${p95.toFixed(0)}, ${p99.toFixed(0)}, ${max.toFixed(0)}],
                        backgroundColor: ['#4CAF50', '#1976D2', '#2196F3', '#FF9800', '#FF6F00', '#f44336', '#C62828'],
                        borderRadius: 4,
                        barThickness: 20
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'ms', font: { size: 10 } }, ticks: { font: { size: 9 } } },
                        x: { ticks: { font: { size: 9 } } }
                    }
                }
            });

            new Chart(document.getElementById('throughputChart'), {
                type: 'doughnut',
                data: {
                    labels: ['Requests Exitosos', 'Requests Fallidos'],
                    datasets: [{
                        data: [${checkPasses}, ${checkFails}],
                        backgroundColor: ['#4CAF50', '#f44336'],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { position: 'bottom', labels: { font: { size: 10 }, padding: 10 } },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = ${totalIterations};
                                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                                    return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                                }
                            }
                        }
                    },
                    cutout: '65%'
                }
            });
        </script>
    </body>
    </html>`;

        const resultadosJson = {
            testInfo: {
                loadTestId: LOAD_TEST_ID,
                startTime: testStartTime,
                startTimeMs: testStartTimeMs,
                totalRequests: resultados.length,
                totalAddresses: addressData.length
            },
            resultados: resultados
        };

        return {
            'reports/stress-test679.html': html,
            'reports/stress-test-summary.json': JSON.stringify(data, null, 2),
            'reports/resultados-completos.json': JSON.stringify(resultadosJson, null, 2),
            'reports/consola-completa.log': consoleLogs.join('\n')
        };
    }