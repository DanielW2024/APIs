// tests/ServiceVertical/servicevertical.js
import { sleep, check } from 'k6';
import { config } from '../../config/config1.js';
import { getServiceVertical } from '../../apis/servicesvertical.js';
import { getTokenWithRetry } from '../../auth/tokenkong.js';

export const options = {
    stages: config.test.stages,
    thresholds: config.test.thresholds,
};

export function setup() {
    console.log('\n==========================================');
    console.log('🚀 INICIANDO TEST SERVICE VERTICAL - FACTIBILITY');
    console.log('==========================================');
    console.log(`🔗 URL Service: ${config.serviceUrl || 'No definida'}`);
    console.log(`📋 Channel: ${config.headers.channel}`);
    console.log(`📍 Parámetros:`);
    console.log(`   - latitude: -12.108237653`);
    console.log(`   - longitude: -77.04892839`);
    console.log(`   - boxType: 8`);
    console.log(`   - condominiumId: 2066`);
    console.log(`   - floorNumber: 2`);
    console.log(`   - towerId: 8781`);

    const token = getTokenWithRetry(3);
    if (!token) {
        throw new Error('❌ No se pudo obtener el token');
    }

    return { token };
}

export default function (data) {
    const token = data.token;
    console.log(`\n--- Iteración ${__ITER + 1} ---`);

    // Parámetros fijos para la consulta
    const params = {
        latitude: '-12.108237653',
        longitude: '-77.04892839',
        boxType: '8',
        condominiumId: '2066',
        floorNumber: '2',
        towerId: '8781'
    };

    const result = getServiceVertical(token, params);

    check(result, {
        'Service Vertical - Status 200': (r) => r && r.status === 200,
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
    console.log('🏁 FIN DEL TEST SERVICE VERTICAL');
    console.log('==========================================');
}