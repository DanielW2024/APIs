import { check, sleep } from 'k6';
import http from 'k6/http';

// Configuración
const config = {
    cognitoUrl: 'https://winet-redneu-test-ue1-cog-domain-vno.auth.us-east-1.amazoncognito.com',
    qualificationUrl: 'https://7459k5n980.execute-api.us-east-1.amazonaws.com/v1',
    cognito: {
        clientId: '43veeetq8neth3sqd0lj3cfvfv',
        clientSecret: '175uhgr5hcmac6ess2uett1530mhk0808ri0q4cfhdqbeoo505rj',
        scope: 'tmf/tmf679.write',
        grantType: 'client_credentials'
    },
    qualification: {
        ctrycode: 'PER',
        sacode: '1634',
        xApiKey: 'X6grhUz3lA6O7fFoNYf2W81J2bPeVGTo8jYK21Vt',
        channelId: '1371',
        channelName: 'FCT-UNI',
        addressId: '15013200154332',
        country: 'Peru'
    }
};

// Función para obtener token
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
    if (response.status === 200) {
        return response.json('access_token');
    }
    return null;
}

// Función para crear qualification
function createQualification(token, eventId, messageId, productId) {
    const url = `${config.qualificationUrl}/tmf679/checkProductOfferingQualification`;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'ctrycode': config.qualification.ctrycode,
        'sacode': config.qualification.sacode,
        'x-api-key': config.qualification.xApiKey,
        'eventid': eventId,
        'messageid': messageId,
        'sarequestts': '2026-06-30T17:25:00.000Z',
        'Content-Type': 'application/json'
    };
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
                        'id': config.qualification.addressId,
                        'country': config.qualification.country,
                        '@type': 'GeographicAddress'
                    }
                }],
                'id': productId
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
    const response = http.post(url, JSON.stringify(body), { headers: headers });
    return response;
}

// pruebas danny stress

export const options = {
    // Opción 1: Estrés progresivo (recomendado)
    stages: [
        { duration: '1m', target: 5 },   // Sube a 10 usuariossss
       // { duration: '2m', target: 10 },   // queda 10 usuarioss
   //     { duration: '1m', target: 20 },   // mas a 20 usuarioss
      //  { duration: '2m', target: 20 },   // que  20 usuarioss
     //   { duration: '1m', target: 50 },   // mas  a 50 usuarios
     //   { duration: '2m', target: 50 },   // se mantien e 50 usuarios
    //    { duration: '1m', target: 0 }     // baja al cero
    ],

    // Umbrales más flexibles para estrés
    thresholds: {
        http_req_duration: ['p(95)<5000'],  // 95% < 5 segundos
        http_req_failed: ['rate<0.05']      // Menos de 5% de fallos
    },

    summaryTrendStats: ['min', 'med', 'avg', 'p(90)', 'p(95)', 'p(99)', 'max']
};

export default function() {
    console.log(`💥 STRESS TEST - VU ${__VU} - ITER ${__ITER}`);

    const token = getToken();
    if (!token) {
        console.error('❌ No se pudo obtener token');
        return;
    }

    const timestamp = Date.now();
    const vuId = __VU || 0;
    const iterId = __ITER || 0;

    const eventId = `E.20260702172045${String(vuId).padStart(4, '0')}${String(iterId).padStart(4, '0')}.wintst`;
    const messageId = `M.20260702172045${String(vuId).padStart(4, '0')}${String(iterId).padStart(4, '0')}.wintst`;
    const productId = `PROD-STRESS-${String(vuId).padStart(4, '0')}${String(iterId).padStart(4, '0')}`;

    const response = createQualification(token, eventId, messageId, productId);

    check(response, {
        '✅ Qualification creada en estrés': (r) => r.status === 200 || r.status === 201
    });

    // Menos pausa para generar más carga
    sleep(0.3);
}

