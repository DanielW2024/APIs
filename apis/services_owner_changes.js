// apis/services_owner_changes.js
import http from 'k6/http';
import { config } from '../config/config1.js';

// ==========================================
// REGISTRAR CAMBIO DE TITULAR
// POST /services/owner-changes
// ==========================================

export function postOwnerChange(token) {
    const { orderCode, newOrderCode } = config.winet.params.ownerChange;

    // --------------------------------------
    // Validaciones
    // --------------------------------------

    if (!orderCode || !newOrderCode) {
        console.error('❌ Error: Faltan orderCode/newOrderCode en .env');
        console.error(`   OWNER_ORDER_CODE: ${orderCode || 'No definido'}`);
        console.error(`   OWNER_NEW_ORDER_CODE: ${newOrderCode || 'No definido'}`);
        return null;
    }

    if (!token) {
        console.error('❌ Error: Token no proporcionado');
        return null;
    }

    const url = `${config.winet.baseUrl}/services/owner-changes`;
    const payload = JSON.stringify({ orderCode, newOrderCode });

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