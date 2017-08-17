import "uikit/dist/css/uikit.css";
import $ from "jquery";
import UIkit from "uikit";
import Icons from "uikit/dist/js/uikit-icons";
import Vue from "vue";
import UkRope from "../dist/build";

UIkit.use(Icons);

Vue.component("uk-rope", UkRope);
new Vue({
    el: "#app"
});
