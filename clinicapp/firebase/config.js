// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyAx7ARUIShKvkcLVD5GSlD12Eu8HA0ZZDo",
    authDomain: "clinicbookingapp-5dc96.firebaseapp.com",
    projectId: "clinicbookingapp-5dc96",
    storageBucket: "clinicbookingapp-5dc96.firebasestorage.app",
    messagingSenderId: "651158333634",
    appId: "1:651158333634:web:68731bda352a870a18b35b",
    measurementId: "G-EYBJNG0GBB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
