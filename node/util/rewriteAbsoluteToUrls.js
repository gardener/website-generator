const isRelativeUrl = require('is-relative-url')
const path = require("path")
const fs = require('fs')
const axios = require('axios')
const url = require("url")

async function downloadImage (imageUrl, dir, token) {
    const parsed = url.parse(imageUrl);
    const imagePath = path.resolve(dir, path.basename(parsed.pathname))
    const imageDir = path.dirname(imagePath)

    if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });
    const writer = fs.createWriteStream(imagePath)

    const response = await axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'stream',
        headers: {
            'Authorization': 'token '+token
        }
    })

    console.log("Download image ", imageUrl, " => ", imagePath)
    response.data.pipe(writer)
}

module.exports= function(documentBaseUrl, content, markdownFilePath, githubToken) {
    let documentRootUrl = path.dirname(documentBaseUrl)
    let markdownRootDir = path.dirname(markdownFilePath)

    // MARKDOWN style image embedding
    //
    let mdMatchRegex = /\[([^\]]+)]\((.+?)\)/g
    let md =  content.replace(mdMatchRegex,  (str, text, link)=> {
        if (isRelativeUrl(link) && link.indexOf("#")!==0) {
            // there is a token for images required. In this case we must download them and store the images in the
            // local directory for Hugo. Reference (link) to the image didn'T work. "Missing token for auth" HTTP 404
            // download the image and store them relative to this document
            if(githubToken) {
                 downloadImage(documentRootUrl + "/" + link, markdownRootDir, githubToken)
            }
            else {
                link = documentRootUrl + "/" + link;
            }
        }

        link = link.replace(new RegExp(".png$", 'g'), ".png?raw=true")
        link = link.replace(new RegExp(".gif$", 'g'), ".gif?raw=true")
        link = link.replace("/./", "/")
        return '[' + text + '](' +link + ')'
    })

    // HTML style image embedding
    //
    mdMatchRegex = /(<img src=")(.+?)(?=")([^>]*)(?=>)>/g
    md =  md.replace(mdMatchRegex, (str, pre, link, post)=> {
        if (isRelativeUrl(link) && link.indexOf("#")!==0) {
            if(githubToken) {
                downloadImage(documentRootUrl + "/" + link, markdownRootDir, githubToken)
            }
            else {
                link = documentRootUrl + "/" + link;
            }
        }

        link = link.replace(new RegExp(".png$", 'g'), ".png?raw=true")
        link = link.replace(new RegExp(".gif$", 'g'), ".gif?raw=true")
        link = link.replace("/./", "/")
        return pre+link+post+">"
    })

    return md;
}
