module.exports = {
  $schema: "https://json.schemastore.org/eslintrc",
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "prettier"],
  extends: [
    "next/core-web-vitals",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  rules: {
    "prettier/prettier": "error",
    "linebreak-style": "off",
    "semi": "off",
    "indent": "off",
    "@typescript-eslint/semi": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "tailwindcss/no-custom-classname": "off",
    "react/react-in-jsx-scope": "off",
    "react/prop-types": 0,
    "react/no-unknown-property": "off",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }
    ]
  },

  settings: {
    tailwindcss: {
      callees: ["cn"],
      config: "tailwind.config.js"
    },
    next: {
      rootDir: ["src/"]
    }
  }
}
