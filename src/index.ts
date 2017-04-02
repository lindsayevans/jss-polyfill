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

    private tagsProxy: ProxyConstructor;
    private idsProxy: ProxyConstructor;
    private classesProxy: ProxyConstructor;

    constructor() {

        // Bail out if the client already has a JSSS implementation
        if (this.jsssSupported()) {
            return;
        }

        // Get JS Style Sheets
        let $stylesheets = Array.from(document.querySelectorAll('style[type="text/javascript"]')) as Array<HTMLElement>;
        let $externalStylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"][type="text/javascript"]')) as Array<HTMLElement>;

        // Add empty style collections to document
        document.tags = {};
        document.ids = {};
        document.classes = {};

        // Proxies to initialise undefined properties
        this.tagsProxy = new Proxy(document.tags, PropertyInitialiserFactory.createHandler(document.tags));
        this.idsProxy = new Proxy(document.ids, PropertyInitialiserFactory.createHandler(document.ids));
        this.classesProxy = new Proxy(document.classes, PropertyInitialiserFactory.createHandler(document.classes));

        // Process each stylesheet
        $stylesheets.forEach($stylesheet => {
            this.processStylesheet($stylesheet.innerHTML);
        });

        // Load each external stylesheet & process it
        $externalStylesheets.forEach($stylesheet => {
            fetch($stylesheet.getAttribute('href'))
                .then(response => {
                    return response.text();
                })
                .then(body => {
                    return new Promise((resolve, reject) => {
                        this.processStylesheet(body);
                        // FIXME: We're rebuilding the entire style collection every time, which is probably inefficient
                        this.injectCss(this.buildCss());
                        resolve();
                    });
                });
        });

        this.injectCss(this.buildCss());
    }

    /**
     * Process JSSS styles
     */
    public processStylesheet(styles: string) {

        // Replace document.X assignments with calls to proxy
        styles = styles
            .replace(/document.tags/gi, 'this.tagsProxy')
            .replace(/document.ids/gi, 'this.idsProxy')
            .replace(/document.classes/gi, 'this.classesProxy');

        // Am I eval? Yes I am
        eval(styles);

    }

    /**
     * Check if the client supports JSSS
     */
    public jsssSupported(): boolean {
        return 'tags' in document && 'ids' in document && 'classes' in document;
    }

    /**
     * Builds CSS stylesheet from JSSS style collections
     */
    private buildCss(): string {

        let cssStyles = '';
        let collectionNames = ['tags', 'ids', 'classes'];

        collectionNames.forEach(name => {

            let collection: JsssStyleCollection = document[name];
            let prefix = name === 'ids' ? '#' : name === 'classes' ? '.' : '';

            for (let id in collection) {
                cssStyles += `${prefix}${id} {`;
                for (let propertyName in collection[id]) {
                    cssStyles += `${this.normalisePropertyName(propertyName)}: ${collection[id][propertyName]};`;
                }
                cssStyles += '}';
            }
        })

        return cssStyles;

    }

    /**
     * Injects provided CSS styles into the document
     */
    private injectCss(cssStyles: string) {
        let $css = document.createElement('style');
        $css.innerText = cssStyles;
        document.head.appendChild($css);
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
