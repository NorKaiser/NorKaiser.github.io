const w = this.innerWidth;
const h = this.innerHeight;
var run;
var shoot;
var playerIndex;

let size = 0.75;
let border = 0.02;
let dis = w * size * (0.5 + border);

var movePos = [dis, dis];
var shootPos = [dis, h - dis];
let socket = null;
var Connected = false;
var MyHealth = 0;
var MyCD = 5;
let playerColor = [getColor(255, 75, 75), getColor(75, 130, 255)];
var GameStart = false;

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) { return pair[1]; }
    }
    return (false);
}
function lerp(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
function distance(a, b) {
    return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]));
}
function distanceClamp(a, b, l) {
    let length = distance(a, b);
    if (length <= l)
        return a;
    return [b[0] + (a[0] - b[0]) * l / length, b[1] + (a[1] - b[1]) * l / length];
}
function getColor(r, g, b) {
    return (Math.floor(r) * 256 + Math.floor(g)) * 256 + Math.floor(b);
}
class MainGame extends Phaser.Scene {
    key = 'MainGame';


    RefreshLayout() {
        let mySize = w * size / 512;
        this.MoveJoyStickBase.setScale(mySize);
        this.MoveJoyStickBase.setPosition(dis, dis);

        this.MoveJoyStick.setScale(mySize);
        this.MoveJoyStick.setPosition(dis, dis);

        this.RunButton.setScale(mySize);
        this.RunButton.setPosition(dis, dis);
        this.RunButton.setRotation(3.14 * 0.5);

        //this.Strength.setScale(mySize);
        //this.Strength.setPosition(dis, dis);

        this.ShootJoyStickBase.setScale(mySize);
        this.ShootJoyStickBase.setPosition(dis, h - dis);

        this.ShootJoyStick.setScale(mySize);
        this.ShootJoyStick.setPosition(dis, h - dis);

        this.ShootButton.setScale(mySize);
        this.ShootButton.setPosition(dis, h - dis);
        this.ShootButton.setRotation(3.14 * 0.5);

        this.Health.setScale(w * 0.8 / 522);
        //this.Bullet.setScale(mySize);
        //this.Bullet.setPosition(dis, h - dis);

    }
    preload() {
        this.load.image('JoyStickBase', 'img/JoyStickBase.png');
        this.load.image('JoyStick', 'img/JoyStick.png');
        this.load.image('RunButton', 'img/RunButton.png');
        this.load.image('ShootButton', 'img/ShootButton.png');
        this.load.image('BlackMask', 'img/BlackMask.png');

        this.load.image('Reloading', 'img/Reloading.png');
        this.load.image('Wait', 'img/Wait.png');
        this.load.image('Disconnected', 'img/Disconnected.png');

        this.load.spritesheet('Health', 'img/Health.png', { frameWidth: 325, frameHeight: 522 });
        this.load.spritesheet('CD', 'img/CountDown.png', { frameWidth: 128, frameHeight: 128 });

        var wsAd = getQueryVariable("wsAd");
        if (wsAd) {
            socket = new WebSocket(wsAd);

            socket.addEventListener('error', function (event) {
                Connected = false;
                console.log("DisConnected");
            });
            socket.addEventListener('open', function (event) {
                Connected = true;
                socket.send("ToConsole/" + playerIndex.toString() + "/" + "Respawn" + ";");
            });
            socket.addEventListener('close', function (event) {
                Connected = false;
                console.log("DisConnected!");
            });
            socket.addEventListener('message', function (event) {
                if (event.data.startsWith("ToControl/")) {
                    var coms = event.data.trimEnd(';').split('/');
                    var com = coms[1];
                    var comPlayerIndex = parseInt(coms[2]);
                    if (comPlayerIndex == playerIndex - 1) {
                        switch (com) {
                            case "Health":
                                var health = parseInt(coms[4]);
                                MyHealth = health;
                                break;
                            case "Start":
                                GameStart = true;
                                break;
                            case "CountDown":
                                var cd = parseInt(coms[4]);
                                MyCD = cd;
                                break;
                        }
                    }
                }
            });
        }
        else {
            console.log("Fail!");
        }

        var id = getQueryVariable("Id");
        if (id) {
            playerIndex = parseInt(id);
        }
        else {
            console.log("Fail!");
        }
        //socket = new WebSocket("ws://192.168.1.15:12345");
    }
    create() {
        this.MoveJoyStickBase = this.add.image(w * 0.25, h * 0.6, 'JoyStickBase');
        this.RunButton = this.add.image(w * 0.25, h * 0.6, 'RunButton');
        this.MoveJoyStick = this.add.image(w * 0.25, h * 0.6, 'JoyStick');

        this.ShootJoyStickBase = this.add.image(w * 0.75, h * 0.6, 'JoyStickBase');
        this.ShootButton = this.add.image(w * 0.75, h * 0.6, 'ShootButton');
        this.ShootJoyStick = this.add.image(w * 0.75, h * 0.6, 'JoyStick');

        this.Health = this.add.sprite(w / 2, h / 2, 'Health');
        this.Health.rotation = 3.1415 * 0.5;
        this.Health.setTint(playerColor[playerIndex - 1]);

        this.BlackMask = this.add.image(w / 2, h / 2, 'BlackMask');
        this.BlackMask.setScale(w / 128, h / 128);

        this.Reloading = this.add.image(w * 0.75, h / 2, 'Reloading');
        this.Reloading.setScale(h * 1 / 512, h * 1 / 512);
        this.Reloading.setRotation(3.1415 * 0.5);
        this.Reloading.alpha = 0;

        this.Wait = this.add.image(w / 2, h / 2, 'Wait');
        this.Wait.setScale(h * 1 / 512, h * 1 / 512);
        this.Wait.setRotation(3.1415 * 0.5);

        this.Disconnected = this.add.image(w / 2, h / 2, 'Disconnected');
        this.Disconnected.setScale(h * 1 / 512, h * 1 / 512);
        this.Disconnected.setRotation(3.1415 * 0.5);
        this.Disconnected.alpha = 0;

        this.CD = this.add.sprite(w * 0.25, h / 2, 'CD');
        this.CD.setScale(h * 0.3 / 128, h * 0.3 / 128);
        this.CD.rotation = 3.1415 * 0.5;
        this.CD.setFrame(4);


        this.RefreshLayout();


        this.input.addPointer(2);
        this.input.mouse.disableContextMenu();
        this.input.on('pointerdown', (pointer) => {
            if (distance([pointer.x, pointer.y], [dis, dis]) <= w * size * 0.7 / 2)
                run = pointer;

            if (distance([pointer.x, pointer.y], [dis, h - dis]) <= w * size * 0.7 / 2)
                shoot = pointer;
        });
        this.input.on('pointerup', (pointer) => {
            if (run == pointer)
                run = null;
            if (shoot == pointer)
                shoot = null;
        });



    }
    update(time, delta) {
        this.BlackMask.alpha = !Connected || MyHealth == 0 || !GameStart;
        this.Reloading.alpha = MyHealth == 0 && GameStart && Connected;
        this.CD.alpha = this.Reloading.alpha;
        if (MyHealth == 0 && GameStart && Connected)
            this.CD.setFrame(Math.min(Math.max(MyCD -1, 0), 4));
        this.Wait.alpha = !GameStart && Connected;
        this.Disconnected.alpha = !Connected;

        this.Health.setFrame(10 - MyHealth);

        if (!Connected || MyHealth == 0 || !GameStart) {

            movePos = lerp(movePos, [dis, dis], delta * 0.05);
            this.MoveJoyStick.setPosition(movePos[0], movePos[1]);

            this.MoveJoyStick.setTint(getColor(255, 255, 255));
            this.MoveJoyStickBase.setTint(getColor(255, 255, 255));
            this.RunButton.setTint(getColor(255, 255, 255));

            shootPos = lerp(shootPos, [dis, h - dis], delta * 0.05);
            this.ShootJoyStick.setPosition(shootPos[0], shootPos[1]);

            this.ShootJoyStick.setTint(getColor(255, 255, 255));
            this.ShootJoyStickBase.setTint(getColor(255, 255, 255));
            this.ShootButton.setTint(getColor(255, 255, 255));

            return;
        }

        if (run != null) {
            let mp = distanceClamp([run.x, run.y], [dis, dis], w * size * 0.7 / 2);
            movePos = lerp(movePos, mp, delta * 0.02);
            this.MoveJoyStick.setPosition(movePos[0], movePos[1]);
            this.RunButton.setRotation(3.14 * 0.5 + Math.atan2(movePos[1] - dis, movePos[0] - dis));

            if (distance([run.x, run.y], [dis, dis]) > w * size * 0.6 / 2) {

                socket.send("ToGame/" + playerIndex.toString() + "/" + Date.now() + "/Run/" + 1 + "/" + (Math.atan2(movePos[1] - dis, movePos[0] - dis)) + ";");

                this.MoveJoyStick.setTint(playerColor[playerIndex - 1]);
                this.MoveJoyStickBase.setTint(playerColor[playerIndex - 1]);
                this.RunButton.setTint(playerColor[playerIndex - 1]);
            } else {

                socket.send("ToGame/" + playerIndex.toString() + "/" + Date.now() + "/Walk/" + distance(movePos, [dis, dis]) / (w * size * 0.6 / 2) + "/" + (Math.atan2(movePos[1] - dis, movePos[0] - dis)) + ";");

                this.MoveJoyStick.setTint(playerColor[playerIndex - 1]);
                this.MoveJoyStickBase.setTint(playerColor[playerIndex - 1]);
                this.RunButton.setTint(getColor(255, 255, 255));
            }
        } else {

            socket.send("ToGame/" + playerIndex.toString() + "/" + Date.now() + "/Stop/" + 0 + "/" + 0 + ";");

            movePos = lerp(movePos, [dis, dis], delta * 0.05);
            this.MoveJoyStick.setPosition(movePos[0], movePos[1]);

            this.MoveJoyStick.setTint(getColor(255, 255, 255));
            this.MoveJoyStickBase.setTint(getColor(255, 255, 255));
            this.RunButton.setTint(getColor(255, 255, 255));
        }


        if (shoot != null) {
            let mp = distanceClamp([shoot.x, shoot.y], [dis, h - dis], w * size * 0.7 / 2);
            shootPos = lerp(shootPos, mp, delta * 0.02);
            this.ShootJoyStick.setPosition(shootPos[0], shootPos[1]);
            this.ShootButton.setRotation(3.14 * 0.5 + Math.atan2(shootPos[1] - h + dis, shootPos[0] - dis));

            if (distance([shoot.x, shoot.y], [dis, h - dis]) > w * size * 0.6 / 2) {

                socket.send("ToGame/" + playerIndex.toString() + "/" + Date.now() + "/Fire/" + 1 + "/" + (Math.atan2(shootPos[1] - h + dis, shootPos[0] - dis)) + ";");

                this.ShootJoyStick.setTint(playerColor[playerIndex - 1]);
                this.ShootJoyStickBase.setTint(playerColor[playerIndex - 1]);
                this.ShootButton.setTint(playerColor[playerIndex - 1]);
            } else {

                socket.send("ToGame/" + playerIndex.toString() + "/" + Date.now() + "/Aim/" + distance(shootPos, [dis, h - dis]) / (w * size * 0.6 / 2) + "/" + (Math.atan2(shootPos[1] - h + dis, shootPos[0] - dis)) + ";");

                this.ShootJoyStick.setTint(playerColor[playerIndex - 1]);
                this.ShootJoyStickBase.setTint(playerColor[playerIndex - 1]);
                this.ShootButton.setTint(getColor(255, 255, 255));
            }
        } else {

            socket.send("ToGame/" + playerIndex.toString() + "/" + Date.now() + "/Still/" + 0 + "/" + 0 + ";");

            shootPos = lerp(shootPos, [dis, h - dis], delta * 0.05);
            this.ShootJoyStick.setPosition(shootPos[0], shootPos[1]);

            this.ShootJoyStick.setTint(getColor(255, 255, 255));
            this.ShootJoyStickBase.setTint(getColor(255, 255, 255));
            this.ShootButton.setTint(getColor(255, 255, 255));
        }

    }

}