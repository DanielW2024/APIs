```javascript
import { check, sleep } from 'k6';
import http from 'k6/http';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { SharedArray } from 'k6/data';


// ============================================================
// HORA DE INICIO DE LA PRUEBA
// ============================================================

const testStartTime = new Date().toLocaleString('es-ES');

const testStartTimeMs = (() => {
    const now = new Date();

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');

    return `${hours}${minutes}${seconds}${ms}`;
})();


// ============================================================
// CARGAR DIRECCIONES DESDE CSV
// ============================================================

const addressData = new SharedArray('direcciones', function () {

    const file = open('./direccion/ids1.csv');

    const parsed = papaparse.parse(file, {
        header: true,
        skipEmptyLines: true
    });

    return parsed.data;
});


console.log(`📊 Total direcciones cargadas: ${addressData.length}`);


// ============================================================
// CONFIGURACIÓN
// ============================================================

const config = {

    cognitoUrl:
        'https://winet-redneu-test-ue1-cog-domain-vno.auth.us-east-1.amazoncognito.com',

    qualificationUrl:
        'https://7459k5n980.execute-api.us-east-1.amazonaws.com/v1',

    cognito: {

        clientId:
            '43veeetq8neth3sqd0lj3cfvfv',

        clientSecret:
            '175uhgr5hcmac6ess2uett1530mhk0808ri0q4cfhdqbeoo505rj',

        scope:
            'tmf/tmf679.write',

        grantType:
            'client_credentials'
    },

    qualification: {

        ctrycode:
            'PER',

        sacode:
            '1634',

        xApiKey:
            'X6grhUz3lA6O7fFoNYf2W81J2bPeVGTo8jYK21Vt',

        channelId:
            '1371',

        channelName:
            'FCT-UNI',

        country:
            'Peru'
    }
};


// ============================================================
// CONTADOR DE DIRECCIONES
// ============================================================

let addressCounter = 0;


// ============================================================
// GENERAR TIMESTAMP CON MILISEGUNDOS
// ============================================================

function getTimestamp() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(now.getMonth() + 1).padStart(2, '0');

    const day =
        String(now.getDate()).padStart(2, '0');

    const hours =
        String(now.getHours()).padStart(2, '0');

    const minutes =
        String(now.getMinutes()).padStart(2, '0');

    const seconds =
        String(now.getSeconds()).padStart(2, '0');

    const ms =
        String(now.getMilliseconds()).padStart(3, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}${ms}`;
}


// ============================================================
// OBTENER TOKEN
// ============================================================

function getToken() {

    const url =
        `${config.cognitoUrl}/oauth2/token`;

    const payload = {

        grant_type:
            config.cognito.grantType,

        client_id:
            config.cognito.clientId,

        client_secret:
            config.cognito.clientSecret,

        scope:
            config.cognito.scope
    };


    const params = {

        headers: {

            'Content-Type':
                'application/x-www-form-urlencoded'
        }
    };


    const response =
        http.post(
            url,
            payload,
            params
        );


    console.log(
        `🔑 Token Status: ${response.status}`
    );


    if (response.status === 200) {

        const token =
            response.json('access_token');

        console.log(
            `✅ Token obtenido`
        );

        return token;

    } else {

        console.error(
            `❌ Error en token: ${response.status}`
        );

        return null;
    }
}


// ============================================================
// SAREQUESTTS
// ============================================================

function getSarequestts() {

    const now =
        new Date();

    return now.toISOString();
}


// ============================================================
// CREAR QUALIFICATION
// ============================================================

