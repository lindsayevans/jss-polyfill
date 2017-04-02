
type JsssStyleCollection = {[name: string]: {[property: string]: string}};

interface Document {
    tags: JsssStyleCollection;
    ids: JsssStyleCollection;
    classes: JsssStyleCollection;
}
