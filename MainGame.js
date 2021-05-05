const FPS = 45;
const inputDelay = 0;
const w = 540;
const h = 960;
const mapSize = 13;
const defaultCameraZoom = 1;
const controlPanle = 0.6;
const controlMode = 1

let keyboard;
const xVector = new Phaser.Math.Vector2(45, -25.5);
const yVector = new Phaser.Math.Vector2(-45, -25.5);
var playerPos = new Phaser.Math.Vector2(10, (mapSize - 1) / 2);
var CameraPos = new Phaser.Math.Vector2(10, (mapSize - 1) / 2);
var preCamPos = new Phaser.Math.Vector2(10, (mapSize - 1) / 2);
var cameraZoom = defaultCameraZoom;
let playerPosture = 0;
let aniTime = 10 / FPS;
var timeCount = 0;
var nextInput = -1;
var blocks = [];
var Score = 0;
var power = 10;
var currentDiff = 10;
var gameTime;

const maxBlockNum = 120;
const newBlockSpawnRange = 20;
const PlayerRange = 3;

const BlockIndexs = ['FlipC', 'FlipB', 'FlipA'];
const BlockPostures = [[[0, 0]], [[0, -1], [0, 0], [0, 1]], [[-1, 0], [0, 0], [1, 0]]];


class MainGame extends Phaser.Scene {
    key = 'MainGame';
    preload() {

        var progressBar = this.add.graphics();
        var progressBox = this.add.graphics();
        progressBar.setScrollFactor(0,0);
        progressBox.setScrollFactor(0,0);
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(w / 2 - 160, h / 2 - 25, 320, 50);

        this.load.on('progress', function (value) {
            //console.log(value);
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(w / 2 - 150, h / 2 - 15, 300 * value, 30);
        });
        this.load.on('complete', function () {
            progressBar.destroy();
            progressBox.destroy();
        });


        this.cam = this.cameras.main;

        this.load.spritesheet('HighIdel', 'img/HighIdel.png', { frameWidth: 256, frameHeight: 256 });
        this.load.spritesheet('HighLeft', 'img/HighLeft.png', { frameWidth: 256, frameHeight: 256 });
        this.load.spritesheet('HighRight', 'img/HighRight.png', { frameWidth: 256, frameHeight: 256 });
        this.load.spritesheet('HighUp', 'img/HighUp.png', { frameWidth: 256, frameHeight: 256 });
        this.load.spritesheet('HighDown', 'img/HighDown.png', { frameWidth: 256, frameHeight: 256 });

        this.load.spritesheet('Low01Idel', 'img/Low01Idel.png', { frameWidth: 256, frameHeight: 256 });
        this.load.spritesheet('Low01Left', 'img/Low01Left.png', { frameWidth: 256, frameHeight: 256 });
        this.load.spritesheet('Low01Right', 'img/Low01Right.png', { frameWidth: 256, frameHeight: 256 });
        this.load.spritesheet('Low01Up', 'img/Low01Up.png', { frameWidth: 256, frameHeight: 256 });
        this.load.spritesheet('Low01Down', 'img/Low01Down.png', { frameWidth: 256, frameHeight: 256 });

        this.load.spritesheet('Low02Idel', 'img/Low02Idel.png', { frameWidth: 256, frameHeight: 256 });
        this.load.spritesheet('Low02Left', 'img/Low02Left.png', { frameWidth: 256, frameHeight: 256 });
        this.load.spritesheet('Low02Right', 'img/Low02Right.png', { frameWidth: 256, frameHeight: 256 });
        this.load.spritesheet('Low02Up', 'img/Low02Up.png', { frameWidth: 256, frameHeight: 256 });
        this.load.spritesheet('Low02Down', 'img/Low02Down.png', { frameWidth: 256, frameHeight: 256 });

        this.load.spritesheet('FlipA', 'img/FlipA.png', { frameWidth: 256, frameHeight: 256 });
        this.load.spritesheet('FlipB', 'img/FlipB.png', { frameWidth: 256, frameHeight: 256 });
        this.load.spritesheet('FlipC', 'img/FlipC.png', { frameWidth: 256, frameHeight: 256 });

        this.load.spritesheet('Low01Score', 'img/Low01Score.png', { frameWidth: 256, frameHeight: 256 });
        this.load.spritesheet('Low02Score', 'img/Low01Score.png', { frameWidth: 256, frameHeight: 256 });
        this.load.spritesheet('HighScore', 'img/HighScore.png', { frameWidth: 256, frameHeight: 256 });

        this.load.spritesheet('Power', 'img/Power.png', { frameWidth: 64, frameHeight: 4 });
        this.load.image('KeyMap', 'img/KeyMap.png');


        this.load.image('MainUI','img/MainUI.png');

    }

