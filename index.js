const config = {
    type: Phaser.AUTO,
    width: 540,
    height: 960,
    pixelArt: true,
    parent: 'app',
    scene: [MainGame]
}
const game = new Phaser.Game(config);