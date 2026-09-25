// tests/bulk-services-speed-changes/speed_changes_smoke.js
import { check, sleep } from 'k6';
import { getTokenWithRetry } from '../../auth/tokenkong.js';
import { postBulkSpeedChange } from '../../apis/bulk_services_speed_changes.js';
import { config } from '../../config/config1.js';

export const options = config.winet.bulkTest;

export function setup() {
    const token = getTokenWithRetry(3);
    if (!token) throw new Error('❌ No se pudo obtener token, abortando test');
    return { token };
}

export default function (data) {
    const res = postBulkSpeedChange(data.token);

    // ============================================
    // LOG CUANDO EL STATUS ES 200
    // ============================================
    if (res && res.status === 200) {
        console.log('✅ ============================================');
        console.log('✅ RESPUESTA 200 RECIBIDA');
        console.log('✅ ============================================');
        console.log(`📊 Status Code : ${res.status}`);
        console.log(`⏱️  Duration   : ${res.timings.duration} ms`);
        console.log('📋 Response Headers:');
        console.log(JSON.stringify(res.headers, null, 2));
        console.log('📦 Response Body:');
        try {
            const parsed = JSON.parse(res.body);
            console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.log(res.body);
        }
        console.log('✅ ============================================');
    }

    // ============================================
    // CHECKS
    // ============================================
    check(res, {
        'status es 200': (r) => r && r.status === 200,
        'respuesta tiene idpeticion': (r) => {
            if (!r || !r.body) return false;
            try {
                return JSON.parse(r.body).idpeticion !== undefined;
            } catch (e) {
                return false;
            }
        },
        'status no es 429': (r) => r && r.status !== 429,
    });

    sleep(1);
}