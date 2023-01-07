/** @type {import('ts-jest').JestConfigWithTsJest} */
const jestConfig = {
  roots: [
    "<rootDir>/typescript-cli/"
  ],
  preset: 'ts-jest/presets/default-esm',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        useESM: true,
      },
    ],
  },
}

export default jestConfig
