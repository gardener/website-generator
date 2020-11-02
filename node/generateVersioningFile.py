import json
import os

versions = []

if os.environ.get('BUILDSINGLEBRANCH') == 'true':
    versions.append(
        {
            'version': os.environ.get('BRANCH'),
            'dirPath': 'documentation',
            'url': "/documentation"
        }
    )
else:
    f = open("latestDocVersions", "r")
    v = f.read().split()
    f.close()
    n=1
    releaseCount = os.environ.get('RELEASES_COUNT')
    if releaseCount != None and 0 < int(releaseCount):
        n = int(releaseCount)
    if len(v) < n:
        n = len(v)
    print("versions count {n}")
    i = 0
    while i < n:
        versions.append(
            {
                'version': v[i],
                'dirPath': 'documentation' if i == 0  else v[i],
                'url': "/documentation" if i == 0  else "/"  + v[i]
            }
        )
        i += 1

print("Generating documentation revisions file for versions")
print(json.dumps(versions))

f = open('hugo/data/revisions.json', 'w')
f.write(json.dumps(versions))
f.close()