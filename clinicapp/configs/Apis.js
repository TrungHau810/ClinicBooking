import axios from "axios";

<<<<<<< HEAD
const BASE_URL = "http://192.168.1.24:8000/";
=======
const BASE_URL = "http://192.168.1.37:8000/";
>>>>>>> c6ff26f8aaa48820ac483b3a7b503f83a7f7c8b7

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