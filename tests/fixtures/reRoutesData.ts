export default {
  i18n: {
    locales: ['en', 'fr'],
    defaultLocale: 'en',
  },

  routeSegments: [
    {
      name: 'first',
      paths: {
        default: 'firstPart',
        en: '1st',
        fr: 'premier',
      },
    },
    {
      name: '[secondPart]',
      paths: {
        default: ':secondPart(\\d+)',
      },
    },
    {
      name: 'thirdPart',
      paths: {
        default: 'thirdPart',
        fr: 'troisieme',
      },
    },
  ],
  reRoutes: {
    redirects: [
      {
        source: '/(firstPart|premier)/:secondPart(\\d+)/(thirdPart|troisieme)',
        destination: '/1st/:secondPart/thirdPart',
      },
      {
        source: '/(firstPart|1st)/:secondPart(\\d+)/thirdPart',
        destination: '/premier/:secondPart/troisieme',
      },
    ].map((redirect) => ({
      locale: false,
      missing: [
        {
          type: 'header',
          key: 'x-nextjs-data',
        },
      ],
      permanent: false,
      ...redirect,
    })),
    rewrites: [
      {
        source: '/(firstPart|1st|premier)/:secondPart(\\d+)/(thirdPart|troisieme)',
        destination: '/first/:secondPart/thirdPart',
        missing: [
          {
            type: 'header',
            key: 'x-nextjs-data',
          },
        ],
      },
    ],
  },
}
