const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  fs.mkdirSync(path.join(__dirname,'../artifacts/refresh'),{recursive:true});
  for(const route of ['home','swipe','loops','guilds','saved','notifications','messages','trending','heat-wheel','take-rush']){
    await page.goto('http://localhost:4173/#'+route);
    await page.waitForTimeout(1100);
    const body=await page.locator('body').innerText();
    if(!body.trim())throw Error('Blank route '+route);
    await page.screenshot({path:path.join(__dirname,'../artifacts/refresh/'+route+'.png')});
    console.log(route,await page.locator('#mainContent').innerText().catch(()=>page.locator('main').innerText()).then(t=>t.slice(0,90).replace(/\n/g,' ')));
  }
  console.log('PAGE ERRORS',JSON.stringify(errors));
  for(const width of [390,768,1440]) {
    await page.setViewportSize({width,height:900});
    for(const route of ['home','swipe','loops','guilds','messages','saved','notifications','trending']) {
      await page.goto('http://localhost:4173/#'+route);
      await page.waitForTimeout(350);
      const consent=page.getByRole('button',{name:'Essential only',exact:true});
      if(await consent.count())await consent.click();
      await page.evaluate(()=>document.documentElement.dataset.resolvedTheme='dark');
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
      if(overflow)errors.push('Horizontal overflow '+route+' at '+width);
      if(['home','swipe','guilds'].includes(route))await page.screenshot({path:path.join(__dirname,'../artifacts/refresh/'+route+'-dark-'+width+'.png')});
    }
  }
  console.log('LAYOUT ERRORS',JSON.stringify(errors));
  await browser.close();
  if(errors.length)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
