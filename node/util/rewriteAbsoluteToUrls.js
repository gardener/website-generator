const isRelativeUrl = require('is-relative-url')
const path = require("path")
const urlExists = require("url-exists")


module.exports= function(documentPath, content) {
    let collectedLinks = []
    let mdMatchRegex = /\[([^\]]*)]\((.+?)(\))/g

    let md =  content.replace(mdMatchRegex, function (str, text, link) {
        if (isRelativeUrl(link) && link.indexOf("#")!==0) {
            let root = path.dirname(documentPath)
            link = root + "/" + link;
        }
        if(link.indexOf("#")!==0 && link.indexOf("mailto:")!==0)
            collectedLinks.push(link);
        link = link.replace(new RegExp(".png$", 'g'), ".png?raw=true")
        link = link.replace(new RegExp(".gif$", 'g'), ".gif?raw=true")
        link = link.replace("/./","/")
        return '[' + text + '](' +link + ')'
    })

    mdMatchRegex = /(<img src=")(.+?)(?=")([^>]*)(?=>)>/g
    md =  md.replace(mdMatchRegex, function (str, pre, link, post) {
        if (isRelativeUrl(link) && link.indexOf("#")!==0) {
            let root = path.dirname(documentPath)
            link = root + "/" + link;
        }
        if(link.indexOf("#")!==0 && link.indexOf("mailto:")!==0)
            collectedLinks.push(link);
        link = link.replace(new RegExp(".png$", 'g'), ".png?raw=true")
        link = link.replace(new RegExp(".gif$", 'g'), ".gif?raw=true")
        link = link.replace("/./", "/")
        return pre+link+post+">"
    })

    return md;
}
