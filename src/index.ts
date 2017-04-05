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

    public collectionNames = [
        'tags',
        'classes',
        'ids'
    ];

    public collectionPrefixes = {
        'tags': '',
        'classes': '.',
        'ids': '#'
    };

    public stylesheetSelectors = 'style[type="text/javascript"], link[rel="stylesheet"][type="text/javascript"]';

    private proxies: {[name: string]: ProxyConstructor} = {};

    constructor() {

        // Bail out if the client already has a JSSS implementation
        if (this.jsssSupported()) {
            return;
        }

        // Get JS Style Sheets
        let $stylesheets = Array.from(document.querySelectorAll(this.stylesheetSelectors)) as Array<HTMLStyleElement | HTMLLinkElement>;

        this.initialiseStyleCollections();

        // Proxies to initialise undefined properties
        this.createProxies();

        // Process each stylesheet
        $stylesheets.forEach($stylesheet => {
            this.loadStyles($stylesheet);
        });

        this.injectCss(this.buildCss());
    }

    /**
     * Loads external stylesheet or gets stylesheet text
     */
    public loadStyles($stylesheet: HTMLStyleElement | HTMLLinkElement) {

        if ($stylesheet.getAttribute('href') !== null) {
            this.loadExternalStylesheet($stylesheet as HTMLLinkElement);
        } else {
            this.processStylesheet($stylesheet.innerText);
        }

    }

    /**
     * Process JSSS styles
     */
    public processStylesheet(styles: string) {

        // Replace document.X assignments with calls to proxy
        this.collectionNames.forEach(name => {
            styles = styles.replace(new RegExp(`document.${name}`, 'gi'), `this.proxies['${name}']`);
        });

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
     * Loads an external stylesheet 
     */
    private async loadExternalStylesheet($stylesheet: HTMLLinkElement) {

        let response = await fetch($stylesheet.getAttribute('href'));
        let css = await response.text();

        this.processStylesheet(css);

        // FIXME: We're rebuilding the entire style collection every time, which is probably inefficient
        this.injectCss(this.buildCss());

    }

    /**
     * Builds CSS stylesheet from JSSS style collections
     */
    private buildCss(): string {

        let cssStyles = '';

        this.collectionNames.forEach(name => {

            let collection: JsssStyleCollection = document[name];
            let prefix = this.collectionPrefixes[name];

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

    /**
     * Add empty style collections to document
     */
    private initialiseStyleCollections() {
        this.collectionNames.forEach(name => {
            document[name] = {};
        });
    }

    /**
     * Creates proxies to initialise undefined properties in each style collection
     */
    private createProxies() {
        this.collectionNames.forEach(name => {
            this.proxies[name] = new Proxy(document[name], PropertyInitialiserFactory.createHandler(document[name]));
        });
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
