
<template>
  <div id="app">
    <div class='dnk-wrapper'>
      <Nav
        :selectSection='selectSection'
        :selectedSection='selectedSection'/>
      <Content
        :selectedSection='selectedSection'/>
    </div>
    <Footer/>
  </div>
</template>

<script>

  import Nav from './components/Nav.vue';
  import Footer from './components/Footer.vue';
  import Content from './components/Content.vue';

  export default {
    name: 'App',
    components: {
      Nav,
      Content,
      Footer
    },
    data: () => {
      return {
        selectedSection: 'about'
      }
    },
    methods: {
      selectSection(section) {
        this.selectedSection = section;
      }
    },
    mounted: () => {
      document
      .querySelector('.dnk-wrapper')
      .addEventListener('scroll', e => {
        const { scrollTop, scrollHeight, offsetHeight } = e.target;
        if (scrollTop + offsetHeight == scrollHeight) {
          document.querySelector('.dnk-separator').style.opacity = 0;
        } else {
          document.querySelector('.dnk-separator').style.opacity = 1;
        }
      });
    }
  }
</script>

<style>
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100vh;
    min-height: -webkit-fill-available;
    -moz-osx-font-smoothing: grayscale;
    -webkit-font-smoothing: antialiased;
    font-family: Avenir, Helvetica, Arial, sans-serif;
    background: linear-gradient(45deg, rgba(62,99,116,1) 0%, rgba(58,97,115,1) 35%, rgba(40,134,153,1) 100%);
  }
  #app {
    width: 100%;
    height: 100%;
    margin: auto;
    display: flex;
    color: #F5F5F5;
    font-size: 18px;
    text-align: left;
    flex-direction: column;
  }
  .dnk-wrapper {
    width: 100%;
    height: 100%;
    padding: 0 20%;
    overflow-y: auto;
    box-sizing: border-box;
  }
  @media only screen and (max-width: 850px) {
    .dnk-wrapper {
      padding: 0 15%;
    }
  }

  @media only screen and (max-width: 700px) {
    .dnk-wrapper {
      padding: 0 10%;
    }
  }
</style>
