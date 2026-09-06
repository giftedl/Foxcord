import {log} from "../log";
import {registerHook} from "../webpack/hookWebpack";
import {registerPackages} from "../package/package";
import {defineGlobal} from "../api/global";

log("Initializing...");

import "../webpack/discord/modules"
defineGlobal();
registerPackages();
registerHook();