    CalPos(Pos) {
        let x = Pos.x * xVector.x + Pos.y * yVector.x + w / 2;
        let y = Pos.x * xVector.y + Pos.y * yVector.y + h / 2;
        return new Phaser.Math.Vector2(x, y);
    }

    makeAni() {
        this.anims.create({
            key: 'HighIdel',
            frames: this.anims.generateFrameNumbers('HighIdel', { start: 0, end: 9 }),
            frameRate: FPS,
            repeat: -1
        })
        this.anims.create({
            key: 'HighLeft',
            frames: this.anims.generateFrameNumbers('HighLeft', { start: 0, end: 9 }),
            frameRate: FPS,
            //repeat: -1
        })
        this.anims.create({
            key: 'HighRight',
            frames: this.anims.generateFrameNumbers('HighRight', { start: 0, end: 9 }),
            frameRate: FPS,
            //repeat: -1
        })
        this.anims.create({
            key: 'HighUp',
            frames: this.anims.generateFrameNumbers('HighUp', { start: 0, end: 9 }),
            frameRate: FPS,
            //repeat: -1
        })
        this.anims.create({
            key: 'HighDown',
            frames: this.anims.generateFrameNumbers('HighDown', { start: 0, end: 9 }),
            frameRate: FPS,
            //repeat: -1
        })

        this.anims.create({
            key: 'Low01Idel',
            frames: this.anims.generateFrameNumbers('Low01Idel', { start: 0, end: 9 }),
            frameRate: FPS,
            repeat: -1
        })
        this.anims.create({
            key: 'Low01Left',
            frames: this.anims.generateFrameNumbers('Low01Left', { start: 0, end: 9 }),
            frameRate: FPS,
            //repeat: -1
        })
        this.anims.create({
            key: 'Low01Right',
            frames: this.anims.generateFrameNumbers('Low01Right', { start: 0, end: 9 }),
            frameRate: FPS,
            //repeat: -1
        })
        this.anims.create({
            key: 'Low01Up',
            frames: this.anims.generateFrameNumbers('Low01Up', { start: 0, end: 9 }),
            frameRate: FPS,
            //repeat: -1
        })
        this.anims.create({
            key: 'Low01Down',
            frames: this.anims.generateFrameNumbers('Low01Down', { start: 0, end: 9 }),
            frameRate: FPS,
            //repeat: -1
        })

        this.anims.create({
            key: 'Low02Idel',
            frames: this.anims.generateFrameNumbers('Low02Idel', { start: 0, end: 9 }),
            frameRate: FPS,
            repeat: -1
        })
        this.anims.create({
            key: 'Low02Left',
            frames: this.anims.generateFrameNumbers('Low02Left', { start: 0, end: 9 }),
            frameRate: FPS,
            //repeat: -1
        })
        this.anims.create({
            key: 'Low02Right',
            frames: this.anims.generateFrameNumbers('Low02Right', { start: 0, end: 9 }),
            frameRate: FPS,
            //repeat: -1
        })
        this.anims.create({
            key: 'Low02Up',
            frames: this.anims.generateFrameNumbers('Low02Up', { start: 0, end: 9 }),
            frameRate: FPS,
            //repeat: -1
        })
        this.anims.create({
            key: 'Low02Down',
            frames: this.anims.generateFrameNumbers('Low02Down', { start: 0, end: 9 }),
            frameRate: FPS,
            //repeat: -1
        })


        this.anims.create({
            key: 'FlipA',
            frames: this.anims.generateFrameNumbers('FlipA', { start: 0, end: 9 }),
            frameRate: 25,
            //repeat: -1
        })
        this.anims.create({
            key: 'FlipB',
            frames: this.anims.generateFrameNumbers('FlipB', { start: 0, end: 9 }),
            frameRate: 25,
            //repeat: -1
        })
        this.anims.create({
            key: 'FlipC',
            frames: this.anims.generateFrameNumbers('FlipC', { start: 0, end: 9 }),
            frameRate: 25,
            //repeat: -1
        })


        this.anims.create({
            key: 'HighScore',
            frames: this.anims.generateFrameNumbers('HighScore', { start: 0, end: 9 }),
            frameRate: 25,
            //repeat: -1
        })
        this.anims.create({
            key: 'Low01Score',
            frames: this.anims.generateFrameNumbers('Low01Score', { start: 0, end: 9 }),
            frameRate: 25,
            //repeat: -1
        })
        this.anims.create({
            key: 'Low02Score',
            frames: this.anims.generateFrameNumbers('Low02Score', { start: 0, end: 9 }),
            frameRate: 25,
            //repeat: -1
        })

    }

