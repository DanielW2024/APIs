import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { getTokenWithRetry } from '../../auth/tokenkong.js';
import { postBulkReconnections } from '../../apis/bulk_services_reconnections.js';
import { config } from '../../config/config1.js';

const ordersPool = new SharedArray('reconnections-orders', function () {
    return JSON.parse(open('../../data/bulk_orders_pool.json'));
});

export const options = {
    stages: config.winet.test.stages,
    thresholds: config.winet.test.thresholds,
};

export function setup() {
    const token = getTokenWithRetry(3);
    if (!token) throw new Error('❌ No se pudo obtener token, abortando test');
    return { token };
}

export default function (data) {
    const order = ordersPool[__VU % ordersPool.length];
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
            try {
                return Array.isArray(JSON.parse(r.body).data);
            } catch (e) {
                return false; // body no es JSON (ej. HTML de error)
            }
        },
    });

    sleep(1);
}