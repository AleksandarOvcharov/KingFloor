import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
    ...nextVitals,
    {
        rules: {
            "react-hooks/set-state-in-effect": "off",
            "react-hooks/preserve-manual-memoization": "off",
            "react-hooks/purity": "off",
            "react-hooks/immutability": "off",
            "react-hooks/refs": "off",
            "react-hooks/static-components": "off",
            "react-hooks/exhaustive-deps": "warn",
            "@next/next/no-img-element": "off",
            "react/no-unescaped-entities": "off",
            "import/no-anonymous-default-export": "off",
        },
    },
    globalIgnores([
        ".next/**",
        "out/**",
        "build/**",
        "next-env.d.ts",
    ]),
]);
