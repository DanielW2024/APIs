
// tests/ont/ont1.js - Versión con body completo
import { sleep, check } from 'k6';
import { SharedArray } from 'k6/data';
import http from 'k6/http';
import { config } from '../../config/config1.js';
import { getTokenWithRetry } from '../../auth/tokenkong.js';

// ==========================================
// LEER ONTs DEL CSV
// ==========================================
const ontData = new SharedArray('onts', function () {
    const data = open('../../tests/ont/onts.csv');
    const lines = data.split('\n').filter(line => line.trim() !== '');
    const startIndex = lines[0].toLowerCase().includes('ontid') ? 1 : 0;
    const onts = [];
    for (let i = startIndex; i < lines.length; i++) {
        const ontId = lines[i].trim();
        if (ontId) {
            onts.push({ ontId: ontId });
        }
    }
    console.log(`📋 Cargados ${onts.length} ONTs desde el CSV`);
    onts.forEach((ont, index) => {
        console.log(`   ${index + 1}. ${ont.ontId}`);
    });
    return onts;
});

export const options = {
    vus: 1,
    duration: '10s',
    thresholds: config.test.thresholds,
};

export function setup() {
    console.log('\n==========================================');
    console.log('🚀 INICIANDO TEST ONT (CONCURRENTE)');
    console.log('==========================================');
    console.log(`📊 Total ONTs a probar: ${ontData.length}`);

    const token = getTokenWithRetry(3);
    if (!token) {
        throw new Error('❌ No se pudo obtener el token');
    }
    return { token };
}

export default function (data) {
    const token = data.token;

    console.log(`\n📋 Ejecutando ${ontData.length} peticiones concurrentes...`);

    // Crear todas las peticiones
    const requests = ontData.map(ont => {
        const url = `${config.ontUrl}/api/v1/contextualization/onts/${ont.ontId}/service-status`;
        const params = {
            headers: {
                'Accept': 'application/json',
                'X-Channel': config.headers.channel || 'WIN',
                'Authorization': `Bearer ${token}`
            },
            timeout: config.timeouts.networkTimeout || 15000
        };
        return {
            ontId: ont.ontId,
            url: url,
            params: params
        };
    });

    // Ejecutar todas las peticiones en paralelo con http.batch
    const responses = http.batch(requests.map(req => ['GET', req.url, null, req.params]));

    // ==========================================
    // PROCESAR Y MOSTRAR RESULTADOS CON BODY COMPLETO
    // ==========================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADOS DE LAS CONSULTAS');
    console.log('='.repeat(60));

    responses.forEach((response, index) => {
        const ontId = requests[index].ontId;
        const isSuccess = response.status === 200;

        console.log(`\n🔍 ONT: ${ontId}`);
        console.log(`   📡 Status: ${response.status}`);
        console.log(`   ⏱️  Tiempo: ${response.timings.duration}ms`);

        // Check de la respuesta
        check(response, {
            [`ONT ${ontId} - Status 200`]: (r) => r.status === 200,
        });

        if (isSuccess) {
            console.log(`   ✅ RESPUESTA EXITOSA`);

            // Mostrar el body completo formateado
            try {
                const body = JSON.parse(response.body);
                console.log(`   📄 BODY COMPLETO:`);
                console.log(`   ${JSON.stringify(body, null, 4)}`);

                // Si hay datos específicos, mostrarlos resumidos
                if (body.data) {
                    console.log(`   📋 Datos encontrados:`);
                    if (Array.isArray(body.data)) {
                        console.log(`   📊 Total de items: ${body.data.length}`);
                        body.data.forEach((item, idx) => {
                            console.log(`      ${idx + 1}. OLT: ${item.olt_id || 'N/A'}, Plan: ${item.tx_plan_activado || 'N/A'}`);
                        });
                    } else {
                        console.log(`   📊 Datos: ${JSON.stringify(body.data).substring(0, 200)}...`);
                    }
                }
            } catch (e) {
                console.log(`   📄 BODY (texto plano):`);
                console.log(`   ${response.body.substring(0, 500)}`);
                if (response.body.length > 500) {
                    console.log(`   ... (${response.body.length - 500} caracteres más)`);
                }
            }
        } else {
            console.log(`   ❌ ERROR EN LA CONSULTA`);
            console.log(`   📄 Body: ${response.body}`);
        }

        console.log(`   ${'-'.repeat(50)}`);
    });

    // ==========================================
    // RESUMEN FINAL
    // ==========================================
    const successCount = responses.filter(r => r.status === 200).length;
    const failCount = responses.filter(r => r.status !== 200).length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE EJECUCIÓN');
    console.log('='.repeat(60));
    console.log(`   ✅ Exitosos: ${successCount}`);
    console.log(`   ❌ Fallidos: ${failCount}`);
    console.log(`   📊 Total: ${responses.length}`);
    console.log('='.repeat(60) + '\n');

    sleep(2);
}

export function teardown() {
    console.log('\n==========================================');
    console.log('🏁 FIN DEL TEST ONT');
    console.log('==========================================');
}