declare global {
  interface Window {
    __NTR_DATA__: import('../src/types').TNtrData
  }
}

export {}
