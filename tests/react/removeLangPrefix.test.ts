/**
 * @jest-environment jsdom
 */
import { removeLangPrefix } from '../../src/react/removeLangPrefix'
import { setEnvData, setEnvDataFallbackLng } from './setEnvData'

describe('removeLangPrefix', () => {
  beforeEach(() => {
    setEnvData()
  })

  test('with non default locale prefix and root prefix to array', () => {
    expect(removeLangPrefix('/en/root/any/path', true)).toEqual(['any', 'path'])
  })
  test('with root prefix only on default locale', () => {
    setEnvData({ defaultLocale: 'en' })
    expect(removeLangPrefix('/root/any/path')).toEqual('/any/path')
  })
  test('with default locale prefix and root prefix', () => {
    setEnvData({ defaultLocale: 'en' })
    expect(removeLangPrefix('/en/root/any/path')).toEqual('/any/path')
  })
  test('with non default locale prefix that should have a root prefix but that is not here', () => {
    expect(removeLangPrefix('/en/any/path')).toEqual('/any/path')
  })
  test('with non default locale prefix that has no root prefix', () => {
    expect(removeLangPrefix('/fr/any/path')).toEqual('/any/path')
  })
  test('with default locale prefix that has no root prefix', () => {
    expect(removeLangPrefix('/fr/any/path')).toEqual('/any/path')
  })
  test('without locale prefix', () => {
    expect(removeLangPrefix('/any/path')).toEqual('/any/path')
  })
  test('without locale prefix when default locale has a root prefix', () => {
    setEnvData({ defaultLocale: 'en' })
    expect(removeLangPrefix('/any/path')).toEqual('/any/path')
  })
})

describe('removeLangPrefixFallbackLng', () => {
  beforeEach(() => {
    setEnvDataFallbackLng()
  })

  test('with non default locale prefix and root prefix to array', () => {
    expect(removeLangPrefix('/en/root/any/path', true)).toEqual(['any', 'path'])
  })
  test('with root prefix only on default locale', () => {
    setEnvData({ defaultLocale: 'en' })
    expect(removeLangPrefix('/root/any/path')).toEqual('/any/path')
  })
  test('with default locale prefix and root prefix', () => {
    setEnvData({ defaultLocale: 'en' })
    expect(removeLangPrefix('/en/root/any/path')).toEqual('/any/path')
  })
  test('with non default locale prefix that should have a root prefix but that is not here', () => {
    expect(removeLangPrefix('/en/any/path')).toEqual('/any/path')
  })
  test('with non default locale prefix that has no root prefix', () => {
    expect(removeLangPrefix('/fr/any/path')).toEqual('/any/path')
  })
  test('with default locale prefix that has no root prefix', () => {
    expect(removeLangPrefix('/fr-FR/any/path')).toEqual('/any/path')
  })
  test('without locale prefix', () => {
    expect(removeLangPrefix('/any/path')).toEqual('/any/path')
  })
  test('without locale prefix when default locale has a root prefix', () => {
    setEnvData({ defaultLocale: 'en' })
    expect(removeLangPrefix('/any/path')).toEqual('/any/path')
  })
})
