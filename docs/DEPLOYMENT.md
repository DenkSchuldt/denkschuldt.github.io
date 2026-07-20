# Deployment runbook

Este repositorio publica dos versiones en un solo sitio de GitHub Pages:

- `master` se publica en `https://denkschuldt.github.io/`.
- `revamp` se publica en `https://denkschuldt.github.io/hidden/`.

El workflow responsable es `.github/workflows/pages.yml`. Un push a `revamp`
inicia un workflow corto que despacha el deployment protegido desde `master`.
El workflow de `master` hace checkout de ambas ramas, compila cada versión,
coloca el resultado de `revamp` dentro de `site/hidden` y publica un único
artefacto de Pages.

## Regla principal

No considerar terminado un pedido de “commit, push y deploy” hasta que se hayan
cumplido las cuatro condiciones siguientes:

1. El árbol de trabajo está limpio y el commit está en `origin/revamp`.
2. La instalación limpia con `npm ci` funciona.
3. La suite con la configuración real de `/hidden` pasa.
4. El workflow despachado desde `master` termina con `success` y las URLs
   públicas responden con HTTP 200.

## Preflight obligatorio

Ejecutar desde la raíz del repositorio, en la rama `revamp`:

```sh
git status --short --branch
npm ci
GITHUB_PAGES_BASE_PATH=/hidden NEXT_PUBLIC_BASE_PATH=/hidden npm test
git diff --check
```

La suite debe compilar primero `packages/cinematic-navigation` y luego el sitio,
prerenderizar las rutas y finalizar con todos los tests aprobados. El script raíz
debe conservar este orden:

```text
build -> build:navigation -> build:site
```

Los archivos generados en `packages/*/dist/` no se versionan. Por eso cualquier
paquete workspace consumido por la aplicación debe formar parte explícita de la
cadena de build antes de que Vinext compile el sitio.

## Commit y push

Revisar primero qué se va a incluir y luego publicar:

```sh
git status --short
git diff --check
git add -A
git commit -m "Descripción concreta del cambio"
git push origin revamp
```

No usar `--force`, no reescribir commits del usuario y no incluir artefactos
generados de `dist`.

## Cómo funciona el workflow

Después del push aparecen normalmente dos runs:

1. Un run `push` de `revamp` ejecuta `trigger-master-deployment`.
2. Ese job despacha un run `workflow_dispatch` sobre `master`.

Debido a `concurrency: group: pages`, el run corto de `revamp` puede aparecer
como `cancelled` cuando comienza el run de `master`. Esto es esperado y no es un
fallo de deployment. El run que debe terminar con `success` es el
`workflow_dispatch` de `master`.

Con GitHub CLI:

```sh
gh run list --workflow pages.yml --limit 5
gh run watch RUN_ID --exit-status
```

Sin GitHub CLI, usar la API pública:

```sh
curl -L --fail --silent --show-error \
  -H 'Accept: application/vnd.github+json' \
  'https://api.github.com/repos/DenkSchuldt/denkschuldt.github.io/actions/workflows/pages.yml/runs?per_page=5'
```

Para consultar un run y sus jobs:

```sh
curl -L --fail --silent --show-error \
  -H 'Accept: application/vnd.github+json' \
  'https://api.github.com/repos/DenkSchuldt/denkschuldt.github.io/actions/runs/RUN_ID'

curl -L --fail --silent --show-error \
  -H 'Accept: application/vnd.github+json' \
  'https://api.github.com/repos/DenkSchuldt/denkschuldt.github.io/actions/runs/RUN_ID/jobs'
```

El resultado esperado es:

- `build`: `completed / success`
- `deploy`: `completed / success`
- run: `completed / success`

## Verificación pública

Una vez exitoso el workflow, comprobar al menos la raíz y una ruta interna:

```sh
curl -L --fail --silent --show-error -o /dev/null \
  -w '%{http_code}\t%{url_effective}\t%{content_type}\n' \
  'https://denkschuldt.github.io/hidden/'

curl -L --fail --silent --show-error -o /dev/null \
  -w '%{http_code}\t%{url_effective}\t%{content_type}\n' \
  'https://denkschuldt.github.io/hidden/about'
```

Ambas deben responder `200` y `text/html`. Finalmente:

```sh
git status --short --branch
```

El árbol debe quedar limpio y sincronizado con `origin/revamp`.

