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
    $(".content").fadeIn();
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
