// tests/tmf679/dataLoader.js

import { SharedArray } from 'k6/data';

import papaparse from
'https://jslib.k6.io/papaparse/5.1.1/index.js';


// ==========================================
// CARGAR CSV DE DIRECCIONES
// ==========================================

export const addressData = new SharedArray(

    'tmf679-direcciones',

    function () {


        // ==============================
        // ARCHIVO CSV
        // ==============================

        const file =
        open('../../data/tmf679/ids.csv');


        // ==============================
        // PARSEAR CSV
        // ==============================

        const parsed =
        papaparse.parse(

            file,

            {
                header: true,

                skipEmptyLines: true
            }
        );


        // ==============================
        // VALIDACIÓN
        // ==============================

        if (
        !parsed.data ||
        parsed.data.length === 0
        ) {

            throw new Error(
                '❌ El archivo ids.csv está vacío o no contiene datos válidos.'
            );
        }


        // ==============================
        // VALIDAR addressId
        // ==============================

        const invalidRows =
        parsed.data.filter(
            row =>
            !row.addressId ||
            String(row.addressId).trim() === ''
        );


        if (invalidRows.length > 0) {

            console.warn(
                `⚠️ Se encontraron ${invalidRows.length} registros sin addressId.`
            );
        }


        // ==============================
        // LOG
        // ==============================

        console.log(
            `📊 TMF679 - Total direcciones cargadas: ${parsed.data.length}`
        );


        return parsed.data;
    }
);


// ==========================================
// OBTENER SIGUIENTE ADDRESS
// ==========================================

export function getNextAddress(

counter,

fallback =
'15012200016251'

) {


    // ==============================
    // SIN DATOS
    // ==============================

    if (
    addressData.length === 0
    ) {

        return fallback;
    }


    // ==============================
    // ÍNDICE SECUENCIAL
    // ==============================

    const index =
    counter %
    addressData.length;


    // ==============================
    // ADDRESS ID
    // ==============================

    const addressId =
    addressData[index]?.addressId;


    return (

    addressId &&
    String(addressId).trim() !== ''

    )

    ? String(addressId).trim()

    : fallback;
}