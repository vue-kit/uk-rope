<template lang="pug">
    .uk-rope(:style="style")
        svg(:width="width" :height="height" :viewBox="box")
            path(:d="path" :stroke="color" :stroke-width="borderWidth"
                :stroke-dasharray="dash" fill="none")
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
                left: 0
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
                return "M" + offset + " " + offset +
                        " L" + (this.width - offset) + " " + offset +
                        " L" + (this.width - offset) + " " + (this.height - offset) +
                        " L" + offset + " " + (this.height - offset) + "Z";
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
    }
</style>
