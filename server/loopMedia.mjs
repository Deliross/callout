import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import ffprobe from 'ffprobe-static';
const run = promisify(execFile);
export function validateLoopMetadata(meta) {
  const video = meta.streams?.find(s => s.codec_type === 'video');
  const rotation = Number(video?.tags?.rotate || video?.side_data_list?.find(s=>s.rotation != null)?.rotation || 0);
  const rotated = Math.abs(rotation) % 180 === 90;
  const width = Number(rotated ? video?.height : video?.width), height = Number(rotated ? video?.width : video?.height);
  const durations = [video?.duration, meta.format?.duration].map(Number).filter(Number.isFinite);
  const duration = Math.max(0, ...durations);
  if (video?.sample_aspect_ratio && !['1:1','N/A','0:1'].includes(video.sample_aspect_ratio))
    throw Object.assign(new Error('Export your Loop with square pixels in 9:16 format.'),{status:400});
  if (!width || !height || !Number.isFinite(duration) || duration <= 0 || duration > 25 || Math.abs(width/height - 9/16) > .006) throw Object.assign(new Error('Loops must be 9:16 videos, no longer than 25 seconds.'), {status:400});
  return { duration, aspectRatio:width/height };
}
export async function verifyLoopMedia(values) {
  if (values.format !== 'loop') return;
  const item = values.media?.[0];
  if (values.media?.length !== 1 || item.type !== 'video') throw Object.assign(new Error('Choose one video for your Loop.'), {status:400});
  const match = /^data:video\/(mp4|webm);base64,([A-Za-z0-9+/=]+)$/.exec(item.url);
  if (!match) throw Object.assign(new Error('Upload your Loop directly; external videos cannot be verified.'), {status:400});
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > 8*1024*1024) throw Object.assign(new Error('Loops must be 8 MB or smaller.'), {status:400});
  const dir = await mkdtemp(path.join(tmpdir(), 'callout-loop-'));
  try {
    const file = path.join(dir, 'video.' + match[1]); await writeFile(file, bytes);
    const {stdout} = await run(path.toNamespacedPath(ffprobe.path), ['-v','error','-protocol_whitelist','file','-show_streams','-show_format','-of','json',file], {timeout:10000,maxBuffer:1000000,windowsHide:true});
    Object.assign(item, validateLoopMetadata(JSON.parse(stdout)));
  } catch (error) {
    if (error.status) throw error;
    throw Object.assign(new Error('This video could not be verified. Upload a valid MP4 or WebM.'), {status:400});
  } finally { await rm(dir,{recursive:true,force:true}); }
}
