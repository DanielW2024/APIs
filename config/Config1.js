// config/config.js
export const config = {
    // URLs
    cognitoUrl: __ENV.POLYGON_COGNITO_URL || '',
    polygonUrl: __ENV.POLYGON_URL || '',
    // NETWORK
    networkUrl: __ENV.NETWORK_URL || '',



    // Cognito
    cognito: {
        clientId: __ENV.POLYGON_COGNITO_CLIENT_ID || '',
        clientSecret: __ENV.POLYGON_COGNITO_CLIENT_SECRET || '',
        grantType: __ENV.POLYGON_COGNITO_GRANT_TYPE || 'client_credentials',
        scope: __ENV.POLYGON_COGNITO_SCOPE || 'tmf/tmf679.write'
    },


    // Headers
    headers: {
        channel: __ENV.POLYGON_CHANNEL_ID || 'WIN'
    },

    // Parámetros


    params: {
        latitud: __ENV.POLYGON_LATITUD || '',
        longitud: __ENV.POLYGON_LONGITUD || '',
    ubigeo : __ENV.NETWORK_UBIGEO || ''
    },

    // Timeouts
    timeouts: {
        tokenTimeout: Number(__ENV.POLYGON_TOKEN_TIMEOUT || 10000),
        polygonTimeout: Number(__ENV.POLYGON_POLYGON_TIMEOUT || 15000),
        networkTimeout: Number(__ENV.NETWORK_TIMEOUT || 15000)
    },

    // Configuración del test
    test: {
        stages: [
            { duration: '1m', target: 2 },
            { duration: '1m', target: 30 },
            { duration: '1', target: 0 },
        ],
        thresholds: {
            http_req_duration: ['p(95)<5000'],
            http_req_failed: ['rate<0.01']
        }
    }
};