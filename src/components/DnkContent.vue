
<script>

  export default {
    name: 'DnkContent',
    data() {
      return {
        areAllCertificatesVisible: false,
        certificates: [
          {
            url: "https://www.interaction-design.org/members/denny-k-schuldt/certificate/course/bdcc9ca0-c9fd-43e1-bdf4-35a162d73deb?certificateType=course&r=denny-k-schuldt",
            img: require("./../images/certificates/course-certificate-hci-thought-and-emotion.jpg"),
            title: "Design for Thought and Emotion",
            expeditionDate: "May 2025"
          },
          {
            url: "https://www.interaction-design.org/members/denny-k-schuldt/certificate/course/674a675b-00e1-4554-8286-66a9acd802ac?certificateType=course&r=denny-k-schuldt",
            img: require("./../images/certificates/course-certificate-design-for-a-better-world-with-don-norman-course.jpg"),
            title: "Design for a Better World with Don Norman",
            expeditionDate: "May 2025"
          },
          {
            url: "https://www.interaction-design.org/members/denny-k-schuldt/certificate/masterclass/mcc_b7228b61c46b4920a174be130ce321f9?r=denny-k-schuldt",
            img: require("./../images/certificates/masterclass-certificate-learning-experience-design-that-delivers-impact-a-step-by-step-guide.jpg"),
            title: "Learning Experience Design That Delivers Impact: A Step-by-Step Guide",
            expeditionDate: "May 2025"
          },
          {
            url: "https://www.interaction-design.org/members/denny-k-schuldt/certificate/course/cd130101-b4a3-4a80-a4a3-54a992d4fbd5",
            img: require("./../images/certificates/course-certificate-ai-for-designers.jpg"),
            title: "AI for Designers",
            expeditionDate: "April 2024"
          },
          {
            url: "https://www.interaction-design.org/members/denny-k-schuldt/certificate/masterclass/mcc_22661bf7b1aa41b599672ea7eb8453b9",
            img: require("./../images/certificates/masterclass-certificate-the-importance-of-emotional-intelligence-in-ux.jpg"),
            title: "The Importance of Emotional Intelligence in UX",
            expeditionDate: "March 2024"
          },
          {
            url: "https://www.interaction-design.org/members/denny-k-schuldt/certificate/course/cd917770-e411-41d1-bb96-c910b9feb3ab",
            img: require("./../images/certificates/course-certificate-hci-perception-and-memory.jpg"),
            title: "Perception and Memory in HCI and UX",
            expeditionDate: "March 2024"
          },
          {
            url: "https://www.credential.net/05270819-3832-4321-883e-b401c38de4a5#gs.6bjgtw",
            img: require("./../images/certificates/certificate-pm-colectivo23.54bf54a8.png"),
            title: "Product Management",
            expeditionDate: "January 2024"
          },
          {
            url: "https://www.interaction-design.org/members/denny-k-schuldt/certificate/course/309f9f8f-5977-4f10-a3c9-405ca32af763",
            img: require("./../images/certificates/course-certificate-journey-mapping.jpg"),
            title: "Journey Mapping",
            expeditionDate: "December 2023"
          },
          {
            url: "https://www.interaction-design.org/members/denny-k-schuldt/certificate/course/1dc1d6bb-f2f3-453f-a50b-6207feb12c82",
            img: require("./../images/certificates/course-certificate-accessibility-how-to-design-for-all.jpg"),
            title: "Accessibility: How to Design for All",
            expeditionDate: "October 2021"
          },
          {
            url: "https://www.interaction-design.org/members/denny-k-schuldt/certificate/course/53376127-fcaa-4ae4-8b76-6e5073a48b67",
            img: require("./../images/certificates/course-certificate-information-visualization-getting-dashboards-right.jpg"),
            title: "Information Visualization: Getting Dashboards Right",
            expeditionDate: "October 2021"
          },
          {
            url: "https://www.interaction-design.org/members/denny-k-schuldt/certificate/course/4d50e6f2-10d5-4212-8f3b-371475323472",
            img: require("./../images/certificates/course-certificate-data-driven-design-quantitative-research-for-ux.jpg"),
            title: "Data-Driven Design: Quantitative Research for UX",
            expeditionDate: "September 2021"
          }
        ],
        projects: [
          {
            url: "https://medium.com/@DenkSchuldt",
            img: require("./../images/projects/denk-poetry.png"),
            title: "DenkPoetry",
            description: "While my professional journey revolves around tech, this space is where I unveil another facet of my soul—poetry.",
            creationDate: "2023 - Present"
          },
          {
            url: "https://www.npmjs.com/package/@denkschuldt/react-dialog",
            img: require("./../images/projects/react-dialog.png"),
            title: "@denkschuldt/react-dialog ",
            description: "A simple to use and customizable react dialog implementation.",
            creationDate: "2021 - Present"
          },
          {
            url: "https://denkschuldt.github.io/360",
            img: require("./../images/projects/360.png"),
            title: "Aventuras en 360",
            description: "I created this project to share the beauty of the touristic places I've been with a 360º view. All pictures featured are mine and taken by myself, sometimes with a phone, others with a 360 camera.",
            creationDate: "2016 - Present"
          }
        ]
      }
    },
    methods: {      
      toggleFullCertificatesVisible() {
        this.areAllCertificatesVisible = true;
      }
    }
  };

