"""Rebuild shipped Noto CJK subsets. Needs FontTools and a locally installed Noto CJK collection."""
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
ROOT=Path(__file__).resolve().parents[1]
content=''.join(p.read_text() for root in [ROOT/'dist',ROOT/'docs'] for p in root.rglob('*') if p.suffix in ['.js','.html','.md','.css'])
content+=''.join(chr(i) for i in range(32,127))
for source,target in [('NotoSansCJK-Regular.ttc','sans-regular.woff'),('NotoSansCJK-Bold.ttc','sans-bold.woff'),('NotoSerifCJK-Bold.ttc','serif-bold.woff')]:
 font=TTFont('/usr/share/fonts/opentype/noto/'+source,fontNumber=2)
 options=subset.Options();options.flavor='woff';options.layout_features=['*']
 subsetter=subset.Subsetter(options=options);subsetter.populate(text=content);subsetter.subset(font);font.flavor='woff';font.save(ROOT/'dist/assets/fonts'/target)
 print(target,len(font.getBestCmap()),'characters')
