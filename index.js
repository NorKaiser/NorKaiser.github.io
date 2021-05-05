const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'app',
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 540,
        height: 960,
    },
    pixelArt: true,
    scene: [MainGame]
}
const game = new Phaser.Game(config);