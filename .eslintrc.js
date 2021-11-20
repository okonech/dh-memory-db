module.exports = {
    parserOptions: {
        ecmaVersion: 11,
        project: [
            './tsconfig.json'
        ],
        tsconfigRootDir: __dirname
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended'
    ],
    rules: {},
    env: {
        node: true,
        es6: true
    }
};
