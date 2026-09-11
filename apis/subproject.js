// apis/network.js
import http from 'k6/http';
import { config } from '../config/config1.js';

// ==========================================
// CONSULTAR NETWORK PROJECTS - SUB-PROJECTS
// ==========================================

export function getNetwork(token) {
    // --------------------------------------
    // Validaciones
    // --------------------------------------
    if (!token) {
        console.error('❌ Error: Token no proporcionado');
        return null;
    }

    // --------------------------------------
    // URL - FIJA CON 2066
    // {{Dominio}}/api/v1/network-projects/2066/sub-projects
    // --------------------------------------
    const url = `${config.networkUrl}/2066/sub-projects`;

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

        console.log(`📡 Network Response Status: ${response.status}`);

        // ----------------------------------
        // NETWORK OK
        // ----------------------------------
        if (response.status === 200) {
            try {
                const body = JSON.parse(response.body);
                console.log(`✅ Network Projects consultado exitosamente`);
                return {
                    status: response.status,
                    body: body
                };
            } catch (parseError) {
                console.error('❌ Error al parsear respuesta JSON');
                console.error(`Body: ${response.body}`);
                return {
                    status: response.status,
                    body: response.body,
                    error: true
                };
            }
        }

        // ----------------------------------
        // ERROR HTTP
        // ----------------------------------
        console.error(`❌ Error en Network Projects: ${response.status}`);
        console.error(`Body: ${response.body}`);
        return {
            status: response.status,
            body: response.body,
            error: true
        };

    } catch (error) {
        console.error(`❌ Error en getNetwork: ${error.message}`);
        return null;
    }
}