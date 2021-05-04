const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
canvas.width = innerWidth;
canvas.height = innerHeight;
const PlayerColor = ['black', 'white'];
const BoardSize = 15;
var pieces = [];
const StepTime = 1.5;
const WinTime = 4.5;
var TimeCount = 0;
var PlayerChoiceIndex = 0;
var GameState = false;


//Shapes
const con_Six = [1, 1, 1, 1, 1, 1];

const con_five = [1, 1, 1, 1, 1];

const live_four = [[0, 1, 1, 1, 1, 0]];

const push_four = [[0, 1, 1, 1, 1],
[1, 0, 1, 1, 1],
[1, 1, 0, 1, 1],
[1, 1, 1, 0, 1],
[1, 1, 1, 1, 0]];

const live_three = [[0, 0, 1, 1, 1, 0],
[0, 1, 0, 1, 1, 0],
[0, 1, 1, 0, 1, 0],
[0, 1, 1, 1, 0, 0]]

const sleep_three = [[0, 0, 1, 1, 1],
[0, 1, 0, 1, 1],
[0, 1, 1, 0, 1],
[0, 1, 1, 1, 0],
[1, 0, 0, 1, 1],
[1, 0, 1, 0, 1],
[1, 0, 1, 1, 0],
[1, 1, 0, 0, 1],
[1, 1, 0, 1, 0],
[1, 1, 1, 0, 0]];

const live_two = [[0, 0, 0, 1, 1, 0], [0, 0, 1, 0, 1, 0], [0, 0, 1, 1, 0, 0],
[0, 1, 0, 0, 1, 0], [0, 1, 0, 1, 0, 0],
[0, 1, 1, 0, 0, 0]]

const sleep_two = [[0, 0, 0, 1, 1], [0, 0, 1, 0, 1], [0, 0, 1, 1, 0],
[0, 1, 0, 0, 1], [0, 1, 0, 1, 0],
[0, 1, 1, 0, 0],
[1, 0, 0, 0, 1], [1, 0, 0, 1, 0],
[1, 0, 1, 0, 0],
[1, 1, 0, 0, 0]];


var pieceSize;
var center = [];
var boardSize;
const cwidth = canvas.width * 0.8;
const cheight = canvas.height * 0.8;
if (cheight < cwidth) {
    pieceSize = cheight / BoardSize;
    center[0] = canvas.width * 0.5 - BoardSize * 0.5 * pieceSize;
    center[1] = canvas.height * 0.5 - BoardSize * 0.5 * pieceSize;;
    boardSize = cheight;
} else {
    pieceSize = cwidth / BoardSize;
    center[0] = canvas.width * 0.5 - BoardSize * 0.5 * pieceSize;
    center[1] = canvas.height * 0.5 - BoardSize * 0.5 * pieceSize;
    boardSize = cwidth;
}
function equar(a, b) {
    // 判断数组的长度
    if (a.length !== b.length) {
        return false
    } else {
        // 循环遍历数组的值进行比较
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false
            }
        }
        return true;
    }
}

function arrayContain(arrayA, arrayB) {

    if (arrayA.length < arrayB.length) {
        return false;
    }
    for (let i = 0; i < arrayA.length - arrayB.length + 1; i++) {
        let thisResult = true;
        for (let j = 0; j < arrayB.length; j++) {
            if (arrayA[i + j] != arrayB[j]) {
                thisResult = false;
                break;
            }
        }
        if (thisResult) {
            return true;
        }
    }
    return false;
}

