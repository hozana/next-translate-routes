export default {
  redirects: [
    {
      source: '/en/(about|a-propos|acerca-de-nosotros)',
      destination: '/root/about',
    },
    {
      source: '/fr/(about|acerca-de-nosotros)',
      destination: '/fr/a-propos',
    },
    {
      source: '/fr/root/about',
      destination: '/fr/a-propos',
    },
    {
      source: '/es/(about|a-propos)',
      destination: '/es/acerca-de-nosotros',
    },
    {
      source: '/es/root/about',
      destination: '/es/acerca-de-nosotros',
    },
    {
      source: '/en/contact',
      destination: '/root/contact',
    },
    {
      source: '/fr/root/contact',
      destination: '/fr/contact',
    },
    {
      source: '/es/root/contact',
      destination: '/es/contact',
    },
    {
      source: '/en/(faq|FAQ)',
      destination: '/root/FAQ',
    },
    {
      source: '/fr/faq',
      destination: '/fr/FAQ',
    },
    {
      source: '/fr/root/FAQ',
      destination: '/fr/FAQ',
    },
    {
      source: '/es/root/FAQ',
      destination: '/es/faq',
    },
    {
      source: '/es/FAQ',
      destination: '/es/faq',
    },
    {
      source: '/en/',
      destination: '/root',
    },
    {
      source: '/fr/root',
      destination: '/fr/',
    },
    {
      source: '/es/root',
      destination: '/es/',
    },
    {
      source: '/en/auth/social',
      destination: '/root/auth/social',
    },
    {
      source: '/fr/root/auth/social',
      destination: '/fr/auth/social',
    },
    {
      source: '/es/root/auth/social',
      destination: '/es/auth/social',
    },
    {
      source: '/en/(catch-all|tout|todo)/:path+',
      destination: '/root/catch-all/:path+',
    },
    {
      source: '/fr/(catch-all|todo)/:path+',
      destination: '/fr/tout/:path+',
    },
    {
      source: '/fr/root/catch-all/:path+',
      destination: '/fr/tout/:path+',
    },
    {
      source: '/es/(catch-all|tout)/:path+',
      destination: '/es/todo/:path+',
    },
    {
      source: '/es/root/catch-all/:path+',
      destination: '/es/todo/:path+',
    },
    {
      source: '/en/(catch-all-or-none|tout-ou-rien|todo-o-nada)/:path*',
      destination: '/root/catch-all-or-none/:path*',
    },
    {
      source: '/fr/(catch-all-or-none|todo-o-nada)/:path*',
      destination: '/fr/tout-ou-rien/:path*',
    },
    {
      source: '/fr/root/catch-all-or-none/:path*',
      destination: '/fr/tout-ou-rien/:path*',
    },
    {
      source: '/es/(catch-all-or-none|tout-ou-rien)/:path*',
      destination: '/es/todo-o-nada/:path*',
    },
    {
      source: '/es/root/catch-all-or-none/:path*',
      destination: '/es/todo-o-nada/:path*',
    },
    {
      source: '/en/(communities|communautes|comunidades)/:tagSlug*',
      destination: '/root/communities/:tagSlug*',
    },
    {
      source: '/fr/(communities|comunidades)/:tagSlug*',
      destination: '/fr/communautes/:tagSlug*',
    },
    {
      source: '/fr/root/communities/:tagSlug*',
      destination: '/fr/communautes/:tagSlug*',
    },
    {
      source: '/es/(communities|communautes)/:tagSlug*',
      destination: '/es/comunidades/:tagSlug*',
    },
    {
      source: '/es/root/communities/:tagSlug*',
      destination: '/es/comunidades/:tagSlug*',
    },
    {
      source: '/en/(community|communaute|comunidad)/:communityId(\\d+){-:communitySlug}',
      destination: '/root/community/:communityId-:communitySlug',
    },
    {
      source: '/fr/(community|comunidad)/:communityId(\\d+){-:communitySlug}',
      destination: '/fr/communaute/:communityId-:communitySlug',
    },
    {
      source: '/fr/root/community/:communityId(\\d+){-:communitySlug}',
      destination: '/fr/communaute/:communityId-:communitySlug',
    },
    {
      source: '/es/(community|communaute)/:communityId(\\d+){-:communitySlug}',
      destination: '/es/comunidad/:communityId-:communitySlug',
    },
    {
      source: '/es/root/community/:communityId(\\d+){-:communitySlug}',
      destination: '/es/comunidad/:communityId-:communitySlug',
    },
    {
      source:
        '/en/(community|communaute|comunidad)/:communityId(\\d+){-:communitySlug}/(statistics|statistiques|estadisticas)',
      destination: '/root/community/:communityId-:communitySlug/statistics',
    },
    {
      source: '/fr/(community|comunidad)/:communityId(\\d+){-:communitySlug}/(statistics|estadisticas)',
      destination: '/fr/communaute/:communityId-:communitySlug/statistiques',
    },
    {
      source: '/fr/root/community/:communityId(\\d+){-:communitySlug}/statistics',
      destination: '/fr/communaute/:communityId-:communitySlug/statistiques',
    },
    {
      source: '/es/(community|communaute)/:communityId(\\d+){-:communitySlug}/(statistics|statistiques)',
      destination: '/es/comunidad/:communityId-:communitySlug/estadisticas',
    },
    {
      source: '/es/root/community/:communityId(\\d+){-:communitySlug}/statistics',
      destination: '/es/comunidad/:communityId-:communitySlug/estadisticas',
    },
    {
      source: '/en/(my-account|mon-compte|mi-cuenta)/(favorites|favoris|favorito)',
      destination: '/root/my-account/favoris',
    },
    {
      source: '/fr/(my-account|mi-cuenta)/(favorites|favorito)',
      destination: '/fr/mon-compte/favoris',
    },
    {
      source: '/fr/root/my-account/favoris',
      destination: '/fr/mon-compte/favoris',
    },
    {
      source: '/es/(my-account|mon-compte)/(favorites|favoris)',
      destination: '/es/mi-cuenta/favorito',
    },
    {
      source: '/es/root/my-account/favoris',
      destination: '/es/mi-cuenta/favorito',
    },
    {
      source: '/en/(news|actualites)/:newsPathPart+',
      destination: '/root/news/:newsPathPart+',
    },
    {
      source: '/fr/news/:newsPathPart+',
      destination: '/fr/actualites/:newsPathPart+',
    },
    {
      source: '/fr/root/news/:newsPathPart+',
      destination: '/fr/actualites/:newsPathPart+',
    },
    {
      source: '/es/root/news/:newsPathPart+',
      destination: '/es/news/:newsPathPart+',
    },
    {
      source: '/es/actualites/:newsPathPart+',
      destination: '/es/news/:newsPathPart+',
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
  ],
}
