# Crustella Admin for Android

This folder contains the Android APK project scaffold for the Crustella Cloud Kitchen admin app.

## Planned capabilities
- Admin order dashboard linked to the Crustella website.
- Firebase Cloud Messaging (FCM) push notifications for new orders.
- WhatsApp order handoff from the website.

## Firebase setup required before push notifications can work
1. Open https://console.firebase.google.com/ and create a Firebase project.
2. Add an Android app with package name `tn.crustella.admin`.
3. Download `google-services.json` and place it in `android-app/app/google-services.json` (do not commit private service-account credentials).
4. Enable Cloud Messaging.
5. Configure a trusted server-side sender to deliver FCM notifications when a new order is inserted. Never put an FCM service-account key in the public website or APK.

## Build
Open `android-app` in Android Studio, wait for Gradle sync, then Build > Build APK(s). The APK output is under `app/build/outputs/apk/debug/`.

## Important
The website currently hands the order to WhatsApp. For true push notifications, orders must first be saved in a backend database and the backend must send the FCM message. The WhatsApp handoff alone cannot trigger a reliable push notification to the admin app.