class checkerBoard {
    constructor() {
        this.xLength = BoardSize;
        this.yLength = BoardSize;
        this.pieces = [];
        for (let i = 0; i < this.xLength; i++) {
            let a = [];
            for (let j = 0; j < this.yLength; j++) {
                a[j] = -1;
            }
            this.pieces[i] = a;
        }
        //console.log(this.pieces);
    }
    clear() {
        for (let i = 0; i < this.xLength; i++) {
            for (let j = 0; j < this.yLength; j++) {
                this.pieces[i][j] = -1;
            }
        }
    }
    win(x, y, playerIndex) {
        //Hor
        let nowpos = [x, y];
        let Xcount = 1;

        nowpos[0]--;
        while (nowpos[0] >= 0 && this.pieces[nowpos[0]][nowpos[1]] === playerIndex) {
            Xcount++;
            nowpos[0]--;
        }

        nowpos = [x, y];

        nowpos[0]++;
        while (nowpos[0] < BoardSize && this.pieces[nowpos[0]][nowpos[1]] === playerIndex) {
            Xcount++;
            nowpos[0]++;
        }
        if (Xcount === 5) {
            return [playerIndex, 0];
        } else if (Xcount > 5) {
            return [1 - playerIndex, 0];
        }

        //Ver
        nowpos = [x, y];
        let Ycount = 1;

        nowpos[1]--;
        while (nowpos[1] >= 0 && this.pieces[nowpos[0]][nowpos[1]] === playerIndex) {
            Ycount++;
            nowpos[1]--;
        }

        nowpos = [x, y];

        nowpos[1]++;
        while (nowpos[1] < BoardSize && this.pieces[nowpos[0]][nowpos[1]] === playerIndex) {
            Ycount++;
            nowpos[1]++;
        }
        if (Ycount === 5) {
            return [playerIndex, 90];
        } else if (Ycount > 5) {
            return [1 - playerIndex, 90];
        }

        //Left
        nowpos = [x, y];
        let Leftcount = 1;

        nowpos[0]--;
        nowpos[1]--;
        while (nowpos[1] >= 0 && nowpos[0] >= 0 && this.pieces[nowpos[0]][nowpos[1]] === playerIndex) {
            Leftcount++;
            nowpos[0]--;
            nowpos[1]--;
        }

        nowpos = [x, y];

        nowpos[0]++;
        nowpos[1]++;
        while (nowpos[1] < BoardSize && nowpos[0] < BoardSize && this.pieces[nowpos[0]][nowpos[1]] === playerIndex) {
            Leftcount++;
            nowpos[0]++;
            nowpos[1]++;
        }
        if (Leftcount === 5) {
            return [playerIndex, -45];
        } else if (Leftcount > 5) {
            return [1 - playerIndex, -45];
        }


        //Right
        nowpos = [x, y];
        let Rightcount = 1;

        nowpos[0]--;
        nowpos[1]++;
        while (nowpos[1] < BoardSize && nowpos[0] >= 0 && this.pieces[nowpos[0]][nowpos[1]] === playerIndex) {
            Rightcount++;
            nowpos[0]--;
            nowpos[1]++;
        }

        nowpos = [x, y];

        nowpos[0]++;
        nowpos[1]--;
        while (nowpos[1] >= 0 && nowpos[0] < BoardSize && this.pieces[nowpos[0]][nowpos[1]] === playerIndex) {
            Rightcount++;
            nowpos[0]++;
            nowpos[1]--;
        }
        if (Rightcount === 5) {
            return [playerIndex, 45];
        } else if (Rightcount > 5) {
            return [1 - playerIndex, 45];
        }

        return [-1, 0];
    }


