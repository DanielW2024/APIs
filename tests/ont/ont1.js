// tests/ont/ont1.js - Versión SECUENCIAL
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
    console.log('🚀 INICIANDO TEST ONT (SECUENCIAL)');
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
    const totalOnts = ontData.length;

    console.log(`\n📋 Ejecutando ${totalOnts} peticiones SECUENCIALMENTE...`);

    // Contadores para el resumen
    let successCount = 0;
    let failCount = 0;

    // ==========================================
    // PROCESAR CADA ONT SECUENCIALMENTE
    // ==========================================
    ontData.forEach((ont, index) => {
        console.log(`\n🔍 [${index + 1}/${totalOnts}] Consultando ONT: ${ont.ontId}`);

        const url = `${config.ontUrl}/api/v1/network-equipment/ont/${ont.ontId}`;
        const params = {
            headers: {
                'Accept': 'application/json',
                'X-Channel': config.headers.channel || 'WIN',
                'Authorization': `Bearer ${token}`
            },
            timeout: config.timeouts.networkTimeout || 30000
        };

        // Hacer la petición (UNA SOLA)
        const response = http.get(url, params);

        // Mostrar resultado individual
        console.log(`   📡 Status: ${response.status}`);
        console.log(`   ⏱️  Tiempo: ${response.timings.duration}ms`);

        // Verificar respuesta
        const isSuccess = check(response, {
            [`ONT ${ont.ontId} - Status 200`]: (r) => r.status === 200,
        });

        if (isSuccess) {
            successCount++;
            console.log(`   ✅ RESPUESTA EXITOSA`);

            // Mostrar body completo
            try {
                const body = JSON.parse(response.body);
                console.log(`   📄 BODY COMPLETO:`);
                console.log(`   ${JSON.stringify(body, null, 4)}`);
            } catch (e) {
                console.log(`   📄 BODY (texto plano):`);
                console.log(`   ${response.body.substring(0, 200)}`);
                if (response.body.length > 200) {
                    console.log(`   ... (${response.body.length - 200} caracteres más)`);
                }
            }
        } else {
            failCount++;
            console.log(`   ❌ ERROR EN LA CONSULTA`);
            console.log(`   📄 Body: ${response.body}`);
        }

        console.log(`   ${'-'.repeat(50)}`);
    });

    // ==========================================
    // RESUMEN FINAL
    // ==========================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE EJECUCIÓN SECUENCIAL');
    console.log('='.repeat(60));
    console.log(`   ✅ Exitosos: ${successCount}`);
    console.log(`   ❌ Fallidos: ${failCount}`);
    console.log(`   📊 Total: ${totalOnts}`);
    console.log('='.repeat(60) + '\n');

    sleep(2);
}

export function teardown() {
    console.log('\n==========================================');
    console.log('🏁 FIN DEL TEST ONT (SECUENCIAL)');
    console.log('==========================================');
}