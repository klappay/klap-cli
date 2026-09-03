import { defineConfig } from 'vitepress'
import llmstxt from 'vitepress-plugin-llms'

export default defineConfig({
  title: '@klappay/cli',
  description:
    'Official CLI for the Klap Core API — create charges, simulate sandbox events, and forward webhooks to your local machine.',
  cleanUrls: true,
  lastUpdated: true,
  appearance: 'force-dark',
  head: [['link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }]],

  vite: {
    plugins: [llmstxt({ domain: 'https://cli.klappay.com' })],
  },

  themeConfig: {
    logo: '/logo.png',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting started', link: '/getting-started' },
      { text: 'npm', link: 'https://www.npmjs.com/package/@klappay/cli' },
    ],

    sidebar: [
      {
        text: 'Overview',
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Getting started', link: '/getting-started' },
          { text: 'Configuration', link: '/configuration' },
        ],
      },
      {
        text: 'Commands',
        items: [
          { text: 'login / logout', link: '/login' },
          { text: 'charges', link: '/charges' },
          { text: 'sandbox', link: '/sandbox' },
          { text: 'listen', link: '/listen' },
          { text: 'logs', link: '/logs' },
          { text: 'webhooks', link: '/webhooks' },
          { text: 'fixtures', link: '/fixtures' },
        ],
      },
    ],

    search: {
      provider: 'local',
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/klappay/klap-cli' }],

    footer: {
      message: 'Docs live in ./docs — the source of truth for both the package and this site.',
      copyright: 'MIT — Klappay',
    },
  },
})