    analyseShape(Shape) {
        let Result = 0;
        //console.log(con_five);
        if (arrayContain(Shape, con_Six)) {
            Result -= 78125;
        }
        if (Result != 0) {
            return Result
        }
        if (arrayContain(Shape, con_five)) {
            Result += 78125;
        }
        if (Result != 0) {
            return Result
        }
        for (let i = 0; i < live_four.length; i++) {
            if (arrayContain(Shape, live_four[i])) {
                Result += 15625;
            }
        }
        if (Result != 0) {
            return Result
        }
        for (let i = 0; i < push_four.length; i++) {
            if (arrayContain(Shape, push_four[i])) {
                Result += 3125;
            }
        }
        if (Result != 0) {
            return Result
        }
        for (let i = 0; i < live_three.length; i++) {
            if (arrayContain(Shape, live_three[i])) {
                Result += 625;
            }
        }
        if (Result != 0) {
            return Result
        }
        for (let i = 0; i < sleep_three.length; i++) {
            if (arrayContain(Shape, sleep_three[i])) {
                Result += 125;
            }
        }
        if (Result != 0) {
            return Result
        }
        for (let i = 0; i < live_two.length; i++) {
            if (arrayContain(Shape, live_two[i])) {
                Result += 25;
            }
        }
        if (Result != 0) {
            return Result
        }
        for (let i = 0; i < sleep_two.length; i++) {
            if (arrayContain(Shape, sleep_two[i])) {
                Result += 5;
            }
        }
        return Result;
    }
    chessShape(x, y, playerIndex) {
        let ShapeScore = 0;
        let nowpos = [];
        //Hor
        let HorlineState = [1];

        nowpos = [x, y];
        nowpos[0]--;
        while (nowpos[0] >= 0) {
            let now = this.pieces[nowpos[0]][nowpos[1]];
            if (now === playerIndex) {
                HorlineState.unshift(1);
            } else if (now === -1) {
                HorlineState.unshift(0);
                //break;
            } else {
                break;
            }
            nowpos[0]--;
        }

        nowpos = [x, y];
        nowpos[0]++;
        while (nowpos[0] < BoardSize) {
            let now = this.pieces[nowpos[0]][nowpos[1]];
            if (now === playerIndex) {
                HorlineState.push(1);
            } else if (now === -1) {
                HorlineState.push(0);
                //break;
            } else {
                break;
            }
            nowpos[0]++;
        }
        //console.log(HorlineState);
        ShapeScore += this.analyseShape(HorlineState);

        //Ver
        let VerlineState = [1];

        nowpos = [x, y];
        nowpos[1]--;
        while (nowpos[1] >= 0) {
            let now = this.pieces[nowpos[0]][nowpos[1]];
            if (now === playerIndex) {
                VerlineState.unshift(1);
            } else if (now === -1) {
                VerlineState.unshift(0);
                //break;
            } else {
                break;
            }
            nowpos[1]--;
        }

        nowpos = [x, y];
        nowpos[1]++;
        while (nowpos[1] < BoardSize) {
            let now = this.pieces[nowpos[0]][nowpos[1]];
            if (now === playerIndex) {
                VerlineState.push(1);
            } else if (now === -1) {
                VerlineState.push(0);
                //break;
            } else {
                break;
            }
            nowpos[1]++;
        }
        //console.log(VerlineState);
        ShapeScore += this.analyseShape(VerlineState);

        //Left
        let LeftlineState = [1];

        nowpos = [x, y];
        nowpos[0]--;
        nowpos[1]--;
        while (nowpos[0] >= 0 && nowpos[1] >= 0) {
            let now = this.pieces[nowpos[0]][nowpos[1]];
            if (now === playerIndex) {
                LeftlineState.unshift(1);
            } else if (now === -1) {
                LeftlineState.unshift(0);
                //break;
            } else {
                break;
            }
            nowpos[0]--;
            nowpos[1]--;
        }

        nowpos = [x, y];
        nowpos[0]++;
        nowpos[1]++;
        while (nowpos[0] < BoardSize && nowpos[1] < BoardSize) {
            let now = this.pieces[nowpos[0]][nowpos[1]];
            if (now === playerIndex) {
                LeftlineState.push(1);
            } else if (now === -1) {
                LeftlineState.push(0);
                //break;
            } else {
                break;
            }
            nowpos[0]++;
            nowpos[1]++;
        }
        //console.log(LeftlineState);
        ShapeScore += this.analyseShape(LeftlineState);

        //Right
        let RightlineState = [1];

        nowpos = [x, y];
        nowpos[0]--;
        nowpos[1]++;
        while (nowpos[0] >= 0 && nowpos[1] < BoardSize) {
            let now = this.pieces[nowpos[0]][nowpos[1]];
            if (now === playerIndex) {
                RightlineState.unshift(1);
            } else if (now === -1) {
                RightlineState.unshift(0);
                //break;
            } else {
                break;
            }
            nowpos[0]--;
            nowpos[1]++;
        }

        nowpos = [x, y];
        nowpos[0]++;
        nowpos[1]--;
        while (nowpos[0] < BoardSize && nowpos[1] >= 0) {
            let now = this.pieces[nowpos[0]][nowpos[1]];
            if (now === playerIndex) {
                RightlineState.push(1);
            } else if (now === -1) {
                RightlineState.push(0);
                //break;
            } else {
                break;
            }
            nowpos[0]++;
            nowpos[1]--;
        }
        //console.log(RightlineState);
        ShapeScore += this.analyseShape(RightlineState);
        return ShapeScore;
    }
    getBest(playerIndex) {
        let MaxScore = 0;
        let TargetX = Math.floor(BoardSize / 2);
        let TargetY = Math.floor(BoardSize / 2);
        for (let i = 0; i < this.xLength; i++) {
            for (let j = 0; j < this.yLength; j++) {
                if (this.pieces[i][j] != -1) {
                    continue;
                }
                let Score = Math.max(this.chessShape(i, j, playerIndex), this.chessShape(i, j, 1 - playerIndex) * 0.9);
                //console.log(Score);
                if (Score > MaxScore) {
                    MaxScore = Score;
                    TargetX = i;
                    TargetY = j;
                }
            }
        }
        //console.log(MaxScore);
        return [TargetX, TargetY];
    }
}
function piecePos(x, y) {
    let realX, realY;

    realX = pieceSize * (x + 0.5) + center[0];
    realY = pieceSize * (y + 0.5) + center[1];

    return [realX, realY];
}
function mousePos(x, y) {
    let realX, realY;

    realX = Math.floor((x - center[0]) / pieceSize);
    realY = Math.floor((y - center[1]) / pieceSize);

    return [realX, realY];
}
class scoreBoard {

    constructor(text) {
        this.show = true;
        this.choice = -1;
        this.targetX = canvas.width * 0.5;
        this.targetY = canvas.height * 0.5;
        this.targetZ = 0.2;

        this.target0X = -0.15;
        this.target0Y = 0.1;
        this.target0Z = 0.2;

        this.target1X = 0.15;
        this.target1Y = 0.1;
        this.target1Z = 0.2;


        this.text = text;
        this.ScaleFactor = Math.min(canvas.width, canvas.height) * 0.6;
        this.xSize = 1 * this.ScaleFactor;
        this.ySize = 0.5 * this.ScaleFactor;
        this.targetAlpha = 1.0;


        this.realX = canvas.width * 0.5;
        this.realY = canvas.height * 0.5;
        this.realZ = 0.5;
        this.realAlpha = 0.0;

        this.real0X = -0.15;
        this.real0Y = 0.1;
        this.real0Z = 2;

        this.real1X = 0.15;
        this.real1Y = 0.1;
        this.real1Z = 2;
    }

