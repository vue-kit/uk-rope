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
                @mouseenter.stop.prevent="showHandle"
                @mousemove.stop.prevent="moveHandle"
                @mousedown.stop.prevent="fixHandle"
                @mouseleave.stop.prevent="hideHandle")
            circle(v-if="handleShow" :cx="this.cx" :cy="this.cy" :r="gap / 2"
                   :fill="color" :pos="this.pos")
            circle.fixed(v-for="(handle, index) of handles"
                  :cx="handle.cx" :cy="handle.cy" :r="gap / 2"
                  :fill="color" :pos="handle.pos" :index="index"
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
                handleShow: false,
                cx: -this.gap,
                cy: -this.gap,
                pos: "",
                handles: [],
                handleFixed: false,
                handleDragged: false,
                handle: null
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
            }
        },
        methods: {
            showHandle(evt) {
                let cx, cy;
                let pos = evt.target.getAttribute("name");
                switch (pos) {
                    case "lt":
                        cx = this.gap / 2;
                        cy = this.gap / 2;
                        break;
                    case "t":
                        cx = evt.clientX - this.$el.getBoundingClientRect().left;
                        cy = this.gap / 2;
                        break;
                    case "rt":
                        cx = this.width - this.gap / 2;
                        cy = this.gap / 2;
                        break;
                    case "l":
                        cx = this.gap / 2;
                        cy = evt.clientY - this.$el.getBoundingClientRect().top;
                        break;
                    case "r":
                        cx = this.width - this.gap / 2;
                        cy = evt.clientY - this.$el.getBoundingClientRect().top;
                        break;
                    case "lb":
                        cx = this.gap / 2;
                        cy = this.height - this.gap / 2;
                        break;
                    case "b":
                        cx = evt.clientX - this.$el.getBoundingClientRect().left;
                        cy = this.height - this.gap / 2;
                        break;
                    case "rb":
                        cx = this.width - this.gap / 2;
                        cy = this.height - this.gap / 2;
                        break;
                }
                if (!this.handleDragged) {
                    if (!this.handleFixed) {
                        this.handleShow = true;
                        this.cx = cx;
                        this.cy = cy;
                        this.pos = pos;
                    }
                } else {
                    this.handle.cx = cx;
                    this.handle.cy = cy;
                    this.handle.pos = pos;
                }
            },
            moveHandle(evt) {
                if (!this.handleFixed && !this.handleDragged) {
                    switch (evt.target.getAttribute("name")) {
                        case "t":
                            this.cx = evt.clientX - this.$el.getBoundingClientRect().left;
                            this.cy = this.gap / 2;
                            break;
                        case "b":
                            this.cx = evt.clientX - this.$el.getBoundingClientRect().left;
                            this.cy = this.height - this.gap / 2;
                            break;
                        case "l":
                            this.cx = this.gap / 2;
                            this.cy = evt.clientY - this.$el.getBoundingClientRect().top;
                            break;
                        case "r":
                            this.cx = this.width - this.gap / 2;
                            this.cy = evt.clientY - this.$el.getBoundingClientRect().top;
                            break;
                    }
                }
            },
            fixHandle(evt) {
                if (!this.handleDragged) {
                    this.handleFixed = true;
                    document.documentElement.addEventListener("mouseup", this.looseHandle, true);
                    this.$emit("fix-handle", this.cx + this.left, this.cy + this.top);
                }
            },
            looseHandle(evt) {
                if (!this.handleDragged) {
                    this.handleFixed = false;
                    document.documentElement.removeEventListener("mouseup", this.looseHandle, true);
                    this.handles.push({
                        cx: this.cx,
                        cy: this.cy,
                        pos: this.pos
                    });
                }
            },
            hideHandle(evt) {
                if (!this.handleFixed && !this.handleDragged) this.handleShow = false;
            },
            handleDragStart(evt) {
                this.handleDragged = true;
                document.documentElement.style.cursor = "move";
                document.documentElement.addEventListener("mousemove", this.handleDrag, true);
                document.documentElement.addEventListener("mouseup", this.handleDragEnd, true);
                this.handle = this.handles[evt.target.getAttribute("index")];
            },
            handleDrag(evt) {
                if (this.handle) {
                    switch(this.handle.pos) {
                        case "lt":
                        case "t":
                        case "rt":
                        case "lb":
                        case "b":
                        case "rb":
                            let offsetX = this.handle.cx + evt.movementX;
                            if (offsetX >= this.gap / 2 && offsetX <= this.width - this.gap / 2) {
                                this.handle.cx = offsetX;
                            }
                            break;
                        case "l":
                        case "r":
                            let offsetY = this.handle.cy + evt.movementY;
                            if (offsetY >= this.gap / 2 && offsetY <= this.height - this.gap / 2) {
                                this.handle.cy = offsetY;
                            }
                            break;
                    }
                    this.$emit("drag-handle", this.handle.cx + this.left, this.handle.cy + this.top);
                }
            },
            handleDragEnd(evt) {
                this.handleDragged = false;
                document.documentElement.removeEventListener("mousemove", this.handleDrag, true);
                document.documentElement.removeEventListener("mouseup", this.handleDragEnd, true);
                document.documentElement.style.cursor = "auto";
                this.handle = null;
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
        .fixed {
            pointer-events: all;
            cursor: move;
        }
    }
</style>
