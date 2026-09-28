// tests/bulk-services-terminations/terminations_smoke.js
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { getTokenWithRetry } from '../../auth/tokenkong.js';
import { postBulkTerminations } from '../../apis/bulk_services_terminations.js';
import { config } from '../../config/config1.js';

// Cargamos el CSV UNA sola vez por VU (gracias a SharedArray)
const ORDERS = new SharedArray('orders', function () {
    const csv = open('../datos.csv'); // ruta relativa al archivo del test
    const parsed = papaparse.parse(csv, { header: true, skipEmptyLines: true }).data;

    // Normalizamos al formato que espera postBulkTerminations
    return parsed
        .filter((row) => row.nserie && row.npedido)
        .map((row) => ({
        orderCode: String(row.npedido).trim(),
        serialNumber: String(row.nserie).trim(),
    }));
});

export const options = config.winet.bulkTest;

export function setup() {
    const token = getTokenWithRetry(3);
    if (!token) throw new Error('❌ No se pudo obtener token, abortando test');

    if (ORDERS.length === 0) {
        throw new Error('❌ El CSV no contiene órdenes válidas');
    }

    return { token };
}

export default function (data) {
    const order = ORDERS[__ITER % ORDERS.length];
    const res = postBulkTerminations(data.token, [order]);

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