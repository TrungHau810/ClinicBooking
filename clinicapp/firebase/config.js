// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCPSOM22-EctirxNSBmd01fYB9dmGcrR9I",
    authDomain: "clinicbookingapp-59336.firebaseapp.com",
    projectId: "clinicbookingapp-59336",
    storageBucket: "clinicbookingapp-59336.firebasestorage.app",
    messagingSenderId: "789754143152",
    appId: "1:789754143152:web:3cf89260010fdc8985f675",
    measurementId: "G-JH2ET8JFSN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize database
const database = getDatabase(app);

// Export database
export { database };