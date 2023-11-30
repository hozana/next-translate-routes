/**
 * @jest-environment node
 */
import type { NEXT_DATA } from 'next/dist/shared/lib/utils'
import path from 'path'

import { createNtrData } from '../../src/plugin/createNtrData'
import { fileNameToPath } from '../../src/plugin/fileNameToPaths'
import { TRouteBranch } from '../../src/types'
import routesTree from '../fixtures/routesTree.json'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      __NEXT_DATA__: Partial<NEXT_DATA>
    }
  }
}

const pagesPath = path.resolve(process.cwd(), './tests/fixtures/pages')

describe('createNtrData.', () => {
  test('with fallbackLng.', () => {
    const i18n = { locales: ['en', 'fr', 'fr-FR'], defaultLocale: 'en', fallbackLng: { 'fr-FR': ['fr'] } }
    const ntrData = createNtrData({ i18n }, pagesPath)
    expect(ntrData.routesTree).toEqual(routesTree)
    expect(ntrData.locales).toEqual(i18n.locales)
    expect(ntrData.defaultLocale).toEqual(i18n.defaultLocale)
    expect(ntrData.fallbackLng).toEqual(i18n.fallbackLng)
    expect(ntrData.debug).toBeUndefined()
  })

  test('with debug and custom routesTree.', () => {
    const customRoutesTree = {}
    const i18n = { locales: ['en', 'fr'], defaultLocale: 'fr' }
    const ntrData = createNtrData({ i18n, translateRoutes: { routesTree: customRoutesTree, debug: true } }, pagesPath)
    expect(ntrData.routesTree).toEqual(customRoutesTree)
    expect(ntrData.locales).toEqual(i18n.locales)
    expect(ntrData.defaultLocale).toEqual(i18n.defaultLocale)
    expect(ntrData.fallbackLng).toEqual({})
    expect(ntrData.debug).toBe(true)
  })

  const removeTranslations = (routeBranch: TRouteBranch): TRouteBranch => ({
    ...routeBranch,
    paths: { default: fileNameToPath(routeBranch.name) },
    ...(routeBranch.children && {
      children: routeBranch.children?.map((child) => removeTranslations(child)),
    }),
  })
  const untranslatedRoutesTree = removeTranslations(routesTree)
  const routesTreeWithCustomNamedRoutes = {
    ...untranslatedRoutesTree,
    children: untranslatedRoutesTree.children?.map((child) => {
      if (child.name === 'contact') {
        return {
          ...child,
          paths: {
            ...child.paths,
            fr: 'nous-contacter',
          },
        }
      }
      if (child.name === 'faq') {
        return {
          ...child,
          paths: {
            ...child.paths,
            en: 'q&a',
            fr: 'questions-reponses',
          },
        }
      }
      return child
    }),
  }

  test('with custom routes data file name.', () => {
    const i18n = { locales: ['en', 'fr', 'es'], defaultLocale: 'es' }
    const ntrData = createNtrData({ i18n, translateRoutes: { routesDataFileName: 'customNamedRoutes' } }, pagesPath)
    expect(ntrData.routesTree).toEqual(routesTreeWithCustomNamedRoutes)
    expect(ntrData.locales).toEqual(i18n.locales)
    expect(ntrData.defaultLocale).toEqual(i18n.defaultLocale)
  })
})
