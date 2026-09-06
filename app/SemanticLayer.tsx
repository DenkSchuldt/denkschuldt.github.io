import { getSiteContent } from "./site.server.ts";
import { hrefFor } from "./site-url.ts";
import { buildStructuredData, serializeJsonLd } from "./structured-data.ts";

import type { SiteContent } from "./site.server.ts";

type Route = readonly string[];

function primaryLanguage(language: string) {
  return language.split(/[,\s/]+/).filter(Boolean)[0] ?? "es";
}

function SiteNav({ content, current }: { content: SiteContent; current: string }) {
  return (
    <nav aria-label="Sections">
      <ul>
        <li>
          <a href={hrefFor("/")} aria-current={current === "/" ? "page" : undefined}>
            Home
          </a>
        </li>
        {content.sections.map((section) => (
          <li key={section.id}>
            <a
              href={hrefFor(section.path)}
              aria-current={current === section.path ? "page" : undefined}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function ResourcesNav({ content }: { content: SiteContent }) {
  const { resources } = content;
  return (
    <nav aria-label="Machine-readable resources">
      <ul>
        <li>
          <a href={resources.siteJson}>Site manifest (site.json)</a>
        </li>
        <li>
          <a href={resources.llms}>llms.txt</a>
        </li>
        <li>
          <a href={resources.llmsFull}>llms-full.txt</a>
        </li>
        <li>
          <a href={resources.sitemap}>Sitemap</a>
        </li>
        <li>
          <a href={resources.poemsFeed} type="application/atom+xml">
            Poetry feed
          </a>
        </li>
      </ul>
    </nav>
  );
}

function RootDocument({ content }: { content: SiteContent }) {
  return (
    <main className="semantic-layer">
      <article aria-label={content.site.name}>
        <h1>{content.person.name}</h1>
        <p>{content.person.tagline}</p>
        <p>{content.site.summary}</p>

        <SiteNav content={content} current="/" />

        <section aria-label="Sections">
          <h2>Sections of {content.site.name}</h2>
          <ul>
            {content.sections.map((section) => (
              <li key={section.id}>
                <a href={hrefFor(section.path)}>{section.label}</a> — {section.summary}
              </li>
            ))}
          </ul>
        </section>

        <ResourcesNav content={content} />
      </article>
    </main>
  );
}

function AboutDocument({ content, current }: { content: SiteContent; current: string }) {
  const { person } = content;
  return (
    <main className="semantic-layer">
      <SiteNav content={content} current={current} />
      <article aria-label={`About ${person.name}`}>
        <h1>About {person.name}</h1>
        {person.bio.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <section aria-label="Languages">
          <h2>Languages</h2>
          <p>{person.languages}</p>
        </section>
        <section aria-label="Based in">
          <h2>Location</h2>
          <p>{person.location}</p>
        </section>
        <nav aria-label="Profiles">
          <h2>Find Denny online</h2>
          <ul>
            {person.links.map((link) => (
              <li key={link.href}>
                <a href={link.href} rel="noopener noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p>
          <a href={content.resources.aboutMarkdown} rel="alternate" type="text/markdown">
            Read this page as Markdown
          </a>
        </p>
      </article>
    </main>
  );
}

function ProjectsDocument({ content }: { content: SiteContent }) {
  return (
    <main className="semantic-layer">
      <SiteNav content={content} current="/projects" />
      <article aria-label={content.selectedWork.title}>
        <h1>{content.selectedWork.title}</h1>
        <p>{content.person.tagline}</p>

        <section aria-label="Career">
          <h2>Career</h2>
          <ol>
            {content.careerChapters.map((chapter) => (
              <li key={chapter.id}>
                <article>
                  <h3>
                    <time>{chapter.years}</time> — {chapter.heading}
                  </h3>
                  {chapter.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </article>
              </li>
            ))}
          </ol>
        </section>

        <section aria-label="Professional experience">
          <h2>Professional experience</h2>
          <ol>
            {content.experience.map((entry) => (
              <li key={`${entry.role}-${entry.company}-${entry.dates}`}>
                <article>
                  <h3>
                    {entry.role} — {entry.company}
                  </h3>
                  <p>
                    <time>{entry.dates}</time> · {entry.location}
                  </p>
                  {entry.bullets && (
                    <ul>
                      {entry.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </article>
              </li>
            ))}
          </ol>
        </section>

        <section aria-label={content.selectedWork.independentExperiments.heading}>
          <h2>{content.selectedWork.independentExperiments.heading}</h2>
          {content.selectedWork.independentExperiments.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <ul>
            {content.projects.map((project) => (
              <li key={project.url}>
                <article>
                  <h3>
                    <a href={project.url} rel="noopener noreferrer">
                      {project.title}
                    </a>
                  </h3>
                  <p>{project.description}</p>
                  <p>
                    <time>{project.dates}</time>
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </section>

        <p>
          <a href={content.resources.projectsMarkdown} rel="alternate" type="text/markdown">
            Read this page as Markdown
          </a>
        </p>
      </article>
    </main>
  );
}

function CertificatesDocument({ content }: { content: SiteContent }) {
  return (
    <main className="semantic-layer">
      <SiteNav content={content} current="/certificates" />
      <article aria-label="Certificates">
        <h1>Certificates</h1>
        <p>Professional certifications held by {content.site.owner}, most recent first.</p>
        <ol>
          {content.certificates.map((certificate) => (
            <li key={certificate.slug}>
              <article>
                <h2>
                  <a href={certificate.credentialUrl} rel="noopener noreferrer">
                    {certificate.title}
                  </a>
                </h2>
                <p>
                  <time>{certificate.date}</time>
                  {certificate.issuer ? ` · ${certificate.issuer}` : ""}
                </p>
                <p>
                  <a href={certificate.credentialUrl} rel="noopener noreferrer">
                    Verify credential
                  </a>{" "}
                  · <a href={certificate.imageUrl}>Certificate image</a>
                </p>
              </article>
            </li>
          ))}
        </ol>
        <p>
          <a href={content.resources.certificatesMarkdown} rel="alternate" type="text/markdown">
            Read this page as Markdown
          </a>
        </p>
      </article>
    </main>
  );
}

function PhoneDocument({ content }: { content: SiteContent }) {
  return (
    <main className="semantic-layer">
      <SiteNav content={content} current="/phone" />
      <article aria-label="Phone">
        <h1>Phone</h1>
        <p>{content.phone.summary}</p>
        <p>
          <a href={hrefFor("/poems")}>Read the latest poems</a>
        </p>
      </article>
    </main>
  );
}

function WallDocument({ content }: { content: SiteContent }) {
  return (
    <main className="semantic-layer">
      <SiteNav content={content} current="/wall" />
      <article aria-label="Wall">
        <h1>Wall</h1>
        <p>
          A few films framed on the workspace wall. This is a corner of the room, not a section of
          its own — the workspace is at <a href={hrefFor("/")}>{content.site.name}</a>.
        </p>
      </article>
    </main>
  );
}

function PoemsIndexDocument({ content }: { content: SiteContent }) {
  return (
    <main className="semantic-layer">
      <SiteNav content={content} current="/poems" />
      <article aria-label="Poems by Denny K. Schuldt">
        <h1>Poems by Denny K. Schuldt</h1>
        <p>Original poetry, newest first.</p>
        <ol>
          {content.poems.items.map((poem) => (
            <li key={poem.slug}>
              <a href={hrefFor(`/poems/${poem.slug}`)}>{poem.title}</a>{" "}
              <time dateTime={poem.date}>{poem.date}</time>
            </li>
          ))}
        </ol>
        <a href={hrefFor("/poems/feed.xml")} type="application/atom+xml">
          Subscribe to the poetry feed
        </a>
      </article>
    </main>
  );
}

function PoemDocument({ content, slug }: { content: SiteContent; slug: string }) {
  const items = content.poems.items;
  const index = items.findIndex((poem) => poem.slug === slug);
  if (index < 0) return <main className="semantic-layer" />;
  const poem = items[index];
  const previous = items[index - 1];
  const next = items[index + 1];
  return (
    <main className="semantic-layer">
      <article aria-label={`Poem: ${poem.title}`} lang={primaryLanguage(poem.language)}>
        <h1>{poem.title}</h1>
        <p>
          <time dateTime={poem.date}>{poem.date}</time>
        </p>
        <p>{poem.body}</p>
        <img src={poem.imageUrl} alt={`Artwork for ${poem.title}`} />
        <nav aria-label="Poem navigation">
          {previous && (
            <a rel="prev" href={hrefFor(`/poems/${previous.slug}`)}>
              {previous.title}
            </a>
          )}
          <a href={hrefFor("/poems")}>All poems</a>
          {next && (
            <a rel="next" href={hrefFor(`/poems/${next.slug}`)}>
              {next.title}
            </a>
          )}
        </nav>
        <a rel="alternate" type="text/markdown" href={poem.markdownUrl}>
          Read the Markdown source
        </a>
      </article>
    </main>
  );
}

function renderDocument(content: SiteContent, route: Route) {
  const [section, slug] = route;
  if (!section) return <RootDocument content={content} />;
  if (section === "about") return <AboutDocument content={content} current="/about" />;
  if (section === "socials") return <AboutDocument content={content} current="/socials" />;
  if (section === "projects") return <ProjectsDocument content={content} />;
  if (section === "certificates") return <CertificatesDocument content={content} />;
  if (section === "phone") return <PhoneDocument content={content} />;
  if (section === "wall") return <WallDocument content={content} />;
  if (section === "poems") {
    return slug ? (
      <PoemDocument content={content} slug={slug} />
    ) : (
      <PoemsIndexDocument content={content} />
    );
  }
  return <RootDocument content={content} />;
}

export async function SemanticLayer({ route }: { route: Route }) {
  const content = await getSiteContent();
  const structuredData = buildStructuredData(content, route);
  return (
    <>
      {renderDocument(content, route)}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
        />
      )}
    </>
  );
}
