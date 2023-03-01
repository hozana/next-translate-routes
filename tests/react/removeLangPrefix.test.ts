/**
 * @jest-environment jsdom
 */
import { removeLangPrefix } from '../../src/react/removeLangPrefix'
import { setEnvData } from './setEnvData'

describe('removeLangPrefix', () => {
  beforeEach(() => {
    setEnvData()
  })

  test('with root prefix only on default locale', () => {
    setEnvData({ i18n: { defaultLocale: 'en' } })
    expect(removeLangPrefix('/root/any/path')).toEqual('/any/path')
  })
  test('with default locale prefix and root prefix', () => {
    setEnvData({ i18n: { defaultLocale: 'en' } })
    expect(removeLangPrefix('/en/root/any/path')).toEqual('/any/path')
  })
  test('with default locale prefix and omitted root prefix', () => {
    setEnvData({ i18n: { defaultLocale: 'en' } })
    expect(removeLangPrefix('/en/any/path')).toEqual('/any/path')
  })
  test('with explicit default locale prefix and omitted root prefix', () => {
    setEnvData({ i18n: { defaultLocale: 'en' } })
    expect(removeLangPrefix('/en/any/path', 'en')).toEqual('/any/path')
  })
  test('with explicit non default locale prefix and root prefix', () => {
    expect(removeLangPrefix('/en/root/any/path', 'en')).toEqual('/any/path')
  })
  test('with explicit non default omitted prefix and root prefix', () => {
    expect(removeLangPrefix('/root/any/path', 'en')).toEqual('/any/path')
  })
  test('with explicit default locale prefix', () => {
    expect(removeLangPrefix('/fr/any/path', 'fr')).toEqual('/any/path')
  })
  test('with non default locale prefix that should have a root prefix but that is not here', () => {
    expect(removeLangPrefix('/en/any/path')).toEqual('/any/path')
  })
  test('with non default locale prefix that has no root prefix', () => {
    setEnvData({ i18n: { defaultLocale: 'en' } })
    expect(removeLangPrefix('/fr/any/path')).toEqual('/any/path')
  })
  test('with default locale prefix that has no root prefix', () => {
    expect(removeLangPrefix('/fr/any/path')).toEqual('/any/path')
  })
  test('without locale prefix', () => {
    expect(removeLangPrefix('/any/path')).toEqual('/any/path')
  })
  test('without locale prefix when default locale has a root prefix', () => {
    setEnvData({ i18n: { defaultLocale: 'en' } })
    expect(removeLangPrefix('/any/path')).toEqual('/any/path')
  })
})
