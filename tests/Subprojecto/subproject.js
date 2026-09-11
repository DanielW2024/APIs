// tests/Subprojecto/subproject.js
import { sleep, check } from 'k6';
import { config } from '../../config/config1.js';
import { getNetwork } from '../../apis/subproject.js';
import { getTokenWithRetry } from '../../auth/tokenkong.js';

export const options = {
    stages: config.test.stages,
    thresholds: config.test.thresholds,
};

export function setup() {
    console.log('\n==========================================');
    console.log('🚀 INICIANDO TEST NETWORK PROJECTS - SUB-PROJECTS');
    console.log('==========================================');
    console.log(`🔗 URL Network: ${config.networkUrl || 'No definida'}`);
    console.log(`📋 Channel: ${config.headers.channel}`);
    console.log(`📌 Project ID: 2066 (fijo)`);

    const token = getTokenWithRetry(3);
    if (!token) {
        throw new Error('❌ No se pudo obtener el token');
    }

    return { token };
}

export default function (data) {
    const token = data.token;
    console.log(`\n--- Iteración ${__ITER + 1} ---`);

    const result = getNetwork(token);

    check(result, {
        'Network - Status 200': (r) => r && r.status === 200,
    });

    if (result && result.status === 200) {
        console.log('✅ Consulta exitosa');
        if (result.body) {
            console.log(`📡 Datos: ${JSON.stringify(result.body).substring(0, 200)}...`);
        }
    } else {
        console.error('❌ Falló la consulta');
        if (result) {
            console.error(`📝 Status: ${result.status}`);
            console.error(`📝 Body: ${result.body}`);
        }
    }

    sleep(2);
}

export function teardown() {
    console.log('\n==========================================');
    console.log('🏁 FIN DEL TEST NETWORK PROJECTS');
    console.log('==========================================');
}