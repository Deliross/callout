import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {BROWSER_COOKIE, browserKey, browserSessionKey, readBrowser, registerBrowserAccount, removeBrowserAccount, deleteBrowser, browserAccessAllowed, requireAccountCsrf} from '../server/browserAccounts.mjs';
test('browser grants are opaque, bounded, isolated, switchable and revocable',async()=>{
  const cookies={};
  const req={cookies};
  const res={cookie:(key,value,options)=>{assert.equal(options.httpOnly,true);cookies[key]=value;}};
  for(let n=0;n<5;n++)await registerBrowserAccount(req,res,'user'+n,'hash'+n);
  assert.equal((await readBrowser(cookies[BROWSER_COOKIE])).accounts.length,5);
  await assert.rejects(registerBrowserAccount(req,res,'sixth','hash6'),/five accounts/);
  const key=browserKey(cookies[BROWSER_COOKIE]);
  assert.notEqual(key,cookies[BROWSER_COOKIE]);
  assert.equal(await browserAccessAllowed(req,{sub:'user4',browser:key,session:browserSessionKey('hash4')}),true);
  assert.equal(await browserAccessAllowed(req,{sub:'user0',browser:key,session:browserSessionKey('hash0')}),false);
  assert.equal(await browserAccessAllowed({cookies:{[BROWSER_COOKIE]:randomBytes(32).toString('hex')}},{sub:'user4',browser:key,session:browserSessionKey('hash4')}),false);
  await registerBrowserAccount(req,res,'user0','newhash');
  assert.equal(await browserAccessAllowed(req,{sub:'user4',browser:key,session:browserSessionKey('hash4')}),false);
  assert.equal(await browserAccessAllowed(req,{sub:'user0',browser:key,session:browserSessionKey('newhash')}),true);
  await removeBrowserAccount(cookies[BROWSER_COOKIE],'user0');
  assert.equal(await browserAccessAllowed(req,{sub:'user0',browser:key,session:browserSessionKey('hash0')}),false);
  await deleteBrowser(cookies[BROWSER_COOKIE]);
  assert.equal(await readBrowser(cookies[BROWSER_COOKIE]),null);
});
test('account mutations reject cross-origin and missing intent headers',()=>{
  const attempt=headers=>{
    let result='allowed';
    requireAccountCsrf({protocol:'https',get:k=>headers[k]}, {status:code=>({json:()=>{result=code;}})},()=>{});
    return result;
  };
  assert.equal(attempt({host:'callout.test',origin:'https://evil.test','x-callout-action':'account'}),403);
  assert.equal(attempt({host:'callout.test'}),403);
  assert.equal(attempt({host:'callout.test',origin:'https://callout.test','x-callout-action':'account'}),'allowed');
});
