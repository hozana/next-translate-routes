const path = require('path')
const withTranslateRoutes = require('next-translate-routes/plugin')

const nextConfig = withTranslateRoutes({
  i18n: {
    locales: ['en', 'fr'],
    defaultLocale: 'en',
    localeDetection: false,
    domains: [
      {
        domain: 'localhost:3000',
        defaultLocale: 'fr',
        http: true,
      },
      {
        domain: 'localhost:3001',
        defaultLocale: 'en',
        http: true,
      },
    ],
  },

  translateRoutes: {
    debug: true,
  },

  webpack(config) {
    // Needed to avoid conflicts between example's react and next-translate-routes react
    config.resolve.alias.react = path.resolve('../node_modules/react')
    return config
  },

  rewrites: async () => {
    return [
      {
        source: '/france/blog/documentation',
        destination: '/docs',
      },
    ]
  },
})

module.exports = nextConfig