    animateControl() {
        this.updatePlayer();
        switch (nextInput) {
            case 0:
                switch (playerPosture) {
                    case 0:
                        this.player.anims.play('HighUp', true);
                        playerPos.x += 2;
                        playerPosture = 2;
                        break;
                    case 1:
                        this.player.anims.play('Low01Up', true);
                        playerPos.x += 1;
                        playerPosture = 1;
                        break;
                    case 2:
                        this.player.anims.play('Low02Up', true);
                        playerPos.x += 2;
                        playerPosture = 0;
                        break;
                }
                nextInput = -1;
                timeCount = aniTime;
                break;
            case 1:
                switch (playerPosture) {
                    case 0:
                        this.player.anims.play('HighLeft', true);
                        playerPos.y += 2;
                        playerPosture = 1;
                        break;
                    case 1:
                        this.player.anims.play('Low01Left', true);
                        playerPos.y += 2;
                        playerPosture = 0;
                        break;
                    case 2:
                        this.player.anims.play('Low02Left', true);
                        playerPos.y += 1;
                        playerPosture = 2;
                        break;
                }
                nextInput = -1;
                timeCount = aniTime;
                break;
            case 2:
                switch (playerPosture) {
                    case 0:
                        this.player.anims.play('HighDown', true);
                        playerPos.x -= 2;
                        playerPosture = 2;
                        break;
                    case 1:
                        this.player.anims.play('Low01Down', true);
                        playerPos.x -= 1;
                        playerPosture = 1;
                        break;
                    case 2:
                        this.player.anims.play('Low02Down', true);
                        playerPos.x -= 2;
                        playerPosture = 0;
                        break;
                }
                nextInput = -1;
                timeCount = aniTime;
                break;
            case 3:
                switch (playerPosture) {
                    case 0:
                        this.player.anims.play('HighRight', true);
                        playerPos.y -= 2;
                        playerPosture = 1;
                        break;
                    case 1:
                        this.player.anims.play('Low01Right', true);
                        playerPos.y -= 2;
                        playerPosture = 0;
                        break;
                    case 2:
                        this.player.anims.play('Low02Right', true);
                        playerPos.y -= 1;
                        playerPosture = 2;
                        break;
                }
                nextInput = -1;
                timeCount = aniTime;
                break;
            default:
                return;
        }
    }

