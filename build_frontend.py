"""Build static files from an explicitly supplied private GAS source directory.
Never copy private account seed, data, credentials, or backend configuration.
"""
from pathlib import Path
import base64,re,sys
source=Path(sys.argv[1]);out=Path(__file__).resolve().parent
html=(source/'Index.html').read_text();server=(source/'Code.gs').read_text()
a=server.index('function scoreModel_(');b=server.index('\nfunction ',a+1)
core=server[a:b].strip()
html=html.replace('<?!= scoreCore ?>',core)
style=re.search(r'<style>(.*?)</style>',html,re.S).group(1)
fonts={}
def font_asset(m):
 encoded=m.group(1)
 if encoded not in fonts:
  name='svs-thai-'+str(len(fonts)+1)+'.woff2';fonts[encoded]=name
  (out/name).write_bytes(base64.b64decode(encoded))
 return 'url("'+fonts[encoded]+'")'
style=re.sub(r'url\([\"\']?data:font/woff2;base64,([A-Za-z0-9+/=]+)[\"\']?\)',font_asset,style)
(out/'styles.css').write_text(style+'\n.connection-help{margin-top:18px;text-align:center}.connection-help button{background:transparent;color:#496c60;font-size:13px;text-decoration:underline}.connection-help p{font-size:12px;color:#657a75;line-height:1.5}\n')
html=re.sub(r'<style>.*?</style>','<link rel="stylesheet" href="styles.css">',html,flags=re.S)
script=re.search(r'<script>(.*?)</script>',html,re.S).group(1)
logo=re.search(r'const SVS_LOGO="data:image/png;base64,([^"]+)";',script)
(out/'svs-logo.png').write_bytes(base64.b64decode(logo.group(1)))
script=script.replace(logo.group(0),'const SVS_LOGO="svs-logo.png";')
old="const api=(fn,arg)=>new Promise((resolve,reject)=>{let runner=google.script.run.withSuccessHandler(resolve).withFailureHandler(reject);runner.authCall(state.token,fn,arg||{});});"
assert old in script;script=script.replace(old,"const api=(fn,arg)=>gasRequest('call',{token:state.token,action:fn,request:arg||{}});")
old="new Promise((resolve,reject)=>google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).authLogin({username:$('loginUsername').value,password:$('loginPassword').value}))"
assert old in script;script=script.replace(old,"gasRequest('login',{request:{username:$('loginUsername').value,password:$('loginPassword').value}})")
old="new Promise((resolve,reject)=>google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).authLogout(state.token))"
assert old in script;script=script.replace(old,"gasRequest('logout',{token:state.token})")
old='</form><p class="login-help">'
assert old in script;script=script.replace(old,'</form><div class="connection-help"><button type="button" id="checkConnection">ตรวจสอบการเชื่อมต่อ</button><p id="connectionResult" role="status" aria-live="polite"></p></div><p class="login-help">',1)
a=script.index('function makeReport()');b=script.index('\nfunction authClear()',a)
script=script[:a]+(out/'report_view.js').read_text().rstrip()+script[b:]
assert 'google.script' not in script
(out/'app.js').write_text(script)
html=re.sub(r'<script>.*?</script>','<script src="transport.js" defer></script><script src="app.js" defer></script>',html,flags=re.S)
html=html.replace('src="app.js"','src="app.js?v=3.0.1"')
html=html.replace('<head>','<head><title>SVS Individual KPI</title><meta name="referrer" content="no-referrer">',1)
(out/'index.html').write_text(html)
(out/'.nojekyll').write_text('')
for name in ['FONT_LICENSE.txt']:(out/name).write_text((source/name).read_text())
print('Built static frontend:',{p.name:p.stat().st_size for p in out.iterdir() if p.is_file()},'font assets:',len(fonts))
