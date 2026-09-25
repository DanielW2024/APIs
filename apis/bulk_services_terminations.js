// apis/bulk_services_terminations.js
import http from 'k6/http';
import { check } from 'k6';
import { config } from '../config/config1.js';

const TERMINATIONS_URL = `${config.winet.internalBaseUrl}${config.winet.endpoints.bulkTerminations}`;

// ==========================================
// POST BULK TERMINATIONS
// Body requerido por el backend:
//   { processType, codigo_proceso, orders: [{ orderCode, serialNumber }] }
// ==========================================
export function postBulkTerminations(
token,
orders,
processType = config.winet.params.bulk.processType
) {
    if (!token) {
        console.error('❌ postBulkTerminations: token vacío o nulo');
        return null;
    }

    const body = JSON.stringify({
        processType,
        codigo_proceso: processType,
        orders,
    });

    const params = {
        headers: {
            'X-Channel': config.headers.channel,
            'X-Forwarded-Proto': 'https',
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
        tags: { name: 'bulk_terminations' },
    };

    console.log(`[DEBUG] URL: ${TERMINATIONS_URL}`);
    console.log(`[DEBUG] BODY: ${body}`);
    console.log(`[DEBUG] AUTH: ${params.headers.Authorization}`);

    const res = http.post(TERMINATIONS_URL, body, params);

    check(res, {
        'status no es 429': (r) => r.status !== 429,
    });

    if (res.status >= 400) {
        console.error(`❌ Terminations HTTP ${res.status}: ${res.body}`);
    }

    return res;
}