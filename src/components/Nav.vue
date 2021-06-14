
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
    font-size: 1.4em;
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
      max-width: 70%;
      font-size: 18px;
      margin-top: 40px;
    }
      nav h1 {
        font-size: 1.2em;
      }
      nav .dnk-selected {
        font-size: 2em;
      }
  }

  @media only screen and (max-width: 700px) {
    nav {
      width: 80%;
      max-width: 80%;
      font-size: 18px;
      margin-top: 20px;
    }
      nav h1 {
        font-size: 1em;
      }
      nav .dnk-selected {
        font-size: 1.5em;
      }
    .fa-circle {
      margin: 0 12px;
    }
  }

</style>