</script>

<template>
  <section>
    <article>
      <h1>About me</h1>
      <p class="dnk-about">
        Strategic-minded Product Leader with a strong technical foundation and over a decade of experience designing and building tools that users actually rely on. I translate operational complexity into intuitive product flows, leading teams that deliver not just features, but measurable impact.
        <br><br>
        Currently VP of Product at Shippify, I lead the development of our internal platform (Dash): a suite of operational tools used daily for routes monitoring, fleet management, real-time tracking, and performance analytics. I work closely with our users and tech team to ensure the product evolves in ways that make their work easier and more efficient.
        <br><br>
        I began my career as a fullstack developer, working with technologies like React and Node.js, and that lens still shapes how I think about product: aligning UX with system behavior, reducing friction, and prioritizing what matters most.
        <br><br>
        Some of my public projects include my open-source library react-dialog <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.npmjs.com/package/@denkschuldt/react-dialog"
        >public react library</a> and my hobby project “Aventuras en 360” <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://denkschuldt.github.io/360"
        >Aventuras en 360</a>where I share immersive views of places I’ve visited.
        <br><br>
        Native Spanish speaker, fluent in English, and conversational in Brazilian Portuguese. You can find me online as @DenkSchuldt.
      </p>
    </article>
    <article>
      <h1>Certificates</h1>
      <ul class="dnk-certificates">
        <li
          v-for="(certificate, index) of certificates"
          :key="index"
        >
          <a
            v-if="index > 3 ? areAllCertificatesVisible : true"
            target="_blank" 
            rel="noopener noreferrer" 
            :href="certificate.url" 
            class="dnk-certificate"
          >
            <img 
              :src="certificate.img"
              :alt="certificate.title"
            >
            <div class="dnk-certificate-content">
              <h4>
                {{ certificate.title }}
              </h4>
              <footer>
                {{ certificate.expeditionDate }}
              </footer>
            </div>
          </a>
        </li>
      </ul>
      <div
        v-if="!areAllCertificatesVisible"
        class="dnk-show-more"
      >
        <button 
          @click="toggleFullCertificatesVisible"
        >
          Show more
          <i class="fa-solid fa-plus"></i>
        </button>
      </div>
    </article>
    <article>
      <h1>Personal projects</h1>
      <ul class="dnk-projects">
        <li
          v-for="(project, index) of projects"
          :key="index"
        >
          <a
            target="_blank" 
            rel="noopener noreferrer" 
            :href="project.url" 
            class="dnk-project"
          >
            <img 
              :src="project.img"
              :alt="project.title"
            >
            <div class="dnk-project-content">
              <h4>
                {{ project.title }}
              </h4>
              <div>
                {{ project.description }}
              </div>
              <footer>
                {{ project.creationDate }}
              </footer>
            </div>
          </a>
        </li>
      </ul>
    </article>
    <article>
      <h1>Socials</h1>
      <div class="dnk-social">
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.linkedin.com/in/denny-schuldt/"
        >
          <i class="fa-brands fa-linkedin"></i>
          Denny Schuldt
        </a>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/DenkSchuldt"
        >
          <i class="fab fa-github" />
          DenkSchuldt
        </a>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.instagram.com/denkschuldt/"
        >
          <i class="fab fa-instagram" />
          DenkSchuldt
        </a>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.threads.net/@denkschuldt"
        >
          <i class="fa-brands fa-threads" />
          DenkSchuldt
        </a>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://twitter.com/DenkSchuldt"
        >
          <i class="fa-brands fa-x-twitter" />
          DenkSchuldt
        </a>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://medium.com/@DenkSchuldt"
        >
          <i class="fa-brands fa-medium"></i>
          DenkSchuldt
        </a>
      </div>
    </article>
  </section>
