/* eslint-disable prettier/prettier */
/**
 * @jest-environment node
 */
const mockedNextPackageJson = { version: '12.3.1' }
jest.mock('next/package.json', () => (mockedNextPackageJson))

import { checkNextVersion } from '../../src/plugin/checkNextVersion'

const versionTests: { current: string, comparison: Parameters<typeof checkNextVersion>[0], expected: boolean }[] = [
  { current: '13.3.1', comparison: '>=13.3.0', expected: true },
  { current: '12.3.1', comparison: '>=13.3.0', expected: false },
  { current: '12.3.1', comparison: '<13.3.0', expected: true },
  { current: '13.5.0', comparison: '!=13.5.0', expected: false },
  { current: '13.5.0', comparison: '!=13.4.0', expected: true },
  { current: '13.5.0', comparison: '!=13.5.0', expected: false },
  { current: '13.5.0', comparison: '=13.5.0', expected: true },
  { current: '13.4.0-5', comparison: '>13.4.0', expected: false },
]

describe('checkNextVersion.', () => {
  versionTests.map(({ current, comparison, expected }) => {
    test(`${current} ${comparison}`, () => {
      mockedNextPackageJson.version = current
      expect(checkNextVersion(comparison)).toBe(expected)
    })
  })
})
