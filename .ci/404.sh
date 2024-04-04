#!/bin/bash

pushd hugo/content || exit

cat > ../static/js/404.js <<EOF
links = [
EOF

find . -type f \
    | grep -v "__resources" \
    | sed -E 's|\.md$|/",|; s|_index/||; s|^\.|"https://gardener.cloud|; ' >> ../static/js/404.js

cat >> ../static/js/404.js <<EOF
]

titles = [
EOF

find . -type f -exec grep -H '^title: ' {} \; | sed 's/.*title: //; s/"//g; s/^/"/; s/$/",/'   >> ../static/js/404.js

cat >> ../static/js/404.js <<EOF
]

let ul = document.getElementById('links');

const newLinks = links.map((element, index) => [element, titles[index]]
).filter( el => {
    let splitUrl = window.location.href.split("/");
    return el[0].endsWith("/" + splitUrl[splitUrl.length - 2] + "/")
}).map( el => {
    let li = document.createElement('li');
    let a = document.createElement('a')
    a.textContent = el[1]
    a.setAttribute("href",el[0])
    li.appendChild(a)
    ul.appendChild(li);
})

if (newLinks.length > 0) {
    document.getElementById('404-descr').innerHTML = "It seems to be moved. Please check the possible locations of your page:"
}

EOF

popd || exit