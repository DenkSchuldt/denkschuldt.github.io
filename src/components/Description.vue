
<template>
  <div class='dnk-description-wrapper'>
    <div class='dnk-description'>
      <h1>About</h1>
      <p>
        Denny K. Schuldt is a Knowledge driven developer, with a passion for code quality and user experience. He has a great common sense and a pixel perfect attention to detail.
      </p>
      <p>
        Over the years Denny has gained professional experience in the Software development field, working with front-end, back-end and mobile technologies. He started in this field as an intern for Blindside Networks, a company based in Canada, and ever since he hasn't stopped learning, working in places like Escuela Superior Politécnica del Litoral, Dátil, Pacificsoft, and currently, Shippify.
      </p>
      <p>
        He's also participated in software communities like TAWS, a student club for which he was designated as President for two years, or Guayaquil Developers.
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
    </div>
  </div>
</template>

<script>

  export default {
    name: 'Description',
    mounted: () => {
      document
      .querySelector('.dnk-description-wrapper')
      .addEventListener('scroll', e => {
        const { scrollTop, scrollHeight, offsetHeight } = e.target;
        if (scrollTop + offsetHeight == scrollHeight) {
          document.querySelector('.dnk-separator').style.opacity = 0;
        } else {
          document.querySelector('.dnk-separator').style.opacity = 1;
        }
      });
    }
  };

</script>

<style scoped>

  .dnk-description-wrapper {
    width: 100%;
    height: 100%;
    overflow-y: auto;
  }
    .dnk-description {
      width: 60%;
      margin: auto;
      color: #f5f5f5;
      font-size: 18px;
      max-width: 720px;
      text-align: left;
      margin-top: 80px;
      height: fit-content;
    }
      .dnk-description h1 {
        margin: 0;
      }
      .dnk-description p a {
        color: #fff;
        font-weight: bold;
        will-change: opacity;
        transition: all 0.3s cubic-bezier(.25,.8,.25,1);
      }
      .dnk-description p a:hover {
        opacity: 0.8;
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

  @media only screen and (max-width: 850px) {
    .dnk-description {
      width: 70%;
      font-size: 18px;
      max-width: 70%;
    }
  }

  @media only screen and (max-width: 700px) {
    .dnk-description {
      width: 80%;
      font-size: 18px;
      max-width: 80%;
    }
  }

</style>