    draw() {
        c.shadowColor = 'rgba(0,0,0,0.75)';
        c.shadowBlur = 70;

        let ScaleFactor = ((this.realZ - 0.2) * 3 / (20 - 0.2) + 1);
        let realSizeX = this.xSize * ScaleFactor;
        let realSizeY = this.ySize * ScaleFactor;
        c.fillStyle = 'rgba(240,240,240,' + this.realAlpha + ')';
        c.fillRect(this.realX - realSizeX * 0.5, this.realY - realSizeY * 0.5, realSizeX, realSizeY);

        c.shadowColor = 'rgba(0,0,0,0)';
        c.shadowBlur = 0;

        c.fillStyle = 'rgba(50,50,50,' + this.realAlpha + ')';
        c.font = 0.12 * this.ScaleFactor * ScaleFactor + "px sen-serif";
        c.textAlign = "center";
        c.fillText(this.text, this.realX, this.realY - 0.1 * this.ScaleFactor * ScaleFactor);

        c.fillStyle = 'rgba(50,50,50,' + this.realAlpha + ')';
        c.font = 0.03 * this.ScaleFactor * ScaleFactor + "px sen-serif";
        c.textAlign = "center";
        c.fillText('Choose a piece to start the game', this.realX, this.realY - 0.05 * this.ScaleFactor * ScaleFactor);

        c.fillStyle = 'rgba(50,50,50,' + this.realAlpha + ')';
        c.font = 0.02 * this.ScaleFactor * ScaleFactor + "px sen-serif";
        c.textAlign = "center";
        c.fillText('V1.0 - Norkaiser', this.realX + 0.4 * this.ScaleFactor * ScaleFactor, this.realY + 0.22 * this.ScaleFactor * ScaleFactor);


        c.beginPath();
        c.arc(this.realX + (this.real0X * this.ScaleFactor + this.real0Z * 15) * ScaleFactor, this.realY + (this.real0Y * this.ScaleFactor + this.real0Z * 15) * ScaleFactor, 0.06 * this.ScaleFactor * ScaleFactor, 0, Math.PI * 2.0, false);
        c.fillStyle = 'rgba(0,0,0,' + this.realAlpha * 0.5 + ')';
        c.fill();

        c.beginPath();
        c.arc(this.realX + (this.real1X * this.ScaleFactor + this.real1Z * 15) * ScaleFactor, this.realY + (this.real1Y * this.ScaleFactor + this.real1Z * 15) * ScaleFactor, 0.06 * this.ScaleFactor * ScaleFactor, 0, Math.PI * 2.0, false);
        c.fillStyle = 'rgba(0,0,0,' + this.realAlpha * 0.5 + ')';
        c.fill();


        c.shadowColor = 'rgba(0,0,0,0.25)';
        c.shadowBlur = 20;
        let Scale0Factor = ((this.real0Z - 0.2) * 0.4 / (2 - 0.2) + 1);
        c.beginPath();
        c.arc(this.realX + this.real0X * this.ScaleFactor * ScaleFactor, this.realY - this.real0Z * 5 + this.real0Y * this.ScaleFactor * ScaleFactor, 0.06 * this.ScaleFactor * ScaleFactor * Scale0Factor, 0, Math.PI * 2.0, false);

        let Xpos = this.realX + this.real0X * this.ScaleFactor * ScaleFactor;
        let Ypos = this.realY - this.real0Z * 5 + this.real0Y * this.ScaleFactor * ScaleFactor;
        let Radius = 0.06 * this.ScaleFactor * ScaleFactor * Scale0Factor;
        let grd = c.createRadialGradient(Xpos + Radius * 0.04, Ypos + Radius * 0.04, Radius * 0.75, Xpos, Ypos, Radius);
        grd.addColorStop(0, "rgb(34, 34, 34," + this.realAlpha + ")");
        grd.addColorStop(1, "rgb(93, 93, 93," + this.realAlpha + ")");

        c.fillStyle = grd;
        c.fill();

        c.shadowColor = 'rgba(0,0,0,0.25)';
        c.shadowBlur = 20;
        let Scale1Factor = ((this.real1Z - 0.2) * 0.4 / (2 - 0.2) + 1);
        c.beginPath();
        c.arc(this.realX + this.real1X * this.ScaleFactor * ScaleFactor, this.realY - this.real1Z * 5 + this.real1Y * this.ScaleFactor * ScaleFactor, 0.06 * this.ScaleFactor * ScaleFactor * Scale1Factor, 0, Math.PI * 2.0, false);

        Xpos = this.realX + this.real1X * this.ScaleFactor * ScaleFactor;
        Ypos = this.realY - this.real1Z * 5 + this.real1Y * this.ScaleFactor * ScaleFactor;
        Radius = 0.06 * this.ScaleFactor * ScaleFactor * Scale1Factor;
        grd = c.createRadialGradient(Xpos + Radius * 0.04, Ypos + Radius * 0.04, Radius * 0.75, Xpos, Ypos, Radius);
        grd.addColorStop(0, "rgb(211, 211, 211," + this.realAlpha + ")");
        grd.addColorStop(1, "rgb(182, 182, 182," + this.realAlpha + ")");

        c.fillStyle = grd;
        c.fill();
    }

    drawShadow() {
        c.shadowColor = 'rgba(0,0,0,0)';
        c.shadowBlur = 0;
        c.fillStyle = 'rgba(0,0,0,' + 0.5 * this.realAlpha + ')';
        c.fillRect(this.realX - this.xSize * 0.5 + this.realZ * 50, this.realY - this.ySize * 0.5 + this.realZ * 50, this.xSize, this.ySize);
    }

