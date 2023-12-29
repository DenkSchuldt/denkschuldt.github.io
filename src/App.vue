
<script>
  import DnkImg from './components/DnkImg.vue';
  import DnkContent from './components/DnkContent.vue';

  export default {
    name: 'App',
    components: {
      DnkContent,
      DnkImg
    },
    data: () => {
      return {
        index: Number(localStorage.getItem('dnk-index')) || 0
      }
    },
    mounted() {
      localStorage.setItem('dnk-index', this.index >= 3 ? 0 : this.index + 1)
    }
  }
</script>

<template>
  <div id="app">
    <div class="dnk-wrapper">
      <DnkContent />
      <DnkImg
        :index="index"
      />
    </div>
  </div>
</template>

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
    height: 100vh;
    color: ##303030;
    font-size: 20px;
    text-align: left;
    overflow-y: auto;
    background-color: #fafafa;
  }
  .dnk-wrapper {
    width: 920px;
    height: 100%;
    margin: auto;
    display: flex;
    position: relative;
    box-sizing: border-box;
    -webkit-overflow-scrolling: touch;
  }

  @media only screen and (max-width: 1000px) {
    .dnk-wrapper {
      width: 720px;
    }
  }

  @media only screen and (max-width: 800px) {
    .dnk-wrapper {
      width: 80%;
      flex-direction: column;
    }
  }

</style>
