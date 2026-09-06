import { patches, replaceSource } from '../webpack/patch';
import corePlugin from './packages/core/core';
import privacyPlugin from './packages/privacy';
import experimentsPlugin from './packages/experiments';
import { PatchType, UniformPatch } from '@foxcord/vulpatch';

function makeToggled(pack: PackageInterface) {
    return {
        package: pack,
        toggled: pack.core == true
    }
}

export var packages: Map<string, PackageInterface> = mapPackages([
    corePlugin,
    privacyPlugin,
    experimentsPlugin
]);

export var toggledPackages: Map<string, ToggledPackage> = new Map(
    [...packages].map(([k, v]) => [k, {
        package: v,
        toggled: v.core === true
    }])
);

function mapPackages(plugins: PackageInterface[]) {
    return new Map(
        plugins.map(pack => [pack.name, pack])
    )
}

export interface PackageInterface {
    name: string;
    patches?: UniformPatch[];
    core?: boolean;
    load?: () => void;
    unload?: () => void;
    [key: string]: any;
}

export type ToggledPackage = {
    package: PackageInterface;
    toggled: boolean;
}

export function definePackage(plugin: PackageInterface): PackageInterface {
    plugin.patches?.forEach(patch => {
        replaceSource(patch, plugin.name);

        if (patch.type == PatchType.RegexPatch) {
            patch.replace.forEach(replace => {
                replace.with = replaceSelfRef(plugin.name, replace.with);
            })
        }
    });

    return plugin;
}

export function replaceSelfRef(name: string, replace: string) {
    return replace.replaceAll("$&self", accessPackageRuntime(name));
}

export function accessPackageRuntime(name: string) {
    return `window.BSJD.p.get(${JSON.stringify(name)})`;
}

export function registerPackages() {
    for (const pack of toggledPackages.values()) {
        if (pack.toggled) {
            const pluginPatches = pack.package.patches || [];

            pluginPatches.forEach(patch => replaceSource(patch, pack.package.name));

            patches.regexPatches.push(...pluginPatches.filter((patch) => patch.type == PatchType.RegexPatch));
            patches.astPatches.push(...pluginPatches.filter((patch) => patch.type == PatchType.AstPatch));

            if (pack.package.load) {
                pack.package.load();
            }
        }
    }
}

export function handleEnabledPackage(pack: PackageInterface) {
    if (pack.patches) return;

    if (pack.package.load) {
        pack.package.load();
    }
}