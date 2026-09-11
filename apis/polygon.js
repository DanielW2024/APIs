// apis/polygon.js
import http from 'k6/http';
import { config } from '../config/config1.js';

// ==========================================
// CONSULTAR ENDPOINT POLYGON
// ==========================================

export function getPolygon(token) {
    const latitud = config.params.latitud;
    const longitud = config.params.longitud;

    // --------------------------------------
    // Validaciones
    // --------------------------------------

    if (!latitud || !longitud) {
        console.error('❌ Error: Faltan coordenadas en .env');
        console.error(`   LATITUD: ${latitud || 'No definida'}`);
        console.error(`   LONGITUD: ${longitud || 'No definida'}`);
        return null;
    }

    if (!token) {
        console.error('❌ Error: Token no proporcionado');
        return null;
    }

    // --------------------------------------
    // URL
    // --------------------------------------

    const url = `${config.polygonUrl}?latitud=${latitud}&longitud=${longitud}`;

    // --------------------------------------
    // Headers
    // --------------------------------------

    const params = {
        headers: {
            'Accept': 'application/json',
            'X-Channel': config.headers.channel || 'WIN',
            'Authorization': `Bearer ${token}`
        },
        timeout: config.timeouts.polygonTimeout || 15000
    };

    // --------------------------------------
    // Request
    // --------------------------------------

    try {
        console.log('📍 Consultando polygon...');
        console.log(`📍 URL: ${url}`);
        
        const response = http.get(url, params);
        
        console.log(`📡 Polygon response: ${response.status}`);

        // ----------------------------------
        // POLYGON OK
        // ----------------------------------

        if (response.status === 200) {
            const body = JSON.parse(response.body);
            console.log('✅ Polygon consultado exitosamente');
            return {
                status: response.status,
                body: body
            };
        }

        // ----------------------------------
        // ERROR HTTP
        // ----------------------------------

        console.error(`❌ Error en polygon: ${response.status}`);
        console.error(`Body: ${response.body}`);
        return {
            status: response.status,
            body: response.body,
            error: true
        };
    } catch (error) {
        console.error(`❌ Error en getPolygon: ${error.message}`);
        return null;
    }
}
