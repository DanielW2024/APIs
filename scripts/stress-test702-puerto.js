import { check, sleep } from 'k6';
import http from 'k6/http';

// HORA DE INICIO DE LA PRUEBA
const testStartTime = new Date().toLocaleString('es-ES');

const config = {
    cognitoUrl: 'https://winet-redneu-test-ue1-cog-domain-vno.auth.us-east-1.amazoncognito.com',
    qualificationUrl: 'https://7459k5n980.execute-api.us-east-1.amazonaws.com/v1',
    cognito: {
        clientId: '43veeetq8neth3sqd0lj3cfvfv',
        clientSecret: '175uhgr5hcmac6ess2uett1530mhk0808ri0q4cfhdqbeoo505rj',
        scope: 'tmf/tmf702.write',
        grantType: 'client_credentials'
    },
    service702: {
        ctrycode: 'PER',
        sacode: '1634',
        xApiKey: 'X6grhUz3lA6O7fFoNYf2W81J2bPeVGTo8jYK21Vt',
        channelId: '1606',
        channelName: 'APP-UNI',
        idempotencyKey: 'idkey702',
        correlationId: 'idco702',
        sarequestts: 'SRQ-VNO-BPORT-QDS-0001'
    }
};

let globalCounter = 0;

// ✅ ARRAY PARA GUARDAR TIEMPOS DE RESPUESTA
const responseTimes = [];

function getToken() {
    const url = `${config.cognitoUrl}/oauth2/token`;
    const payload = {
        grant_type: config.cognito.grantType,
        client_id: config.cognito.clientId,
        client_secret: config.cognito.clientSecret,
        scope: config.cognito.scope
    };
    const params = {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    };
    const response = http.post(url, payload, params);

    console.log(`🔑 Token Status: ${response.status}`);
    if (response.status === 200) {
        const token = response.json('access_token');
        console.log(`✅ Token obtenido`);
        return token;
    } else {
        console.error(`❌ Error en token: ${response.status}`);
        return null;
    }
}

function searchPorts(token, eventId, messageId) {
    const url = `${config.qualificationUrl}/tmf702/resource`;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'idempotency-key': config.service702.idempotencyKey,
        'x-correlation-id': config.service702.correlationId,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'messageid': messageId,
        'ctrycode': config.service702.ctrycode,
        'eventid': eventId,
        'sacode': config.service702.sacode,
        'sarequestts': config.service702.sarequestts,
        'x-api-key': config.service702.xApiKey
    };
    const body = {
        'name': 'Resource A',
        'resourceCharacteristic': [
            {
                '@type': 'ObjectCharacteristic',
                'name': 'resource.box',
                'value': {
                    '@type': 'Resource',
                    'id': '1628417',
                    'category': 'box',
                    'port': {
                        'id': '5896549',
                        'category': 'port'
                    }
                }
            },
            {
                '@type': 'StringCharacteristic',
                'name': 'resource.criterialSearch',
                'value': 'SearchBoxPort'
            },
            {
                '@type': 'ObjectCharacteristic',
                'name': 'resource.channel',
                'value': {
                    'id': config.service702.channelId,
                    'name': config.service702.channelName,
                    '@type': 'ChannelRef'
                }
            },
            {
                '@type': 'ObjectCharacteristic',
                'name': 'resource.event',
                'value': {
                    'eventId': eventId,
                    'messageId': messageId
                }
            }
        ]
    };
    const response = http.post(url, JSON.stringify(body), { headers: headers });

    if (response.status !== 200 && response.status !== 201) {
        console.error(`❌ API Error (Puertos): ${response.status}`);
    } else {
        console.log(`✅ API Success (Puertos): ${response.status}`);
    }

    return response;
}

