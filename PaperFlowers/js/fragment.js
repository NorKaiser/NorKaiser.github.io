import {
    Vector2,
} from '../three/build/three.module.js';
import * as THREE from '../three/build/three.module.js';
import { shapeShader } from './shapeShader.js';
import { Mathf } from './Mathf.js';

class fragment {
    constructor(geo) {

        this.pointList = [];
        this.rect = {
            x_min: -5,
            x_max: 5,
            y_min: -5,
            y_max: 5,
            area: 100
        };
        this.renderTarget = new THREE.WebGLRenderTarget(512, 512, {
            wrapS: THREE.ClampToEdgeWrapping,
            wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: (!!navigator.userAgent.match(/Safari/i) && !navigator.userAgent.match(/Chrome/i)) ? THREE.HalfFloatType : THREE.FloatType,
            depthBuffer: false
        });
        this.geometry = new THREE.BufferGeometry().copy(geo);
        this.material = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.clone(shapeShader.uniforms),
            vertexShader: shapeShader.vertexShader,
            fragmentShader: shapeShader.fragmentShader,
            side: THREE.DoubleSide
        });
        this.material.uniforms['_alpha'].value = this.renderTarget.texture;
        this.material.uniforms['_frontColor'].value = new THREE.Color(0xff0000);
        this.material.uniforms['_backColor'].value = new THREE.Color(0xffff00);

        this.fragmentShape = new THREE.Mesh(this.geometry, this.material);
        this.fragment = new THREE.Group();
        this.fragment.add(this.fragmentShape);
        this.shapeScale = 1;

        this.cutCompute = null;

        this.active = false;
        this.fragment.visible = false;



        this.timeCount = 0;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.rotation = 0;
        this.rotationAngle = new THREE.Vector3(0, 0, 0);
        this.currentPos = new THREE.Vector3(0, 0, 0);
        this.gravity = new THREE.Vector3(0, -50, 0);
        this.life = 5;

        for (let i = 0; i != this.fragmentShape.morphTargetInfluences.length; i++)
            this.fragmentShape.morphTargetInfluences[i] = 0;
        this.fragmentShape.morphTargetInfluences[69] = 1;

    }
    refresh() {
        this.cutCompute.getResult(this.pointList, this.rect, this.renderTarget);
    }
    spawn(shape) {
        this.active = true;
        this.fragment.visible = true;
        this.fragmentShape.scale.set(this.shapeScale, this.shapeScale, this.shapeScale);
        this.fragment.position.set((shape.rect.x_min + shape.rect.x_max) * 0.5, (shape.rect.y_min + shape.rect.y_max) * 0.5, 0);
        this.fragmentShape.position.set(-this.fragment.position.x, -this.fragment.position.y, 0);
        this.fragment.rotation.set(0, 0, 0);
        this.pointList = shape.shape;
        this.rect = shape.rect;
        this.refresh();

        let shapeArea = (this.rect.x_max - this.rect.x_min) * (this.rect.y_max - this.rect.y_min);
        let veloctyMult = Mathf.Lerp(1, 0.4, Mathf.Clamped_Proportion(shapeArea, 0, 15));
        let rotateMult = Mathf.Lerp(1, 0.2, Mathf.Clamped_Proportion(shapeArea, 0, 15));


        this.timeCount = 0;
        this.currentPos.copy(this.fragment.position);
        this.velocity.copy(this.currentPos);
        this.velocity.add(new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 1.5 + 0.5, Math.random() * 3 - 1)).normalize().multiplyScalar((Math.random() * 4 + 3) * veloctyMult).add(new THREE.Vector3(0, 0, 2));

        this.rotation = (Math.random() * 3.1415926 / 6 + 3.1415926 / 6) * Math.abs(this.velocity.z) * rotateMult;
        let angle = Math.random() * 2 * 3.1415926;
        this.rotationAngle.set(Math.cos(angle), Math.sin(angle), 0);
    }
    update(delta) {
        this.timeCount += delta;

        this.currentPos.add(new THREE.Vector3().copy(this.velocity).multiplyScalar(delta));
        this.velocity.add(new THREE.Vector3().copy(this.gravity).multiplyScalar(delta));
        this.velocity.multiplyScalar(0.999);

        this.fragment.position.copy(this.currentPos);
        this.fragment.rotateOnAxis(this.rotationAngle, this.rotation * delta);
        this.rotation *= 0.99;

        if (this.timeCount >= this.life) {
            this.active = false;
            this.fragment.visible = false;
        }
    };
};

export { fragment };