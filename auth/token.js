// auth/token.js

import http from 'k6/http';
import { sleep } from 'k6';

import { config } from '../config/config.js';


// ==========================================
// OBTENER TOKEN DE COGNITO
// ==========================================

export function getToken() {

    console.log('🔑 Obteniendo token de Cognito...');

    // --------------------------------------
    // URL
    // --------------------------------------

    const url =
    `${config.cognitoUrl}/oauth2/token`;

    console.log(
        `🌐 Cognito URL: ${config.cognitoUrl}/oauth2/token`
    );


    // --------------------------------------
    // Validaciones
    // --------------------------------------

    if (!config.cognitoUrl) {

        console.error(
            '❌ COGNITO_URL no está configurado.'
        );

        return null;
    }

    if (!config.cognito.clientId) {

        console.error(
            '❌ COGNITO_CLIENT_ID no está configurado.'
        );

        return null;
    }

    if (!config.cognito.clientSecret) {

        console.error(
            '❌ COGNITO_CLIENT_SECRET no está configurado.'
        );

        return null;
    }


    // --------------------------------------
    // Payload
    // --------------------------------------

    const payload = {

        grant_type:
        config.cognito.grantType,

        client_id:
        config.cognito.clientId,

        client_secret:
        config.cognito.clientSecret,

        scope:
        config.cognito.scope
    };


    // --------------------------------------
    // Parámetros HTTP
    // --------------------------------------

    const params = {

        headers: {

            'Content-Type':
            'application/x-www-form-urlencoded'
        },

        timeout:
        config.timeouts.tokenTimeout
    };


    // --------------------------------------
    // Request
    // --------------------------------------

    try {

        const response =
        http.post(
            url,
            payload,
            params
        );


        console.log(
            `🔑 Token Status: ${response.status}`
        );


        // ----------------------------------
        // TOKEN OK
        // ----------------------------------

        if (response.status === 200) {

            const token =
            response.json('access_token');


            if (token) {

                console.log(
                    '✅ Token obtenido correctamente'
                );

                return token;
            }


            console.error(
                '❌ Cognito respondió 200 pero no contiene access_token.'
            );

            console.error(
                `Respuesta Cognito: ${response.body}`
            );

            return null;
        }


        // ----------------------------------
        // ERROR HTTP
        // ----------------------------------

        console.error(
            `❌ Error al obtener token. HTTP Status: ${response.status}`
        );

        console.error(
            `Respuesta Cognito: ${response.body}`
        );

        return null;

    } catch (error) {

        console.error(
            `❌ Excepción obteniendo token: ${error.message}`
        );

        return null;
    }
}


// ==========================================
// OBTENER TOKEN CON REINTENTOS
// ==========================================

export function getTokenWithRetry(
maxRetries = 3
) {

    for (
    let attempt = 1;
    attempt <= maxRetries;
    attempt++
    ) {

        console.log(
            `🔄 Intento de token ${attempt}/${maxRetries}`
        );


        const token =
        getToken();


        // ----------------------------------
        // TOKEN OBTENIDO
        // ----------------------------------

        if (token) {

            return token;
        }


        // ----------------------------------
        // RETRY
        // ----------------------------------

        if (
        attempt < maxRetries
        ) {

            console.log(
                '⏳ Esperando 2 segundos antes de reintentar...'
            );

            sleep(2);
        }
    }


    console.error(
        `❌ No se pudo obtener el token después de ${maxRetries} intentos`
    );

    return null;
}