    create() {
        this.cam.setZoom(1.3);
        this.cam.backgroundColor.setTo(50, 50, 50);

        //this.UICam = this.add.cameras()


        this.makeAni();
        this.player = this.add.sprite(w / 2, h / 2, 'HighIdel')
        this.player.setScale(2.5);
        this.player.anims.play('HighIdel', true);
        this.updatePlayer();
        this.player.on('animationcomplete', () => {
            this.updateBlocks();
            if (nextInput != -1) {
                this.animateControl();
                return;
            }
            switch (playerPosture) {
                case 0:
                    this.player.anims.play('HighIdel', true);
                    break;
                case 1:
                    this.player.anims.play('Low01Idel', true);
                    break;
                case 2:
                    this.player.anims.play('Low02Idel', true);
                    break;
            }
            this.updatePlayer();
        })
        keyboard = this.input.keyboard.createCursorKeys();
        keyboard.up.addListener("down", () => {
            if (timeCount > inputDelay * aniTime) {
                nextInput = 0;
                return;
            }
            nextInput = 0;
            this.animateControl();
        });
        keyboard.left.addListener("down", () => {
            if (timeCount > inputDelay * aniTime) {
                nextInput = 1;
                return;
            }
            nextInput = 1;
            this.animateControl();
        });
        keyboard.down.addListener("down", () => {
            if (timeCount > inputDelay * aniTime) {
                nextInput = 2;
                return;
            }
            nextInput = 2;
            this.animateControl();
        });
        keyboard.right.addListener("down", () => {
            if (timeCount > inputDelay * aniTime) {
                nextInput = 3;
                return;
            }
            nextInput = 3;
            this.animateControl();
        });
        var style = { font: "bold 75px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
        this.ScoreText = this.add.text(20, 20, Score, style);
        this.ScoreText.setScrollFactor(0, 0);
        this.ScoreText.setDepth(100 - playerPos.x - playerPos.y);

        this.input.mouse.disableContextMenu();
        this.input.on('pointerdown', (pointer) => {
            if ((pointer.leftButtonDown() || pointer.rightButtonDown())) {
                let xFactor = pointer.x / w;
                let yFactor = (h - pointer.y) / (h * (1 - controlPanle));
                let pos;
                let neg;
                if (controlMode == 0) {
                    pos = xFactor > yFactor;
                    neg = yFactor > 1 - xFactor;
                } else if (controlMode == 1) {
                    pos = yFactor < 0.5;
                    neg = xFactor > 0.5;
                }
                if (pos && neg) {
                    if (timeCount > inputDelay * aniTime) {
                        nextInput = 3;
                    } else {
                        nextInput = 3;
                        this.animateControl();
                    }
                    //console.log()
                } else if (pos && !neg) {
                    if (timeCount > inputDelay * aniTime) {
                        nextInput = 2;
                    } else {
                        nextInput = 2;
                        this.animateControl();
                    }
                } else if (!pos && neg) {
                    if (timeCount > inputDelay * aniTime) {
                        nextInput = 0;
                    } else {
                        nextInput = 0;
                        this.animateControl();
                    }
                } else if (!pos && !neg) {
                    if (timeCount > inputDelay * aniTime) {
                        nextInput = 1;
                    } else {
                        nextInput = 1;
                        this.animateControl();
                    }
                }
            }
        });


        this.MainUI = this.add.image(w/2,128,'MainUI');
        this.MainUI.setScrollFactor(0,0);
        this.MainUI.setDepth(50-playerPos.x-playerPos.x);

        this.KeyMap = this.add.image(w/2,h/2,'KeyMap');
        this.KeyMap.setScrollFactor(0,0);
        this.KeyMap.setDepth(49-playerPos.x-playerPos.x);

        this.PowerBar = this.add.image(383,49,'Power',0);
        this.PowerBar.setScrollFactor(0,0);
        this.PowerBar.setDepth(48-playerPos.x-playerPos.x);
        this.PowerBar.setScale(278/64,50/4);

        /*this.PowerBar = this.add.graphics();
        this.PowerBar.setScrollFactor(0,0);
        this.PowerBar.setDepth(49-playerPos.x-playerPos.x);
        this.PowerBar.fillStyle(0xff0000, 1);
        this.PowerBar.fillRect(385.3-130, 49-18, 260, 36);*/

    }
    claps(x, y, newBlockIndex) {
        var myPostures = BlockPostures[newBlockIndex];
        for (let i = 0; i != blocks.length; i++) {
            var thisPostures = BlockPostures[blocks[i].getData('Postures')];
            var thisX = blocks[i].getData('XPos');
            var thisY = blocks[i].getData('YPos');
            for (let j = 0; j != myPostures.length; j++) {
                for (let k = 0; k != thisPostures.length; k++) {
                    if (thisX + thisPostures[k][0] == x + myPostures[j][0] && thisY + thisPostures[k][1] == y + myPostures[j][1]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    Coincide(thisX, thisY, thisIndex) {
        var myPostures = BlockPostures[playerPosture];
        var x = playerPos.x;
        var y = playerPos.y;
        var thisPostures = BlockPostures[thisIndex];
        if (thisPostures.length != myPostures.length) {
            return false;
        }
        for (let j = 0; j != myPostures.length; j++) {
            if ((thisX + thisPostures[j][0] != x + myPostures[j][0]) || (thisY + thisPostures[j][1] != y + myPostures[j][1])) {
                return false;
            }
        }
        return true;
    }
    spawnNewBlock() {
        if (blocks.length < maxBlockNum) {
            //for (let i = blocks.length; i < maxBlockNum; i++) {
            let x, y;
            let newBlockIndex;
            do {
                x = Phaser.Math.Between(playerPos.x - newBlockSpawnRange, playerPos.x + newBlockSpawnRange);
                y = Phaser.Math.Between(playerPos.y - newBlockSpawnRange, playerPos.y + newBlockSpawnRange);
                newBlockIndex = Phaser.Math.Between(0, 2);
            } while (this.claps(x, y, newBlockIndex) || (Math.abs(x - playerPos.x) < PlayerRange && Math.abs(y - playerPos.y) < PlayerRange))


            var newBlock = this.add.sprite(w / 2, h / 2, BlockIndexs[newBlockIndex]);

            let newPos = this.CalPos(new Phaser.Math.Vector2(x, y));
            newBlock.x = newPos.x;
            newBlock.y = newPos.y;
            newBlock.setDepth(- x - y);

            newBlock.setScale(1.25);
            newBlock.anims.play(BlockIndexs[newBlockIndex], true);

            newBlock.setData('XPos', x);
            newBlock.setData('YPos', y);
            newBlock.setData('Postures', newBlockIndex);

            blocks.push(newBlock);
            //}
        }

    }
    updateCamera(delta) {
        CameraPos.lerp(playerPos, 1 * delta / 1000);
        let c = this.CalPos(CameraPos);
        this.cam.centerOn(c.x, c.y);
        //console.log(CameraPos.x);
        var speed = CameraPos.distance(preCamPos) * 1000 / delta;
        cameraZoom = ((defaultCameraZoom / Math.exp(speed / 25)) - cameraZoom) * 1 * delta / 1000 + cameraZoom;
        this.cam.setZoom(cameraZoom);
        this.MainUI.setScale(1/cameraZoom,1/cameraZoom);
        this.MainUI.setY(h/2-(h/2-128)/cameraZoom);

        this.ScoreText.setScale(1/cameraZoom,1/cameraZoom);
        this.ScoreText.setX(w/2-(w/2-25)/cameraZoom);
        this.ScoreText.setY(h/2-(h/2-25)/cameraZoom);

        this.PowerBar.setScale(278/64/cameraZoom,50/4/cameraZoom);
        this.PowerBar.setX(w/2-(w/2-383)/cameraZoom);
        this.PowerBar.setY(h/2-(h/2-49)/cameraZoom);

        this.KeyMap.setScale(1/cameraZoom,1/cameraZoom);

        /*this.PowerBar.clear();
        this.PowerBar.fillStyle(0xff0000, 1);
        let x = (385.5-130);
        let width = (power/currentDiff) *260;
        //console.log(power);
        this.PowerBar.fillRect(w/2-(w/2-x)/cameraZoom, h/2-(h/2-(49-18))/cameraZoom, width/cameraZoom, 36/cameraZoom);*/

        //console.log(CameraPos.x-preCamPos.x);
        preCamPos.copy(CameraPos);
    }
    updatePlayer() {
        let newPos = this.CalPos(playerPos);
        this.player.x = newPos.x;
        this.player.y = newPos.y;
        this.player.setDepth(20 - playerPos.x - playerPos.y);
    }
    deleteFarBlocks() {
        let i = 0;
        while (i < blocks.length) {
            let x = blocks[i].getData('XPos');
            let y = blocks[i].getData('YPos');
            if (Math.abs(x - playerPos.x) > newBlockSpawnRange || Math.abs(y - playerPos.y) > newBlockSpawnRange) {
                blocks[i].destroy();
                blocks.splice(i, 1);
                //console.log('delete blocks');
            }
            i++;
        }
    }

    updateBlocks() {
        let i = 0;
        while (i < blocks.length) {
            let x = blocks[i].getData('XPos');
            let y = blocks[i].getData('YPos');
            let Index = blocks[i].getData('Postures');
            if (this.Coincide(x, y, Index)) {
                blocks[i].destroy();
                blocks.splice(i, 1);
                Score += [10, 10, 25][Index];
                power = (1 - (Math.atan(Math.pow(gameTime / 60, 1.5)) / (0.5 * Math.PI))) * (30 - 2.5) + 2.5;
                currentDiff = power;
                this.ScoreText.text = Score;
                console.log(Score)

                var newScore = this.add.sprite(w / 2, h / 2, ['HighScore', 'Low01Score', 'Low02Score'][playerPosture]);
                var newScorePos = this.CalPos(playerPos);
                newScore.x = newScorePos.x;
                newScore.y = newScorePos.y;
                newScore.setScale(2.5);
                newScore.setDepth(-playerPos.x - playerPos.y);
                newScore.anims.play(['HighScore', 'Low01Score', 'Low02Score'][playerPosture], true);
                newScore.on('animationcomplete', () => {
                    newScore.destroy();
                })


                return;
            }
            i++;
        }
    }
    update(time, delta) {
        gameTime = time / 1000;
        this.deleteFarBlocks();
        if (timeCount > 0) {
            timeCount -= delta / 1000;
        }
        if (power > 0) {
            power -= delta / 1000;
        } else {
            //console.log('Die!');
        }
        this.PowerBar.setTexture('Power',Math.floor((0.999-power/currentDiff)*64));
        this.updateCamera(delta);
        this.spawnNewBlock();
    }
}