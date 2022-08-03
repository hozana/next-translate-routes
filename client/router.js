'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.withRouter = exports.useRouter = void 0
var router_1 = require('next/router')
/**
 * Get router with route translation capabilities
 *
 * @deprecated since version 1.2.0
 * Use withTranslateRoutes in _app instead, then use Next useRouter (`next/router`)
 */
exports.useRouter = router_1.useRouter
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Inject router prop with route translation capabilities
 *
 * @deprecated since version 1.2.0
 * Use withTranslateRoutes in _app instead, then use Next withRouter (`next/router`)
 */
exports.withRouter = router_1.withRouter
//# sourceMappingURL=router.js.map
