// apis/bulk_services_speed_changes.js
import http from 'k6/http';
import { check } from 'k6';
import { config } from '../config/config1.js';

const SPEED_CHANGES_URL = `${config.winet.internalBaseUrl}/bulk/services/speed-changes`;

// ==========================================
// CAMBIO MASIVO DE PLAN/VELOCIDAD
// POST /bulk/services/speed-changes
// Body: { group, speed, serialNumber, orderCode }
// ==========================================
export function postBulkSpeedChange(token) {
    const { group, speed, serialNumber, orderCode } = config.winet.params.speedChange;

    // ----- Validaciones -----
    if (!group || !speed || !serialNumber || !orderCode) {
        console.error('❌ Error: Faltan parámetros en config para speed-changes');
        console.error(`   GROUP: ${group || 'No definido'}`);
        console.error(`   SPEED: ${speed || 'No definido'}`);
        console.error(`   SERIAL: ${serialNumber || 'No definido'}`);
        console.error(`   ORDER_CODE: ${orderCode || 'No definido'}`);
        return null;
    }

    if (serialNumber.length !== 16) {
        console.error('❌ Error: serialNumber debe tener 16 caracteres alfanuméricos');
        return null;
    }

    if (!token) {
        console.error('❌ Error: Token no proporcionado');
        return null;
    }

    const body = JSON.stringify({
        group,
        speed,
        serialNumber,
        orderCode,
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
        tags: { name: 'bulk_speed_changes' },
    };

    console.log(`[DEBUG] URL: ${SPEED_CHANGES_URL}`);
    console.log(`[DEBUG] BODY: ${body}`);
    console.log(`[DEBUG] AUTH: ${params.headers.Authorization}`);

    const res = http.post(SPEED_CHANGES_URL, body, params);

    check(res, {
        'speed-changes status no es 429': (r) => r.status !== 429,
    });

    if (res.status >= 400) {
        console.error(`❌ Speed-changes HTTP ${res.status}: ${res.body}`);
    }

    return res;
}