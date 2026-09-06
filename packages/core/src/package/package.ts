import { patches, replaceSource } from '../webpack/patch';
import corePlugin from './packages/core/core';
import privacyPlugin from './packages/privacy';
import experimentsPlugin from './packages/experiments';
import testPlugin from './packages/test';
import { PatchType, UniformPatch } from '@foxcord/vulpatch';
import { FoxcordStore } from '@foxcord/core/utils/store';
import { webpack } from '@foxcord/core/webpack/hookWebpack';

export interface PackageInterface {
    name: string;
    patches?: UniformPatch[];
    core?: boolean;
    load?: () => void;
    unload?: () => void;
    [key: string]: any;
}

export type PackageEntry = {
    package: PackageInterface;
    toggled: boolean;
    pending: boolean;
}

class PackageStore extends FoxcordStore {
    private packages: Map<string, PackageEntry> = new Map();
    private pendingPackages: boolean = false;

    register(pack: PackageInterface, toggled = pack.core === true) {
        this.rawRegister(pack, toggled);
        this.emit();
    }

    private rawRegister(pack: PackageInterface, toggled = pack.core === true) {
        if (this.packages.has(pack.name)) return;

        this.packages.set(pack.name, { package: pack, toggled, pending: false });
        if (toggled) {
            if (isStartup()) {
                startupLoadPackage(pack);
            } else if (hotLoadable(pack)) {
                hotLoadPackage(pack);
            } else {
                this.markPending(pack.name);
            }
        }
    }

    registerBatch(...packs: PackageInterface[]) {
        for (const pack of packs) {
            this.rawRegister(pack);
        }

        this.emit();
    }

    get(name: string) {
        return this.packages.get(name);
    }

    setToggled(name: string, toggle: boolean) {
        const entry = this.packages.get(name);
        if (!entry) return;
        if (entry.package.core) return;

        entry.toggled = toggle;

        if (!hotLoadable(entry.package)) {
            this.markPending(name);
        } else if (toggle) {
            hotLoadPackage(entry.package);
        } else {
            hotUnloadPackage(entry.package);
        }

        this.emit();
    }

    private markPending(name: string) {
        const entry = this.packages.get(name);
        if (!entry) return;
        if (entry.package.core) return;

        entry.pending = true;
        this.pendingPackages = true;
    }

    get entries() {
        return [...this.packages];
    }

    get entriesMap() {
        return new Map(this.packages);
    }

    get isPending() {
        return this.pendingPackages;
    }
}

export const packageStore = new PackageStore();

export function initPackages() {
    packageStore.registerBatch(
        corePlugin,
        privacyPlugin,
        experimentsPlugin,
        testPlugin,
    );
}

function hotLoadable(pack: PackageInterface) {
    return pack.patches == undefined;
}

function isStartup(): boolean {
    return webpack == undefined;
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
    return `window.BSJD.p.get(${JSON.stringify(name)}).package`;
}

export function hotLoadPackage(pack: PackageInterface) {
    if (!hotLoadable(pack)) return;

    if (pack.load) {
        pack.load();
    }
}

export function hotUnloadPackage(pack: PackageInterface) {
    if (!hotLoadable(pack)) return;

    if (pack.unload) {
        pack.unload();
    }
}

export function startupLoadPackage(pack: PackageInterface) {
    if (!isStartup()) return;

    const pluginPatches = pack.patches || [];

    pluginPatches.forEach(patch => replaceSource(patch, pack.name));

    patches.regexPatches.push(...pluginPatches.filter((patch) => patch.type == PatchType.RegexPatch));
    patches.astPatches.push(...pluginPatches.filter((patch) => patch.type == PatchType.AstPatch));

    if (pack.load) {
        pack.load();
    }
}