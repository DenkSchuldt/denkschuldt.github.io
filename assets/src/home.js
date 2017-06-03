
/**
 * home.js
 * Home module
 *
 * @version 1.0
 * @author  Denny K. Schuldt
 *
 */

import $ from 'jquery';
import React from 'react';

/**
 *
 */
const Home = React.createClass({
  componentDidMount() {
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
            appendContent('<a href="https://github.com/DenkSchuldt?tab=repositories" target="_blank" class="icon icon-sm github"><i class="fa fa-github" aria-hidden="true"></i></a>');
            appendContent('<div><hr/></div>');
            setTimeout(() => {
              updateHrWidth();
              updateHeight();
              $(".icon").fadeIn(() => {
                appendContent('<a href="https://play.google.com/store/apps/details?id=com.dennyschuldt.babahoyo.vr" target="_blank"><div class="icon"><img src="/assets/images/babahoyovr.png"/></div><span>Babahoyo VR</span></a>');
                appendContent('<a href="https://play.google.com/store/apps/details?id=com.dennyschuldt.colors" target="_blank"><div class="icon"><img src="/assets/images/colors.png"/></div><span>Colors</span></a>');
                appendContent('<a href="#/360" class="icon"><strong>360º</strong></a>');
                updateHeight();
                $(".icon").fadeIn();
              });
            }, 250)
          }, 500)
        }, 500)
      });
    }, 1800)
  },
  render() {
    return (
      <div id="home">
        <div className="background"></div>
        <div className="content"></div>
      </div>
    )
  }
});

/**
 *
 */
const updateHeight = () => (
  $(".content").css("marginTop", -$(".content").height()/2)
)

/**
 *
 */
const updateHrWidth = () => (
  $("hr").css("width", "70%")
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


export default Home;
