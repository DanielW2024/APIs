// apis/tmf679.js

import http from 'k6/http';

import { config } from '../config/config.js';


// ==========================================
// CONSTRUIR BODY TMF679
// ==========================================

function buildQualificationBody(
addressId,
eventId,
messageId,
productId = config.tmf679.productId
) {

    return {

        '@type':
        'CheckProductOfferingQualification',


        // ==================================
        // CHANNEL
        // ==================================

        'channel': {

            'id':
            config.tmf679.channelId,

            'name':
            config.tmf679.channelName,

            '@type':
            'ChannelRef'
        },


        // ==================================
        // QUALIFICATION ITEM
        // ==================================

        'checkProductOfferingQualificationItem': [

            {

                'id':
                '1',

                '@type':
                'CheckProductOfferingQualificationItem',


                // ==========================
                // PRODUCT
                // ==========================

                'product': {

                    '@type':
                    'Product',


                    // ======================
                    // ADDRESS
                    // ======================

                    'place': [

                        {

                            'role':
                            'installationAddress',

                            '@type':
                            'RelatedPlaceRefOrValue',


                            'place': {

                                'id':
                                addressId,

                                'country':
                                config.tmf679.country,

                                '@type':
                                'GeographicAddress'
                            }
                        }
                    ],


                    // ======================
                    // PRODUCT ID
                    // ======================

                    'id':
                    productId
                }
            }
        ],


        // ==================================
        // EVENT CHARACTERISTIC
        // ==================================

        'characteristic': [

            {

                '@type':
                'ObjectCharacteristic',

                'name':
                'checkProductOfferingQualification.event',


                'value': {

                    'eventId':
                    eventId,

                    'messageId':
                    messageId
                }
            }
        ]
    };
}


// ==========================================
// CREATE QUALIFICATION
// ==========================================

export function createQualification(
token,
addressId,
eventId,
messageId,
productId = config.tmf679.productId
) {


    // ======================================
    // URL
    // ======================================

    const url =
    `${config.tmf679Url}/tmf679/checkProductOfferingQualification`;


    // ======================================
    // HEADERS
    // ======================================

    const headers = {

        'Authorization':
        `Bearer ${token}`,

        'ctrycode':
        config.tmf679.ctrycode,

        'sacode':
        config.tmf679.sacode,

        'x-api-key':
        config.tmf679.xApiKey,

        'eventid':
        eventId,

        'messageid':
        messageId,

        'sarequestts':
        new Date().toISOString(),

        'Content-Type':
        'application/json'
    };


    // ======================================
    // BODY
    // ======================================

    const body =
    buildQualificationBody(
        addressId,
        eventId,
        messageId,
        productId
    );


    // ======================================
    // REQUEST
    // ======================================

    try {

        const response =
        http.post(

            url,

            JSON.stringify(body),

            {
                headers: headers,

                timeout:
                config.timeouts.tmf679Timeout,

                tags: {
                    api: 'TMF679',
                    operation:
                    'checkProductOfferingQualification'
                }
            }
        );


        // ==================================
        // RESULTADO
        // ==================================

        return {

            success:
            response.status === 200 ||
            response.status === 201,

            status:
            response.status,

            response:
            response
        };


    } catch (error) {


        // ==================================
        // ERROR
        // ==================================

        console.error(
            `❌ TMF679 Exception: ${error.message}`
        );


        return {

            success:
            false,

            status:
            0,

            error:
            error.message
        };
    }
}