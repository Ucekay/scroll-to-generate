// https://docs.expo.dev/guides/using-eslint/
module.exports = {
	extends: ['expo', 'plugin:import/recommended'],
	plugins: ['import', 'react-native-style-order'],
	ignorePatterns: ['/dist/*'],
	overrides: [
		{
			files: ['*.ts', '*.tsx', '*.js'],
			parser: '@typescript-eslint/parser',
		},
	],
	rules: {
		'import/order': [
			'warn',
			{
				alphabetize: {
					order: 'asc',
				},
				groups: [
					'builtin',
					'external',
					'internal',
					'parent',
					'sibling',
					'index',
					'object',
					'type',
				],
				'newlines-between': 'always',
				pathGroups: [
					{
						pattern: 'expo',
						group: 'builtin',
						position: 'before',
					},
					{
						pattern: 'expo-router',
						group: 'builtin',
						position: 'before',
					},
					{
						pattern: 'react',
						group: 'builtin',
						position: 'before',
					},
					{
						pattern: 'react-native',
						group: 'builtin',
						position: 'before',
					},
				],
				distinctGroup: false,
				pathGroupsExcludedImportTypes: ['builtin'],
			},
		],
		'react-native-style-order/sort-style-props': [
			'warn',
			{
				order: 'predefined',
			},
		],
	},
};
