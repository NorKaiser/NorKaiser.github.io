import {
    Vector2,
} from '../three/build/three.module.js';
import * as THREE from '../three/build/three.module.js';
import { shapeShader } from './shapeShader.js';

class shape {
    constructor(geo, shapeIndex, name) {
        this.shapeIndex = shapeIndex;
        this.cutCount = 0;
        this.cutable = false;
        this.edg_A = [];
        this.edg_B = [];
        this.initCut = [];
        this.minHeight = 0;
        this.pointList = [];
        this.rect = {
            x_min: -5,
            x_max: 5,
            y_min: -5,
            y_max: 5,
            area: 100
        };
        this.name = name;
        this.renderTarget = new THREE.WebGLRenderTarget(512, 512, {
            wrapS: THREE.ClampToEdgeWrapping,
            wrapT: THREE.ClampToEdgeWrapping,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            format: THREE.RGBAFormat,
            type: (!!navigator.userAgent.match(/Safari/i) && !navigator.userAgent.match(/Chrome/i)) ? THREE.HalfFloatType : THREE.FloatType,
            depthBuffer: false
        });
        this.renderTarget.texture.name = name;
        this.geometry = new THREE.BufferGeometry().copy(geo);
        this.material = new THREE.ShaderMaterial({
            uniforms: THREE.UniformsUtils.clone(shapeShader.uniforms),
            vertexShader: shapeShader.vertexShader,
            fragmentShader: shapeShader.fragmentShader,
            side: THREE.DoubleSide
        });
        this.material.uniforms['_alpha'].value = this.renderTarget.texture;

        //this.material = new THREE.MeshStandardMaterial({ color: 0xff0000, side: THREE.DoubleSide });

        this.shapeScale = 1;

        this.shape = new THREE.Mesh(this.geometry, this.material);
        this.shape.visible = false;
        this.active = false;
        this.cutCompute = null;

        this.frame = 0.0;
        this.frameCount = 90;
        this.send = false;
    }
    setAnimation(frame) {
        let framePos = (frame - Math.floor(frame)) * this.frameCount;
        let nowFrame = Math.floor(framePos);
        let nextFrame = Math.min(nowFrame + 1, this.frameCount - 1);
        if (nextFrame == nowFrame)
            framePos = nowFrame;
        for (let i = 0; i != this.frameCount; i++) {
            if (i < nowFrame || i > nextFrame)
                this.shape.morphTargetInfluences[i] = 0;
            else if (i == nowFrame)
                this.shape.morphTargetInfluences[i] = 1.0 - (framePos - nowFrame);
            else if (i == nextFrame)
                this.shape.morphTargetInfluences[i] = (framePos - nowFrame);
        }
    }
    spawn() {
        this.shape.scale.set(this.shapeScale, this.shapeScale, this.shapeScale);
        this.shape.visible = true;
        this.active = true;
        this.cutable = false;
        this.send = false;
        this.cutCount = 0;
        // this.frame = 0;
        // this.setAnimation(this.frame);
    }
    update(delta) {
        // if (this.frame < (this.send ? 1 : 69 / 90)) {
        //     this.frame = Math.min(this.frame + delta * 0.3333, (this.send ? 1 : 69 / 90));
        //     this.setAnimation(this.frame);
        // } else {
        //     this.frame = (this.send ? 1 : 69 / 90);
        //     this.setAnimation(this.frame);
        //     this.cutable = true;
        // }
        // if (this.frame == 1) {
        //     this.kill();
        // }
    }
    kill() {
        this.shape.visible = false;
        this.active = false;
    }
    refresh() {
        this.cutCompute.getResult(this.pointList, this.rect, this.renderTarget);
    }
    is_Intersected(A, B, C, D) {
        let AC_x = A.x - C.x;
        let AC_y = A.y - C.y;

        let AD_x = A.x - D.x;
        let AD_y = A.y - D.y;

        let BC_x = B.x - C.x;
        let BC_y = B.y - C.y;

        let BD_x = B.x - D.x;
        let BD_y = B.y - D.y;

        return ((AC_x * AD_y - AD_x * AC_y) * (BC_x * BD_y - BD_x * BC_y) <= 0) && ((AC_x * BC_y - BC_x * AC_y) * (AD_x * BD_y - BD_x * AD_y) <= 0);
    }
    get_Intersect(A, B, C, D) {
        let t = ((D.x - A.x) * (B.y - A.y) - (D.y - A.y) * (B.x - A.x)) / ((C.y - D.y) * (B.x - A.x) - (C.x - D.x) * (B.y - A.y));
        return new Vector2((C.x - D.x) * t + D.x, (C.y - D.y) * t + D.y);
    }
    getRect(pointList) {
        let X_Min = Number.MAX_VALUE;
        let Y_Min = Number.MAX_VALUE;
        let X_Max = -Number.MAX_VALUE;
        let Y_Max = -Number.MAX_VALUE;
        pointList.forEach((v) => {
            X_Min = Math.min(X_Min, v.x);
            Y_Min = Math.min(Y_Min, v.y);
            X_Max = Math.max(X_Max, v.x);
            Y_Max = Math.max(Y_Max, v.y);
        });
        return {
            x_min: X_Min,
            x_max: X_Max,
            y_min: Y_Min,
            y_max: Y_Max,
            area: (X_Max - X_Min) * (Y_Max - Y_Min)
        };
    }
    islegal(pointList) {
        let p_in_SideA = false;
        let p_in_SideB = false;
        for (let i = 0; i != pointList.length; i++) {
            if (!p_in_SideA)
                p_in_SideA = p_in_SideA || (this.point2Line(pointList[i], this.edg_A) < 0.001);
            if (!p_in_SideB)
                p_in_SideB = p_in_SideB || (this.point2Line(pointList[i], this.edg_B) < 0.001);
            if (p_in_SideA && p_in_SideB)
                break;
        }
        let bounds = this.getRect(pointList);
        return { 'legal': ((bounds.y_max - bounds.y_min) > this.minHeight * 10) && (p_in_SideA && p_in_SideB), 'bounds': bounds, 'area': (bounds.y_max - bounds.y_min) * (bounds.x_max - bounds.x_min) };
    }
    point2Line(p, line) {
        let line_magnitude = new Vector2(line[0], line[1]).distanceTo(new Vector2(line[2], line[3]));
        let distance = Number.MAX_VALUE;
        let ix, iy;
        if (line_magnitude > 0) {
            let u1 = (((p.x - line[0]) * (line[2] - line[0])) + ((p.y - line[1]) * (line[3] - line[1])));
            let u = u1 / (line_magnitude * line_magnitude);
            if ((u < 0.000001) || (u > 1)) {
                ix = p.distanceTo(new Vector2(line[0], line[1]));
                iy = p.distanceTo(new Vector2(line[2], line[3]));
                distance = Math.min(ix, iy);
            }
            else {
                ix = line[0] + u * (line[2] - line[0]);
                iy = line[1] + u * (line[3] - line[1]);
                distance = p.distanceTo(new Vector2(ix, iy));
            }
        }
        return distance;
    }
    cut(cutList) {
        this.cutCount++;
        let first_index = -1;
        let second_index = -1;
        let first_intersect = null;
        let second_intersect = null;
        if (cutList.length <= 2) {
            cutList.length = 0;
            return [];
        }

        for (let i = 0; i < this.pointList.length; i++) {
            let j = i + 1;
            if (i == this.pointList.length - 1)
                j = 0;


            if (first_index == -1 && this.is_Intersected(cutList[0], cutList[1], this.pointList[i], this.pointList[j])) {
                first_index = i;
                first_intersect = this.get_Intersect(cutList[0], cutList[1], this.pointList[i], this.pointList[j]);
            }
            if (second_index == -1 && this.is_Intersected(cutList[cutList.length - 2], cutList[cutList.length - 1], this.pointList[i], this.pointList[j])) {
                second_index = i;
                second_intersect = this.get_Intersect(cutList[cutList.length - 2], cutList[cutList.length - 1], this.pointList[i], this.pointList[j]);
            }
            if (first_index != -1 && second_index != -1)
                break;
        }
        if (first_index == -1 || second_index == -1) {
            cutList.length = 0;
            return [];
        }
        let inverse;
        if (first_index < second_index) {
            inverse = false;
        }
        else if (first_index > second_index) {
            inverse = true;
            let temp_i = second_index;
            let temp_v_x = second_intersect.x;
            let temp_v_y = second_intersect.y;
            second_index = first_index;
            second_intersect.copy(first_intersect);
            first_index = temp_i;
            first_intersect.set(temp_v_x, temp_v_y);
        } else {
            let first_l = first_intersect.distanceTo(this.pointList[first_index]);
            let second_l = second_intersect.distanceTo(this.pointList[first_index]);
            inverse = first_l > second_l;
            if (inverse) {
                let temp_v_x = second_intersect.x;
                let temp_v_y = second_intersect.y;
                second_intersect.copy(first_intersect);
                first_intersect.set(temp_v_x, temp_v_y);
            }
        }
        if (inverse)
            cutList.reverse();
        cutList.splice(0, 1, first_intersect);
        cutList.splice(cutList.length - 1, 1, second_intersect);

        let fragment_A = [];
        fragment_A.push(...this.pointList);
        fragment_A.splice(first_index + 1, second_index - first_index, ...cutList);

        let fragment_B = [];
        if (first_index != second_index) {
            fragment_B = this.pointList.slice(first_index + 1, second_index + 1);
            fragment_B.reverse();
        }
        fragment_B.push(...cutList);

        this.pointList.length = 0;
        let Legal_A = this.islegal(fragment_A);
        let Legal_B = this.islegal(fragment_B);
        let which = -1;
        if (Legal_A['legal'] && Legal_B['legal'])
            which = (Legal_A['area'] > Legal_B['area']) ? 0 : 1;
        else if (Legal_A['legal'] || Legal_B['legal'])
            which = Legal_A['legal'] ? 0 : 1;
        else {
            cutList.length = 0;
            return [{ shape: fragment_A, rect: Legal_A['bounds'] }, { shape: fragment_B, rect: Legal_B['bounds'] }];
        }
        cutList.length = 0;
        if (which != -1) {
            if (which == 0) {
                this.pointList.push(...fragment_A);
                this.rect = Legal_A['bounds'];
                return [{ shape: fragment_B, rect: Legal_B['bounds'] }];
            } else {
                this.pointList.push(...fragment_B);
                this.rect = Legal_B['bounds'];
                return [{ shape: fragment_A, rect: Legal_A['bounds'] }];
            }
        }
    }
    insideShape(p) {
        if (!this.cutable)
            return false;

        if (p.x < this.rect.x_min || p.x > this.rect.x_max || p.y < this.rect.y_min || p.y > this.rect.y_max) {
            return false;
        }
        let angle = 0;
        for (let i = 0; i != this.pointList.length; i++) {

            let nextIndex = (i + 1 >= this.pointList.length) ? 0 : (i + 1);

            let pre_x = this.pointList[i].x - p.x;
            let pre_y = this.pointList[i].y - p.y;
            let next_x = this.pointList[nextIndex].x - p.x;
            let next_y = this.pointList[nextIndex].y - p.y;

            let preAngle = Math.atan2(pre_y, pre_x);
            let nextAngle = Math.atan2(next_y, next_x);

            let temp = nextAngle - preAngle;

            if (pre_y * next_y < 0. && (next_y * (pre_x - next_x) / (next_y - pre_y) + next_x < 0.)) {
                temp -= 2. * 3.1415926 * (temp / Math.abs(temp));
            }
            angle += temp;
        }
        return Math.abs(Math.abs(angle / (2. * 3.1415926)) - 1) < 0.001;
    }
    self_Intersected(pointList) {
        if (pointList.Count < 4)
            return false;
        for (let i = 0; i < pointList.length - 3; i++) {
            if (this.is_Intersected(pointList[pointList.length - 2], pointList[pointList.length - 1], pointList[i], pointList[i + 1]))
                return true;
        }
        return false;
    }
};

export { shape };