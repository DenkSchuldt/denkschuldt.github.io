import '../css/main.scss';
import $ from 'jquery';


$(document).ready(()=>{

  updateContent("Hello World!");
  updateHeight();
  $(".background").css("backgroundColor", "white");
  $(".content").fadeIn(
    ()=>setTimeout(()=>$(".content").fadeOut(), 1000)
  );

  setTimeout(()=> {
    updateContent("I'm Denny.");
    updateHeight();
    $(".content").fadeIn(() => {
      setTimeout(() => {
        appendContent("<p>A Computer Science Engineer.</p");
        $("p").fadeIn();
        updateHeight();
        setTimeout(() => {
          appendContent('<a href="https://github.com/DenkSchuldt" target="_blank" class="icon github"><i class="fa fa-github" aria-hidden="true"></i></a>');
          appendContent('<a href="https://twitter.com/DenkSchuldt" target="_blank" class="icon twitter"><i class="fa fa-twitter" aria-hidden="true"></i></a>');
          appendContent('<a href="https://www.instagram.com/denkschuldt/" target="_blank" class="icon instagram"><i class="fa fa-instagram" aria-hidden="true"></i></a>');
          setTimeout(() => {
            $(".icon").fadeIn();
          }, 250)
        }, 500)
      }, 500)
    });
  }, 1800)

})

/**
 *
 */
const updateHeight = () => (
  $(".content").css("marginTop", -$(".content").height()/2)
)

/**
 *
 */
const updateContent = (str) => (
  $(".content").html("<h1>"+str+"</h1>")
)

/**
 *
 */
const appendContent = (str) => (
  $(".content").append(str)
)
