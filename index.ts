// TODO:
// * Feature detection (bail if 'tags' in document)
// * Add support for with (document.tags) syntax
// * Add support for inline styles (<P STYLE="color = 'green'">)
// * Add support for pseudo classes ('Typographical Elements' in proposal)
// * Normalise property names - camelCase to kebab-case, expand shorthand properties (e.g. bgColor)

// Get JS Style Sheets
// TODO: querySelectorAll, loop
// TODO: External style sheets
let $stylesheet = document.querySelector('style[type="text/javascript"]');
let styles = $stylesheet.innerHTML.trim();

// Add empty style collections to document
document.tags = {};
document.ids = {};
document.classes = {};

// Proxy to initialise undefined properties
// TODO: Create a factory or something to handle this cruft
let tagsProxy = new Proxy<any>(document.tags, {
    get: (obj, prop) => {

        if (document.tags[prop] === undefined) {
            // TODO: Need a Proxy here to intercept setting style properties, so that we can normalise property names etc.
            document.tags[prop] = {};
        }

        return obj[prop];
    }
});
let idsProxy = new Proxy<any>(document.ids, {
    get: (obj, prop) => {

        if (document.ids[prop] === undefined) {
            document.ids[prop] = {};
        }

        return obj[prop];
    }
});
let classesProxy = new Proxy<any>(document.classes, {
    get: (obj, prop) => {

        if (document.classes[prop] === undefined) {
            document.classes[prop] = {};
        }

        return obj[prop];
    }
});

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
