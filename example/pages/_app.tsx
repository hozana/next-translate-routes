import NextApp from 'next/app'
// import withTranslateRoutes from 'next-translate-routes' // Regular import
import withTranslateRoutes from '../../index' // Live test import

if (typeof window !== 'undefined') {
  console.log('From Layout, routesTree:', JSON.parse(process.env.NEXT_PUBLIC_ROUTES))
}

export default withTranslateRoutes(NextApp)
