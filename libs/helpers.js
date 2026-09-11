// ============================================================
// ARCHIVO: libs/helpers.js
// PROPÓSITO: Funciones reutilizables que facilitan las pruebas
// ============================================================

import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

/**
 * Genera un ID aleatorio entre min y max
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {number} Número aleatorio
 *
 * EJEMPLO: getRandomId(1, 1000) -> 547
 */
export function getRandomId(min = 1, max = 10000) {
    return randomIntBetween(min, max);
}

/**
 * Genera un string aleatorio (útil para pruebas de creación)
 * @param {number} length - Longitud del string
 * @returns {string} String aleatorio
 *
 * EJEMPLO: getRandomString(10) -> "aB3dEfGhIj"
 */
export function getRandomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Espera un tiempo aleatorio entre min y max (simula comportamiento humano)
 * @param {number} minSleep - Tiempo mínimo en segundos
 * @param {number} maxSleep - Tiempo máximo en segundos
 *
 * EJEMPLO: randomSleep(1, 3) -> espera entre 1 y 3 segundos
 */
export function randomSleep(minSleep = 1, maxSleep = 3) {
    const sleepTime = randomIntBetween(minSleep, maxSleep);
    sleep(sleepTime);
}

/**
 * Construye una URL completa a partir de la base y el endpoint
 * @param {string} base - URL base (ej: STAGING_URL)
 * @param {string} endpoint - Ruta del endpoint (ej: '/api/users')
 * @returns {string} URL completa
 *
 * EJEMPLO: buildUrl(STAGING_URL, '/api/users') -> "https://api.staging.com/api/users"
 */
export function buildUrl(base, endpoint) {
    // Elimina barras duplicadas
    return `${base.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
}

/**
 * Genera datos de prueba para un usuario nuevo
 * @returns {object} Datos de usuario con nombre, email, etc.
 *
 * EJEMPLO: generateMockUser() -> { name: "John_XYZ", email: "user_XYZ@test.com" }
 */
export function generateMockUser() {
    const randomString = getRandomString(8);
    return {
        name: `TestUser_${randomString}`,
        email: `user_${randomString}@test.com`,
        password: 'Test123!'
    };
}

/**
 * Loggea información útil en la consola (solo útil para debug)
 * @param {string} label - Etiqueta descriptiva
 * @param {any} data - Datos a mostrar
 *
 * EJEMPLO: debugLog("Respuesta recibida", { status: 200 })
 */
export function debugLog(label, data) {
    console.log(`[DEBUG] ${label}: ${JSON.stringify(data)}`);
}

/**
 * Calcula métricas personalizadas como percentiles, promedio, etc.
 * NOTA: Esto es para análisis, k6 ya lo hace automáticamente
 *
 * @param {array} durations - Lista de tiempos de respuesta
 * @returns {object} Métricas calculadas
 */
export function calculateMetrics(durations) {
    const sorted = durations.sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
        count: durations.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: sum / durations.length,
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
    };
}

// ============================================================
// ¿PARA QUÉ SIRVE ESTE ARCHIVO?
// ============================================================
// Contiene funciones que:
// 1. Generan datos de prueba dinámicos
// 2. Ayudan a simular comportamiento realista
// 3. Evitan código repetitivo en cada prueba
// 4. Facilitan el debugging y análisis