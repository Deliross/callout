import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLoopMetadata, verifyLoopMedia } from '../server/loopMedia.mjs';
const metadata = (width=1080,height=1920,duration=25) => ({streams:[{codec_type:'video',width,height,duration}]});
test('Loop metadata accepts portrait and rejects landscape, square, long and missing video', () => {
  assert.equal(validateLoopMetadata(metadata()).aspectRatio,9/16);
  for(const data of [metadata(1920,1080),metadata(1000,1000),metadata(1080,1920,25.01),metadata(1080,1920,0),{}])
    assert.throws(()=>validateLoopMetadata(data), /9:16/);
});
test('Loop metadata handles container rotation',()=>{
  const data=metadata(1920,1080);data.streams[0].side_data_list=[{rotation:90}];
  assert.equal(validateLoopMetadata(data).aspectRatio,9/16);
});
test('Loop inspection never fetches external URLs or trusts claimed dimensions',async()=>{
  await assert.rejects(verifyLoopMedia({format:'loop',media:[{type:'video',url:'https://example.com/a.mp4',aspectRatio:9/16,duration:3}]}),/directly/);
  await assert.rejects(verifyLoopMedia({format:'loop',media:[{type:'video',url:'data:video/mp4;base64,bm90IGEgdmlkZW8=',aspectRatio:9/16,duration:3}]}),/verified/);
  await verifyLoopMedia({format:'normal',media:[]});
});
