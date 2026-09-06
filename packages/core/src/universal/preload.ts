import {log} from "../log";
import {registerHook} from "../webpack/hookWebpack";
import {defineGlobal} from "../api/global";

log("Initializing...");

import "../webpack/discord/modules"
import { initPackages } from '@foxcord/core/package/package';
defineGlobal();
initPackages();
registerHook();