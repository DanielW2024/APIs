// apis/bulk_services_suspensions.js
import http from 'k6/http';
import { config } from '../config/config1.js';

// ==========================================
// SUSPENSION MASIVA DE SERVICIOS
// POST /bulk/services/suspensions
// Body: { processType, orders: [{ orderCode, serialNumber }] }
// Máximo 60 elementos por solicitud
// ==========================================

export function postBulkSuspensions(token, orders) {
    const { processType } = config.winet.params.bulk;

    // --------------------------------------
    // Validaciones
    // --------------------------------------

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

    if (!token) {
        console.error('❌ Error: Token no proporcionado');
        return null;
    }

    const url = `${config.winet.baseUrl}/bulk/services/suspensions`;
    const payload = JSON.stringify({ processType, orders });

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