// ============================================================
// ARCHIVO: libs/assertions.js
// PROPÓSITO: Validaciones reutilizables para respuestas HTTP
// ============================================================

import { check } from 'k6';

/**
 * Valida que la respuesta tenga estado exitoso (2xx)
 * @param {object} response - Respuesta de k6 (res)
 * @param {string} endpointName - Nombre del endpoint para mensaje
 * @returns {boolean} True si pasó todas las validaciones
 *
 * EJEMPLO: validateStatusCode(res, 'GET /users')
 */
export function validateStatusCode(response, endpointName) {
    const isSuccess = response.status >= 200 && response.status < 300;

    return check(response, {
        [`✅ ${endpointName} - Status code es ${response.status} (2xx esperado)`]: () => isSuccess,
    });
}

/**
 * Valida que la respuesta tenga un código específico
 * @param {object} response - Respuesta de k6
 * @param {number} expectedStatus - Código HTTP esperado (ej: 200, 404)
 * @param {string} endpointName - Nombre del endpoint
 * @returns {boolean} True si coincide
 *
 * EJEMPLO: validateExactStatus(res, 201, 'POST /users')
 */
export function validateExactStatus(response, expectedStatus, endpointName) {
    return check(response, {
        [`✅ ${endpointName} - Status code esperado ${expectedStatus}, obtenido ${response.status}`]:
        () => response.status === expectedStatus,
    });
}

/**
 * Valida que la respuesta tenga un campo específico con un valor
 * @param {object} response - Respuesta de k6
 * @param {string} fieldPath - Ruta del campo (ej: 'data.user.id')
 * @param {any} expectedValue - Valor esperado
 * @param {string} endpointName - Nombre del endpoint
 * @returns {boolean} True si el campo existe y tiene el valor
 *
 * EJEMPLO: validateFieldValue(res, 'user.email', 'test@test.com', 'GET /users')
 */
export function validateFieldValue(response, fieldPath, expectedValue, endpointName) {
    try {
        // Convierte 'user.email' en objeto.user.email
        const fields = fieldPath.split('.');
        let value = JSON.parse(response.body);

        for (const field of fields) {
            value = value[field];
            if (value === undefined) break;
        }

        return check(null, {
            [`✅ ${endpointName} - Campo '${fieldPath}' es '${expectedValue}'`]:
            () => value === expectedValue,
        });
    } catch (e) {
        return check(null, {
            [`❌ ${endpointName} - Error parseando respuesta`]: () => false,
        });
    }
}

/**
 * Valida que el tiempo de respuesta sea menor a un límite
 * @param {object} response - Respuesta de k6
 * @param {number} maxTimeMs - Tiempo máximo en milisegundos
 * @param {string} endpointName - Nombre del endpoint
 * @returns {boolean} True si es más rápido que el límite
 *
 * EJEMPLO: validateResponseTime(res, 1000, 'GET /slow-endpoint')
 */
export function validateResponseTime(response, maxTimeMs, endpointName) {
    return check(response, {
        [`⏱️ ${endpointName} - Respuesta en ${response.timings.duration}ms (máx ${maxTimeMs}ms)`]:
        () => response.timings.duration < maxTimeMs,
    });
}

/**
 * Validación completa (status + tiempo + estructura básica)
 * @param {object} response - Respuesta de k6
 * @param {number} expectedStatus - Código HTTP esperado
 * @param {number} maxTimeMs - Tiempo máximo en ms
 * @param {string} endpointName - Nombre del endpoint
 * @returns {boolean} True si todas las validaciones pasaron
 *
 * EJEMPLO: validateComplete(res, 200, 2000, 'GET /api/users')
 */
export function validateComplete(response, expectedStatus, maxTimeMs, endpointName) {
    let allValid = true;

    // 1. Validar status code
    allValid = allValid && validateExactStatus(response, expectedStatus, endpointName);

    // 2. Validar tiempo de respuesta
    allValid = allValid && validateResponseTime(response, maxTimeMs, endpointName);

    // 3. Validar que la respuesta no esté vacía (para GETs que devuelven datos)
    if (expectedStatus === 200 && response.body) {
        try {
            const body = JSON.parse(response.body);
            allValid = allValid && check(body, {
                [`✅ ${endpointName} - Respuesta tiene datos`]: () => body !== null && body !== undefined,
            });
        } catch (e) {
            console.log(`⚠️ No se pudo parsear respuesta de ${endpointName}`);
        }
    }

    return allValid;
}

// ============================================================
// ¿PARA QUÉ SIRVE ESTE ARCHIVO?
// ============================================================
// Centraliza validaciones comunes para:
// 1. Evitar repetir código de check en cada prueba
// 2. Tener mensajes de error consistentes
// 3. Facilitar la creación de pruebas con múltiples validaciones
// 4. Simplificar el mantenimiento (cambias aquí y afecta todas las pruebas)