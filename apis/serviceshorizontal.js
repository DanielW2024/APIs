// apis/servicehorizontal.js
import http from 'k6/http';
import { config } from '../config/config1.js';

// ==========================================
// CONSULTAR SERVICE QUALIFICATION - FACTIBILITY HORIZONTAL
// ==========================================

export function getServiceHorizontal(token, params) {
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
        boxType = '7',
        condominiumId = '',
        floorNumber = '',
        towerId = '',
        latitude = '-12.0976773',
        longitude = '-77.0231155'
    } = params || {};

    // --------------------------------------
    // URL - CON PARÁMETROS QUERY
    // {{Dominio}}/api/v1/service-qualification/factibility?boxType=7&condominiumId=&floorNumber=&towerId=&latitude=-12.0976773&longitude=-77.0231155
    // --------------------------------------
    const url = `${config.serviceUrl}/factibility?boxType=${boxType}&condominiumId=${condominiumId}&floorNumber=${floorNumber}&towerId=${towerId}&latitude=${latitude}&longitude=${longitude}`;

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

        console.log(`📡 Service Horizontal Response Status: ${response.status}`);

        // ----------------------------------
        // SERVICE OK
        // ----------------------------------
        if (response.status === 200) {
            try {
                const body = JSON.parse(response.body);
                console.log(`✅ Service Horizontal consultado exitosamente`);
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
        console.error(`❌ Error en Service Horizontal: ${response.status}`);
        console.error(`Body: ${response.body}`);
        return {
            status: response.status,
            body: response.body,
            error: true
        };

    } catch (error) {
        console.error(`❌ Error en getServiceHorizontal: ${error.message}`);
        return null;
    }
}