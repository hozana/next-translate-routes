const path = require('path')
const withTranslateRoutes = require('next-translate-routes/plugin')

const nextConfig = withTranslateRoutes({
  i18n: {
    locales: ['en', 'fr'],
    defaultLocale: 'en',
  },

  translateRoutes: {
    debug: true,
  },

  webpack(config) {
    // Needed to avoid conflicts between example's react and next-translate-routes react
    config.resolve.alias.react = path.resolve('../node_modules/react')
    config.infrastructureLogging = { level: 'error' }
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
