<template lang="pug">
    .uk-rope(:style="style")
        svg(:width="width" :height="height" :viewBox="box")
            path(:d="path" :stroke="color" :stroke-width="borderWidth"
                :stroke-dasharray="dash" fill="none")
            rect(v-for="border of borders"
                :name="border.name"
                :x="border.x" :y="border.y"
                :width="border.width" :height="border.height"
                fill="none"
                @mouseenter.stop.prevent="addHandle"
                @mousemove.stop.prevent="moveHandle"
                @mousedown.stop.prevent="fixHandle"
                @mouseleave.stop.prevent="removeHandle")
            circle(v-for="handle of handles"
                  :cx="handle.cx" :cy="handle.cy"
                  :r="gap / 2" :fill="color"
                  @mousedown.stop.prevent="handleDragStart")
</template>
<script>
    export default {
        name: "uk-rope",
        props: {
            target: {
                type: Array,
                required: true,
                validator(val) {
                    for (let v of val) {
                        if (!/^(#|\.)/.test(v) || v.length <= 1) {
                            console.error("The target: " + v + " is invalid.");
                            return false;
                        }
                    }
                    return true;
                }
            },
            padding: {
                type: [String, Number],
                default: 10,
                validator(val) {
                    return !isNaN(val) && parseInt(val) > 0;
                }
            },
            strokeWidth: {
                type: [String, Number],
                default: 1,
                validator(val) {
                    return !isNaN(val) && parseFloat(val) > 0;
                }
            },
            strokeColor: {
                type: String,
                default: "default",
                validator(val) {
                    return val === "default" || val === "success" || val === "warning" ||
                            val === "danger" || /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(val)
                }
            },
            strokeDashed: {
                type: [String, Boolean],
                default: true,
                validator(val) {
                    return typeof val === "boolean" || val === "true" || val === "false";
                }
            }
        },
        data() {
            return {
                top: 0,
                left: 0,
                handles: [],
                handleFixed: false
            }
        },
        computed: {
            gap() {
                return parseInt(this.padding);
            },
            borderWidth() {
                return parseFloat(this.strokeWidth);
            },
            dashed() {
                return typeof this.strokeDashed === "string" ?
                        this.strokeDashed === "true" : this.strokeDashed;
            },
            tiedElements() {
                let elements = [];
                for (let t of this.target) {
                    if (/^#/.test(t)) {
                        let ele = document.getElementById(t.substring(1));
                        if (ele) {
                            let rect = ele.getBoundingClientRect();
                            elements.push({
                                left: rect.left,
                                top: rect.top,
                                right: rect.right,
                                bottom: rect.bottom
                            });
                        }
                    } else if (/^\./.test(t)) {
                        let eles = document.getElementsByClassName(t.substring(1));
                        if (eles) {
                            for (let ele of eles) {
                                let rect = ele.getBoundingClientRect();
                                elements.push({
                                    left: rect.left,
                                    top: rect.top,
                                    right: rect.right,
                                    bottom: rect.bottom
                                });
                            }
                        }
                    }
                }
                return elements;
            },
            ropeExtent() {
                return {
                    left: this.tiedElements.map(ele => ele.left)
                                           .reduce((min, cur) => Math.min(min, cur), Infinity),
                    top: this.tiedElements.map(ele => ele.top)
                                          .reduce((min, cur) => Math.min(min, cur), Infinity),
                    right: this.tiedElements.map(ele => ele.right)
                                            .reduce((max, cur) => Math.max(max, cur), -Infinity),
                    bottom: this.tiedElements.map(ele => ele.bottom)
                                             .reduce((max, cur) => Math.max(max, cur), -Infinity)
                }
            },
            width() {
                return this.ropeExtent.right - this.ropeExtent.left + this.gap * 2;
            },
            height() {
                return this.ropeExtent.bottom - this.ropeExtent.top + this.gap * 2;
            },
            box() {
                return "0 0 " + this.width + " " + this.height;
            },
            style() {
                return {
                    top: this.top + "px",
                    left: this.left + "px"
                }
            },
            path() {
                let offset = this.gap / 2 - this.borderWidth / 2;
                let lt = offset + " " + offset;
                let rt = (this.width - offset) + " " + offset;
                let lb = offset + " " + (this.height - offset);
                let rb = (this.width - offset) + " " + (this.height - offset);
                return "M" + lt + " L" + rt + " L" + rb + " L" + lb + "Z";
            },
            color() {
                let c = this.strokeColor;
                if (c == "default") {
                    c = "#1e87f0";
                } else if (c == "success") {
                    c = "#32d296";
                } else if (c == "warning") {
                    c = "#faa05a";
                } else if (c == "danger") {
                    c = "#f0506e";
                }
                return c;
            },
            dash() {
                if (this.dashed) {
                    return "1% 1%";
                } else {
                    return false;
                }
            },
            borders() {
                let rightX = this.width - this.gap;
                let bottomY = this.height - this.gap;
                let middleWidth = this.width - this.gap * 2;
                let middleHeight = this.height - this.gap * 2;
                return [
                    { name: "lt", x: 0, y: 0, width: this.gap, height: this.gap },
                    { name: "t", x: this.gap, y: 0, width: middleWidth, height: this.gap },
                    { name: "rt", x: rightX, y: 0, width: this.gap, height: this.gap },
                    { name: "l", x: 0, y: this.gap, width: this.gap, height: middleHeight },
                    { name: "r", x: rightX, y: this.gap, width: this.gap, height: middleHeight },
                    { name: "lb", x: 0, y: bottomY, width: this.gap, height: this.gap },
                    { name: "b", x: this.gap, y: bottomY, width: middleWidth, height: this.gap },
                    { name: "rb", x: rightX, y: bottomY, width: this.gap, height: this.gap }
                ]
            },
            latestHandle() {
                return this.handles[this.handles.length - 1];
            }
        },
        methods: {
            addHandle(evt) {
                if (!this.handleFixed) {
                    switch (evt.target.getAttribute("name")) {
                        case "lt":
                            this.handles.push({
                                cx: this.gap / 2,
                                cy: this.gap / 2
                            });
                            break;
                        case "t":
                            this.handles.push({
                                cx: evt.clientX - this.$el.getBoundingClientRect().left,
                                cy: this.gap / 2
                            });
                            break;
                        case "rt":
                            this.handles.push({
                                cx: this.width - this.gap / 2,
                                cy: this.gap / 2
                            });
                            break;
                        case "l":
                            this.handles.push({
                                cx: this.gap / 2,
                                cy: evt.clientY - this.$el.getBoundingClientRect().top
                            });
                            break;
                        case "r":
                            this.handles.push({
                                cx: this.width - this.gap / 2,
                                cy: evt.clientY - this.$el.getBoundingClientRect().top
                            });
                            break;
                        case "lb":
                            this.handles.push({
                                cx: this.gap / 2,
                                cy: this.height - this.gap / 2
                            });
                            break;
                        case "b":
                            this.handles.push({
                                cx: evt.clientX - this.$el.getBoundingClientRect().left,
                                cy: this.height - this.gap / 2
                            });
                            break;
                        case "rb":
                            this.handles.push({
                                cx: this.width - this.gap / 2,
                                cy: this.height - this.gap / 2
                            });
                            break;
                    }
                }
            },
            moveHandle(evt) {
                if (!this.handleFixed) {
                    switch (evt.target.getAttribute("name")) {
                        case "t":
                        case "b":
                            let offsetX = this.latestHandle.cx + evt.movementX;
                            if (offsetX >= this.gap / 2 && offsetX <= this.width - this.gap / 2) {
                                this.latestHandle.cx = offsetX;
                            }
                            break;
                        case "l":
                        case "r":
                            let offsetY = this.latestHandle.cy + evt.movementY;
                            if (offsetY >= this.gap / 2 && offsetY <= this.height - this.gap / 2) {
                                this.latestHandle.cy = offsetY;
                            }
                            break;
                    }
                }
            },
            fixHandle(evt) {
                this.handleFixed = true;
                document.documentElement.addEventListener("mouseup", this.looseHandle, true);
                this.$emit("fix-handle", this.latestHandle.cx + this.left, this.latestHandle.cy + this.top);
            },
            looseHandle(evt) {
                this.handleFixed = false;
                document.documentElement.removeEventListener("mouseup", this.looseHandle, true);
            },
            removeHandle(evt) {
                if (!this.handleFixed) this.handles.pop();
            },
            handleDragStart(evt) {

            }
        },
        mounted() {
            let positionedAncestor = this.$el.offsetParent;
            let rect = positionedAncestor.getBoundingClientRect();
            let tunedLeft = 0, tunedTop = 0;
            if (positionedAncestor.tagName.toLowerCase() === "body") {
                tunedLeft = rect.left;
                tunedTop = rect.top;
            }
            this.left = this.ropeExtent.left - rect.left - this.gap + tunedLeft;
            this.top = this.ropeExtent.top - rect.top - this.gap + tunedTop;
        }
    }
</script>
<style lang="less" scoped>
    .uk-rope {
        position: absolute;
        pointer-events: none;
        rect {
            pointer-events: all;
        }
    }
</style>
