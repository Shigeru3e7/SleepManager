import next from "eslint-config-next"

const [coreConfig, ...restConfigs] = next

export default [
  {
    ignores: ["node_modules/**", ".next/**", "public/**"],
  },
  {
    ...coreConfig,
    rules: {
      ...coreConfig.rules,
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react/no-unescaped-entities": "off",
      "import/no-anonymous-default-export": "off",
    },
  },
  ...restConfigs,
]

