// dataLoader.js
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

/**
 * Carga las direcciones desde el archivo CSV
 */
export const addressData = new SharedArray('direcciones', function () {
    const file = open('./direccion/ids.csv');
    const parsed = papaparse.parse(file, {
        header: true,
        skipEmptyLines: true
    });

    console.log(`📊 Total direcciones cargadas: ${parsed.data.length}`);
    return parsed.data;
});

/**
 * Obtiene la siguiente dirección (secuencial)
 * @param {number} counter - Contador actual
 * @param {string} fallback - Dirección por defecto
 * @returns {string} addressId
 */
export function getNextAddress(counter, fallback = '15012200016251') {
    if (addressData.length === 0) {
        return fallback;
    }
    const index = counter % addressData.length;
    return addressData[index]?.addressId || fallback;
}