/**
 * JSSS Polyfill
 * 
 * Adds support for JavaScript Style Sheets
 * 
 * TODO:
 * - Feature detection (bail if 'tags' in document)
 * - Add support for with (document.tags) syntax
 * - Add support for inline styles (<P STYLE="color = 'green'">)
 * - Add support for pseudo classes ('Typographical Elements' in proposal)
 * - Normalise property names - camelCase to kebab-case, expand shorthand properties (e.g. bgColor)
*/

export class JsssPolyfill {

    constructor() {

        // Get JS Style Sheets
        // TODO: querySelectorAll, loop
        // TODO: External style sheets
        let $stylesheet = document.querySelector('style[type="text/javascript"]');
        let styles = $stylesheet.innerHTML.trim();

        // Add empty style collections to document
        document.tags = {};
        document.ids = {};
        document.classes = {};

        // Proxies to initialise undefined properties
        let tagsProxy = new Proxy<any>(document.tags, PropertyInitialiserFactory.createHandler(document.tags));
        let idsProxy = new Proxy<any>(document.ids, PropertyInitialiserFactory.createHandler(document.ids));
        let classesProxy = new Proxy<any>(document.classes, PropertyInitialiserFactory.createHandler(document.classes));

        // Replace document.X assignments with calls to proxy
        styles = styles
            .replace(/document.tags/gi, 'tagsProxy')
            .replace(/document.ids/gi, 'idsProxy')
            .replace(/document.classes/gi, 'classesProxy');

        // Evaluate is now considered sexy
        eval(styles);

        // Build CSS
        let cssStyles = '';

        // TODO: Refactor
        for (let tagName in document.tags) {
            cssStyles += `${tagName} {`;
            for (let propertyName in document.tags[tagName]) {
                cssStyles += `${propertyName}: ${document.tags[tagName][propertyName]};`;
            }
            cssStyles += '}';
        }

        for (let id in document.ids) {
            cssStyles += `#${id} {`;
            for (let propertyName in document.ids[id]) {
                cssStyles += `${propertyName}: ${document.ids[id][propertyName]};`;
            }
            cssStyles += '}';
        }

        for (let className in document.classes) {
            cssStyles += `.${className} {`;
            for (let propertyName in document.classes[className]) {
                cssStyles += `${propertyName}: ${document.classes[className][propertyName]};`;
            }
            cssStyles += '}';
        }

        // Inject CSS into document
        let $css = document.createElement('style');
        $css.innerText = cssStyles;
        document.head.appendChild($css);

    }

}

class PropertyInitialiserFactory {

    public static createHandler(collection) {
        return {   
            get: (obj, prop) => {

                if (collection[prop] === undefined) {
                    // TODO: Need a Proxy here to intercept setting style properties, so that we can normalise property names etc.
                    collection[prop] = {};
                }

                return obj[prop];
            }
        };
    }

}