export const options = {
    stages: [
        { duration: '10s', target: 5 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<5000'],
    },
    summaryTrendStats: ['min', 'med', 'avg', 'p(90)', 'p(95)', 'p(99)', 'max']
};

export function setup() {
    console.log('🔑 Obteniendo token...');
    const token = getToken();
    if (!token) {
        console.error('❌ Error al obtener token');
        throw new Error('No se pudo obtener el token.');
    }
    console.log('✅ Token obtenido exitosamente');
    return { token };
}

export default function(data) {
    const token = data?.token;
    if (!token) {
        console.error('❌ No hay token');
        return;
    }

    globalCounter++;

    const vuId = __VU || 0;
    const iterId = __ITER || 0;
    const counter = globalCounter;

    // ✅ Generar IDs únicos (sin CSV)
    const eventId = `EVT-PORT-${String(vuId).padStart(4, '0')}${String(iterId).padStart(4, '0')}`;
    const messageId = `MSG-PORT-${String(vuId).padStart(4, '0')}${String(iterId).padStart(4, '0')}.wintst`;

    console.log(`📍 VU ${__VU} - ITER ${__ITER} - eventId: ${eventId}`);

    const response = searchPorts(token, eventId, messageId);

    // ✅ Guardar tiempo de respuesta
    if (response.timings && response.timings.duration) {
        responseTimes.push(response.timings.duration);
    }

    check(response, {
        'Status OK 200 or 201': (r) => r.status === 200 || r.status === 201
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

    const checks = metrics.checks;
    const checkPasses = checks?.['Status OK 200 or 201']?.passes || 0;
    const checkFails = checks?.['Status OK 200 or 201']?.fails || 0;
    const totalChecks = checkPasses + checkFails;

    const apiSuccessRate = totalChecks > 0 ? ((checkPasses / totalChecks) * 100) : 100;
    const apiFails = checkFails;

    console.log(`📊 maxVUs: ${maxVUs}`);
    console.log(`📊 Peticiones API (Puertos): ${totalIterations}`);
    console.log(`📊 Checks exitosos: ${checkPasses}`);
    console.log(`📊 Checks fallidos: ${checkFails}`);
    console.log(`📊 Tasa éxito API: ${apiSuccessRate.toFixed(2)}%`);

    const isPassed = apiSuccessRate > 95 && p95 < 5000;

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reporte de Prueba de Estrés - TMF 702 Puertos</title>
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
        .config-box { background: white; padding: 18px 20px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); margin-bottom: 15px; }
        .config-box h2 { font-size: 16px; color: #333; margin-bottom: 12px; }
        .config-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
        .config-item { background: #f8f9ff; padding: 10px 14px; border-radius: 6px; border-left: 3px solid #1a237e; }
        .config-item .config-label { font-size: 11px; color: #666; text-transform: uppercase; }
        .config-item .config-value { font-size: 15px; font-weight: bold; color: #1a237e; }
        .stages-list { margin-top: 10px; background: #f8f9ff; padding: 12px 15px; border-radius: 6px; font-size: 14px; }
        .chart-container { background: white; padding: 8px 12px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); margin-bottom: 15px; }
        .chart-container h2 { font-size: 13px; color: #333; margin-bottom: 4px; }
        .footer { text-align: center; padding: 15px; color: #999; font-size: 12px; margin-top: 15px; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; }
        .badge-green { background: #4CAF50; color: white; }
        .badge-orange { background: #FF9800; color: white; }
        .badge-red { background: #f44336; color: white; }
        .recommendation { background: #fff3e0; padding: 15px 20px; border-radius: 8px; border-left: 4px solid #FF6F00; margin-top: 15px; }
        .recommendation h3 { font-size: 16px; color: #e65100; margin-bottom: 6px; }
        .recommendation p { font-size: 14px; }
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
        .datetime-info { background: #e8eaf6; padding: 10px 15px; border-radius: 6px; margin-bottom: 15px; border-left: 4px solid #3f51b5; display: flex; justify-content: flex-start; flex-wrap: wrap; font-size: 13px; gap: 20px; }
        .datetime-info .label { color: #666; }
        .datetime-info .value { font-weight: bold; color: #1a237e; }
        .top5 { background: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.08); margin-top: 15px; }
        .top5 h2 { font-size: 16px; color: #333; margin-bottom: 10px; }
        .top5 .req-name { font-weight: 600; color: #1a237e; font-size: 13px; }
        .top5 .req-url { color: #666; font-size: 11px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reporte de Prueba de Estrés - TMF 702 Puertos</h1>
            <div class="subtitle">API: Búsqueda Puertos</div>
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
            </div>
            <div class="stages-list">
                <strong>Detalle de Stages:</strong>
                <span style="margin-left: 10px;">Stage 1: 10s → 👥 5 VUs</span>
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
        </div>

        <!-- ✅ SOLO GRÁFICO DE BARRAS - TAMAÑO 120 -->
        <div class="chart-container">
            <h2>📊 Distribución de Tiempos de Respuesta</h2>
            <canvas id="percentileChart" height="120"></canvas>
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
                            <div class="req-name">🔌 Busqueda de Puertos</div>
                            <div class="req-url">/tmf702/resource</div>
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
            ` : p95 < 4000 && apiSuccessRate > 95 ? `
                <p>⚠️ Rendimiento aceptable - El sistema soporta ${maxVUs} usuarios con ligera degradación.</p>
                <p><span class="badge badge-orange">RENDIMIENTO ACEPTABLE</span></p>
            ` : `
                <p>🔴 Rendimiento crítico - ${apiFails} de ${totalIterations} peticiones fallaron (${(100 - apiSuccessRate).toFixed(1)}% de fallos).</p>
                <p><span class="badge badge-red">NECESITA REVISIÓN</span></p>
            `}
        </div>

        <div class="footer">
            Reporte generado con k6 - ${new Date().toLocaleString('es-ES')}
            <br>API: TMF 702 - Búsqueda Puertos
            <br>${totalIterations} peticiones a la API • ${maxVUs} VUs • 10s
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
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y + 'ms';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'ms', font: { size: 9 } },
                        ticks: { font: { size: 9 } }
                    },
                    x: {
                        ticks: { font: { size: 9 } }
                    }
                }
            }
        });
    </script>
</body>
</html>`;

    return {
        'reports/stress-test-report-702-port.html': html,
        'reports/stress-test-summary-702-port.json': JSON.stringify(data, null, 2)
    };
}