
<template>
  <div id="app">
    <Description/>
    <footer>
      <Social/>
    </footer>
  </div>
</template>

<script>

  import Social from './components/Social.vue';
  import Description from './components/Description.vue';

  export default {
    name: 'App',
    components: {
      Social,
      Description
    }
  }
</script>

<style>
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100vh;
  }
  #app {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #34515e;
    background: rgb(52,81,94);
    -moz-osx-font-smoothing: grayscale;
    -webkit-font-smoothing: antialiased;
    font-family: Avenir, Helvetica, Arial, sans-serif;
    background: linear-gradient(45deg, rgba(62,99,116,1) 0%, rgba(58,97,115,1) 35%, rgba(40,134,153,1) 100%);
  }
  footer {
    width: 64%;
    margin: auto;
  }

  @media only screen and (max-width: 850px) {
    footer {
      width: 80%;
      max-width: 80%;
    }
  }

  @media only screen and (max-width: 700px) {
    footer {
      width: 90%;
      max-width: 90%;
    }
  }
</style>
