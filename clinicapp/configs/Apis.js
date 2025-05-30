import axios from "axios";

const BASE_URL = "http://192.168.1.102:8000/";

export const endpoints = {
    'hospitals': '/hospitals/',
    'hospital-details': (hospitalId) => `/hospitals/${hospitalId}/`,
    'specializations': '/specializations/',
    'patients': '/patients/',
    'doctors': '/doctors/',
    // 'doctorinfos': '/doctorinfos/',
    'login': '/o/token/',
    'register': '/users/',
    'reset-password-otp': "/api/password-reset/otp/",
    'reset-password-confirm': "/api/password-reset/otp/confirm/",
    'current-user': '/users/current-user/',
    'appointments': "/appointments/",
    'healthrecords':'/healthrecords/me/',
    'schedules': '/schedules/',
    'notifications': '/notifications/',
}

export const authApis = (token) => {
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
}

export default axios.create({
    baseURL: BASE_URL
});