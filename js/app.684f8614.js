(function(e){function t(t){for(var r,i,s=t[0],c=t[1],l=t[2],d=0,p=[];d<s.length;d++)i=s[d],Object.prototype.hasOwnProperty.call(a,i)&&a[i]&&p.push(a[i][0]),a[i]=0;for(r in c)Object.prototype.hasOwnProperty.call(c,r)&&(e[r]=c[r]);u&&u(t);while(p.length)p.shift()();return o.push.apply(o,l||[]),n()}function n(){for(var e,t=0;t<o.length;t++){for(var n=o[t],r=!0,s=1;s<n.length;s++){var c=n[s];0!==a[c]&&(r=!1)}r&&(o.splice(t--,1),e=i(i.s=n[0]))}return e}var r={},a={app:0},o=[];function i(t){if(r[t])return r[t].exports;var n=r[t]={i:t,l:!1,exports:{}};return e[t].call(n.exports,n,n.exports,i),n.l=!0,n.exports}i.m=e,i.c=r,i.d=function(e,t,n){i.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},i.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},i.t=function(e,t){if(1&t&&(e=i(e)),8&t)return e;if(4&t&&"object"===typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(i.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)i.d(n,r,function(t){return e[t]}.bind(null,r));return n},i.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return i.d(t,"a",t),t},i.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},i.p="/";var s=window["webpackJsonp"]=window["webpackJsonp"]||[],c=s.push.bind(s);s.push=t,s=s.slice();for(var l=0;l<s.length;l++)t(s[l]);var u=c;o.push([0,"chunk-vendors"]),n()})({0:function(e,t,n){e.exports=n("56d7")},"034f":function(e,t,n){"use strict";n("85ec")},"0aae":function(e,t,n){"use strict";n("f3ba")},"10ee":function(e,t,n){e.exports=n.p+"img/react-dialog.19a5514b.png"},"2a93":function(e,t,n){"use strict";n("61ca")},3397:function(e,t,n){},"56d7":function(e,t,n){"use strict";n.r(t);n("e260"),n("e6cf"),n("cca6"),n("a79d");var r=n("2b0e"),a=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{style:{background:"linear-gradient("+e.backgrounds[e.index]+", "+e.backgrounds[e.index>=3?0:e.index+1]+")"},attrs:{id:"app"}},[n("div",{staticClass:"dnk-wrapper"},[n("Nav",{attrs:{selectSection:e.selectSection,selectedSection:e.selectedSection}}),n("Content",{attrs:{selectedSection:e.selectedSection}})],1),n("Footer")],1)},o=[],i=(n("a9e3"),function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("nav",[n("h1",{class:{"dnk-selected":"about"==e.selectedSection},attrs:{id:"about"},on:{click:function(t){return e.selectSection("about")}}},[e._v(" About ")]),n("i",{staticClass:"fas fa-circle"}),n("h1",{class:{"dnk-selected":"projects"==e.selectedSection},attrs:{id:"projects"},on:{click:function(t){return e.selectSection("projects")}}},[e._v(" Projects ")])])}),s=[],c={name:"Nav",props:{selectedSection:{type:String},selectSection:{type:Function}}},l=c,u=(n("88f7"),n("2877")),d=Object(u["a"])(l,i,s,!1,null,"4728cb88",null),p=d.exports,f=function(){var e=this,t=e.$createElement;e._self._c;return e._m(0)},h=[function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("footer",[n("div",{staticClass:"dnk-separator"}),n("div",{staticClass:"dnk-social"},[n("a",{attrs:{target:"_blank",rel:"noopener noreferrer",href:"https://github.com/DenkSchuldt"}},[n("i",{staticClass:"fab fa-github"})]),n("a",{attrs:{target:"_blank",rel:"noopener noreferrer",href:"https://twitter.com/DenkSchuldt"}},[n("i",{staticClass:"fab fa-twitter"})]),n("a",{attrs:{target:"_blank",rel:"noopener noreferrer",href:"https://www.instagram.com/denkschuldt/"}},[n("i",{staticClass:"fab fa-instagram"})])])])}],b={name:"Footer"},v=b,m=(n("0aae"),Object(u["a"])(v,f,h,!1,null,"485da98d",null)),g=m.exports,k=function(){var e=this,t=e.$createElement,r=e._self._c||t;return r("section",[r("transition",{attrs:{name:"fade",mode:"out-in"}},["about"==e.selectedSection?r("article",{attrs:{id:"article-about"}},[r("p",[e._v(" Denny K. Schuldt is a Knowledge driven developer, with a passion for code quality and user experience. He has a great common sense and a pixel perfect attention to detail. ")]),r("p",[e._v(" Over the years Denny has gained professional experience in the Software development field, working with front-end, back-end and mobile technologies. He started in this field as an intern for Blindside Networks, a company based in Canada, and he hasn't stopped learning ever since, working in places like Escuela Superior Politécnica del Litoral, Dátil, Pacificsoft, and currently, Shippify. ")]),r("p",[e._v(" He's also participated in software communities like TAWS, a student club for which he was designated as President for two years, or Guayaquil Developers giving a short talk about Webpack. ")]),r("p",[e._v(' His main personal project is "'),r("a",{attrs:{href:"http://dennyschuldt.com/360",target:"_blank",rel:"noopener noreferrer"}},[e._v("Aventuras en 360")]),e._v('", in which he collects self-taken 360 photographs of touristic places, aiming to share their beauty with the world. ')]),r("p",[e._v('In the past he\'s also created apps like "Babahoyo VR", the first ever Virtual Reality app for touristic places in Babahoyo, Ecuador, which was available in the Google Play store.')]),r("p",[e._v(" You can know more about Denny following him on social media, where you can find him as "),r("a",{attrs:{href:"https://twitter.com/DenkSchuldt",target:"_blank",rel:"noopener noreferrer"}},[e._v("@DenkSchuldt")]),e._v(". ")]),r("p",{staticClass:"fa-circle-wrapper"},[r("i",{staticClass:"fas fa-circle"})])]):e._e()]),r("transition",{attrs:{name:"fade",mode:"out-in"}},["projects"==e.selectedSection?r("article",{attrs:{id:"article-projects"}},[r("a",{staticClass:"dnk-project",attrs:{target:"_blank",rel:"noopener noreferrer",href:"https://www.npmjs.com/package/@denkschuldt/react-dialog"}},[r("img",{attrs:{src:n("10ee"),alt:"@denkschuldt/react-dialog"}}),r("h4",[e._v("@denkschuldt/react-dialog")]),r("div",[e._v("A simple to use and customizable react dialog implementation.")]),r("footer",[e._v(" 2021 - Present ")])]),r("a",{staticClass:"dnk-project",attrs:{target:"_blank",rel:"noopener noreferrer",href:"http://dennyschuldt.com/360"}},[r("img",{attrs:{src:n("e7f8"),alt:"Aventuras en 360"}}),r("h4",[e._v("Aventuras en 360")]),r("div",[e._v(" I created this project to share the beauty of the touristic places I've been with a 360º view. All pictures featured are mine and taken by myself, sometimes with a phone, others with a 360 camera. ")]),r("footer",[e._v(" 2016 - Present ")])]),r("p",{staticClass:"fa-circle-wrapper"},[r("i",{staticClass:"fas fa-circle"})])]):e._e()])],1)},w=[],y={name:"Content",props:{selectedSection:{type:String}}},_=y,S=(n("2a93"),Object(u["a"])(_,k,w,!1,null,"237aa28e",null)),j=S.exports,x={name:"App",components:{Nav:p,Content:j,Footer:g},data:function(){return{index:Number(localStorage.getItem("dnk-index"))||0,backgrounds:["#00897b","#00acc1","#1e88e5","#3949ab"],selectedSection:"about"}},methods:{selectSection:function(e){this.selectedSection=e}},mounted:function(){document.querySelector(".dnk-wrapper").addEventListener("scroll",(function(e){var t=e.target,n=t.scrollTop,r=t.scrollHeight,a=t.offsetHeight;document.querySelector(".dnk-separator").style.opacity=n+a>=r?0:1})),localStorage.setItem("dnk-index",this.index>=3?0:this.index+1)}},C=x,O=(n("034f"),Object(u["a"])(C,a,o,!1,null,null,null)),P=O.exports;r["a"].config.productionTip=!1,new r["a"]({render:function(e){return e(P)}}).$mount("#app")},"61ca":function(e,t,n){},"85ec":function(e,t,n){},"88f7":function(e,t,n){"use strict";n("3397")},e7f8:function(e,t,n){e.exports=n.p+"img/360.e1697108.png"},f3ba:function(e,t,n){}});
//# sourceMappingURL=app.684f8614.js.map