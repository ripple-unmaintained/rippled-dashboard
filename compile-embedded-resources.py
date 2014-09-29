#!/usr/bin/env python
import sys
import os

root = sys.argv[1]

out = open(sys.argv[2], 'w')
out.write("static const std::map<std::string, std::pair<std::vector<unsigned char>, size_t> > contents = {\n")

for path, dirs, files in os.walk(sys.argv[1]):
  for f in files:
    relPath = unicode('/'.join((path.replace(root, '', 1), f)))
    if relPath.startswith('//'):
      relPath = relPath[1:]
    contents = open('/'.join((path, f)), 'r').read()
    out.write('{"%s", {{\n'%(relPath))
    out.write(','.join(map(lambda x:str(ord(x)), contents)))
    out.write('}, %d}},\n' % (len(contents)))

out.write("};\n ")
