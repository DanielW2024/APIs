import http from 'k6/http';
import { sleep } from 'k6';
import { config } from './config.js';

export function getToken() {
    console.log('🔑 Obteniendo token de Cognito...');

    const url = `${config.cognitoUrl}/oauth2/token`;
    const payload = {
        grant_type: config.cognito.grantType,
        client_id: config.cognito.clientId,
        client_secret: config.cognito.clientSecret,
        scope: config.cognito.scope
    };
    const params = {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: config.timeouts.tokenTimeout
    };

    try {
        const response = http.post(url, payload, params);
        if (response.status === 200) {
            const token = response.json('access_token');
            if (token) {
                console.log(`✅ Token obtenido`);
                return token;
            }
        }
        console.error(`❌ Error al obtener token: ${response.status}`);
        return null;
    } catch (error) {
        console.error(`❌ Excepción: ${error.message}`);
        return null;
    }
}

export function getTokenWithRetry(maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        const token = getToken();
        if (token) return token;
        if (i < maxRetries - 1) sleep(2);
    }
    return null;
}