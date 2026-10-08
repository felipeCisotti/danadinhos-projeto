const { chromium } = require('C:/Users/DEV25MA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const http=require('node:http'), fs=require('node:fs'), path=require('node:path');
 const server=http.createServer((req,res)=>{const file=path.join(process.cwd(),'dist',req.url==='/'?'index.html':req.url); const ext=path.extname(file); res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[ext]||'application/octet-stream'); fs.createReadStream(file).on('error',()=>{res.statusCode=404;res.end()}).pipe(res)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage();
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Pular abertura'}).click();
 for(const width of [320,390,768,900,1024,1440,2560]){
  await page.setViewportSize({width,height:1000});
  await page.evaluate(()=>scrollTo(0,0));
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error('Overflow '+width);
  const mobile=await page.locator('.hero-mobile').isVisible();
  if(mobile!==(width<=900)) throw Error('Breakpoint '+width);
  if([390,768,1440].includes(width)) await page.locator('.hero-section').screenshot({path:'tmp/banner-'+width+'.png'});
 }
 console.log('PASS: banner layouts at 320, 390, 768, 900, 1024, 1440, 2560px; no horizontal overflow.');
 await browser.close(); server.close();
})();