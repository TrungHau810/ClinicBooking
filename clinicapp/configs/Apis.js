import axios from "axios";

const BASE_URL = "http://10.17.64.227:8000/";

export const endpoints = {
    'hospitals': '/hospitals/',
    'hospital-details': (hospitalId) => `/hospitals/${hospitalId}/`,
    'specializations': '/specializations/',
    'patients': '/patients/',
    'doctors': '/doctors/',
    'login': '/o/token/',
    'current-user': '/users/current-user/',
    'appointments': "/appointments/",
    'healthrecords':'/healthrecords/me/'
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