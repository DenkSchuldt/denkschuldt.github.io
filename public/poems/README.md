# Poems content

Poem content lives in the `revamp` branch using this structure:

```text
public/poems/YYYY-MM-DD/
  poem.md
  image.jpg
```

The folder name is the publication date. The application orders valid folders
newest first and ignores incomplete folders. Both `poem.md` and `image.*` are
required. The image extension may be `avif`, `gif`, `jpg`, `jpeg`, `png`, or
`webp`. The `slug:` field in the Markdown frontmatter defines the public URL.
Include `lang:` with the poem's language code, such as `es`, `en`, or `pt-BR`.

Every poem is included in the next static build so `/poems/:slug` receives its
own semantic HTML page, Open Graph preview, JSON-LD description, sitemap entry,
Atom feed entry, and links to its neighboring poems. The browser initially
loads only a lightweight metadata manifest; it fetches `poem.md` for the active
page and its immediate neighbors.

Publication does not transfer copyright or grant a reuse license. The generated
discovery files identify Denny K. Schuldt as author and copyright holder.
