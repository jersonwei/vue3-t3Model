<template>
    <div ref="background" class="background">
        <canvas class="canvas" ref="canvas" :width="width" :height="height">
        </canvas>
        <canvas class="line" ref="line" :width="width" :height="height"></canvas>
        <div class="slot">
            <slot></slot>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        right: {
            type: Boolean,
            default: true
        }
    },
    methods: {
        drawLine(ctx, x0, y0, x1, y1) {
            const gradient = ctx.createLinearGradient(x0, y0, x1, y1)
            gradient.addColorStop(0, '#ffffff00')
            gradient.addColorStop(0.5, '#f7f8f8')
            gradient.addColorStop(1, '#ffffff00')
            ctx.strokeStyle = gradient
            ctx.beginPath()
            ctx.moveTo(x0, y0)
            ctx.lineTo(x1, y1)
            ctx.stroke()
        },
        lineTween() {
            const { width, height } = this
            // console.log('drawLine')
            const ctx = this.$refs.line.getContext('2d')
            ctx.clearRect(0, 0, width, height)
            ctx.lineWidth = 1
            const map = new Map([
                [0, this.drawRightLine],
                [1, this.drawRightDownLine],
                [2, this.drawDownLine],
                [3, this.drawDownLeftLine],
                [4, this.drawLeftLine],
                [5, this.drawUpLeftLine],
                [6, this.drawUpLine],
                [7, this.drawRightUpLine]
            ])
            map.has(this.direction) && map.get(this.direction).call(this, ctx)

            this.requestId = window.requestAnimationFrame(() => this.lineTween())
        },
        drawRightLine(ctx) {
            const {
                point: { x },
                point,
                lineWidth,
                width,
                v
            } = this
            if (x + lineWidth < width - 31) {
                this.drawLine(ctx, x, 13, x + lineWidth, 13)
                point.x += v
            } else {
                this.direction++
                point.y = 31
                this.drawRightDownLine(ctx)
            }
        },
        drawRightDownLine(ctx) {
            const {
                point: { x, y },
                point,
                width,
                v
            } = this

            this.drawLine(ctx, x, 13, width - 31, 13)
            this.drawLine(ctx, width - 11, 31, width - 11, y)
            point.y += v

            if (x < width - 31) {
                point.x += v
            } else {
                this.direction++
                this.drawDownLine(ctx)
            }
        },
        drawDownLine(ctx) {
            const {
                point: { y },
                point,
                width,
                height,
                lineWidth,
                v
            } = this
            if (y < height - 41) {
                this.drawLine(ctx, width - 11, y - lineWidth, width - 11, y)
                point.y += v
            } else {
                this.direction++
                this.point.x = width - 81
                this.drawDownLeftLine(ctx)
            }
        },
        drawDownLeftLine(ctx) {
            const {
                point: { x, y },
                point,
                width,
                height,
                lineWidth,
                v
            } = this

            if (y - lineWidth < height - 41) {
                this.drawLine(ctx, width - 11, y - lineWidth, width - 11, height - 41)
                point.y += v

                this.drawLine(ctx, width - 81, height - 13, x, height - 13)
                point.x -= v
            } else {
                this.direction++
                point.y = height - 13
                this.drawLeftLine(ctx)
            }
        },
        drawLeftLine(ctx) {
            const {
                point: { x },
                point,
                height,
                lineWidth,
                v
            } = this
            if (x > 13) {
                this.drawLine(ctx, x + lineWidth, height - 13, x, height - 13)
                point.x -= v
            } else {
                this.direction++
                this.drawUpLeftLine(ctx)
            }
        },
        drawUpLeftLine(ctx) {
            const {
                point: { x, y },
                point,
                height,
                lineWidth,
                v
            } = this
            if (x + lineWidth > 13) {
                this.drawLine(ctx, x + lineWidth, height - 13, 13, height - 13)
                point.x -= v

                this.drawLine(ctx, 13, height - 13, 13, y)
                point.y -= v
            } else {
                this.direction++
                point.x = 13
                this.drawUpLine(ctx)
            }
        },
        drawUpLine(ctx) {
            const {
                point: { y },
                point,
                lineWidth,
                v
            } = this
            if (y > 13) {
                this.drawLine(ctx, 13, y + lineWidth, 13, y)
                point.y -= v
            } else {
                this.direction++
                this.drawRightUpLine(ctx)
            }
        },
        drawRightUpLine(ctx) {
            const {
                point: { x, y },
                point,
                lineWidth,
                v
            } = this
            if (y + lineWidth > 13) {
                this.drawLine(ctx, 13, y + lineWidth, 13, 13)
                point.y -= v

                this.drawLine(ctx, 13, 13, x, 13)
                point.x += v
            } else {
                this.direction = 0
                this.point = { x: 13, y: 13 }
                this.drawRight(ctx)
            }
        },
        draw() {
            const { width, height } = this
            const ctx = this.$refs.canvas.getContext('2d')
            ctx.clearRect(0, 0, width, height)
            ctx.beginPath()
            ctx.lineWidth = 2
            ctx.strokeStyle = '#4971EC'
            ctx.fillStyle = 'rgba(6,15,37,0.8)'

            this.right
                ? this.drawRight(ctx, width, height)
                : this.drawLeft(ctx, width, height)
            ctx.save()
        },
        drawLeft(ctx, width, height) {
            const points = [
                [width - 1, 1],
                [width - 1, height - 1],
                [71, height - 1],
                [1, height - 31],
                [1, 21],
                [21, 21]
            ]

            ctx.moveTo(21, 1)
            this.lineTo(ctx, points)
            ctx.closePath()
            ctx.stroke()
            ctx.fill()

            ctx.fillStyle = 'white'
            const rects = [
                [0, 0, 6, 6],
                [31, 11, 4, 4],
                [width - 13, 11, 4, 4],
                [width - 13, height - 13, 4, 4],
                [81, height - 13, 4, 4],
                [11, height - 43, 4, 4],
                [11, 31, 4, 4]
            ]
            this.fillRect(ctx, rects)
        },
        drawRight(ctx, width, height) {
            const points = [
                [width - 21, 1],
                [width - 21, 21],
                [width - 1, 21],
                [width - 1, height - 31],
                [width - 71, height - 1],
                [1, height - 1]
            ]
            ctx.moveTo(1, 1)
            this.lineTo(ctx, points)
            ctx.closePath()
            ctx.stroke()
            ctx.fill()

            ctx.fillStyle = 'white'
            const rects = [
                [width - 6, 0, 6, 6],
                [11, 11, 4, 4],
                [width - 31, 11, 4, 4],
                [width - 13, 31, 4, 4],
                [width - 13, height - 41, 4, 4],
                [width - 81, height - 15, 4, 4],
                [11, height - 15, 4, 4]
            ]
            this.fillRect(ctx, rects)
        },
        lineTo(ctx, points) {
            points.forEach((point) => ctx.lineTo(...point))
        },
        fillRect(ctx, rects) {
            rects.forEach((rect) => ctx.fillRect(...rect))
        },
        layout() {
            this.$nextTick(() => {
                this.draw()
                this.lineTween()
            })
        }
    },
    mounted() {
        const { clientWidth, clientHeight } = this.$refs.background
        Object.assign(this, { width: clientWidth, height: clientHeight })
        this.layout()
        const MutationObserver =
            window.MutationObserver ||
            window.WebKitMutationObserver ||
            window.MozMutationObserver
        if (this.observer) {
            this.observer.disconnect()
        }
        this.observer = new MutationObserver(mutations => {
            this.direction = 0
            this.point = { x: 13, y: 31 }
            const { clientWidth, clientHeight } = this.$refs.background
            Object.assign(this, { width: clientWidth, height: clientHeight })
            window.cancelAnimationFrame(this.requestId)
            this.layout()
        })
        this.observer.observe(this.$refs.background, {
            attributes: true,
            attributeFilter: ['style'],
            attributeOldValue: true
        })
    },
    beforeDestroy() {
        this.observer.disconnect()
        window.cancelAnimationFrame(this.requestId)
    },
    data() {
        this.lineWidth = 100 // 线长
        this.v = 4 // 速度
        this.point = { x: 13, y: 31 }
        this.direction = 0
        return {
            clientHeight: 0,
            width: 0,
            height: 0
        }
    }
}
</script>

<style lang="scss" scoped>
.background {
    position: relative;
    width: 100%;
    height: 100%;

    .canvas {
        z-index: 0;
        position: absolute;
        filter: drop-shadow(0 2px 8px #0584f2);
    }

    .line {
        position: absolute;
        z-index: 1;
        box-sizing: border-box;
        height: 100%;
        width: 100%;
    }

    .slot {
        position: absolute;
        padding: 30px;
        color: white;
        z-index: 2;
        box-sizing: border-box;
        height: 100%;
        width: 100%;
    }
}
</style>