function createQualification(
    token,
    eventId,
    messageId,
    addressId
) {

    const url =
        `${config.qualificationUrl}/tmf679/checkProductOfferingQualification`;


    const sarequestts =
        getSarequestts();


    console.log(
        `📤 SAREOUESTTS enviado: ${sarequestts}`
    );


    const headers = {

        'Authorization':
            `Bearer ${token}`,

        'ctrycode':
            config.qualification.ctrycode,

        'sacode':
            config.qualification.sacode,

        'x-api-key':
            config.qualification.xApiKey,

        'eventid':
            eventId,

        'messageid':
            messageId,

        'sarequestts':
            getSarequestts(),

        'Content-Type':
            'application/json'
    };


    const body = {

        '@type':
            'CheckProductOfferingQualification',

        channel: {

            id:
                config.qualification.channelId,

            name:
                config.qualification.channelName,

            '@type':
                'ChannelRef'
        },


        checkProductOfferingQualificationItem: [

            {

                id:
                    '1',

                '@type':
                    'CheckProductOfferingQualificationItem',

                product: {

                    '@type':
                        'Product',

                    place: [

                        {

                            role:
                                'installationAddress',

                            '@type':
                                'RelatedPlaceRefOrValue',

                            place: {

                                id:
                                    addressId,

                                country:
                                    config.qualification.country,

                                '@type':
                                    'GeographicAddress'
                            }
                        }
                    ],

                    id:
                        'PROD-004'
                }
            }
        ],


        characteristic: [

            {

                '@type':
                    'ObjectCharacteristic',

                name:
                    'checkProductOfferingQualification.event',

                value: {

                    eventId:
                        eventId,

                    messageId:
                        messageId
                }
            }
        ]
    };


    const response =
        http.post(
            url,
            JSON.stringify(body),
            {
                headers: headers
            }
        );


    if (
        response.status !== 200 &&
        response.status !== 201
    ) {

        console.error(
            `❌ API Error: ${response.status}`
        );
    }


    return response;
}


// ============================================================
// OPCIONES K6
// ============================================================

export const options = {

    stages: [

        {
            duration: '10s',
            target: 1
        }

    ],


    thresholds: {

        http_req_duration:
            ['p(95)<5000']

    },


    summaryTrendStats: [

        'min',
        'med',
        'avg',
        'p(90)',
        'p(95)',
        'p(99)',
        'max'

    ]
};


// ============================================================
// SETUP
// ============================================================

export function setup() {

    console.log(
        '🔑 Obteniendo token...'
    );


    const token =
        getToken();


    if (!token) {

        console.error(
            '❌ Error al obtener token'
        );

        throw new Error(
            'No se pudo obtener el token.'
        );
    }


    console.log(
        '✅ Token obtenido exitosamente'
    );


    return {
        token
    };
}


// ============================================================
// TEST PRINCIPAL
// ============================================================

export default function(data) {

    const token =
        data?.token;


    if (!token) {

        console.error(
            '❌ No hay token'
        );

        return;
    }


    const totalAddresses =
        addressData.length;


    const addressIndex =
        addressCounter % totalAddresses;


    const addressRecord =
        addressData[addressIndex];


    const addressId =
        addressRecord?.addressId ||
        '15012200016251';


    addressCounter++;


    const channelId =
        config.qualification.channelId;


    const timestamp =
        getTimestamp();


    const eventId =
        `E.${channelId}.${timestamp}.wintst`;


    const messageId =
        `M.${channelId}.${timestamp}.wintst`;


    console.log(
        `📝 EVENT ID: ${eventId}`
    );


    console.log(
        `📝 MESSAGE ID: ${messageId}`
    );


    console.log(
        `📍 VU ${__VU} - ITER ${__ITER} - addressId: ${addressId}`
    );


    const response =
        createQualification(
            token,
            eventId,
            messageId,
            addressId
        );


    check(response, {

        '✅ Status 200/201':
            (r) =>
                r.status === 200 ||
                r.status === 201

    });


    sleep(0.3);
}


// ============================================================
// HANDLE SUMMARY
// ============================================================

