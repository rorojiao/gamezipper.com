import json, itertools, sys
D=json.load(open(__import__('os').path.join(__import__('os').path.dirname(__file__), 'levels.json')))
def isSet(cards):
    nf=len(cards[0])
    for a in range(nf):
        vs=[c[a] for c in cards]
        if not (vs[0]==vs[1]==vs[2] or len(set(vs))==3): return False
    return True
bad=[]; nof=[]
for lv in D['levels']:
    cards=lv['cards']; nof.append(len(cards[0]))
    trips=[t for t in itertools.combinations(range(len(cards)),3) if isSet([cards[i] for i in t])]
    sol=lv['solution']
    if len(trips)!=1: bad.append((lv['id'],'SET-count=%d (claim: exactly 1)'%len(trips)))
    if not (len(sol)==3 and isSet([cards[c] for c in sol])):
        bad.append((lv['id'],'stored solution indices not a valid SET'))
    if len(trips)==1 and sorted(trips[0])!=sorted(sol):
        bad.append((lv['id'],'stored sol %s != unique SET %s'%(sol,trips[0])))
    if len({tuple(c) for c in cards})!=len(cards):
        bad.append((lv['id'],'duplicate cards on board'))
print("levels:",len(D['levels']),"| features:",sorted(set(nof)),"| boards:",sorted({len(l['cards']) for l in D['levels']}))
print("BAD:", bad if bad else "none -> VERDICT: PASS 30/30 exactly-one-SET; stored solutions valid & equal to the unique SET; no duplicate cards")
sys.exit(0 if not bad else 1)
