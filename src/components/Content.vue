
<template>
  <section>
    <transition name="fade" mode="out-in">
      <article
        id='article-about'
        v-if='selectedSection == "about"'>
        <img
          :src="getSrc()"
          alt="">
        <p>
          Hello there! My name is Denny Schuldt and I'm a knowledge driven developer, with a passion for code quality and product design. Colleagues have told me that I have a great common sense and a pixel perfect attention to detail.
        </p>
        <p>
          Over the years I've gained professional experience in the Software development field, working with front-end, back-end and mobile technologies. I started in this field as an intern for Blindside Networks, a company based in Canada, and haven't stopped learning ever since, working in places like Escuela Superior Politécnica del Litoral, Dátil, Pacificsoft, and currently, Shippify.
        </p>
        <p>
          Extracurricularly, I've participated in software communities like <i>TAWS</i>, a student club for which I was designated as President for two years, or <i>Guayaquil Developers</i> giving a short talk about Webpack.
        </p>
        <p>
          My main personal project is "<a href='http://dennyschuldt.com/360' target='_blank' rel='noopener noreferrer'>Aventuras en 360</a>", in which I collect self-taken 360 photographs of touristic places, aiming to share their beauty with the world.
        </p>
        <p>
          In the past I've also created apps like "Babahoyo VR", the first ever Virtual Reality app for touristic places in Babahoyo - Ecuador, which was available in the Google Play store for a couple of years.
        </p>
        <p>
          You can know more about me on social media, where you can find me as <a href='https://twitter.com/DenkSchuldt' target='_blank' rel='noopener noreferrer'>@DenkSchuldt</a>.
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
          <img src='./../images/react-dialog.png' alt='@denkschuldt/react-dialog'/>
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
          href='https://denkschuldt.github.io
Public/360'>
          <img src='./../images/360.png' alt='Aventuras en 360'/>
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
      index: {
        type: Number
      },
      selectedSection: {
        type: String
      }
    },
    methods: {
      getSrc() {
        const images = require.context('./../images/dnk', false, /\.jpeg$/);
        return images(`./0${this.$props.index}.jpeg`);
      }
    }
  };

</script>

<style scoped>

  #article-about {
    display: flex;
    flex-direction: column;
  }
    #article-about p a {
      color: #fff;
      font-weight: bold;
      will-change: opacity;
      transition: all 0.3s cubic-bezier(.25,.8,.25,1);
    }
      #article-about p a:hover {
        opacity: 0.8;
      }
    #article-about img {
      width: 200px;
      height: 200px;
      border: 10px solid;
      border-radius: 100%;
      margin: 32px auto 16px auto;
      -webkit-box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
      -moz-box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
      -ms-box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
      -o-box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
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