    update() {
        this.targetZ = this.show ? 0.2 : 0.5;
        //this.targetY = this.show ? canvas.height*0.5 : canvas.height+this.ySize;
        this.targetAlpha = this.show ? 1 : 0;
        this.target0Z = (this.choice == 0) ? 2 : 0.2;
        this.target1Z = (this.choice == 1) ? 2 : 0.2;

        this.realX = this.realX + (this.targetX - this.realX) * 0.02;
        this.realY = this.realY + (this.targetY - this.realY) * 0.02;
        this.realZ = this.realZ + (this.targetZ - this.realZ) * 0.03;
        this.realAlpha = this.realAlpha + (this.targetAlpha - this.realAlpha) * 0.03;

        this.real0X = this.real0X + (this.target0X - this.real0X) * 0.02;
        this.real0Y = this.real0Y + (this.target0Y - this.real0Y) * 0.02;
        this.real0Z = this.real0Z + (this.target0Z - this.real0Z) * 0.1;

        this.real1X = this.real1X + (this.target1X - this.real1X) * 0.02;
        this.real1Y = this.real1Y + (this.target1Y - this.real1Y) * 0.02;
        this.real1Z = this.real1Z + (this.target1Z - this.real1Z) * 0.1;
    }
}
class winStroke {
    constructor(centerX, centerY, angle) {
        this.angle = angle;
        this.centerX;
        this.centerY;
        this.length;
        this.targetWidth = pieceSize * 1.2;
        this.realWidth;
        switch (this.angle) {
            case 0:
                this.centerY = centerY;
                this.centerX = canvas.width * 0.5;
                this.length = canvas.width;
                this.realWidth = this.targetWidth * 10;
                break;
            case 90:
                this.centerY = canvas.height * 0.5;
                this.centerX = centerX;
                this.length = canvas.height;
                this.realWidth = this.targetWidth * 10;
                break;
            case 45:
                this.centerY = centerY;
                this.centerX = centerX;
                this.length = Math.max(canvas.height, canvas.width) * 2;
                this.realWidth = this.targetWidth * 10;
                break;
            case -45:
                this.centerY = centerY;
                this.centerX = centerX;
                this.length = Math.max(canvas.height, canvas.width) * 2;
                this.realWidth = this.targetWidth * 10;
                break;
        }
        this.targetAlpha = 0;
        this.realAlpha = 0;
    }
    reset(centerX, centerY, angle) {
        this.angle = angle;
        this.centerX;
        this.centerY;
        this.length;
        this.targetWidth = pieceSize * 1.2;
        this.realWidth;
        switch (this.angle) {
            case 0:
                this.centerY = centerY;
                this.centerX = canvas.width * 0.5;
                this.length = canvas.width;
                this.realWidth = this.targetWidth * 10;
                break;
            case 90:
                this.centerY = canvas.height * 0.5;
                this.centerX = centerX;
                this.length = canvas.height;
                this.realWidth = this.targetWidth * 10;
                break;
            case 45:
                this.centerY = centerY;
                this.centerX = centerX;
                this.length = Math.max(canvas.height, canvas.width) * 2;
                this.realWidth = this.targetWidth * 10;
                break;
            case -45:
                this.centerY = centerY;
                this.centerX = centerX;
                this.length = Math.max(canvas.height, canvas.width) * 2;
                this.realWidth = this.targetWidth * 10;
                break;
        }
        this.targetAlpha = 1;
        this.realAlpha = 0;
    }
    draw() {
        c.shadowColor = 'rgba(0,0,0,0)';
        c.shadowBlur = 0;
        c.strokeStyle = 'rgb(255,0,0,' + this.realAlpha * 0.4 + ')';
        c.lineWidth = this.realWidth;
        c.beginPath();
        switch (this.angle) {
            case 0:
                c.moveTo(this.centerX - this.length, this.centerY);
                c.lineTo(this.centerX + this.length, this.centerY);
                break;
            case 90:
                c.moveTo(this.centerX, this.centerY - this.length);
                c.lineTo(this.centerX, this.centerY + this.length);
                break;
            case 45:
                c.moveTo(this.centerX + this.length, this.centerY - this.length);
                c.lineTo(this.centerX - this.length, this.centerY + this.length);
                break;
            case -45:
                c.moveTo(this.centerX + this.length, this.centerY + this.length);
                c.lineTo(this.centerX - this.length, this.centerY - this.length);
                break;
        }
        c.stroke();
    }
    update() {
        this.realWidth = this.realWidth + (this.targetWidth - this.realWidth) * 0.05;
        this.realAlpha = this.realAlpha + (this.targetAlpha - this.realAlpha) * 0.05;
    }
}
class piece {

