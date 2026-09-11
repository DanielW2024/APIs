// config/config.js
export const config = {
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
    },

    // Timeouts
    timeouts: {
        tokenTimeout: 10000,
        polygonTimeout: 15000,
        networkTimeout: 30000
    },

    // Configuración del test
    test: {
        stages: [
            { duration: '1m', target: 3 },
            //{ duration: '1m', target: 30 },
           // { duration: '1', target: 0 },
        ],
        thresholds: {
            http_req_duration: ['p(95)<5000'],
            http_req_failed: ['rate<0.01']
        }
    }
};