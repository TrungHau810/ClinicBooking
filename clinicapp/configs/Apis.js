import axios from "axios";

const BASE_URL = "http://192.168.1.5:8000/";

export const endpoints = {
    'hospitals': '/hospitals/',
    'hospital-details': (hospitalId) => `/hospitals/${hospitalId}/`,
    'specializations': '/specializations/',
    'user-patients': '/users/patients/',
    'user-doctors': '/users/doctors/',
    'doctor-detail': "/doctors/by-user/",
    'doctors': '/doctors/',
    'login': '/o/token/',
    'register': '/users/',
    'reset-password-otp': "/api/password-reset/otp/",
    'reset-password-confirm': "/api/password-reset/otp/confirm/",
    'current-user': '/users/current-user/',
    'appointments': "/appointments/",
    'healthrecords': '/healthrecords/me/',
    'healthrecords-update': '/healthrecords/',
    'schedules': '/schedules/',
    'notifications': '/notifications/',
    'messages': '/messages/',
    'testresults': '/testresults/',
    'reviews': '/reviews/',
    // VNPay
    'create-vnpay-url': '/create-payment-url/',
    'vnpay-return': '/vnpay-return/',
    // Report
    'reportsdoctor': '/reportsdoctor/',
    'reportsadmin': '/reportsadmin/'
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