    constructor(x, y, playerIndex) {
        let realPos = piecePos(x, y);
        this.targetX = realPos[0];
        this.targetY = realPos[1];
        this.playerIndex = playerIndex;
        this.size = 0.45 * pieceSize;
        this.targetZ = 0.2;
        this.realZ = 10;
        this.realX = (this.playerIndex === PlayerChoiceIndex) ? (canvas.width * 0.45) : (canvas.width * 0.55);
        this.realY = (this.playerIndex === PlayerChoiceIndex) ? (canvas.height + this.size * 2) : (-this.size * 2);

        this.offsetX = (Math.random() * 2 - 1) * 0.05 * pieceSize;
        this.offsetY = (Math.random() * 2 - 1) * 0.05 * pieceSize;
    }

    draw() {
        let Radius = this.size * ((this.realZ - 0.2) * 1 / (10 - 0.5) + 1);
        let Xpos = this.realX;
        let YPos = this.realY - this.realZ * 5;

        c.beginPath();
        c.shadowColor = 'rgba(0,0,0,' + ((this.realZ - 0.2) * -0.35 / (10 - 0.5) + 0.35) + ')';
        c.shadowBlur = 20;
        c.arc(Xpos, YPos, Radius, 0, Math.PI * 2.0, false);

        let grd;

        if (this.playerIndex == 0) {
            grd = c.createRadialGradient(Xpos + Radius * 0.04, YPos + Radius * 0.04, Radius * 0.75, Xpos, YPos, Radius);
            grd.addColorStop(0, "#1E1E1E");
            grd.addColorStop(1, "#5B5B5B");
        } else {
            grd = c.createRadialGradient(Xpos - Radius * 0.04, YPos - Radius * 0.04, Radius * 0.75, Xpos, YPos, Radius);
            grd.addColorStop(0, "#D5D5D5");
            grd.addColorStop(1, "#BDAEA3");
        }


        c.fillStyle = grd;
        c.fill();
    }

    drawShadow() {
        c.beginPath();
        c.shadowColor = 'rgba(0,0,0,0)';
        c.shadowBlur = 0;
        c.arc(this.realX + this.realZ * 20, this.realY + this.realZ * 20, this.size, 0, Math.PI * 2.0, false);
        c.fillStyle = 'rgb(0,0,0,0.25)';
        c.fill();
    }

    update() {
        this.realX = this.realX + (this.targetX + this.offsetX - this.realX) * 0.05;
        this.realY = this.realY + (this.targetY + this.offsetX - this.realY) * 0.05;
        this.realZ = this.realZ + (this.targetZ - this.realZ) * 0.015;
        this.draw();
    }
}

class indicator {

    constructor(x, y, playerIndex) {
        let realPos = piecePos(x, y);
        this.targetX = realPos[0];
        this.targetY = realPos[1];
        this.playerIndex = playerIndex;
        this.size = 0.45 * pieceSize;
        this.targetScale = 0;
        this.realScale = 0;
        this.realX = (this.playerIndex === PlayerChoiceIndex) ? (canvas.width * 0.45) : (canvas.width * 0.55);
        this.realY = (this.playerIndex === PlayerChoiceIndex) ? (canvas.height + this.size * 2) : (-this.size * 2);
    }

    draw() {
        c.shadowColor = 'rgba(0,0,0,0)';
        c.shadowBlur = 0;
        c.lineWidth = 3;
        c.beginPath();
        c.arc(this.realX, this.realY, this.size * this.realScale, 0, Math.PI * 2.0, false);
        c.strokeStyle = 'rgba(255,0,0,0.5)';
        c.stroke();
    }

    update() {
        this.realX = this.realX + (this.targetX - this.realX) * 0.1;
        this.realY = this.realY + (this.targetY - this.realY) * 0.1;
        this.realScale = this.realScale + (this.targetScale - this.realScale) * 0.1;
        this.draw();
    }
}

var nowPlayerIndex = 0;
var Board = new checkerBoard();
var myIndicator = new indicator(0, 0, PlayerChoiceIndex);
var ScoreBoard = new scoreBoard('-GOBANG-');

var myWinStroke = new winStroke(0, 0, 0);

