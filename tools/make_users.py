#!/usr/bin/env python3
"""Personal 4-digit login codes for the CCR app.
  python3 tools/make_users.py add "Ivanov A." "Petrov B."   -> adds people, prints their new codes (codes are NOT stored, only hashes)
  python3 tools/make_users.py rename "Old name" "New name"  -> renames, code stays the same
  python3 tools/make_users.py list
users.json keeps: salt + [{n: name, h: sha256(salt+code)}]. Give each person his code; it cannot be read back."""
import json,sys,secrets,hashlib,os
F=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','users.json')
def load():
    if os.path.exists(F): return json.load(open(F,encoding='utf-8'))
    return {'salt':secrets.token_hex(8),'users':[]}
def h(salt,code): return hashlib.sha256((salt+code).encode()).hexdigest()
d=load();a=sys.argv[1:]
if a and a[0]=='add':
    used={u['h'] for u in d['users']}
    for n in a[1:]:
        while True:
            c='%04d'%secrets.randbelow(10000)
            if h(d['salt'],c) not in used and not (c in('0000','1234','1111')): break
        used.add(h(d['salt'],c));d['users'].append({'n':n,'h':h(d['salt'],c)});print('%s\t%s'%(n,c))
elif a and a[0]=='rename':
    for u in d['users']:
        if u['n']==a[1]: u['n']=a[2]
else:
    for u in d['users']: print(u['n'])
json.dump(d,open(F,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
