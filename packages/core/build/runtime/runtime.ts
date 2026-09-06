import { PackageInterface } from '../../src/package/package';

declare global {
    interface Window {
        BSJD: {
            r: any;
            p: Map<string, PackageInterface>;
        }
    }
}

export function jsx(...args) {
    return window.BSJD.r.jsx(...args);
}

export function jsxs(...args) {
    return window.BSJD.r.jsxs(...args);
}

export const Fragment = Symbol.for("react.fragment");

export namespace JSX {
    export interface Element {}
    export interface IntrinsicElements {
        [tag: string]: any;
    }
    export interface ElementChildrenAttribute {
        children: {};
    }
}