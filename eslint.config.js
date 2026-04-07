import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended (type-aware disabled — keeps lint fast)
  ...tseslint.configs.recommended,

  // React Hooks rules
  {
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },

  // React Refresh (Vite HMR)
  {
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Project-specific overrides
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Already enforced by TS strict mode — disable ESLint duplicates
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',

      // Stylistic preferences
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
    },
  },

  // Prettier must be last — disables all formatting rules
  eslintConfigPrettier,
);
