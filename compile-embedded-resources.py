#!/usr/bin/env python
import sys
import os

root = sys.argv[1]

out = open(sys.argv[2], 'w')

fileMap = {}
fileIdx = 0

out.write("static const char* file_contents[] = {\n")
for path, dirs, files in os.walk(sys.argv[1]):
  for f in files:
    relPath = unicode('/'.join((path.replace(root, '', 1), f)))
    if relPath.startswith('//'):
      relPath = relPath[1:]
    contents = open('/'.join((path, f)), 'r').read()
    fileMap[fileIdx] = {'path': relPath, 'size': len(contents)}
    fileIdx += 1
    out.write('"'+''.join(map(lambda x:'\\'+hex(ord(x))[1:], contents))+'",\n')

out.write("0};\n\n")

out.write("\n".join((
           "typedef struct {",
           "    std::uint64_t size;",
           "    const char* contents;",
           "} file_entry;",
           "static const std::map<std::string, file_entry> contents = {","")))
for idx,contents in fileMap.iteritems():
  out.write('    { "%s", {%s, file_contents[%d]}},\n'%(contents['path'],
  contents['size'], idx))
out.write("};\n")
