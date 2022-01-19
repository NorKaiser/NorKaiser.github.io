import {
    Vector2,
} from '../three/build/three.module.js';
import * as THREE from '../three/build/three.module.js';

class Mathf {
    static Clamp(t, min, max) {
        return Math.max(Math.min(t, max), min);
    }
    static Clamp01(t) {
        return this.Clamp(t, 0, 1);
    }
    static Lerp(a, b, t) {
        return a + (b - a) * t;
    }
    static Proportion(t, a, b) {
        return (t - a) / (b - a);
    }
    static Clamped_Proportion(t, a, b) {
        return this.Clamp01((t - a) / (b - a));
    }
    static SmoothDamp(current, target, currentVelocity, smoothTime, maxSpeed, deltaTime) {
        smoothTime = Math.max(0.0001, smoothTime);
        let num = 2 / smoothTime;
        let num2 = num * deltaTime;
        let num3 = 1 / (1 + num2 + 0.48 * num2 * num2 + 0.235 * num2 * num2 * num2);
        let num4 = current - target;
        let num5 = target;
        let num6 = maxSpeed * smoothTime;
        num4 = this.Clamp(num4, -num6, num6);
        target = current - num4;
        let num7 = (currentVelocity.val + num * num4) * deltaTime;
        currentVelocity.val = (currentVelocity.val - num * num7) * num3;
        let num8 = target + (num4 + num7) * num3;
        if (num5 - current > 0 == num8 > num5) {
            num8 = num5;
            currentVelocity = (num8 - num5) / deltaTime;
        }
        return num8;
    }
};

export { Mathf };