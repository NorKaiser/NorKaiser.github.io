const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.ENVELOP,
        parent: 'app',
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: this.innerWidth,
        height: this.innerHeight,
    },
    pixelArt: true,
    scene: [MainGame]
}
const game = new Phaser.Game(config);