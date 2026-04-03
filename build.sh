#!/bin/bash

if [ -n "$VITE_FIREBASE_API_KEY" ]; then
  echo "Generando firebase-applet-config.json desde variables de entorno..."
  cat <<EOF > firebase-applet-config.json
{
  "projectId": "$VITE_FIREBASE_PROJECT_ID",
  "appId": "$VITE_FIREBASE_APP_ID",
  "apiKey": "$VITE_FIREBASE_API_KEY",
  "authDomain": "$VITE_FIREBASE_AUTH_DOMAIN",
  "firestoreDatabaseId": "$VITE_FIREBASE_DATABASE_ID",
  "storageBucket": "$VITE_FIREBASE_STORAGE_BUCKET",
  "messagingSenderId": "$VITE_FIREBASE_MESSAGING_SENDER_ID",
  "measurementId": ""
}
EOF
else
  echo "Usando firebase-applet-config.json existente..."
fi

echo "Iniciando build de Vite..."
npx vite build
