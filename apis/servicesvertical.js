// apis/servicevertical.js
import http from 'k6/http';
import { config } from '../config/config1.js';

// ==========================================
// CONSULTAR SERVICE QUALIFICATION - FACTIBILITY
// ==========================================

export function getServiceVertical(token, params) {
    // --------------------------------------
    // Validaciones
    // --------------------------------------
    if (!token) {
        console.error('❌ Error: Token no proporcionado');
        return null;
    }

    // --------------------------------------
    // Parámetros con valores por defecto
    // --------------------------------------
    const {
        latitude = '-12.108237653',
        longitude = '-77.04892839',
        boxType = '8',
        condominiumId = '2066',
        floorNumber = '2',
        towerId = '8781'
    } = params || {};

    // --------------------------------------
    // URL - CON PARÁMETROS QUERY
    // {{Dominio}}/api/v1/service-qualification/factibility?latitude=-12.108237653&longitude=-77.04892839&boxType=8&condominiumId=2066&floorNumber=2&towerId=8781
    // --------------------------------------
    const url = `${config.serviceUrl}/factibility?latitude=${latitude}&longitude=${longitude}&boxType=${boxType}&condominiumId=${condominiumId}&floorNumber=${floorNumber}&towerId=${towerId}`;

    console.log(`📍 URL: ${url}`);

    // --------------------------------------
    // Headers
    // --------------------------------------
    const paramsHeaders = {
        headers: {
            'Accept': 'application/json',
            'X-Channel': config.headers.channel || 'WIN',
            'Authorization': `Bearer ${token}`
        },
        timeout: config.timeouts.serviceTimeout || 15000
    };

    // --------------------------------------
    // Request
    // --------------------------------------
    try {
        const response = http.get(url, paramsHeaders);

        console.log(`📡 Service Vertical Response Status: ${response.status}`);

        // ----------------------------------
        // SERVICE OK
        // ----------------------------------
        if (response.status === 200) {
            try {
                const body = JSON.parse(response.body);
                console.log(`✅ Service Vertical consultado exitosamente`);
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
        console.error(`❌ Error en Service Vertical: ${response.status}`);
        console.error(`Body: ${response.body}`);
        return {
            status: response.status,
            body: response.body,
            error: true
        };

    } catch (error) {
        console.error(`❌ Error en getServiceVertical: ${error.message}`);
        return null;
    }
}