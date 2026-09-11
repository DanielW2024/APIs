// tests/tmf679/polygon_stress.js

import {
check,
sleep
} from 'k6';


import {
getTokenWithRetry
} from '../../auth/token.js';


import {
createQualification
} from '../../apis/tmf679.js';


import {
addressData,
getNextAddress
} from './dataLoader.js';


// ==========================================
// CONFIGURACIÓN
// ==========================================

const MAX_TOKEN_RETRIES = 3;


// ==========================================
// CONTADOR DE DIRECCIONES
// ==========================================

let addressCounter = 0;


// ==========================================
// HORA DE INICIO
// ==========================================

const testStartTime =
new Date().toLocaleString('es-PE');


// ==========================================
// GENERAR TIMESTAMP
// ==========================================

function getTimestamp() {

    const now =
    new Date();


    const year =
    now.getFullYear();


    const month =
    String(
        now.getMonth() + 1
    ).padStart(2, '0');


    const day =
    String(
        now.getDate()
    ).padStart(2, '0');


    const hours =
    String(
        now.getHours()
    ).padStart(2, '0');


    const minutes =
    String(
        now.getMinutes()
    ).padStart(2, '0');


    const seconds =
    String(
        now.getSeconds()
    ).padStart(2, '0');


    const ms =
    String(
        now.getMilliseconds()
    ).padStart(3, '0');


    return (
    `${year}${month}${day}` +
    `${hours}${minutes}${seconds}${ms}`
    );
}


// ==========================================
// OPCIONES K6
// ==========================================

export const options = {


    // ======================================
    // STRESS TEST
    // ======================================

    stages: [

        {
            duration: '10s',
            target: 5
        }

    ],


    // ======================================
    // THRESHOLDS
    // ======================================

    thresholds: {

        http_req_duration: [
            'p(95)<5000'
        ],

        checks: [
            'rate>0.95'
        ]
    },


    // ======================================
    // MÉTRICAS DEL SUMMARY
    // ======================================

    summaryTrendStats: [

        'min',

        'med',

        'avg',

        'p(90)',

        'p(95)',

        'p(99)',

        'max'

    ]
};


// ==========================================
// SETUP
// ==========================================

export function setup() {


    console.log(
        '=========================================='
    );

    console.log(
        '🚀 INICIANDO PRUEBA DE ESTRÉS TMF679'
    );

    console.log(
        '=========================================='
    );


    console.log(
        `📅 Inicio: ${testStartTime}`
    );


    // ======================================
    // DIRECCIONES
    // ======================================

    console.log(
        `📊 Direcciones disponibles: ${addressData.length}`
    );


    if (
    addressData.length === 0
    ) {

        throw new Error(
            '❌ No hay direcciones disponibles en ids.csv'
        );
    }


    // ======================================
    // TOKEN
    // ======================================

    console.log(
        '🔑 Obteniendo token de Cognito...'
    );


    const token =
    getTokenWithRetry(
        MAX_TOKEN_RETRIES
    );


    if (!token) {

        throw new Error(
            '❌ No se pudo obtener el token de Cognito.'
        );
    }


    console.log(
        '✅ Token obtenido correctamente'
    );


    // ======================================
    // DATA PARA LOS VUs
    // ======================================

    return {

        token: token,

        startTime:
        Date.now()
    };
}


// ==========================================
// TEST PRINCIPAL
// ==========================================

export default function (data) {


    // ======================================
    // TOKEN
    // ======================================

    const token =
    data?.token;


    if (!token) {

        throw new Error(
            '❌ Token no disponible'
        );
    }


    // ======================================
    // ADDRESS
    // ======================================

    const addressId =
    getNextAddress(
        addressCounter
    );


    addressCounter++;


    // ======================================
    // TIMESTAMP
    // ======================================

    const timestamp =
    getTimestamp();


    // ======================================
    // CHANNEL
    // ======================================

    const channelId =
    '1371';


    // ======================================
    // EVENT ID
    // ======================================

    const eventId =
    `E.${channelId}.${timestamp}.wintst`;


    // ======================================
    // MESSAGE ID
    // ======================================

    const messageId =
    `M.${channelId}.${timestamp}.wintst`;


    // ======================================
    // LOG
    // ======================================

    console.log(
        `📝 EVENT ID: ${eventId}`
    );

    console.log(
        `📝 MESSAGE ID: ${messageId}`
    );

    console.log(
        `📍 VU ${__VU} - ITER ${__ITER} - addressId: ${addressId}`
    );


    // ======================================
    // LLAMAR TMF679
    // ======================================

    const result =
    createQualification(

        token,

        addressId,

        eventId,

        messageId
    );


    // ======================================
    // CHECK
    // ======================================

    const checkResult =
    check(
        result,

        {

            'TMF679 - Status 200/201':
            response =>
            response.status === 200 ||
            response.status === 201

        }
    );


    // ======================================
    // LOG ERROR
    // ======================================

    if (
    !checkResult
    ) {

        console.error(
            `❌ TMF679 falló - Status: ${result.status}`
        );


        if (
        result.response
        ) {

            console.error(
                `❌ Response: ${result.response.body}`
            );
        }
    }


    // ======================================
    // PAUSA ENTRE REQUESTS
    // ======================================

    sleep(0.3);
}