// config/config.js
export const config = {
<<<<<<< HEAD
    // URLs - VALORES FIJOS
    cognitoUrl: 'https://api-integracionqa.winet.pe/oauth2/token',
    polygonUrl: 'https://api-integracionqa.winet.pe/api/v1/coverage/polygon',
    networkUrl: 'https://api-integracionqa.winet.pe/api/v1/network-projects',
    ontUrl: 'https://api-integracionqa.winet.pe',
    serviceUrl: 'https://api-integracionqa.winet.pe/api/v1/service-qualification',

    // Cognito - VALORES FIJOS
    cognito: {
        clientId: 'ieKJneRZVVKdm9YHz4JkVzoCsRUdqIoK',
        clientSecret: 'MA7CfFdZ738EBaBUXvGvnfipcy9oxA30',
        grantType: 'client_credentials',
        scope: 'tmf/tmf679.write'
    },

    // Headers
    headers: {
        channel: 'WIN'
    },

    // Parámetros - VALORES FIJOS
    params: {
        latitud: '-12.211893244818599',
        longitud: '-77.00200435008979',
        ubigeo: '00150131'
=======
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
>>>>>>> 8782307bf19bd182b0b9895a1be375c6326ea6e9
    },

    // Timeouts
    timeouts: {
<<<<<<< HEAD
        tokenTimeout: 10000,
        polygonTimeout: 15000,
        networkTimeout: 30000
=======
        tokenTimeout: Number(__ENV.POLYGON_TOKEN_TIMEOUT || 10000),
        polygonTimeout: Number(__ENV.POLYGON_POLYGON_TIMEOUT || 15000),
        networkTimeout: Number(__ENV.NETWORK_TIMEOUT || 15000)
>>>>>>> 8782307bf19bd182b0b9895a1be375c6326ea6e9
    },

    // Configuración del test
    test: {
        stages: [
<<<<<<< HEAD
            { duration: '1m', target: 3 },
            //{ duration: '1m', target: 30 },
           // { duration: '1', target: 0 },
=======
            { duration: '1m', target: 2 },
            { duration: '1m', target: 30 },
            { duration: '1', target: 0 },
>>>>>>> 8782307bf19bd182b0b9895a1be375c6326ea6e9
        ],
        thresholds: {
            http_req_duration: ['p(95)<5000'],
            http_req_failed: ['rate<0.01']
        }
    }
};