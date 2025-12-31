// @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import pluginQuery from '@tanstack/eslint-plugin-query'
import pluginRouter from '@tanstack/eslint-plugin-router'

import convexPlugin from '@convex-dev/eslint-plugin'

import eslintConfigPrettier from 'eslint-config-prettier'
import noProcessEnv from 'eslint-plugin-no-process-env'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'

export default [
  // 1. Base TanStack Configuration
  ...tanstackConfig,

  // 2. Framework Plugins (Query & Router)
  ...pluginQuery.configs['flat/recommended'],
  ...pluginRouter.configs['flat/recommended'],

  // 3. Global React & Logic Configuration
  {
    languageOptions: {
      parserOptions: {
        // Fix: Allows config files to be linted without being in tsconfig
        projectService: {
          allowDefaultProject: [
            '*.js',
            'prettier.config.js',
            'eslint.config.js',
          ],
        },
        // IMPORTANT: Explicitly set project to null to override the TanStack base config
        project: null,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      'no-process-env': noProcessEnv,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React & Hooks
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // Not needed in modern React
      'react/prop-types': 'off', // Using TypeScript

      // Security: Force use of src/shared/lib/env.ts
      'no-process-env/no-process-env': 'error',

      // Fix: Disable conflicting sort rule to let Prettier handle it
      'sort-imports': 'off',

      '@typescript-eslint/no-unnecessary-condition': 'warn', // or 'off'

      // Fix: Allow inline type imports (Essential for Shadcn UI)
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'import/consistent-type-specifier-style': ['error', 'prefer-inline'],
    },
  },

  // 4. Convex-Specific Rules (Targeted)
  {
    files: ['convex/**/*.ts', 'convex/**/*.js'],
    plugins: { '@convex-dev': convexPlugin },
    rules: {
      ...convexPlugin.configs.recommended[0].rules,
    },
  },

  // 5. Prettier Override (MUST BE LAST)
  eslintConfigPrettier,
]
