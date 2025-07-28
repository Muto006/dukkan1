// Firebase Konfigürasyonu - Modern SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase konfigürasyonu
const firebaseConfig = {
    apiKey: "AIzaSyAn0x-1PksVKuAYDNYZ2NgCjpbX9W2t_HI",
    authDomain: "dukkan-ff6f8.firebaseapp.com",
    projectId: "dukkan-ff6f8",
    storageBucket: "dukkan-ff6f8.firebasestorage.app",
    messagingSenderId: "306437745783",
    appId: "1:306437745783:web:93122eafbb1397e0b5ea72",
    measurementId: "G-TMSN6Q0RX3"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Analytics'i başlat
const analytics = getAnalytics(app);

// Firestore veritabanını al
const db = getFirestore(app);

// Authentication servisini al
const auth = getAuth(app);

// Google provider'ı ayarla
const googleProvider = new GoogleAuthProvider();

// Firebase servislerini global olarak export et
window.firebaseServices = {
    db,
    auth,
    googleProvider,
    analytics
};

// Firebase'i global olarak export et (eski kodlar için)
window.firebase = {
    firestore: {
        FieldValue: {
            serverTimestamp: () => new Date()
        }
    }
}; 