</template>

<style scoped>

  section {
    margin-right: 48px;
    width: calc(100% - 414px);
  }
    section article {
      margin-bottom: 64px;
    }
    section article:first-of-type {
      margin-top: 100px;
    }
      section article h1 {
        margin: 0;
        font-size: 32px;
        position: sticky;
        top: 0;
        background: #fafafa;
        padding: 16px 32px;
        margin: 0 -32px;
      }

  .dnk-about a {
    color: #607D8B;
    font-weight: bold;
    text-decoration: none;
  }
    .dnk-about a:hover {
      color: #0D47A1;
    }

  .dnk-projects {
    margin: 0;
    padding: 0;
    display: flex;
    list-style-type: none;
    flex-direction: column;
  }
    .dnk-projects li {
      display: flex;
      margin-bottom: 16px;
    }
    .dnk-projects li:last-of-type {
      margin-bottom: 0px;
    }
    .dnk-projects .dnk-project {
      width: 100%;
      height: 100%;
      padding: 16px;
      color: #303030;
      margin-bottom: 16px;
      border-radius: 20px;
      text-decoration: none;
      box-sizing: border-box;
      border: 1px solid #BDBDBD;
    }
    .dnk-projects .dnk-project:hover {
      background-color: #E0E0E0;
    }
    .dnk-projects .dnk-project:last-of-type {
      margin-bottom: 0px;
    }
      .dnk-projects .dnk-project img {
        width: 100%;
        margin-bottom: 8px;
        border-radius: 16px;
      }
      .dnk-projects .dnk-project .dnk-project-content {
        display: grid;
        gap: 8px;
      }
        .dnk-projects .dnk-project .dnk-project-content h4 {
          margin: 0;
          font-size: 22px;
        }
        .dnk-projects .dnk-project .dnk-project-content footer {
          width: 100%;
          text-align: right;
        }

  .dnk-certificates {
    margin: 0;
    padding: 0;
    list-style-type: none;
    display: grid;
    grid-gap: 16px;
    grid-template-columns: repeat(2, 1fr);
  }
    .dnk-certificates li {
      display: flex;
    }
    .dnk-certificates li:last-of-type {
      margin-bottom: 0px;
    }
    .dnk-certificates .dnk-certificate {
      width: 100%;
      height: 100%;
      padding: 16px;
      color: #303030;
      margin-bottom: 16px;
      border-radius: 20px;
      text-decoration: none;
      box-sizing: border-box;
      border: 1px solid #BDBDBD;
      display: flex;
      flex-direction: column;
    }
    .dnk-certificates .dnk-certificate:hover {
      background-color: #E0E0E0;
    }
      .dnk-certificates .dnk-certificate img {
        width: 100%;
        height: 155px;
        margin-bottom: 8px;
        border-radius: 16px;
      }
      .dnk-certificates .dnk-certificate .dnk-certificate-content {
        gap: 8px;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
        .dnk-certificates .dnk-certificate .dnk-certificate-content h4 {
          margin: 0;
          height: 100%;
          font-size: 22px;
        }
    .dnk-show-more {
      width: 100%;
      display: flex;
      margin-top: 16px;
      justify-content: center;
    }
    button {
      cursor: pointer;
      padding: 8px 16px;
      border-radius: 50px;
      display: flex;
      align-items: center;
      font-size: 20px;
      color: #303030;
      border: 1px solid #BDBDBD;
    }
      button i {
        margin-left: 16px;
      }

  .dnk-social {
    display: flex;
    flex-direction: column;
  }
    .dnk-social a {
      color: #607D8B;
      width: fit-content;
      margin-bottom: 8px;
      text-decoration: none;
    }
    .dnk-social i {
      width: 24px;
    }
    .dnk-social a:last-of-type {
      margin-bottom: 100px;
    }
      .dnk-social a:hover {
        color: #0D47A1;
      }

  @media only screen and (max-width: 1000px) {
    section {
      width: calc(100% - 364px);
    }
    .dnk-certificates {
      grid-template-columns: repeat(1, 1fr);
    }
      .dnk-certificates .dnk-certificate img {
        height: auto;
      }
  }

  @media only screen and (max-width: 800px) {
    section {
      width: 100%;
      margin-right: 0;
    }
    .dnk-social a:last-of-type {
      margin-bottom: 0;
    }
  }

</style>