let TouchX = -1;
let TouchY = -1;
/*addEventListener('touchstart', (event)=>{
    TouchX = event.touches[0].clientX;
    TouchY = event.touches[0].clientY;
});*/
addEventListener('touchend', TouchClickMission);
addEventListener('touchmove', TouchMoveMission)
addEventListener('click', MouseClickMission);
addEventListener('mousemove', MouseMoveMission);
function DoMove(x,y) {
    let realPos = mousePos(x, y);
    let moveX = realPos[0];
    let moveY = realPos[1];
    moveX = (moveX < 0) ? 0 : ((moveX >= BoardSize) ? (BoardSize - 1) : moveX);
    moveY = (moveY < 0) ? 0 : ((moveY >= BoardSize) ? (BoardSize - 1) : moveY);
    //myIndicator.targetScale = (Board.pieces[moveX][moveY] === -1) ? 1 : 1.2;
    let tempPos = piecePos(moveX, moveY);
    myIndicator.targetX = tempPos[0];
    myIndicator.targetY = tempPos[1];

    if (ScoreBoard.show) {
        let mouseX = x;
        let mouseY = y;
        let mouse0X = mouseX - ScoreBoard.realX - ScoreBoard.real0X * ScoreBoard.ScaleFactor;
        let mouse0Y = mouseY - ScoreBoard.realY - ScoreBoard.real0Y * ScoreBoard.ScaleFactor;

        let mouse1X = mouseX - ScoreBoard.realX - ScoreBoard.real1X * ScoreBoard.ScaleFactor;
        let mouse1Y = mouseY - ScoreBoard.realY - ScoreBoard.real1Y * ScoreBoard.ScaleFactor;

        if (mouse0X * mouse0X + mouse0Y * mouse0Y < (0.06 * ScoreBoard.ScaleFactor) * (0.06 * ScoreBoard.ScaleFactor)) {
            ScoreBoard.choice = 0;
        } else if (mouse1X * mouse1X + mouse1Y * mouse1Y < (0.06 * ScoreBoard.ScaleFactor) * (0.06 * ScoreBoard.ScaleFactor)) {
            ScoreBoard.choice = 1;
        } else {
            ScoreBoard.choice = -1;
        }
    }
}
function DoClick(x,y) {
    if (!GameState) {

        if (ScoreBoard.show) {
            let mouseX = x;
            let mouseY = y;
            let mouse0X = mouseX - ScoreBoard.realX - ScoreBoard.real0X * ScoreBoard.ScaleFactor;
            let mouse0Y = mouseY - ScoreBoard.realY - ScoreBoard.real0Y * ScoreBoard.ScaleFactor;

            let mouse1X = mouseX - ScoreBoard.realX - ScoreBoard.real1X * ScoreBoard.ScaleFactor;
            let mouse1Y = mouseY - ScoreBoard.realY - ScoreBoard.real1Y * ScoreBoard.ScaleFactor;

            if (mouse0X * mouse0X + mouse0Y * mouse0Y < (0.06 * ScoreBoard.ScaleFactor) * (0.06 * ScoreBoard.ScaleFactor)) {
                myWinStroke.targetAlpha = 0;
                PlayerChoiceIndex = 0;
                GameState = true;
                ScoreBoard.show = false;
                ScoreBoard.choice = -1;
                pieces = [];
                Board.clear();
                nowPlayerIndex = 0;
            } else if (mouse1X * mouse1X + mouse1Y * mouse1Y < (0.06 * ScoreBoard.ScaleFactor) * (0.06 * ScoreBoard.ScaleFactor)) {
                myWinStroke.targetAlpha = 0;
                PlayerChoiceIndex = 1;
                GameState = true;
                ScoreBoard.show = false;
                ScoreBoard.choice = -1;
                pieces = [];
                Board.clear();
                nowPlayerIndex = 0;
            } else {
                return;
            }
        }

        return;
    }
    if (TimeCount != 0 || nowPlayerIndex != PlayerChoiceIndex)
        return;

    let realPos = mousePos(x, y);
    let clickX = realPos[0];
    let clickY = realPos[1];

    if (clickX < 0 || clickX >= BoardSize || clickY < 0 || clickY > BoardSize) {
        return;
    }
    if (Board.pieces[clickX][clickY] === -1) {
        let thisPiece = new piece(clickX, clickY, nowPlayerIndex);

        thisPiece.draw();
        Board.pieces[clickX][clickY] = nowPlayerIndex;
        TimeCount = StepTime;
        let win = Board.win(clickX, clickY, nowPlayerIndex);
        if (win[0] != -1) {
            //console.log(win[0]);
            let mousePos = piecePos(realPos[0], realPos[1]);
            myWinStroke.reset(mousePos[0], mousePos[1], win[1]);
            GameState = false;
            TimeCount = WinTime;
            //ScoreBoard.show = true;
            ScoreBoard.text = (win[0] == PlayerChoiceIndex) ? "-You Win-" : "-You Fail-";
        }
        nowPlayerIndex = 1 - nowPlayerIndex;
        pieces.push(thisPiece);
        //console.log(thisPiece);
    }
}

function MouseMoveMission(event){
    DoMove(event.clientX,event.clientY);
}

function MouseClickMission(event){
    DoClick(event.clientX,event.clientY);
}

function TouchMoveMission(event){
    TouchX = event.touches[0].clientX;
    TouchY = event.touches[0].clientY;
    DoMove(event.touches[0].clientX,event.touches[0].clientY);
}

function TouchClickMission(event){
    DoClick(TouchX,TouchY);
}


