// src/environments/environment.ts
export const environment = {
    production: false,
    firebase: {
        apiKey: process.env['FIREBASE_API_KEY'] || 'YOUR_API_KEY',
        authDomain: process.env['FIREBASE_AUTH_DOMAIN'] || 'YOUR_AUTH_DOMAIN',
        projectId: process.env['FIREBASE_PROJECT_ID'] || 'YOUR_PROJECT_ID',
        storageBucket: process.env['FIREBASE_STORAGE_BUCKET'] || 'YOUR_STORAGE_BUCKET',
        messagingSenderId: process.env['FIREBASE_MESSAGING_SENDER_ID'] || 'YOUR_SENDER_ID',
        appId: process.env['FIREBASE_APP_ID'] || 'YOUR_APP_ID',
        measurementId: process.env['FIREBASE_MEASUREMENT_ID'] || 'YOUR_MEASUREMENT_ID',
    },    
    google: {
        clientId: process.env['GOOGLE_CLIENT_ID'] || 'REPLACE_ME',
    },
    apiServerUrl: process.env['BLOG_API'] || 'http://localhost:3000'
};

