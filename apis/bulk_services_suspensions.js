// apis/bulk_services_suspensions.js
import http from 'k6/http';
import { check } from 'k6';
import { config } from '../config/config1.js';

const SUSPENSIONS_URL = `${config.winet.internalBaseUrl}/bulk/services/suspensions`;

// ==========================================
// SUSPENSION MASIVA DE SERVICIOS
// POST /bulk/services/suspensions
// Body: { processType, codigo_proceso, orders: [{ orderCode, serialNumber }] }
// Máximo 60 elementos por solicitud
// ==========================================
export function postBulkSuspensions(
token,
orders,
processType = config.winet.params.bulk.processType
) {
    // ----- Validaciones -----
    if (!token) {
        console.error('❌ Error: Token no proporcionado');
        return null;
    }

    if (!orders || orders.length === 0) {
        console.error('❌ Error: No hay orders[] cargadas para suspensions');
        return null;
    }

    if (orders.length > 60) {
        console.error(`❌ Error: orders[] excede el máximo de 60 (recibidas: ${orders.length})`);
        return null;
    }

    for (const order of orders) {
        if (!order.orderCode || !order.serialNumber || order.serialNumber.length !== 16) {
            console.error(`❌ Error: order inválida -> ${JSON.stringify(order)}`);
            return null;
        }
    }

    const body = JSON.stringify({
        processType,
        codigo_proceso: processType,   // el backend lo exige (igual que en terminations)
        orders,
    });

    const params = {
        headers: {
            'X-Channel': config.winet.headers.channel,
            'X-Forwarded-Proto': 'https',
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
        timeout: config.winet.timeouts.requestTimeout,
        tags: { name: 'bulk_suspensions' },
    };

    const res = http.post(SUSPENSIONS_URL, body, params);

    check(res, {
        'suspensions status no es 429': (r) => r.status !== 429,
    });

    if (res.status >= 400) {
        console.error(`❌ Suspensions HTTP ${res.status}: ${res.body}`);
    }

    return res;
}