<script>

  export default {
    name: 'DnkImg',
    props: {
      index: {
        default: 0,
        type: Number
      }
    },
    methods: {
      getSrc() {
        const images = require.context('./../images/dnk', false, /\.jpg$/);
        return images(`./0${this.$props.index}.jpg`);
      }
    }
  };

</script>

<template>
  <figure>
    <img
      :src="getSrc()" 
      alt="Denny K. Schuldt"
    >
  </figure>
</template>

<style scoped>

  figure {
    right: 0;
    width: 350px;
    height: 80vh;
    margin-left: 0;
    margin-right: 0;
    margin-top: 10vh;
    position: absolute;
    pointer-events: none;
  }

  img {
    width: 350px;
    height: 80vh;
    position: fixed;
    object-fit: cover;
    border-radius: 20px;
    box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23);
  }

  @media only screen and (max-width: 1000px) {
    figure, img {
      width: 300px;
    }
  }

  @media only screen and (max-width: 800px) {
    figure {
      height: auto;
      width: 100%;
      margin-top: 0;
      position: inherit;
    }
    img {
      height: auto;
      width: 100%;
      position: inherit;
      margin-bottom: 100px;
    }
  }

</style>
