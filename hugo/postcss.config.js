// // const purgeJs = require('purgecss-from-js')
// // const purgeHtml = require('purgecss-from-html')

// // const purgecss = require('@fullhuman/postcss-purgecss')({
// //     content: ['./hugo_stats.json'],
// //     defaultExtractor: (content) => {
// //         let els = JSON.parse(content).htmlElements;
// //         return els.tags.concat(els.classes, els.ids);
// //     }
// // });

// module.exports = {
//     plugins: {
//         '@fullhuman/postcss-purgecss': {
//             content: ['layouts/index.html'],
//             defaultExtractor: (content) => {

//                 return content;
//             }
//         },
//         autoprefixer: {}
//     },
// }