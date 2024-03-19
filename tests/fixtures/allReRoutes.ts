export default {
  redirects: [
    {
      source: '/(about|a-propos|acerca-de-nosotros)',
      destination: '/root/about',
    },
    {
      source: '/(about|acerca-de-nosotros)',
      destination: '/a-propos',
    },
    {
      source: '/root/about',
      destination: '/a-propos',
    },
    {
      source: '/(about|a-propos)',
      destination: '/acerca-de-nosotros',
    },
    {
      source: '/root/about',
      destination: '/acerca-de-nosotros',
    },
    {
      source: '/contact',
      destination: '/root/contact',
    },
    {
      source: '/root/contact',
      destination: '/contact',
    },
    {
      source: '/root/contact',
      destination: '/contact',
    },
    {
      source: '/(faq|FAQ)',
      destination: '/root/FAQ',
    },
    {
      source: '/faq',
      destination: '/FAQ',
    },
    {
      source: '/root/FAQ',
      destination: '/FAQ',
    },
    {
      source: '/root/FAQ',
      destination: '/faq',
    },
    {
      source: '/FAQ',
      destination: '/faq',
    },
    {
      source: '/',
      destination: '/root',
    },
    {
      source: '/root',
      destination: '/',
    },
    {
      source: '/root',
      destination: '/',
    },
    {
      source: '/auth/social',
      destination: '/root/auth/social',
    },
    {
      source: '/root/auth/social',
      destination: '/auth/social',
    },
    {
      source: '/root/auth/social',
      destination: '/auth/social',
    },
    {
      source: '/(catch-all|tout|todo)/:path+',
      destination: '/root/catch-all/:path+',
    },
    {
      source: '/(catch-all|todo)/:path+',
      destination: '/tout/:path+',
    },
    {
      source: '/root/catch-all/:path+',
      destination: '/tout/:path+',
    },
    {
      source: '/(catch-all|tout)/:path+',
      destination: '/todo/:path+',
    },
    {
      source: '/root/catch-all/:path+',
      destination: '/todo/:path+',
    },
    {
      source: '/(catch-all-or-none|tout-ou-rien|todo-o-nada)/:path*',
      destination: '/root/catch-all-or-none/:path*',
    },
    {
      source: '/(catch-all-or-none|todo-o-nada)/:path*',
      destination: '/tout-ou-rien/:path*',
    },
    {
      source: '/root/catch-all-or-none/:path*',
      destination: '/tout-ou-rien/:path*',
    },
    {
      source: '/(catch-all-or-none|tout-ou-rien)/:path*',
      destination: '/todo-o-nada/:path*',
    },
    {
      source: '/root/catch-all-or-none/:path*',
      destination: '/todo-o-nada/:path*',
    },
    {
      source: '/(communities|communautes|comunidades)/:tagSlug*',
      destination: '/root/communities/:tagSlug*',
    },
    {
      source: '/(communities|comunidades)/:tagSlug*',
      destination: '/communautes/:tagSlug*',
    },
    {
      source: '/root/communities/:tagSlug*',
      destination: '/communautes/:tagSlug*',
    },
    {
      source: '/(communities|communautes)/:tagSlug*',
      destination: '/comunidades/:tagSlug*',
    },
    {
      source: '/root/communities/:tagSlug*',
      destination: '/comunidades/:tagSlug*',
    },
    {
      source: '/(community|communaute|comunidad)/:communityId(\\d+){-:communitySlug}',
      destination: '/root/community/:communityId-:communitySlug',
    },
    {
      source: '/(community|comunidad)/:communityId(\\d+){-:communitySlug}',
      destination: '/communaute/:communityId-:communitySlug',
    },
    {
      source: '/root/community/:communityId(\\d+){-:communitySlug}',
      destination: '/communaute/:communityId-:communitySlug',
    },
    {
      source: '/(community|communaute)/:communityId(\\d+){-:communitySlug}',
      destination: '/comunidad/:communityId-:communitySlug',
    },
    {
      source: '/root/community/:communityId(\\d+){-:communitySlug}',
      destination: '/comunidad/:communityId-:communitySlug',
    },
    {
      source:
        '/(community|communaute|comunidad)/:communityId(\\d+){-:communitySlug}/(statistics|statistiques|estadisticas)',
      destination: '/root/community/:communityId-:communitySlug/statistics',
    },
    {
      source: '/(community|comunidad)/:communityId(\\d+){-:communitySlug}/(statistics|estadisticas)',
      destination: '/communaute/:communityId-:communitySlug/statistiques',
    },
    {
      source: '/root/community/:communityId(\\d+){-:communitySlug}/statistics',
      destination: '/communaute/:communityId-:communitySlug/statistiques',
    },
    {
      source: '/(community|communaute)/:communityId(\\d+){-:communitySlug}/(statistics|statistiques)',
      destination: '/comunidad/:communityId-:communitySlug/estadisticas',
    },
    {
      source: '/root/community/:communityId(\\d+){-:communitySlug}/statistics',
      destination: '/comunidad/:communityId-:communitySlug/estadisticas',
    },
    {
      destination: '/root/:side',
      source: '/:side(heads|tails)',
    },
    {
      destination: '/root/:side',
      source: '/:side(pile|face)',
    },
    {
      destination: '/root/:side',
      source: '/:side(cara|cruz)',
    },
    {
      destination: '/:side',
      source: '/root/:side(heads|tails)',
    },
    {
      destination: '/:side',
      source: '/root/:side(heads|tails)',
    },
    {
      source: '/(my-account|mon-compte|mi-cuenta)/(favorites|favoris|favorito)',
      destination: '/root/my-account/favoris',
    },
    {
      source: '/(my-account|mi-cuenta)/(favorites|favorito)',
      destination: '/mon-compte/favoris',
    },
    {
      source: '/root/my-account/favoris',
      destination: '/mon-compte/favoris',
    },
    {
      source: '/(my-account|mon-compte)/(favorites|favoris)',
      destination: '/mi-cuenta/favorito',
    },
    {
      source: '/root/my-account/favoris',
      destination: '/mi-cuenta/favorito',
    },
    {
      source: '/(news|actualites)/:newsPathPart+',
      destination: '/root/news/:newsPathPart+',
    },
    {
      source: '/news/:newsPathPart+',
      destination: '/actualites/:newsPathPart+',
    },
    {
      source: '/root/news/:newsPathPart+',
      destination: '/actualites/:newsPathPart+',
    },
    {
      source: '/root/news/:newsPathPart+',
      destination: '/news/:newsPathPart+',
    },
    {
      source: '/actualites/:newsPathPart+',
      destination: '/news/:newsPathPart+',
    },
    {
      source: '/root/:anyPathPart+',
      destination: '/:anyPathPart+',
    },
    {
      source: '/root/:anyPathPart+',
      destination: '/:anyPathPart+',
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
      source: '/root/about',
      destination: '/about',
    },
    {
      source: '/(a-propos|acerca-de-nosotros)',
      destination: '/about',
    },
    {
      source: '/root/contact',
      destination: '/contact',
    },
    {
      source: '/root/FAQ',
      destination: '/faq',
    },
    {
      source: '/FAQ',
      destination: '/faq',
    },
    {
      source: '/root',
      destination: '/',
    },
    {
      source: '/root/auth/social',
      destination: '/auth/social',
    },
    {
      source: '/root/catch-all/:path+',
      destination: '/catch-all/:path+',
    },
    {
      source: '/(tout|todo)/:path+',
      destination: '/catch-all/:path+',
    },
    {
      source: '/root/catch-all-or-none/:path*',
      destination: '/catch-all-or-none/:path*',
    },
    {
      source: '/(tout-ou-rien|todo-o-nada)/:path*',
      destination: '/catch-all-or-none/:path*',
    },
    {
      source: '/root/communities/:tagSlug*',
      destination: '/communities/:tagSlug*',
    },
    {
      source: '/(communautes|comunidades)/:tagSlug*',
      destination: '/communities/:tagSlug*',
    },
    {
      source: '/(community|communaute|comunidad)/:communityId(\\d+){-:communitySlug}',
      destination: '/community/:communityId/:communitySlug',
    },
    {
      source: '/root/community/:communityId(\\d+){-:communitySlug}',
      destination: '/community/:communityId/:communitySlug',
    },
    {
      source:
        '/(community|communaute|comunidad)/:communityId(\\d+){-:communitySlug}/(statistics|statistiques|estadisticas)',
      destination: '/community/:communityId/:communitySlug/statistics',
    },
    {
      source: '/root/community/:communityId(\\d+){-:communitySlug}/statistics',
      destination: '/community/:communityId/:communitySlug/statistics',
    },
    {
      destination: '/ignored/:side',
      source: '/:side(heads|tails)',
    },
    {
      destination: '/ignored/:side',
      source: '/root/:side(heads|tails)',
    },
    {
      destination: '/ignored/:side',
      source: '/:side(pile|face)',
    },
    {
      destination: '/ignored/:side',
      source: '/:side(cara|cruz)',
    },
    {
      source: '/root/my-account/favoris',
      destination: '/my-account/favorites',
    },
    {
      source: '/(mon-compte|mi-cuenta)/(favoris|favorito)',
      destination: '/my-account/favorites',
    },
    {
      source: '/root/news/:newsPathPart+',
      destination: '/news/:newsPathPart+',
    },
    {
      source: '/actualites/:newsPathPart+',
      destination: '/news/:newsPathPart+',
    },
    {
      destination: '/:anyPathPart+',
      source: '/root/:anyPathPart+',
    },
  ].map((rewrite) => ({
    ...rewrite,
    missing: [
      {
        type: 'header',
        key: 'x-nextjs-data',
      },
    ],
  })),
}
