// scripts/load-test.js
import { check, sleep } from 'k6';
import { getTokenWithRetry } from '../src/token.js';
import { createQualification } from '../src/qualification.js';

export const options = {
    stages: [
        { duration: '30s', target: 10 },   // Rampa: 10 usuarios
        { duration: '1m', target: 10 },    // Mantener: 10 usuarios
        { duration: '30s', target: 0 }     // Rampa: bajar a 0
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'],
        http_req_failed: ['rate<0.01']
    }
};

export default function() {
    console.log(`\n📊 LOAD TEST - VU ${__VU} - ITER ${__ITER}`);

    // Obtener token (cada VU obtiene su propio token)
    const token = getTokenWithRetry();
    if (!token) return;

    // Generar datos únicos
    const timestamp = Date.now();
    const vuId = __VU || 0;
    const iterId = __ITER || 0;

    const eventId = `E.20260702172045${String(vuId).padStart(4, '0')}${String(iterId).padStart(4, '0')}.wintst`;
    const messageId = `M.20260702172045${String(vuId).padStart(4, '0')}${String(iterId).padStart(4, '0')}.wintst`;
    const productId = `PROD-LOAD-${String(vuId).padStart(4, '0')}${String(iterId).padStart(4, '0')}`;

    // Crear qualification
    const result = createQualification(token, eventId, messageId, productId);

    check(result, {
        'Qualification creada en carga': (r) => r.success === true
    });

    sleep(1);
}