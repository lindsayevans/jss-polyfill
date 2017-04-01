// TODO:
// * Feature detection (bail if 'tags' in document)
// * Add support for with (document.tags) syntax
// * Add support for other style collections (classes, ids)
// * Add support for inline styles (<P STYLE="color = 'green'">)
// * Add support for pseudo classes ('Typographical Elements' in proposal)
// * Normalise property names - camelCase to kebab-case, expand shorthand properties (e.g. bgColor)

// Get JS Style Sheets
// TODO: querySelectorAll, loop
// TODO: External style sheets
let $stylesheet = document.querySelector('style[type="text/javascript"]');
let styles = $stylesheet.innerHTML.trim();

// Add empty tags style collection to document
document.tags = {};

// Proxy to initialise undefined properties
let tagsProxy = new Proxy<any>(document.tags, {
    get: (obj, prop) => {

        if (document.tags[prop] === undefined) {
            // TODO: Need a Proxy here to intercept setting style properties, so that we can normalise property names etc.
            document.tags[prop] = {};
        }

        return obj[prop];
    }
});

// Replace document.X assignments with calls to proxy
styles = styles.replace(/document.tags/gi, 'tagsProxy');

// Evaluate is now considered sexy
eval(styles);

// Build CSS
let cssStyles = '';

for (let tagName in document.tags) {
    cssStyles += `${tagName} {`;
    for (let propertyName in document.tags[tagName]) {
        cssStyles += `${propertyName}: ${document.tags[tagName][propertyName]};`;
    }
    cssStyles += '}';
}

// Inject CSS into document
let $css = document.createElement('style');
$css.innerText = cssStyles;
document.head.appendChild($css);
