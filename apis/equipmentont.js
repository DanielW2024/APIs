// apis/equipmentont.js
import http from 'k6/http';
import { config } from '../config/config1.js';

// ==========================================
// CONSULTAR ENDPOINT ONT
// ==========================================

export function getNetwork(token, ontId) {
    // --------------------------------------
    // Validaciones
    // --------------------------------------
    if (!token) {
        console.error('❌ Error: Token no proporcionado');
        return null;
    }

    if (!ontId) {
        console.error('❌ Error: ontId no proporcionado');
        return null;
    }

    // --------------------------------------
    // URL - ID dinámico
    // --------------------------------------
    const url = `${config.ontUrl}/api/v1/network-equipment/ont/${ontId}`;

    console.log(`📍 Consultando ONT: ${ontId}`);
    console.log(`📍 URL: ${url}`);

    // --------------------------------------
    // Headers
    // --------------------------------------
    const params = {
        headers: {
            'Accept': 'application/json',
            'X-Channel': config.headers.channel || 'WIN',
            'Authorization': `Bearer ${token}`
        },
        timeout: config.timeouts.networkTimeout || 15000
    };

    // --------------------------------------
    // Request
    // --------------------------------------
    try {
        const response = http.get(url, params);

        console.log(`📡 ONT Response Status: ${response.status}`);

        // ----------------------------------
        // ONT OK
        // ----------------------------------
        if (response.status === 200) {
            try {
                const body = JSON.parse(response.body);
                console.log(`✅ ONT ${ontId} consultado exitosamente`);
                return {
                    status: response.status,
                    body: body,
                    ontId: ontId
                };
            } catch (parseError) {
                console.error('❌ Error al parsear respuesta JSON');
                console.error(`Body: ${response.body}`);
                return {
                    status: response.status,
                    body: response.body,
                    error: true,
                    ontId: ontId
                };
            }
        }

        // ----------------------------------
        // ERROR HTTP
        // ----------------------------------
        console.error(`❌ Error en ONT ${ontId}: ${response.status}`);
        console.error(`Body: ${response.body}`);
        return {
            status: response.status,
            body: response.body,
            error: true,
            ontId: ontId
        };

    } catch (error) {
        console.error(`❌ Error en getNetwork para ${ontId}: ${error.message}`);
        return null;
    }
}