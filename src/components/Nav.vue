
<template>
  <nav>
    <h1
      id='about'
      @click='selectSection("about")'
      :class='{"dnk-selected": selectedSection == "about"}'>
      About
    </h1>
    <i class="fas fa-circle"></i>
    <h1
      id='projects'
      @click='selectSection("projects")'
      :class='{"dnk-selected": selectedSection == "projects"}'>
      Projects
    </h1>
  </nav>
</template>

<script>

  export default {
    name: 'Nav',
    props: {
      selectedSection: {
        type: String
      },
      selectSection: {
        type: Function
      }
    }
  };

</script>

<style scoped>

  nav {
    width: 100%;
    display: flex;
    min-height: 60px;
    margin-top: 80px;
    align-items: center;
  }
  nav h1 {
    margin: 0;
    color: #fff;
    cursor: pointer;
    font-weight: bold;
    will-change: opacity;
    transition: all 0.3s cubic-bezier(.25,.8,.25,1);
  }
    nav h1:hover {
      opacity: 0.8;
    }
  nav .dnk-selected {
    font-size: 2.4em;
  }
  .fa-circle {
    color: #fff;
    opacity: 0.5;
    font-size: 12px;
    margin: 0 24px;
  }

  @media only screen and (max-width: 850px) {
    nav {
      width: 70%;
      font-size: 18px;
      max-width: 70%;
    }
  }

  @media only screen and (max-width: 700px) {
    nav {
      width: 80%;
      font-size: 18px;
      max-width: 80%;
    }
    .fa-circle {
      margin: 0 12px;
    }
  }

</style>
