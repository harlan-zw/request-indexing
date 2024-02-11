import antfu from '@antfu/eslint-config'

export default antfu({
  rules: {
    'unicorn/prefer-node-protocol': 'off',
    'node/prefer-global': 'off',
    'node/prefer-global/buffer': 'off',
  },
})
