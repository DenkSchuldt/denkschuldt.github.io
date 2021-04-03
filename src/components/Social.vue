
<template>
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
</template>

<script>

  export default {
    name: 'Social'
  };

</script>

<style scoped>

  .dnk-social {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  a {
    color: #fff;
    margin: 0 12px;
    font-size: 24px;
    text-decoration: none;
  }

</style>
