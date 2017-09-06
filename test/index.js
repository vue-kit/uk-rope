import "uikit/dist/css/uikit.css";
import $ from "jquery";
import UIkit from "uikit";
import Icons from "uikit/dist/js/uikit-icons";
import Vue from "vue";
import UkLine from "uk-line";
import UkRope from "../dist/build";

UIkit.use(Icons);

let jointLine = null;
let drawing = false, landOnBorder = false;
let lines = {};

Vue.component("uk-rope", UkRope);
Vue.component("uk-line", UkLine);
new Vue({
    el: "#app",
    methods: {
        drawstart(sx, sy) {
            jointLine = new Vue({
                template: "<uk-line :x1='x1' :y1='y1' :x2='x2' :y2='y2'></uk-line>",
                data: {
                    x1: sx,
                    y1: sy,
                    x2: sx,
                    y2: sy
                }
            }).$mount();
            this.$container.append(jointLine.$el);
            drawing = true;
        },
        draw(mx, my) {
            if (!landOnBorder) {
                jointLine.x2 += mx;
                jointLine.y2 += my;
            }
        },
        drawend(id) {
            lines[id] = jointLine;
            drawing = false;
            landOnBorder = false;
        },
        dragstart(id) {
            jointLine = lines[id];
        },
        drag(x, y) {
            jointLine.x1 = x;
            jointLine.y1 = y;
        },
        land(x, y) {
            if (drawing) {
                landOnBorder = true;
                jointLine.x2 = x;
                jointLine.y2 = y;
            }
        },
        move(x, y) {
            if (landOnBorder) {
                jointLine.x2 = x;
                jointLine.y2 = y;
            }
        }
    },
    mounted() {
        this.$container = $(".uk-position-relative");
    }
});
