import "uikit/dist/css/uikit.css";
import $ from "jquery";
import UIkit from "uikit";
import Icons from "uikit/dist/js/uikit-icons";
import Vue from "vue";
import UkLine from "uk-line";
import UkRope from "../dist/build";

UIkit.use(Icons);

let jointLine = null;
let lines = {};

Vue.component("uk-rope", UkRope);
Vue.component("uk-line", UkLine);
new Vue({
    el: "#app",
    methods: {
        drawstart(sx, sy) {
            jointLine = new Vue({
                data: {
                    x1: sx,
                    y1: sy,
                    x2: sx,
                    y2: sy
                },
                template: "<uk-line :x1='x1' :y1='y1' :x2='x2' :y2='y2' v-if='show'>" +
                          "</uk-line>",
                computed: {
                    show() {
                        return this.x1 != this.x2 || this.y1 != this.y2;
                    }
                }
            }).$mount();
            this.$container.append(jointLine.$el);
        },
        draw(mx, my) {
            jointLine.x2 += mx;
            jointLine.y2 += my;
        },
        drawend(index) {
            lines[index] = jointLine;
        },
        dragstart(index) {
            jointLine = lines[index];
        },
        drag(x, y) {
            jointLine.x1 = x;
            jointLine.y1 = y;
        }
    },
    mounted() {
        this.$container = $(".uk-position-relative");
    }
});
