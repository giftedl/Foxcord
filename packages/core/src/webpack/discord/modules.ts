import { vulpmap, utils } from '../vulpmap';
import { FilterType, FullExportsFilterBuilder } from '@foxcord/vulpmap';

export type JsxFunc = (element: string, body: any, props?: any) => object;

type JsxModule = {
    jsx: JsxFunc;
    jsxs: JsxFunc;
    Fragment: symbol;
};
export var ReactJsxModule: JsxModule;
vulpmap.registerMapperAndSearch(
    "React/JsxModule",
    {
        map(found, builder) {
            builder.mapProperty(found);
        },
        filterType: FilterType.ExportsFilter,
        filter: new FullExportsFilterBuilder(utils.makeFullFilter(utils.byPropsFilter("jsxs", "jsx", "Fragment")))
            .retrieveRoot(true)
            .finish(),
    }
).then(mapped => ReactJsxModule = mapped as unknown as JsxModule);