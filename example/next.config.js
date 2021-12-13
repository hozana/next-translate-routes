const withTranslateRoutes = require("next-translate-routes/plugin")

const nextConfig = withTranslateRoutes({
  i18n: {
    locales: ['en', 'fr'],
    defaultLocale: 'en',
  },

  rewrites: async () => {
    return [
      {
        source: '/france/blog/documentation',
        destination: '/docs'
      },
    ]
  },
})

const logRR = async () => {
  console.log('From next.config.', { rewrites: await nextConfig.rewrites?.(), redirects: await nextConfig.redirects?.() })
}

logRR()

module.exports = nextConfig
