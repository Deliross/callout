import crypto from 'node:crypto';
import mongoose from 'mongoose';

export const BROWSER_COOKIE = 'callout_browser';
const lifetime = 90 * 24 * 60 * 60 * 1000;
const schema = new mongoose.Schema({
  _id: String, active: {type:String,default:''},
  accounts: [{_id:false,userId:String,sessionHash:String}],
  expiresAt: {type:Date,index:{expires:0}}
},{optimisticConcurrency:true});
const BrowserAccounts = mongoose.models.BrowserAccounts || mongoose.model('BrowserAccounts',schema);
const memory = new Map();
export const browserKey = token => typeof token === 'string' && /^[a-f0-9]{64}$/.test(token) ?
  crypto.createHash('sha256').update(token).digest('hex') : '';
export const browserSessionKey = sessionHash => crypto.createHash('sha256').update(sessionHash).digest('hex');
export async function readBrowser(token) {
  const key=browserKey(token);
  if(!key)return null;
  const record=mongoose.connection.readyState === 1 ? await BrowserAccounts.findById(key).lean() : memory.get(key);
  return record && new Date(record.expiresAt)>new Date() ? structuredClone(record) : null;
}
async function changeBrowser(token, mutate, create=false) {
  const key=browserKey(token);
  if(!key)throw Object.assign(new Error('Browser session expired. Sign in again.'),{status:401});
  for(let attempt=0;attempt<4;attempt++){
    if(mongoose.connection.readyState !== 1){
      const previous=memory.get(key);
      if(!create && (!previous || new Date(previous.expiresAt)<=new Date()))throw Object.assign(new Error('Browser session expired.'),{status:401});
      const record=structuredClone(previous || {_id:key,accounts:[],active:''});
      mutate(record);record.expiresAt=new Date(Date.now()+lifetime);memory.set(key,record);return record;
    }
    let record=await BrowserAccounts.findById(key);
    if(!record && create)record=new BrowserAccounts({_id:key,accounts:[]});
    if(!record || (!create && record.expiresAt<=new Date()))throw Object.assign(new Error('Browser session expired.'),{status:401});
    mutate(record);record.expiresAt=new Date(Date.now()+lifetime);
    try {await record.save();return record.toObject();}
    catch(error){if(error.name !== 'VersionError' && error.code!==11000)throw error;}
  }
  throw Object.assign(new Error('Another account change is in progress. Try again.'),{status:409});
}
export async function registerBrowserAccount(req,res,userId,sessionHash) {
  let token=req.cookies?.[BROWSER_COOKIE];
  if(!await readBrowser(token))token=crypto.randomBytes(32).toString('hex');
  await changeBrowser(token,record=>{
    const remaining=record.accounts.filter(a=>a.userId!==String(userId));
    if(remaining.length>=5)throw Object.assign(new Error('This browser already has five accounts. Remove one first.'),{status:409});
    record.accounts=[...remaining,{userId:String(userId),sessionHash}];record.active=String(userId);
  },true);
  res.cookie(BROWSER_COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:lifetime});
  return browserKey(token);
}
export async function removeBrowserAccount(token,userId) {
  return changeBrowser(token,record=>{
    record.accounts=record.accounts.filter(a=>a.userId!==String(userId));
    if(record.active===String(userId))record.active='';
  });
}
export async function deleteBrowser(token) {
  const key=browserKey(token);
  if(!key)return;
  if(mongoose.connection.readyState===1)await BrowserAccounts.deleteOne({_id:key});
  else memory.delete(key);
}
export function clearBrowserCookie(res) {
  res.clearCookie(BROWSER_COOKIE,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/'});
}
export async function browserAccessAllowed(req,payload) {
  if(!payload.browser)return true; // Existing single-account sessions remain compatible.
  const token=req.cookies?.[BROWSER_COOKIE];
  if(browserKey(token)!==payload.browser)return false;
  const record=await readBrowser(token);
  return Boolean(record?.active===payload.sub && record.accounts.some(a=>a.userId===payload.sub && browserSessionKey(a.sessionHash)===payload.session));
}
export function requireAccountCsrf(req,res,next) {
  const origin=req.get('origin');
  const expected=new URL(process.env.APP_URL || (req.protocol+'://'+req.get('host'))).origin;
  if(req.get('x-callout-action')!=='account' || (origin && origin!==expected) || req.get('sec-fetch-site')==='cross-site')
    return res.status(403).json({error:'Open Callout directly to change accounts.'});
  next();
}
