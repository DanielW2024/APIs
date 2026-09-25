import { check, sleep } from 'k6';
import { getTokenWithRetry } from '../../auth/tokenkong.js';
import { postOwnerChange } from '../../apis/services_owner_changes.js';
import { config } from '../../config/config1.js';

export const options = {
    stages: config.winet.test.stages,
    thresholds: config.winet.test.thresholds,
};

export function setup() {
    const token = getTokenWithRetry(3);
    if (!token) throw new Error('❌ No se pudo obtener token, abortando test');
    return { token };
}

export default function (data) {
    const res = postOwnerChange(data.token);

    check(res, {
        'status es 200': (r) => r && r.status === 200,
        'respuesta tiene status funcional': (r) => r && JSON.parse(r.body).status !== undefined,
    });

    sleep(1);
}