export function handleSummary(data) {

    const metrics =
        data.metrics;


    // ========================================================
    // ITERACIONES
    // ========================================================

    const iterations =
        metrics.iterations;


    const totalIterations =
        iterations?.values?.count || 0;


    const totalApiIterations =
        Math.max(
            0,
            totalIterations - 1
        );


    // ========================================================
    // VUS
    // ========================================================

    const vusMax =
        metrics.vus_max;


    const maxVUs =
        vusMax?.values?.value ||
        vusMax?.value ||
        0;


    // ========================================================
    // HTTP DURATION
    // ========================================================

    const httpDuration =
        metrics.http_req_duration;


    const p95 =
        httpDuration?.values?.['p(95)'] ||
        0;


    const p90 =
        httpDuration?.values?.['p(90)'] ||
        0;


    const p99 =
        httpDuration?.values?.['p(99)'] ||
        0;


    const avg =
        httpDuration?.values?.avg ||
        0;


    const max =
        httpDuration?.values?.max ||
        0;


    const min =
        httpDuration?.values?.min ||
        0;


    const med =
        httpDuration?.values?.med ||
        0;


    // ========================================================
    // MÉTRICAS DE RED
    // ========================================================

    const httpBlocked =
        metrics.http_req_blocked?.values?.avg ||
        0;


    const httpConnecting =
        metrics.http_req_connecting?.values?.avg ||
        0;


    const httpLookingUp =
        metrics.http_req_looking_up?.values?.avg ||
        0;


    const httpReceiving =
        metrics.http_req_receiving?.values?.avg ||
        0;


    const httpSending =
        metrics.http_req_sending?.values?.avg ||
        0;


    const dataReceived =
        metrics.data_received?.values?.avg ||
        0;


    const dataSent =
        metrics.data_sent?.values?.avg ||
        0;


    // ========================================================
    // CHECKS
    // ========================================================

    const checks =
        metrics.checks;


    const checkPasses =
        checks?.['✅ Status 200/201']?.passes ||
        0;


    const checkFails =
        checks?.['✅ Status 200/201']?.fails ||
        0;


    const totalChecks =
        checkPasses +
        checkFails;


    const apiSuccessRate =
        totalChecks > 0
            ? ((checkPasses / totalChecks) * 100)
            : 100;


    const apiFails =
        checkFails;


    // ========================================================
    // RESULTADOS EN CONSOLA
    // ========================================================

    console.log(
        `📊 maxVUs: ${maxVUs}`
    );


    console.log(
        `📊 Peticiones TOTALES (con token): ${totalIterations}`
    );


    console.log(
        `📊 Peticiones API (sin token): ${totalApiIterations}`
    );


    console.log(
        `📊 Checks exitosos: ${checkPasses}`
    );


    console.log(
        `📊 Checks fallidos: ${checkFails}`
    );


    console.log(
        `📊 Tasa éxito API: ${apiSuccessRate.toFixed(2)}%`
    );


    console.log(
        `📊 Throughput: ${(totalIterations / 10).toFixed(2)} req/s`
    );


    // ========================================================
    // DIRECCIONES
    // ========================================================

    const totalAvailable =
        addressData.length;


    const uniqueAddresses =
        addressData.map(
            item => item.addressId
        );


    // ========================================================
    // ESTADO FINAL
    // ========================================================

    const isPassed =
        apiSuccessRate > 95 &&
        p95 < 5000;


    // ========================================================
    // LOG COMPLETO
    // ========================================================

    const logContent = `

============================================================
K6 - REPORTE DE PRUEBA DE ESTRÉS
TMF679 QUALIFICATION
============================================================

📅 Fecha de inicio: ${testStartTime}
⏱️ Timestamp inicio: ${testStartTimeMs}
📊 Duración: 10s

------------------------------------------------------------
CONFIGURACIÓN
------------------------------------------------------------

👥 VUs máximos: ${maxVUs}
📍 Direcciones disponibles: ${totalAvailable}
📍 Direcciones utilizadas: ${Math.min(
totalApiIterations,
totalAvailable
)}

------------------------------------------------------------
PETICIONES
------------------------------------------------------------

📊 Peticiones TOTALES (con token): ${totalIterations}
📊 Peticiones API (sin token): ${totalApiIterations}
🔑 Peticiones TOKEN: 1

------------------------------------------------------------
RESULTADOS
------------------------------------------------------------

✅ Checks exitosos: ${checkPasses}
❌ Checks fallidos: ${checkFails}
📈 Tasa éxito API: ${apiSuccessRate.toFixed(2)}%

------------------------------------------------------------
TIEMPOS DE RESPUESTA
------------------------------------------------------------

⏱️ Mínimo: ${min.toFixed(2)} ms
⏱️ Mediana: ${med.toFixed(2)} ms
⏱️ Promedio: ${avg.toFixed(2)} ms
⏱️ p(90): ${p90.toFixed(2)} ms
⏱️ p(95): ${p95.toFixed(2)} ms
⏱️ p(99): ${p99.toFixed(2)} ms
⏱️ Máximo: ${max.toFixed(2)} ms

------------------------------------------------------------
MÉTRICAS DE RED
------------------------------------------------------------

🌐 Blocked: ${httpBlocked.toFixed(2)} ms
🔌 Connecting: ${httpConnecting.toFixed(2)} ms
🔎 Looking Up: ${httpLookingUp.toFixed(2)} ms
📤 Sending: ${httpSending.toFixed(2)} ms
📥 Receiving: ${httpReceiving.toFixed(2)} ms

------------------------------------------------------------
TRANSFERENCIA DE DATOS
------------------------------------------------------------

📤 Datos enviados: ${(dataSent / 1024).toFixed(2)} KB
📥 Datos recibidos: ${(dataReceived / 1024).toFixed(2)} KB

------------------------------------------------------------
THROUGHPUT
------------------------------------------------------------

🚀 Throughput: ${(totalIterations / 10).toFixed(2)} req/s

------------------------------------------------------------
RESULTADO FINAL
------------------------------------------------------------

${isPassed
? '✅ PRUEBA APROBADA'
: '❌ PRUEBA FALLIDA'}

${apiFails > 0
? `⚠️ Peticiones API fallidas: ${apiFails}`
: '✅ Todas las peticiones API fueron exitosas'}

------------------------------------------------------------
DIRECCIONES UTILIZADAS
------------------------------------------------------------

${uniqueAddresses
    .slice(0, 20)
    .join('\n')}

${totalAvailable > 20
? `... +${totalAvailable - 20} direcciones adicionales`
: ''}

============================================================
FIN DEL REPORTE
============================================================

`;


    // ========================================================
    // HTML
    // ========================================================

    const html = `<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
Reporte de Prueba de Estrés - TMF679
</title>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<style>

* {
margin: 0;
padding: 0;
box-sizing: border-box;
}

body {

font-family:
'Segoe UI',
Arial,
sans-serif;

background:
#f5f7fa;

padding:
20px;
}

    .container {

max-width:
1400px;

margin:
0 auto;
}

    .header {

background:
linear-gradient(
135deg,
#1a237e,
#0d47a1
);

color:
white;

padding:
25px 30px;

border-radius:
12px;

margin-bottom:
20px;

display:
flex;

justify-content:
space-between;

align-items:
center;
}

    .header h1 {

font-size:
24px;

font-weight:
300;
}

    .header .subtitle {

opacity:
0.8;

font-size:
14px;
}

    .status-badge {

display:
inline-block;

padding:
8px 24px;

border-radius:
20px;

font-weight:
bold;

font-size:
16px;
}

    .status-passed {

background:
#4CAF50;

color:
white;
}

    .status-warning {

background:
#FF9800;

color:
white;
}

    .status-failed {

background:
#f44336;

color:
white;
}

    .stats-grid {

display:
grid;

grid-template-columns:
repeat(
auto-fit,
minmax(160px, 1fr)
);

gap:
12px;

margin-bottom:
20px;
}

    .stat-card {

background:
white;

padding:
15px 18px;

border-radius:
10px;

box-shadow:
0 2px 8px
rgba(0,0,0,0.08);

border-left:
4px solid #1976D2;
}

    .stat-card .value {

font-size:
26px;

font-weight:
bold;

color:
#1a237e;
}

    .stat-card .label {

font-size:
12px;

color:
#666;

margin-top:
2px;

text-transform:
uppercase;
}

    .stat-card .sub-value {

font-size:
12px;

color:
#888;

margin-top:
2px;
}

    .stat-card.success {

border-left-color:
#4CAF50;
}

    .stat-card.warning {

border-left-color:
#FF9800;
}

    .stat-card.danger {

border-left-color:
#f44336;
}

    .stat-card.info {

border-left-color:
#1976D2;
}

    .stat-card.purple {

border-left-color:
#7B1FA2;
}

    .stat-card.teal {

border-left-color:
#00897B;
}

    .value.green {

color:
#4CAF50;
}

    .value.orange {

color:
#FF9800;
}

    .value.red {

color:
#f44336;
}

    .value.blue {

color:
#1976D2;
}

    .value.purple {

color:
#7B1FA2;
}

    .row {

display:
grid;

grid-template-columns:
1fr 1fr;

gap:
15px;

margin-bottom:
15px;
}

@media (max-width: 768px) {

    .row {
grid-template-columns:
1fr;
}
}

    .panel {

background:
white;

padding:
18px 20px;

border-radius:
10px;

box-shadow:
0 2px 8px
rgba(0,0,0,0.08);
}

    .panel h2 {

font-size:
14px;

color:
#333;

margin-bottom:
12px;

font-weight:
600;

border-bottom:
2px solid #f0f0f0;

padding-bottom:
8px;
}

    .chart-container {

position:
relative;

height:
200px;
}

table {

width:
100%;

border-collapse:
collapse;

font-size:
13px;
}

th {

background:
#f8f9ff;

padding:
8px 12px;

text-align:
left;

font-weight:
600;

font-size:
11px;

color:
#555;
}

td {

padding:
8px 12px;

border-bottom:
1px solid #f0f0f0;
}

    .metric-bar {

height:
6px;

background:
#e0e0e0;

border-radius:
3px;

margin-top:
4px;

overflow:
hidden;
}

    .metric-bar-fill {

height:
100%;

border-radius:
3px;
}

    .bar-green {
background:
#4CAF50;
}

    .bar-orange {
background:
#FF9800;
}

    .bar-red {
background:
#f44336;
}

    .footer {

text-align:
center;

padding:
15px;

color:
#999;

font-size:
12px;

margin-top:
15px;
}

</style>

</head>


<body>

<div class="container">

<div class="header">

<div>

<h1>
📊 Reporte de Prueba de Estrés - TMF679
</h1>

<div class="subtitle">
API: Qualification (TMF679) | Tipo: Stress Test
</div>

</div>


<div>

<div class="status-badge ${
isPassed
? 'status-passed'
: (
apiSuccessRate > 95
? 'status-warning'
: 'status-failed'
)
}">

${
isPassed
? '✅ APROBADO'
: (
apiSuccessRate > 95
? '⚠️ ADVERTENCIA'
: '❌ FALLIDO'
)
}

</div>

</div>

</div>


<div class="stats-grid">

<div class="stat-card info">

<div class="value blue">
${totalIterations}
</div>

<div class="label">
Peticiones TOTALES
</div>

<div class="sub-value">
API: ${totalApiIterations} | Token: 1
</div>

</div>


<div class="stat-card success">

<div class="value green">
${apiSuccessRate.toFixed(1)}%
</div>

<div class="label">
Tasa de Éxito
</div>

<div class="sub-value">
${checkPasses} pasaron / ${checkFails} fallaron
</div>

</div>


<div class="stat-card info">

<div class="value blue">
${avg.toFixed(0)}ms
</div>

<div class="label">
Tiempo Promedio
</div>

<div class="sub-value">
Min: ${min.toFixed(0)}ms |
Max: ${max.toFixed(0)}ms
</div>

</div>


<div class="stat-card purple">

<div class="value purple">
${p95.toFixed(0)}ms
</div>

<div class="label">
p(95)
</div>

</div>


<div class="stat-card warning">

<div class="value orange">
${p99.toFixed(0)}ms
</div>

<div class="label">
p(99)
</div>

</div>


<div class="stat-card teal">

<div class="value">
${(totalIterations / 10).toFixed(2)}
</div>

<div class="label">
🚀 Throughput
</div>

<div class="sub-value">
${totalIterations} requests en 10s
</div>

</div>


<div class="stat-card">

<div class="value">
${maxVUs}
</div>

<div class="label">
Usuarios Concurrentes
</div>

</div>


<div class="stat-card">

<div class="value">
${(
dataReceived / 1024
).toFixed(1)} KB
</div>

<div class="label">
📥 Datos Recibidos
</div>

</div>

</div>


<div class="row">

<div class="panel">

<h2>
📊 Distribución de Tiempos de Respuesta
</h2>

<div class="chart-container">

<canvas id="percentileChart"></canvas>

</div>

</div>


<div class="panel">

<h2>
🚀 Resultado de Requests
</h2>

<div class="chart-container">

<canvas id="throughputChart"></canvas>

</div>

</div>

</div>


<div class="panel">

<h2>
🔝 Detalle de Peticiones
</h2>

<table>

<thead>

<tr>

<th>Request</th>
<th>Promedio</th>
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
POST - Qualification API
</td>

<td>
${avg.toFixed(0)} ms
</td>

<td>
${p90.toFixed(0)} ms
</td>

<td>
${p95.toFixed(0)} ms
</td>

<td>
${p99.toFixed(0)} ms
</td>

<td>
${min.toFixed(0)} ms
</td>

<td>
${max.toFixed(0)} ms
</td>

</tr>

</tbody>

</table>

</div>


<div class="panel" style="margin-top:15px;">

<h2>
🌐 Métricas de Red
</h2>

<table>

<thead>

<tr>

<th>Métrica</th>
<th>Valor</th>
</tr>

</thead>


<tbody>

<tr>
<td>Blocked</td>
<td>${httpBlocked.toFixed(2)} ms</td>
</tr>

<tr>
<td>Connecting</td>
<td>${httpConnecting.toFixed(2)} ms</td>
</tr>

<tr>
<td>Looking Up</td>
<td>${httpLookingUp.toFixed(2)} ms</td>
</tr>

<tr>
<td>Sending</td>
<td>${httpSending.toFixed(2)} ms</td>
</tr>

<tr>
<td>Receiving</td>
<td>${httpReceiving.toFixed(2)} ms</td>
</tr>

<tr>
<td>Datos Enviados</td>
<td>${(dataSent / 1024).toFixed(2)} KB</td>
</tr>

<tr>
<td>Datos Recibidos</td>
<td>${(dataReceived / 1024).toFixed(2)} KB</td>
</tr>

</tbody>

</table>

</div>


<div class="footer">

<p>

Reporte generado con k6 -
${new Date().toLocaleString('es-ES')}

<br>

API: Qualification (TMF679) -
Prueba de Estrés

<br>

<strong>
TOTAL: ${totalIterations} peticiones
</strong>

• ${maxVUs} VUs • 10s

</p>

</div>

</div>


<script>

// ========================================================
// GRÁFICO DE PERCENTILES
// ========================================================

new Chart(
document.getElementById('percentileChart'),
{

type: 'bar',

data: {

labels: [
'Mínimo',
'Mediana',
'Promedio',
'p(90)',
'p(95)',
'p(99)',
'Máximo'
],

datasets: [

{

label:
'Tiempo de Respuesta (ms)',

data: [

${min.toFixed(0)},
${med.toFixed(0)},
${avg.toFixed(0)},
${p90.toFixed(0)},
${p95.toFixed(0)},
${p99.toFixed(0)},
${max.toFixed(0)}

],

borderRadius:
4,

barThickness:
25

}

]

},

options: {

responsive:
true,

maintainAspectRatio:
false,

plugins: {

legend: {
display:
false
}

}

}

}
);


// ========================================================
// GRÁFICO DE REQUESTS
// ========================================================

new Chart(
document.getElementById('throughputChart'),
{

type:
'doughnut',

data: {

labels: [
'Requests Exitosos',
'Requests Fallidos'
],

datasets: [

{

data: [
${checkPasses},
${checkFails}
],

borderWidth:
2

}

]

},

options: {

responsive:
true,

maintainAspectRatio:
false,

plugins: {

legend: {

position:
'bottom'

}

},

cutout:
'60%'

}

}
);

</script>


</body>

</html>`;


    // ========================================================
    // ARCHIVOS GENERADOS
    // ========================================================

    return {

        // Reporte HTML
        'reports/stress-test679.html':
            html,

        // Resumen completo de k6
        'reports/stress-test-summary.json':
            JSON.stringify(
                data,
                null,
                2
            ),

        // NUEVO: LOG
        'reports/stress-test679.log':
            logContent
    };
}
```
