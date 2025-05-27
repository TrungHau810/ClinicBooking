import axios from "axios";

<<<<<<< HEAD
const BASE_URL = "http://192.168.1.8:8000/";
=======
const BASE_URL = "http://192.168.1.6:8000/";
>>>>>>> 81adef28e3bb0e197ec41fc79dfa58733d534cfb

export const endpoints = {
    'hospitals': '/hospitals/',
    'hospital-details': (hospitalId) => `/hospitals/${hospitalId}/`,
    'specializations': '/specializations/',
    'patients': '/patients/',
<<<<<<< HEAD
    'doctors': '/doctors/',
=======
>>>>>>> 81adef28e3bb0e197ec41fc79dfa58733d534cfb
    'doctorinfos': '/doctorinfos/',
    'login': '/o/token/',
    'register': '/users/',
    'current-user': '/users/current-user/',
    'appointments': "/appointments/",
<<<<<<< HEAD
    'healthrecords':'/healthrecords/me/',
    'schedules': '/schedules/',
=======
    'healthrecords': '/healthrecords/me/'
>>>>>>> 81adef28e3bb0e197ec41fc79dfa58733d534cfb
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