// apis/bulk_services_speed_changes.js
import http from 'k6/http';
import { config } from '../config/config1.js';

// ==========================================
// CAMBIO MASIVO DE PLAN/VELOCIDAD
// POST /bulk/services/speed-changes
// ==========================================

export function postBulkSpeedChange(token) {
    const { group, speed, serialNumber, orderCode } = config.winet.params.speedChange;

    // --------------------------------------
    // Validaciones
    // --------------------------------------

    if (!group || !speed || !serialNumber || !orderCode) {
        console.error('❌ Error: Faltan parámetros en .env para speed-changes');
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

    const url = `${config.winet.baseUrl}/bulk/services/speed-changes`;
    const payload = JSON.stringify({ group, speed, serialNumber, orderCode });

    const params = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'X-Channel': config.winet.headers.channel,
            'Content-Type': 'application/json'
        },
        timeout: config.winet.timeouts.requestTimeout
    };

    return http.post(url, payload, params);
}