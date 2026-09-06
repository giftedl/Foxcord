import { vulpmap, utils } from '../vulpmap';
import { FilterType } from '@foxcord/vulpmap';

export var Button: any;

vulpmap.registerMapperAndSearch("UI/Button", {
    filterType: FilterType.FactoryFilter,
    filter: utils.byFactoryCode("buttonChildren,"),
    map(found, mapped) {
        mapped.mapProperty(found[Object.keys(found)[0]]);
    }
}).then((mapped) => Button = mapped);