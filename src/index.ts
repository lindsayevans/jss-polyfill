/**
 * JSSS Polyfill
 * 
 * Adds support for JavaScript Style Sheets
 * 
 * TODO:
 * - Add support for with (document.tags) syntax
 * - Add support for inline styles (<P STYLE="color = 'green'">)
 * - Add support for pseudo classes ('Typographical Elements' in proposal)
*/
export class JsssPolyfill {

    constructor() {

        // Bail out if the client already has a JSSS implementation
        if (this.jsssSupported()) {
            return;
        }

        // Get JS Style Sheets
        // TODO: External style sheets
        let $stylesheets = Array.from(document.querySelectorAll('style[type="text/javascript"]')) as Array<HTMLElement>;

        // Add empty style collections to document
        document.tags = {};
        document.ids = {};
        document.classes = {};

        // Proxies to initialise undefined properties
        let tagsProxy = new Proxy<any>(document.tags, PropertyInitialiserFactory.createHandler(document.tags));
        let idsProxy = new Proxy<any>(document.ids, PropertyInitialiserFactory.createHandler(document.ids));
        let classesProxy = new Proxy<any>(document.classes, PropertyInitialiserFactory.createHandler(document.classes));

        // Process each stylesheet
        $stylesheets.forEach($stylesheet => {

            let styles = $stylesheet.innerHTML.trim();

            // Replace document.X assignments with calls to proxy
            styles = styles
                .replace(/document.tags/gi, 'tagsProxy')
                .replace(/document.ids/gi, 'idsProxy')
                .replace(/document.classes/gi, 'classesProxy');

            // Am I eval? Yes I am
            eval(styles);

        });

        // Build CSS
        let cssStyles = '';

        // TODO: Refactor
        for (let tagName in document.tags) {
            cssStyles += `${tagName} {`;
            for (let propertyName in document.tags[tagName]) {
                cssStyles += `${this.normalisePropertyName(propertyName)}: ${document.tags[tagName][propertyName]};`;
            }
            cssStyles += '}';
        }

        for (let id in document.ids) {
            cssStyles += `#${id} {`;
            for (let propertyName in document.ids[id]) {
                cssStyles += `${this.normalisePropertyName(propertyName)}: ${document.ids[id][propertyName]};`;
            }
            cssStyles += '}';
        }

        for (let className in document.classes) {
            cssStyles += `.${className} {`;
            for (let propertyName in document.classes[className]) {
                cssStyles += `${this.normalisePropertyName(propertyName)}: ${document.classes[className][propertyName]};`;
            }
            cssStyles += '}';
        }

        // Inject CSS into document
        let $css = document.createElement('style');
        $css.innerText = cssStyles;
        document.head.appendChild($css);

    }

    /**
     * Check if the client supports JSSS
     */
    public jsssSupported(): boolean {
        return 'tags' in document && 'ids' in document && 'classes' in document;
    }

    /**
     * Normalise property names
     * - Converts camelCase to kebab-case
     * - Expands shorthand properties (e.g. bgColor)
     */
    private normalisePropertyName(propertyName: string): string {

        // Expand shorthand property names
        // TODO: Check if there are others
        propertyName = propertyName.replace(/^bg/, 'background');

        // Convert camelCase to kebab-case
        propertyName = propertyName.replace(/([a-z]*)([A-Z]+)([a-z]*)/g, (match, p1, p2, p3) => {
            return `${p1}-${p2.toLowerCase()}${p3}`;
        })

        return propertyName;
    }

}

class PropertyInitialiserFactory {

    public static createHandler(collection) {
        return {   
            get: (obj, prop) => {

                if (collection[prop] === undefined) {
                    collection[prop] = {};
                }

                return obj[prop];
            }
        };
    }

}
