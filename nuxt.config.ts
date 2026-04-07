// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from '@primevue/themes/aura';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8'));
const resolvedAppVersion = process.env.APP_VERSION || packageJson.version || 'dev';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false, // <-- IMPORTANTE: Modo SPA para Offline-First
  runtimeConfig: {
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    public: {
      appVersion: resolvedAppVersion
    }
  },
  future: {
    compatibilityVersion: 4
  },
  vite: {
    plugins: [
      tailwindcss()
    ]
  },
  modules: [
    '@pinia/nuxt',
    '@primevue/nuxt-module',
    '@nuxtjs/supabase',
    '@vite-pwa/nuxt'
  ],
  primevue: {
    options: {
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.dark',
        }
      }
    }
  },
  supabase: {
    redirect: false, // Turn off automatic redirect for offline first logic handling
    types: '~/types/database.types.ts'
  },
  pwa: {
    manifest: {
      name: 'GestorPOS',
      short_name: 'POS',
      theme_color: '#ffffff',
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,ico}'], // Evitamos woff,woff2 o svg si no existen para evitar error en build de vite-pwa
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600,
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  },
  css: ['primeicons/primeicons.css', '~/assets/css/tailwind.css'],
  devtools: { enabled: true }
})
