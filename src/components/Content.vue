
<template>
  <section>
    <transition name="fade" mode="out-in">
      <article
        id='article-about'
        v-if='selectedSection == "about"'>
        <p>
          Denny K. Schuldt is a Knowledge driven developer, with a passion for code quality and user experience. He has a great common sense and a pixel perfect attention to detail.
        </p>
        <p>
          Over the years Denny has gained professional experience in the Software development field, working with front-end, back-end and mobile technologies. He started in this field as an intern for Blindside Networks, a company based in Canada, and he hasn't stopped learning ever since, working in places like Escuela Superior Politécnica del Litoral, Dátil, Pacificsoft, and currently, Shippify.
        </p>
        <p>
          He's also participated in software communities like TAWS, a student club for which he was designated as President for two years, or Guayaquil Developers giving a short talk about Webpack.
        </p>
        <p>
          His main personal project is "<a href='http://dennyschuldt.com/360' target='_blank' rel='noopener noreferrer'>Aventuras en 360</a>", in which he collects self-taken 360 photographs of touristic places, aiming to share their beauty with the world.
        </p>
        <p>In the past he's also created apps like "Babahoyo VR", the first ever Virtual Reality app for touristic places in Babahoyo, Ecuador, which was available in the Google Play store.</p>
        <p>
          You can know more about Denny following him on social media, where you can find him as <a href='https://twitter.com/DenkSchuldt' target='_blank' rel='noopener noreferrer'>@DenkSchuldt</a>.
        </p>
        <p class="fa-circle-wrapper">
          <i class="fas fa-circle"></i>
        </p>
      </article>
    </transition>
    <transition name="fade" mode="out-in">
      <article
        id='article-projects'
        v-if='selectedSection == "projects"'>
        <a
          target='_blank'
          class='dnk-project'
          rel='noopener noreferrer'
          href='https://www.npmjs.com/package/@denkschuldt/react-dialog'>
          <img src='./../images/react-dialog.gif' alt='@denkschuldt/react-dialog'/>
          <h4>@denkschuldt/react-dialog</h4>
          <div>A simple to use and customizable react dialog implementation.</div>
          <footer>
            2021 - Present
          </footer>
        </a>
        <a
          target='_blank'
          class='dnk-project'
          rel='noopener noreferrer'
          href='http://dennyschuldt.com/360'>
          <img src='./../images/360.gif' alt='Aventuras en 360'/>
          <h4>Aventuras en 360</h4>
          <div>
            I created this project to share the beauty of the touristic places I've been with a 360º view. All pictures featured are mine and taken by myself, sometimes with a phone, others with a 360 camera.
          </div>
          <footer>
            2016 - Present
          </footer>
        </a>
        <p class="fa-circle-wrapper">
          <i class="fas fa-circle"></i>
        </p>
      </article>
    </transition>
  </section>
</template>

<script>

  export default {
    name: 'Content',
    props: {
      selectedSection: {
        type: String
      }
    },
  };

</script>

<style scoped>

  #article-about p a {
    color: #fff;
    font-weight: bold;
    will-change: opacity;
    transition: all 0.3s cubic-bezier(.25,.8,.25,1);
  }
    #article-about p a:hover {
      opacity: 0.8;
    }

  .dnk-project {
    display: flex;
    padding: 16px;
    color: #F5F5F5;
    flex-direction: column;
    margin-block-start: 24px;
    margin-block-end: 24px;
    border-radius: 10px;
    text-decoration: none;
    box-sizing: border-box;
    border: 1px solid #F5F5F5;
    transition: all 0.3s cubic-bezier(.25,.8,.25,1);
  }
    .dnk-project:hover {
      background-color: #f5f5f526;
    }
    .dnk-project img {
      width: 100%;
      margin-bottom: 24px;
      border-radius: 10px;
      align-self: flex-start;
      background-color: #f5f5f526;
    }
    .dnk-project h4 {
      margin: 0 0 12px 0;
    }
    .dnk-project footer {
      font-size: 14px;
      margin-top: 12px;
      text-align: right;
      font-weight: bold;
    }

  .fa-circle-wrapper {
    display: flex;
    padding: 20px 0;
    justify-content: center;
  }
    .fa-circle {
      opacity: 0.5;
      font-size: 12px;
    }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity .3s;
  }
  .fade-enter,
  .fade-leave-to {
    opacity: 0;
  }
</style>
