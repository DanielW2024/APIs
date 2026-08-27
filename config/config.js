// tests/Polygon/polygon_stress.js
import { sleep, check } from 'k6';
import { getCognitoToken, createDefaultOrder, getTMF679OrderStatus } from '../../apis/polygon.js';

// Configuración del test
export const options = {
    stages: [
        { duration: '30s', target: 10 },   // Rampa hasta 10 usuarios
        { duration: '1m', target: 20 },    // Rampa hasta 20 usuarios
        { duration: '30s', target: 0 },    // Rampa abajo
    ],
    thresholds: {
        http_req_duration: ['p(95)<10000'], // 95% de requests < 10s
        http_req_failed: ['rate<0.01'],      // Tasa de error < 1%
    },
};

// Setup - se ejecuta una vez al inicio
export function setup() {
    console.log('=== INICIANDO TEST DE STRESS POLYGON ===');
    console.log(`URL TMF679: ${__ENV.TMF679_URL || 'No definida'}`);
    console.log(`Product ID: ${__ENV.PRODUCT_ID || 'PROD-004'}`);

    // Obtener token una vez y compartirlo
    const token = getCognitoToken();
    if (!token) {
        throw new Error('No se pudo obtener el token de Cognito');
    }
    return { token };
}

// Función principal de prueba - se ejecuta para cada VU
export default function (data) {
    const token = data.token;

    // 1. Crear una orden
    console.log('Creando orden...');
    const orderResult = createDefaultOrder(token);

    if (orderResult && orderResult.status === 201) {
        const orderId = orderResult.body.id || orderResult.body.orderId;
        console.log(`Orden creada: ${orderId}`);

        // 2. Verificar estado de la orden
        sleep(1); // Pequeña pausa antes de verificar
        const statusResult = getTMF679OrderStatus(token, orderId);

        if (statusResult && statusResult.status === 200) {
            console.log(`Estado de orden ${orderId}: ${statusResult.body.status}`);
        }
    } else {
        console.error('Fallo al crear la orden');
    }

    // Pausa entre iteraciones
    sleep(2);
}

// Teardown - se ejecuta una vez al final
export function teardown(data) {
    console.log('=== FIN DEL TEST DE STRESS POLYGON ===');
    console.log(`Total de iteraciones completadas: ${__ITER}`);
}