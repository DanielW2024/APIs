import http from 'k6/http';
import { config } from './config.js';

function buildQualificationBody(addressId, eventId, messageId, productId = 'PROD-004') {
    return {
        '@type': 'CheckProductOfferingQualification',
        'channel': {
            'id': config.qualification.channelId,
            'name': config.qualification.channelName,
            '@type': 'ChannelRef'
        },
        'checkProductOfferingQualificationItem': [{
            'id': '1',
            '@type': 'CheckProductOfferingQualificationItem',
            'product': {
                '@type': 'Product',
                'place': [{
                    'role': 'installationAddress',
                    '@type': 'RelatedPlaceRefOrValue',
                    'place': {
                        'id': addressId,
                        'country': config.qualification.country,
                        '@type': 'GeographicAddress'
                    }
                }],
                'id': productId
            }
        }],
        'characteristic': [{
            '@type': 'ObjectCharacteristic',
            'name': 'checkProductOfferingQualification.event',
            'value': {
                'eventId': eventId,
                'messageId': messageId
            }
        }]
    };
}

export function createQualification(token, addressId, eventId, messageId, productId = 'PROD-004') {
    const url = `${config.qualificationUrl}/tmf679/checkProductOfferingQualification`;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'ctrycode': config.qualification.ctrycode,
        'sacode': config.qualification.sacode,
        'x-api-key': config.qualification.xApiKey,
        'eventid': eventId,
        'messageid': messageId,
        'sarequestts': '2026-06-30T17:25:00.000Z',
        'Content-Type': 'application/json'
    };
    const body = buildQualificationBody(addressId, eventId, messageId, productId);

    try {
        const response = http.post(url, JSON.stringify(body), {
            headers: headers,
            timeout: config.timeouts.qualificationTimeout
        });

        return {
            success: response.status === 200 || response.status === 201,
            status: response.status,
            response: response
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}