function AIPlayer() {
    let x, y;
    /*x = Math.floor(Math.random() * (BoardSize - 0.001));
    y = Math.floor(Math.random() * (BoardSize - 0.001));
    let now = Board.pieces[x][y];
    while (now != -1) {
        x = Math.floor(Math.random() * (BoardSize - 0.001));
        y = Math.floor(Math.random() * (BoardSize - 0.001));
        now = Board.pieces[x][y];
    }*/
    let Best = Board.getBest(nowPlayerIndex);
    x = Best[0];
    y = Best[1];






    TimeCount = StepTime;
    let thisPiece = new piece(x, y, nowPlayerIndex);
    thisPiece.draw();
    Board.pieces[x][y] = nowPlayerIndex;
    let win = Board.win(x, y, nowPlayerIndex);
    if (win[0] != -1) {
        //console.log(win[0]);
        let mousePos = piecePos(x, y);
        myWinStroke.reset(mousePos[0], mousePos[1], win[1]);
        GameState = false;
        TimeCount = WinTime;
        //ScoreBoard.show = true;
        ScoreBoard.text = (win[0] == PlayerChoiceIndex) ? "-You Win-" : "-You Fail-";
    }
    nowPlayerIndex = 1 - nowPlayerIndex;
    pieces.push(thisPiece);
}
function drawGrid() {

    var BGgrd = c.createRadialGradient(canvas.width * 0.5, canvas.height * 0.5, 0, canvas.width * 0.5, canvas.height * 0.5, Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) * 0.5);
    BGgrd.addColorStop(0, "#92E0E5");
    BGgrd.addColorStop(1, "#7588A2");

    c.fillStyle = BGgrd;

    //c.fillStyle = '#d6753d';
    c.fillRect(0, 0, canvas.width, canvas.height);


    //c.fillStyle = 'rgba(0,0,0,0.5)';
    //c.fillRect(center[0] - pieceSize * 0.5 + 10, center[1] - pieceSize * 0.5 + 10, boardSize + pieceSize, boardSize + pieceSize);

    var grd = c.createRadialGradient(center[0] + boardSize * 0.5, center[1] + boardSize * 0.5, 0, center[0] + boardSize * 0.5, center[1] + boardSize * 0.5, boardSize * 0.5 * 1.414);
    grd.addColorStop(0, "#F6CE95");
    grd.addColorStop(1, "#E7A676");

    c.fillStyle = grd;
    c.shadowColor = 'rgba(0,0,0,0.5)';
    c.shadowBlur = 70;

    c.fillRect(center[0] - pieceSize * 0.5, center[1] - pieceSize * 0.5, boardSize + pieceSize, boardSize + pieceSize);

    let width = 2;
    c.fillStyle = 'rgba(0,0,0,0.5)';
    for (let i = 1; i <= BoardSize; i++) {
        c.fillRect((i - 0.5) * pieceSize - width * 0.5 + center[0], center[1] + pieceSize * 0.5, width, boardSize - pieceSize);
        c.fillRect(center[0] + pieceSize * 0.5, (i - 0.5) * pieceSize - width * 0.5 + center[1], boardSize - pieceSize, width);
    }

    c.lineWidth = 5;
    c.strokeStyle = 'rgba(0,0,0,0.5)';
    c.strokeRect(center[0], center[1], boardSize, boardSize);



    c.shadowColor = 'rgba(0,0,0,0)';
    c.shadowBlur = 0;
    c.fillStyle = 'rgb(0,0,0,1)';
    c.beginPath();
    let H8 = piecePos(7, 7);
    c.arc(H8[0], H8[1], pieceSize*0.1, 0, Math.PI * 2.0, false);
    c.fill();
    c.beginPath();
    let D12 = piecePos(3, 3);
    c.arc(D12[0], D12[1], pieceSize*0.1, 0, Math.PI * 2.0, false);
    c.fill();
    c.beginPath();
    let D4 = piecePos(3, 11);
    c.arc(D4[0], D4[1], pieceSize*0.1, 0, Math.PI * 2.0, false);
    c.fill();
    c.beginPath();
    let L12 = piecePos(11, 3);
    c.arc(L12[0], L12[1], pieceSize*0.1, 0, Math.PI * 2.0, false);
    c.fill();
    c.beginPath();
    let L4 = piecePos(11, 11);
    c.arc(L4[0], L4[1], pieceSize*0.1, 0, Math.PI * 2.0, false);
    c.fill();
}

function drawScore() {
    for (let i = 0; i < BoardSize; i++) {
        for (let j = 0; j < BoardSize; j++) {
            let pos = piecePos(i, j);
            c.font = "10px sen-serif";
            c.textAlign = "center";
            c.fillStyle = 'rgba(255,0,0,1)';
            let thisScore = Board.chessShape(i, j, 1 - PlayerChoiceIndex);
            c.fillText(thisScore, pos[0], pos[1]);
        }
    }
}
function update() {
    requestAnimationFrame(update);

    drawGrid();
    ScoreBoard.update();
    myIndicator.update();
    myWinStroke.update();
    pieces.forEach(piece => {
        piece.drawShadow();
    })
    myWinStroke.draw();
    //ScoreBoard.drawShadow();
    pieces.forEach(piece => {
        piece.update();
    })
    ScoreBoard.draw();
    if (TimeCount > 0) {
        TimeCount -= 0.02;
    } else {
        TimeCount = 0;
    }
    if (TimeCount == 0 && !GameState && !ScoreBoard.show) {
        ScoreBoard.show = true;
    }
    //drawScore();
    //console.log(TimeCount);
    if (TimeCount == 0 && nowPlayerIndex != PlayerChoiceIndex && GameState) {
        AIPlayer();
    }
    myIndicator.targetScale = (TimeCount == 0 && nowPlayerIndex == PlayerChoiceIndex) ? 1 : 0;
    if (!GameState) {
        myIndicator.targetScale = 0;
    }
}
update();