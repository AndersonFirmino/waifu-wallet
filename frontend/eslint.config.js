import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },

  // JS base
  js.configs.recommended,

  // TypeScript strict + type-checked (usa o compilador para inferência)
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },

    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      // React Hooks
      ...reactHooks.configs['recommended-latest'].rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // ── TypeScript na Unha ──────────────────────────────────────────────
      // Proibido any (já vem no strict, reforça como error)
      '@typescript-eslint/no-explicit-any': 'error',

      // Proibido type assertions (as X) — só as const é permitido
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        { assertionStyle: 'never' },
      ],

      // interface para shapes de dados, type para unions/aliases
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],

      // import type para imports de apenas tipos
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // Proibido non-null assertion (!)
      '@typescript-eslint/no-non-null-assertion': 'error',

      // Promessas não podem ficar flutuando sem await/catch
      '@typescript-eslint/no-floating-promises': 'error',

      // Prefere ?? sobre || para null/undefined
      '@typescript-eslint/prefer-nullish-coalescing': 'error',

      // Proibido usar undefined como valor de domínio onde null é esperado
      '@typescript-eslint/no-unnecessary-condition': 'error',

      // Evita inferência desnecessária de any em callbacks
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
    },
  },

  // Desativa regras do ESLint que conflitam com Prettier (deve ser o último)
  prettierConfig,
)
