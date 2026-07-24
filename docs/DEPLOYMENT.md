# Runbook de deploy

Este repositorio publica una sola versión del portfolio desde `master` en
`https://denkschuldt.github.io/`.

El workflow responsable es `.github/workflows/pages.yml`. Cada push a `master`
ejecuta una instalación limpia, compila el workspace de navegación y genera el
sitio estático que GitHub Pages publica en la raíz.

## Preflight

Desde la raíz del repositorio:

```sh
git status --short --branch
npm ci
npm test
git diff --check
```

La suite compila primero `packages/cinematic-navigation` y después el sitio.
Los artefactos de `dist/` no se versionan; el workflow publica únicamente
`dist/client/`.

## Commit, push y deploy

Revisar primero el diff y publicar únicamente los archivos intencionales:

```sh
git status --short
git diff --check
git add -A
git commit -m "Descripción concreta del cambio"
git push origin master
```

No usar `--force` ni incluir archivos generados de `dist/`.

El push inicia el workflow. El resultado esperado es:

- `build`: `completed / success`
- `deploy`: `completed / success`

Con GitHub CLI:

```sh
gh run list --workflow pages.yml --limit 5
gh run watch RUN_ID --exit-status
```

Sin GitHub CLI:

```sh
curl -L --fail --silent --show-error \
  -H 'Accept: application/vnd.github+json' \
  'https://api.github.com/repos/DenkSchuldt/denkschuldt.github.io/actions/workflows/pages.yml/runs?per_page=5'
```

## Verificación pública

Después de un run exitoso, comprobar la raíz y una ruta interna:

```sh
curl -L --fail --silent --show-error -o /dev/null \
  -w '%{http_code}\t%{url_effective}\t%{content_type}\n' \
  'https://denkschuldt.github.io/'

curl -L --fail --silent --show-error -o /dev/null \
  -w '%{http_code}\t%{url_effective}\t%{content_type}\n' \
  'https://denkschuldt.github.io/about'
```

Ambas deben responder `200` y `text/html`. También verificar que el árbol
quede limpio y sincronizado con `origin/master`.

## Publicar poemas

Los poemas viven en `public/poems` dentro de `master`. Cada poema debe tener:

```text
public/poems/YYYY-MM-DD/
  poem.md
  image.jpg
```

`image.*` acepta `avif`, `gif`, `jpg`, `jpeg`, `png` o `webp`. La carpeta define
la fecha y el orden; la aplicación muestra primero la fecha más reciente. El
frontmatter de `poem.md` debe incluir un `slug:` único y estable y un `lang:`
válido. Ese slug genera `/poems/:slug`, metadata Open Graph, JSON-LD, sitemap,
feed Atom y `llms.txt`.

Los cuerpos de los poemas no se incluyen en el manifiesto del cliente: se
cargan de forma diferida desde su Markdown. Como GitHub Pages no ejecuta un
servidor, un poema nuevo requiere commit, build y deploy para que su URL exista.

## Diagnóstico rápido

### `npm ci` indica que los locks no coinciden

Ejecutar `npm install --package-lock-only`, revisar el diff del lockfile y
volver a probar `npm ci`. No sustituir `npm ci` por `npm install` en el
workflow.

### No se encuentra `@denk/cinematic-navigation`

Confirmar que `package.json` conserve:

```json
{
  "scripts": {
    "build": "npm run build:navigation && npm run build:site",
    "build:navigation": "tsc -p packages/cinematic-navigation/tsconfig.build.json",
    "build:site": "WRANGLER_LOG_PATH=.wrangler/wrangler.log vinext build"
  }
}
```

El workspace debe compilarse antes del sitio; no se debe versionar su carpeta
`dist/`.

### El build local pasa pero Actions falla

Reproducir la instalación limpia (`npm ci` y `npm test`), consultar el job
fallido y revisar el primer paso que cambia a `failure`. Si el error aparece en
prerender, comprobar que todas las rutas dinámicas tengan valores válidos en
`generateStaticParams()`.

## Checklist de cierre

- [ ] `npm ci` pasó.
- [ ] `npm test` pasó.
- [ ] `git diff --check` pasó.
- [ ] Commit creado y `master` subido a `origin`.
- [ ] Workflow de Pages terminó con `success`.
- [ ] `/` responde `200`.
- [ ] Una ruta interna responde `200`.
- [ ] Working tree limpio.
