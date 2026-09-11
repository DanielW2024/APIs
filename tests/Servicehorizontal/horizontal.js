// tests/ServiceHorizontal/horizontal.js
import { sleep, check } from 'k6';
import { config } from '../../config/config1.js';
import { getServiceHorizontal } from '../../apis/serviceshorizontal.js';
import { getTokenWithRetry } from '../../auth/tokenkong.js';

export const options = {
    stages: config.test.stages,
    thresholds: config.test.thresholds,
};

export function setup() {
    console.log('\n==========================================');
    console.log('🚀 INICIANDO TEST SERVICE HORIZONTAL - FACTIBILITY');
    console.log('==========================================');
    console.log(`🔗 URL Service: ${config.serviceUrl || 'No definida'}`);
    console.log(`📋 Channel: ${config.headers.channel}`);
    console.log(`📍 Parámetros:`);
    console.log(`   - boxType: 7`);
    console.log(`   - condominiumId: (vacío)`);
    console.log(`   - floorNumber: (vacío)`);
    console.log(`   - towerId: (vacío)`);
    console.log(`   - latitude: -12.0976773`);
    console.log(`   - longitude: -77.0231155`);

    const token = getTokenWithRetry(3);
    if (!token) {
        throw new Error('❌ No se pudo obtener el token');
    }

    return { token };
}

export default function (data) {
    const token = data.token;
    console.log(`\n--- Iteración ${__ITER + 1} ---`);

    // Parámetros fijos para la consulta horizontal
    const params = {
        boxType: '7',
        condominiumId: '',
        floorNumber: '',
        towerId: '',
        latitude: '-12.0976773',
        longitude: '-77.0231155'
    };

    const result = getServiceHorizontal(token, params);

    check(result, {
        'Service Horizontal - Status 200': (r) => r && r.status === 200,
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
    console.log('🏁 FIN DEL TEST SERVICE HORIZONTAL');
    console.log('==========================================');
}