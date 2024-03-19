# @almacareer/edu-next-translate-routes example

This is a simple project that shows the usage of next-translate-routes.

## Starting

1. `yarn install` (This will first execute `yarn install` in the root package, then link `@almacareer/edu-next-translate-routes` into this example package.)
2. `yarn dev` or `yarn build && yarn start`

## Note

There is no `@almacareer/edu-next-translate-routes` dependency in package.json because this example directly use the root package: it is built and linked during preinstall (Cf. package.json preinstall hook in scripts).
