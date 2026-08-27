// config/config.js

export const config = {

    // ==========================================
    // URLs
    // ==========================================

    cognitoUrl:
    __ENV.COGNITO_URL ||
    '',

    tmf679Url:
    __ENV.TMF679_URL ||
    '',


    // ==========================================
    // COGNITO
    // ==========================================

    cognito: {

        clientId:
        __ENV.COGNITO_CLIENT_ID ||
        '',

        clientSecret:
        __ENV.COGNITO_CLIENT_SECRET ||
        '',

        scope:
        __ENV.COGNITO_SCOPE ||
        'tmf/tmf679.write',

        grantType:
        __ENV.COGNITO_GRANT_TYPE ||
        'client_credentials'
    },


    // ==========================================
    // TMF679
    // ==========================================

    tmf679: {

        ctrycode:
        __ENV.CTRYCODE ||
        'PER',

        sacode:
        __ENV.SACODE ||
        '1634',

        xApiKey:
        __ENV.TMF679_X_API_KEY ||
        '',

        channelId:
        __ENV.CHANNEL_ID ||
        '1371',

        channelName:
        __ENV.CHANNEL_NAME ||
        'FCT-UNI',

        country:
        __ENV.COUNTRY ||
        'Peru',

        productId:
        __ENV.PRODUCT_ID ||
        'PROD-004'
    },


    // ==========================================
    // TIMEOUTS
    // ==========================================

    timeouts: {

        tokenTimeout:
        Number(__ENV.TOKEN_TIMEOUT || 10000),

        tmf679Timeout:
        Number(__ENV.TMF679_TIMEOUT || 15000)
    }
};