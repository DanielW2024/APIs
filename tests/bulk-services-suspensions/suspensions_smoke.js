// tests/bulk-services-suspensions/suspensions_smoke.js
import { check, sleep } from 'k6';
import { getTokenWithRetry } from '../../auth/tokenkong.js';
import { postBulkSuspensions } from '../../apis/bulk_services_suspensions.js';
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
    const res = postBulkSuspensions(data.token, [order]);

    check(res, {
        'status es 200': (r) => r && r.status === 200,
        'respuesta tiene data[]': (r) => {
            if (!r || !r.body) return false;
            try {
                return Array.isArray(JSON.parse(r.body).data);
            } catch (_) {
                return false;
            }
        },
        'status no es 429': (r) => r && r.status !== 429,
    });

    sleep(1);
}