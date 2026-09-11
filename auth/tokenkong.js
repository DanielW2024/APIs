// auth/tokenkong.js
import http from 'k6/http';
import { sleep } from 'k6';
import { config } from '../config/config1.js';

// ==========================================
// OBTENER TOKEN DE COGNITO
// ==========================================

export function getToken() {
    console.log('🔑 Obteniendo token de Cognito...');

    // --------------------------------------
    // URL
    // --------------------------------------

    const url = config.cognitoUrl;

    console.log(`🌐 Cognito URL: ${url}`);

    // --------------------------------------
    // Validaciones
    // --------------------------------------

    if (!config.cognitoUrl) {
        console.error('❌ POLYGON_COGNITO_URL no está configurado.');
        return null;
    }

    if (!config.cognito.clientId) {
        console.error('❌ POLYGON_COGNITO_CLIENT_ID no está configurado.');
        return null;
    }

    if (!config.cognito.clientSecret) {
        console.error('❌ POLYGON_COGNITO_CLIENT_SECRET no está configurado.');
        return null;
    }

    // --------------------------------------
    // Payload (body)
    // --------------------------------------

    const payload = {
        grant_type: config.cognito.grantType || 'client_credentials',
        client_id: config.cognito.clientId,
        client_secret: config.cognito.clientSecret
    };

    console.log(`📦 Payload: ${JSON.stringify(payload)}`);

    // --------------------------------------
    // Headers (PARAMETROS HTTP)
    // --------------------------------------

    const params = {
        headers: {
            'X-Channel': config.headers.channel || 'WIN',
            'X-Forwarded-Proto': 'https',
            'Content-Type': 'application/json'
        },
        timeout: config.timeouts.tokenTimeout || 10000
    };

    console.log(`📋 Headers: ${JSON.stringify(params.headers)}`);

    // --------------------------------------
    // Request
    // --------------------------------------

    try {
        const response = http.post(url, JSON.stringify(payload), params);

        console.log(`🔑 Token Status: ${response.status}`);

        // ----------------------------------
        // TOKEN OK
        // ----------------------------------

        if (response.status === 200) {
            const body = JSON.parse(response.body);
            const token = body.access_token;

            if (token) {
                console.log('✅ Token obtenido correctamente');
                console.log(`📝 Token: ${token.substring(0, 20)}...`);
                return token;
            }

            console.error('❌ Cognito respondió 200 pero no contiene access_token.');
            console.error(`Respuesta Cognito: ${response.body}`);
            return null;
        }

        // ----------------------------------
        // ERROR HTTP
        // ----------------------------------

        console.error(`❌ Error al obtener token. HTTP Status: ${response.status}`);
        console.error(`Respuesta Cognito: ${response.body}`);
        return null;
    } catch (error) {
        console.error(`❌ Excepción obteniendo token: ${error.message}`);
        return null;
    }
}

// ==========================================
// OBTENER TOKEN CON REINTENTOS
// ==========================================

export function getTokenWithRetry(maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`🔄 Intento de token ${attempt}/${maxRetries}`);

        const token = getToken();

        // ----------------------------------
        // TOKEN OBTENIDO
        // ----------------------------------

        if (token) {
            return token;
        }

        // ----------------------------------
        // RETRY
        // ----------------------------------

        if (attempt < maxRetries) {
            console.log('⏳ Esperando 2 segundos antes de reintentar...');
            sleep(2);
        }
    }

    console.error(`❌ No se pudo obtener el token después de ${maxRetries} intentos`);
    return null;
}
