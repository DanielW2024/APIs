// primer-test.js - Tu primera prueba en k6
import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    vus: 15,           // 10 usuarios virtuales
    duration: '40s',   // Durante 30 segundos
};

export default function () {
    http.get('https://httpbin.test.k6.io/');
    sleep(1);
}