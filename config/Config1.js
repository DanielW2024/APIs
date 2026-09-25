// config/config1.js

export const config = {

    // ==========================================
    // URLs
    // ==========================================
    cognitoUrl: 'http://172.16.27.41:8080/oauth2/token',
    polygonUrl: 'https://api-integracionqa.winet.pe/api/v1/coverage/polygon',
    networkUrl: 'https://api-integracionqa.winet.pe/api/v1/network-projects',

    // ==========================================
    // Cognito
    // ==========================================
    cognito: {
        clientId: 'ieKJneRZVVKdm9YHz4JkVzoCsRUdqIoK',
        clientSecret: 'MA7CfFdZ738EBaBUXvGvnfipcy9oxA30',
        grantType: 'client_credentials',
        scope: 'tmf/tmf679.write services:write bulk-services:write'
    },

    // ==========================================
    // Headers globales
    // ==========================================
    headers: {
        channel: 'WIN'
    },

    // ==========================================
    // Parámetros (Polygon / Network)
    // ==========================================
    params: {
        latitud: '-12.211893244818599',
        longitud: '-77.00200435008979',
        ubigeo: '00150131'
    },

    // ==========================================
    // Timeouts
    // ==========================================
    timeouts: {
        tokenTimeout: 20000,
        polygonTimeout: 15000,
        networkTimeout: 15000,
        requestTimeout: 15000
    },

    // ==========================================
    // Test Polygon / Network
    // ==========================================
    test: {
        stages: [
            { duration: '1s', target: 1 },
        ],
        thresholds: {
            http_req_duration: ['p(95)<5000'],
            http_req_failed: ['rate<0.01']
        }
    },

    // ==========================================
    // WINET API CATALOG — services / bulk
    // ==========================================
    winet: {
        baseUrl: 'https://api-integracionqa.winet.pe/api/v1',
        internalBaseUrl: 'http://172.16.27.41:8080/api/v1',
        headers: {
            channel: 'WIN'
        },
        endpoints: {
            bulkTerminations: '/bulk/services/terminations'
        },
        params: {
            ownerChange: {
                orderCode: 0,
                newOrderCode: 0
            },
            speedChange: {
                group: 'WIN',
                speed: '1000',
                serialNumber: '48575443FD8875AE',
                orderCode: 2598640
            },
            bulk: {
                processType: 'APC'
            }
        },
        timeouts: {
            requestTimeout: 15000
        },

        // Rate limit de Kong (headers 429): 20/min, 1/seg
        rateLimit: {
            perMinute: 20,
            perSecond: 1,
            safeRatePerMinute: 18
        },

        // Test genérico (servicestatus, speed-changes, etc.)
        test: {
            stages: [
                { duration: '30s', target: 1 },
                { duration: '30s', target: 2 },
                { duration: '15s', target: 0 },
            ],
            thresholds: {
                http_req_duration: ['p(95)<5000'],
                http_req_failed: ['rate<0.01']
            }
        },

        // Test BULK: controla requests/min para no pasar el rate limit
        bulkTest: {
            scenarios: {
                bulk_smoke: {
                    executor: 'constant-arrival-rate',
                    rate: 15,
                    timeUnit: '1m',
                    duration: '1m',
                    preAllocatedVUs: 1,
                    maxVUs: 2
                }
            },
            thresholds: {
                http_req_duration: ['p(95)<5000'],
                http_req_failed: ['rate<0.05'],
                'checks{check:status no es 429}': ['rate>0.95']
            }
        }
    }
};