## Publicar poemas

Los poemas viven en `public/poems` dentro de la rama `revamp`. Cada poema debe
tener esta estructura:

```text
public/poems/YYYY-MM-DD/
  poem.md
  image.jpg
```

Ambos archivos son obligatorios. `image.*` acepta `avif`, `gif`, `jpg`, `jpeg`,
`png` o `webp`. La carpeta define la fecha y el orden; la aplicación muestra
primero la fecha más reciente. El frontmatter de `poem.md` debe incluir un
`slug:` único y estable y un `lang:` válido. Ese valor genera `/poems/:slug`,
además de la página HTML y metadata Open Graph utilizadas al compartir el
enlace.

Publicación desde `revamp`:

```sh
git add public/poems
git commit -m "Add poem YYYY-MM-DD"
git push origin revamp
```

El build descubre automáticamente las carpetas válidas y genera un manifiesto
liviano, las rutas estáticas, previews, JSON-LD, `sitemap.xml`, un feed Atom,
`llms.txt` y `robots.txt`. El cuerpo no se incluye en el manifiesto: el cliente
carga el `poem.md` activo y precarga solamente sus vecinos. Como GitHub Pages no
ejecuta un servidor, cada poema nuevo requiere build y deploy para que su URL y
preview existan.

La publicación mantiene el copyright del autor. Indexación y descubrimiento no
equivalen a una licencia para copiar, redistribuir, traducir o crear obras
derivadas; cualquier licencia de reutilización debe elegirse explícitamente.

## Diagnóstico de fallos conocidos

### `npm ci` indica que `package.json` y `package-lock.json` no coinciden

Síntoma: `Build hidden revamp` falla casi inmediatamente y el mensaje local
incluye `npm ci can only install packages when your package.json and
package-lock.json are in sync` o una dependencia `Missing`.

Solución:

```sh
npm install --package-lock-only
npm ci
GITHUB_PAGES_BASE_PATH=/hidden NEXT_PUBLIC_BASE_PATH=/hidden npm test
```

Revisar el diff del lockfile, crear un commit correctivo y volver a hacer push.
No cambiar el workflow para sustituir `npm ci` por `npm install`: el deployment
debe continuar verificando una instalación reproducible.

### No se encuentra `@denk/cinematic-navigation` o su `dist`

Síntoma: `npm ci` pasa, pero `Build hidden revamp` falla al resolver exports del
workspace package.

Verificar que `package.json` mantenga:

```json
{
  "scripts": {
    "build": "npm run build:navigation && npm run build:site",
    "build:navigation": "tsc -p packages/cinematic-navigation/tsconfig.build.json",
    "build:site": "WRANGLER_LOG_PATH=.wrangler/wrangler.log vinext build"
  }
}
```

No resolverlo versionando `packages/cinematic-navigation/dist`; la solución es
compilar el workspace antes del consumidor.

### El build pasa localmente pero falla en Actions

Reproducir la configuración exacta de Pages, no solamente `npm run build`:

```sh
npm ci
GITHUB_PAGES_BASE_PATH=/hidden NEXT_PUBLIC_BASE_PATH=/hidden npm test
```

Después revisar el job preciso. Con autenticación:

```sh
gh run view RUN_ID --log-failed
```

La API pública permite consultar estado, pasos y annotations, pero GitHub puede
responder `403` al solicitar los logs completos sin autenticación. En ese caso,
usar GitHub CLI autenticado o abrir el job con una sesión de GitHub iniciada.

### El run de `revamp` aparece cancelado

Antes de tratarlo como error, comprobar si existe un run más reciente de tipo
`workflow_dispatch` sobre `master`. Si ese run está activo, la cancelación es el
handoff esperado producido por el grupo de concurrencia `pages`.

## Checklist de cierre

- [ ] `npm ci` pasó.
- [ ] Tests con `GITHUB_PAGES_BASE_PATH=/hidden` y
      `NEXT_PUBLIC_BASE_PATH=/hidden` pasaron.
- [ ] `git diff --check` pasó.
- [ ] Commit creado y `revamp` subido a `origin`.
- [ ] Run `workflow_dispatch` de `master` terminó con `success`.
- [ ] `/hidden/` responde 200.
- [ ] Una ruta interna de `/hidden` responde 200.
- [ ] Working tree limpio.
