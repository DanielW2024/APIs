// tests/bulk-services-reconnections/reconnections_smoke.js
import { check, sleep } from 'k6';
import { getTokenWithRetry } from '../../auth/tokenkong.js';
import { postBulkReconnections } from '../../apis/bulk_services_reconnections.js';
import { config } from '../../config/config1.js';

// Órdenes hardcodeadas (sin archivo externo)
const ORDERS = [
    { orderCode: '11111',  serialNumber: '1313131313131313' },
    { orderCode: '222222', serialNumber: '1414141414141414' },
];

export const options = config.winet.bulkTest;

export function setup() {
    const token = getTokenWithRetry(3);
    if (!token) throw new Error('❌ No se pudo obtener token, abortando test');
    return { token };
}

export default function (data) {
    const order = ORDERS[__ITER % ORDERS.length];
    const res = postBulkReconnections(data.token, [order]);

    // ===== LOGS DE RESPUESTA =====
    const icon = res && res.status === 200 ? '✅' : '❌';
    console.log(`${icon} VU${__VU} iter${__ITER} | order=${JSON.stringify(order)} | status=${res.status} | t=${res.timings.duration.toFixed(0)}ms`);
    console.log(`📋 Headers: ${JSON.stringify(res.headers)}`);
    console.log(`📄 Body: ${String(res.body).substring(0, 1000)}`);
    console.log('──────────────────────────────────────────────');

    check(res, {
        'status es 200': (r) => r && r.status === 200,
        'respuesta tiene data[]': (r) => {
            if (!r || !r.body) return false;
            try {
                return Array.isArray(JSON.parse(r.body).data);
            } catch (e) {
                return false;
            }
        },
        'status no es 429': (r) => r && r.status !== 429,
    });

    sleep(1);
}