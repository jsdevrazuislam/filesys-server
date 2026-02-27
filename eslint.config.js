const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const prettier = require('eslint-plugin-prettier');
const simpleImportSort = require('eslint-plugin-simple-import-sort');
const eslintComments = require('@eslint-community/eslint-plugin-eslint-comments');

module.exports = [
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
        plugins: {
            '@typescript-eslint': typescriptEslint,
            prettier: prettier,
            'simple-import-sort': simpleImportSort,
            'eslint-comments': eslintComments,
        },
        rules: {
            ...typescriptEslint.configs.recommended.rules,
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            'prettier/prettier': 'error',
            'no-console': 'error',
            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'error',
            'eslint-comments/no-unlimited-disable': 'error',
            'eslint-comments/no-unused-disable': 'error',
            'eslint-comments/no-use': 'error',
        },
    },
];
