
<template>
  <footer>
    <div class='dnk-separator'></div>
    <div class='dnk-social'>
      <a
        target='_blank'
        rel='noopener noreferrer'
        href='https://github.com/DenkSchuldt'>
        <i class="fab fa-github"></i>
      </a>
      <a
        target='_blank'
        rel='noopener noreferrer'
        href='https://twitter.com/DenkSchuldt'>
        <i class="fab fa-twitter"></i>
      </a>
      <a
        target='_blank'
        rel='noopener noreferrer'
        href='https://www.instagram.com/denkschuldt/'>
        <i class="fab fa-instagram"></i>
      </a>
    </div>
  </footer>
</template>

<script>

  export default {
    name: 'Footer'
  };

</script>

<style scoped>

  .dnk-separator {
    width: 70%;
    height: 4px;
    margin: auto;
    border-radius: 100%;
    transition: all 0.3s cubic-bezier(.25,.8,.25,1);
    background-image: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.2));
  }
  .dnk-social {
    width: 100%;
    display: flex;
    padding: 40px 0;
    align-items: center;
    justify-content: center;
  }
  a {
    color: #fff;
    width: 32px;
    height: 32px;
    display: flex;
    margin: 0 12px;
    font-size: 24px;
    align-items: center;
    text-decoration: none;
    justify-content: center;
    will-change: font-size;
    transition: all 0.3s cubic-bezier(.25,.8,.25,1);
  }
    a:hover {
      font-size: 32px;
    }

  @media only screen and (max-width: 850px) {
    .dnk-separator {
      width: 80%
    }
  }

  @media only screen and (max-width: 700px) {
    .dnk-separator {
      width: 90%
    }
    .dnk-social {
      padding: 12px 0;
    }
    a {
      font-size: 16px;
    }
      a:hover {
        font-size: 20px;
      }
  }

</style>
