import {
    Vector2,
    Vector3
} from '../three/build/three.module.js';
import * as THREE from '../three/build/three.module.js';

class cut {
    constructor(mouse_div, camera) {
        this.camera = camera;
        this.mouse_div = mouse_div;
        // this.geometry = new THREE.CircleGeometry(0.01, 5);
        // this.material = new THREE.MeshBasicMaterial({ color: 0xffffff });

        this.group = [];
        this.active = false;

        this.currentDot = null;
        this.preDot = new Vector2(0, 0);

    }
    spawn(point) {
        this.group.forEach((d) => {
            d.active = false;
            if (d.element != null){
                this.mouse_div.removeChild(d.element);
                d.element = null;
            }
        })

        this.active = true;
        this.preDot.copy(point);
    }
    addPoint(point) {
        this.newDot(point);
        this.preDot.copy(point)
    }
    kill() {
        this.group.forEach((d) => {
            d.active = false;
            if (d.element != null){
                this.mouse_div.removeChild(d.element);
                d.element = null;
            }
        })

        this.active = false;
        this.currentDot = null;
    }
    update(camera_width, camera_height, camera) {
        for (let i = 0; i != this.group.length; i++) {
            if (this.group[i].active) {
                this.group[i].element.style.display = 'block';
                let x = (this.group[i].x - camera.position.x) / camera_width;
                let y = -(this.group[i].y - camera.position.y) / camera_height;
                this.group[i].element.style.transform = 'translate(' + x * 100 + 'vw,' + y * 100 + 'vh)';
            }
        }
    }

    newDot(point) {
        let currentDot = null;

        for (let i = 0; i != this.group.length; i++) {
            if (!this.group[i].active) {
                currentDot = this.group[i];
                break;
            }
        }
        if (currentDot == null) {
            currentDot = { element: null, x: 0, y: 0, active: false };
            this.group.push(currentDot);
        }

        currentDot.element = document.createElement('div');
        currentDot.element.className = 'cut_dot';
        currentDot.element.style.display = 'none';
        mouse_div.appendChild(currentDot.element);

        currentDot.active = true;
        currentDot.x = point.x;
        currentDot.y = point.y;

    }
};

export { cut };