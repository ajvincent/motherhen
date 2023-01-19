/** @type {import('ts-jest').JestConfigWithTsJest} */
const jestConfig = {
  roots: [
    "<rootDir>/typescript-cli/"
  ],
  testPathIgnorePatterns: [
    "<rootDir>/typescript-cli/.*/fixtures"
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

  moduleNameMapper: {
    "#cli/(.*)": "<rootDir>/typescript-cli/$1",
  },

  resolver: "ts-jest-resolver",
}

export default jestConfig
