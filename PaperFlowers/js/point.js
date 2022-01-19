import {
    Vector2,
} from '../three/build/three.module.js';
import * as THREE from '../three/build/three.module.js';
import { cut } from './cut.js';

class point {
    constructor(mouse_div, camera) {

        this.camera = camera;

        // const geometry = new THREE.CircleGeometry(0.1, 8);
        // const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        // this.point = new THREE.Mesh(geometry, material);

        this.point = document.createElement('div');
        this.point.className = 'mouse_cube';
        mouse_div.appendChild(this.point);

        this.targetPos = new Vector2();
        this.screenPos = new Vector2();
        this.currentPos = new Vector2();
        this.prePos = new Vector2();
        this.followSpeed = 30;

        this.move = false;
        this.active = false;
        this.scale = 0;

        this.cutList = [];
        this.cutLine = new cut(mouse_div, camera);

        this.cutLineGap = 0.1;
        this.dis2preDot = 0;

        this.cutListGap = 0.05;
        this.inside = false;

    }
    update(delta, camera_width, camera_height) {

        this.targetPos.set((this.screenPos.x - 0.5) * camera_width + this.camera.position.x, (this.screenPos.y - 0.5) * camera_height + this.camera.position.y);

        this.currentPos.lerp(this.targetPos, Math.min(this.followSpeed * delta, 1));

        if (!this.move && this.scale < 0.0001) {
            this.active = false;
            this.point.style.display = 'none';
            this.cutLine.kill();
            this.cutList.length = 0;
        }

        this.scale = ((this.move ? 1 : 0) - this.scale) * Math.min(this.followSpeed * delta, 1) + this.scale;


        let x = this.screenPos.x - 0.5;
        let y = -(this.screenPos.y - 0.5);

        this.point.style.transform = 'translate(' + x * 100 + 'vw,' + y * 100 + 'vh) scale(' + this.scale + ')';

        this.cutLine.update(camera_width, camera_height, this.camera);
    }
    spawn(pos, camera_width, camera_height) {
        this.active = true;
        this.point.style.display = 'block';
        this.followSpeed = 30;
        this.move = true;
        this.screenPos.copy(pos);
        this.targetPos.set((pos.x - 0.5) * camera_width + this.camera.position.x, (pos.y - 0.5) * camera_height + this.camera.position.y);
        this.currentPos.copy(this.targetPos);
        this.prePos.copy(this.targetPos);

        this.cutList.length = 0;

        let x = pos.x - 0.5;
        let y = -(pos.y - 0.5);

        this.point.style.transform = 'translate(' + x * 100 + 'vw,' + y * 100 + 'vh) scale(0)';
    }
    kill() {
        this.move = false;
    }
};

export { point };