// @ts-check

/** @type {import('prettier').Config & import('@ianvs/prettier-plugin-sort-imports').PrettierConfig} */
const config = {
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 80,
  plugins: [
    '@ianvs/prettier-plugin-sort-imports',
    'prettier-plugin-tailwindcss',
  ],
  // Tailwind configuration
  tailwindFunctions: ['cn', 'cva'],
  // Import sorting configuration
  importOrder: [
    '<BUILTIN_MODULES>',
    '',
    '^react$',
    '^@tanstack/(.*)$',
    '',
    '^(convex|@convex-dev|@workos-inc)(.*)$', // Infrastructure Group (WorkOS, Convex)
    '',
    '<THIRD_PARTY_MODULES>',
    '',
    '^@/shared/(.*)$', // Shared stuff group
    '',
    '^@/(.*)$',
    '',
    '^[./]',
  ],
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  importOrderTypeScriptVersion: '5.0.0',
}

export default config
