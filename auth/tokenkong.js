// auth/tokenkong.js
import http from 'k6/http';
import { sleep } from 'k6';
import { config } from '../config/config1.js';

const TOKEN_URL = config.cognitoUrl;

export function getToken() {
    const payload = JSON.stringify({
        grant_type: config.cognito.grantType,
        client_id: config.cognito.clientId,
        client_secret: config.cognito.clientSecret,
    });

    const params = {
        headers: {
            'X-Channel': config.headers.channel,
            'X-Forwarded-Proto': 'https',
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        tags: { name: 'cognito_token' },
    };

    const res = http.post(TOKEN_URL, payload, params);

    if (res.status !== 200) {
        console.error(`❌ Error al obtener token. HTTP Status: ${res.status}`);
        console.error(`Respuesta Cognito: ${res.body}`);
        return null;
    }

    const token = res.json('access_token');
    if (!token) {
        console.error(`❌ No se encontró access_token: ${res.body}`);
        return null;
    }

    return token;
}

export function getTokenWithRetry(maxRetries = 3, delaySeconds = 2) {
    for (let i = 1; i <= maxRetries; i++) {
        console.log(`🔑 Intento de token ${i}/${maxRetries}`);
        const token = getToken();
        if (token) {
            console.log('✅ Token obtenido correctamente');
            return token;
        }
        if (i < maxRetries) {
            console.log(`⏳ Esperando ${delaySeconds}s antes de reintentar...`);
            sleep(delaySeconds);
        }
    }
    console.error('❌ No se pudo obtener token tras varios intentos');
    return null;
}