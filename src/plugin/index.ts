import { createNtrData } from './createNtrData'
import { withTranslateRoutes } from './withTranslateRoutes'

module.exports = Object.assign(withTranslateRoutes, { withTranslateRoutes, createNtrData })

export { withTranslateRoutes, createNtrData }

export default withTranslateRoutes
