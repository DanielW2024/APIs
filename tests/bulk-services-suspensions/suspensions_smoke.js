import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { getTokenWithRetry } from '../../auth/tokenkong.js';
import { postBulkSuspensions } from '../../apis/bulk_services_suspensions.js';
import { config } from '../../config/config1.js';

const ordersPool = new SharedArray('suspensions-orders', function () {
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
    // Cada VU/iteración toma un registro distinto del pool
    const order = ordersPool[__VU % ordersPool.length];
    const res = postBulkSuspensions(data.token, [order]);

    check(res, {
        'status es 200': (r) => r && r.status === 200,
        'respuesta tiene data[]': (r) => r && Array.isArray(JSON.parse(r.body).data),
    });

    sleep(1);
}