// ============================================================
// 📊 GENERAR REPORTE
// ============================================================
export function handleSummary(data) {
    const metrics = data.metrics;
    const httpDuration = metrics.http_req_duration;
    const httpFailed = metrics.http_req_failed;
    const iterations = metrics.iterations;
    const vus = metrics.vus_max;

    const p90 = httpDuration.values['p(90)'] || 0;
    const p95 = httpDuration.values['p(95)'] || 0;
    const p99 = httpDuration.values['p(99)'] || 0;
    const avg = httpDuration.values.avg || 0;
    const max = httpDuration.values.max || 0;
    const min = httpDuration.values.min || 0;
    const med = httpDuration.values.med || 0;

    const successRate = ((1 - (httpFailed.values.rate || 0)) * 100);
    const isPassed = httpFailed.values.rate < 0.05 && p95 < 5000;

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reporte de Prueba de Estrés - API Qualification</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 3px solid #FF6F00; padding-bottom: 10px; }
        .status { font-size: 24px; font-weight: bold; padding: 10px 20px; border-radius: 5px; display: inline-block; margin: 10px 0; }
        .passed { background: #4CAF50; color: white; }
        .failed { background: #f44336; color: white; }
        .warning { background: #FF9800; color: white; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
        .card { background: #f9f9f9; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e0e0e0; }
        .card .value { font-size: 28px; font-weight: bold; color: #FF6F00; }
        .card .label { font-size: 14px; color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #FF6F00; color: white; padding: 10px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #e0e0e0; }
        tr:hover { background: #f5f5f5; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #999; font-size: 14px; }
        .recommendation { background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF6F00; }
        .bar-container { background: #e0e0e0; border-radius: 10px; height: 25px; margin: 5px 0; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 10px; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; color: white; font-weight: bold; font-size: 12px; }
        .bar-green { background: linear-gradient(90deg, #66BB6A, #43A047); }
        .bar-blue { background: linear-gradient(90deg, #42A5F5, #1565C0); }
        .bar-orange { background: linear-gradient(90deg, #FFA726, #FB8C00); }
        .bar-red { background: linear-gradient(90deg, #EF5350, #C62828); }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .badge-green { background: #4CAF50; color: white; }
        .badge-orange { background: #FF9800; color: white; }
        .badge-red { background: #f44336; color: white; }
        .stress-level { text-align: center; padding: 15px; background: #fff3e0; border-radius: 8px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>💥 Reporte de Prueba de Estrés</h1>
        <p><strong>API:</strong> Qualification | <strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
        <p><strong>Tipo:</strong> Prueba de Estrés (Stress Test) - Buscando límites del sistema</p>

        <div class="status ${isPassed ? 'passed' : (successRate > 95 ? 'warning' : 'failed')}">
            ${isPassed ? '✅ APROBADO' : (successRate > 95 ? '⚠️ ADVERTENCIA' : '❌ FALLIDO')}
        </div>

        <div class="grid">
            <div class="card">
                <div class="value">${iterations.values.count || 0}</div>
                <div class="label">📝 Peticiones Totales</div>
            </div>
            <div class="card">
                <div class="value" style="color: ${p95 < 2000 ? '#4CAF50' : p95 < 4000 ? '#FF9800' : '#f44336'}">${p95.toFixed(0)}ms</div>
                <div class="label">⏱️ Tiempo p(95)</div>
            </div>
            <div class="card">
                <div class="value" style="color: ${successRate > 99 ? '#4CAF50' : successRate > 95 ? '#FF9800' : '#f44336'}">${successRate.toFixed(1)}%</div>
                <div class="label">✅ Tasa de Éxito</div>
            </div>
            <div class="card">
                <div class="value">${vus.values.max || 0}</div>
                <div class="label">👥 Usuarios Concurrentes</div>
            </div>
        </div>

        <div class="stress-level">
            <strong>📊 Nivel de Estrés Alcanzado:</strong>
            <span style="font-size: 20px; font-weight: bold; color: ${vus.values.max > 40 ? '#f44336' : vus.values.max > 20 ? '#FF9800' : '#4CAF50'}">
                ${vus.values.max > 40 ? 'ALTO' : vus.values.max > 20 ? 'MEDIO' : 'BAJO'}
            </span>
            (${vus.values.max} usuarios concurrentes)
        </div>

        <h2>📈 Distribución de Tiempos de Respuesta</h2>
        <div>
            <div><strong>Mínimo</strong> <span style="float:right">${min.toFixed(0)}ms</span></div>
            <div class="bar-container"><div class="bar-fill bar-green" style="width: ${(min / max) * 100}%">${min.toFixed(0)}ms</div></div>

            <div><strong>Mediana</strong> <span style="float:right">${med.toFixed(0)}ms</span></div>
            <div class="bar-container"><div class="bar-fill bar-blue" style="width: ${(med / max) * 100}%">${med.toFixed(0)}ms</div></div>

            <div><strong>Promedio</strong> <span style="float:right">${avg.toFixed(0)}ms</span></div>
            <div class="bar-container"><div class="bar-fill bar-blue" style="width: ${(avg / max) * 100}%">${avg.toFixed(0)}ms</div></div>

            <div><strong>p(90)</strong> <span style="float:right">${p90.toFixed(0)}ms</span></div>
            <div class="bar-container"><div class="bar-fill bar-orange" style="width: ${(p90 / max) * 100}%">${p90.toFixed(0)}ms</div></div>

            <div><strong>p(95)</strong> <span style="float:right">${p95.toFixed(0)}ms</span></div>
            <div class="bar-container"><div class="bar-fill bar-orange" style="width: ${(p95 / max) * 100}%">${p95.toFixed(0)}ms</div></div>

            <div><strong>p(99)</strong> <span style="float:right">${p99.toFixed(0)}ms</span></div>
            <div class="bar-container"><div class="bar-fill bar-red" style="width: ${(p99 / max) * 100}%">${p99.toFixed(0)}ms</div></div>

            <div><strong>Máximo</strong> <span style="float:right">${max.toFixed(0)}ms</span></div>
            <div class="bar-container"><div class="bar-fill bar-red" style="width: 100%">${max.toFixed(0)}ms</div></div>
        </div>

        <h2>📋 Métricas Detalladas</h2>
        <table>
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
                <td colspan="7" style="text-align:center; font-weight:bold; color: ${httpFailed.values.rate < 0.02 ? '#4CAF50' : '#f44336'}">
                    ${httpFailed.values.fails || 0} fallos (${(httpFailed.values.rate * 100).toFixed(2)}%)
                </td>
            </tr>
        </table>

        <div class="recommendation">
            <h3>💡 Recomendación para Prueba de Estrés</h3>
            ${p95 < 2000 && successRate > 99 ? `
                <p>✅ <strong>Excelente resistencia</strong> - El sistema soporta ${vus.values.max} usuarios sin degradación.</p>
                <p>✅ <span class="badge badge-green">PUEDE SOPORTAR MÁS CARGA</span></p>
                <p>💡 Sugerencia: Aumentar usuarios a 100+ para encontrar el límite real.</p>
            ` : p95 < 4000 && successRate > 95 ? `
                <p>⚠️ <strong>Rendimiento aceptable</strong> - El sistema soporta ${vus.values.max} usuarios pero con algo de degradación.</p>
                <p>⚠️ <span class="badge badge-orange">CAPACIDAD CERCA DEL LÍMITE</span></p>
                <p>💡 Sugerencia: Optimizar antes de aumentar más usuarios.</p>
            ` : `
                <p>🔴 <strong>Límite alcanzado</strong> - El sistema no soporta ${vus.values.max} usuarios.</p>
                <p>🔴 <span class="badge badge-red">CAPACIDAD EXCEDIDA</span></p>
                <p>💡 Sugerencia: Este es el límite del sistema. Considerar escalar horizontalmente.</p>
            `}
        </div>

        <div class="footer">
            Reporte generado automáticamente con k6 • ${new Date().toLocaleString('es-ES')}
            <br>API de Qualification - Prueba de Estrés
        </div>
    </div>
</body>
</html>`;

    return {
        'reports/stress-test-report.html': html,
        'reports/stress-test-summary.json': JSON.stringify(data, null, 2)
    };
}
