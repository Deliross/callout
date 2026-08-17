import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createPost, createSavedBoard, createUser, deleteSavedBoard, getPublicProfile,
  listSavedBoards, listSavedPostIds, moveSavedPostToBoard, reorderSavedBoardPosts,
  toggleSavedPost, updateSavedBoard
} from '../server/repository.mjs';

const account = async label => createUser({ email: `${label}-${Date.now()}-${Math.random()}@example.com`, displayName: label });

test('Saved Pinboard initializes defaults once and preserves deleted suggestions', async () => {
  const owner = await account('Board defaults');
  let boards = await listSavedBoards(owner.id);
  assert.deepEqual(boards.map(board => board.title), ['Content Ideas', 'Funniest', 'Movies']);
  await deleteSavedBoard(boards[1].id, owner.id);
  boards = await listSavedBoards(owner.id);
  assert.deepEqual(boards.map(board => board.title), ['Content Ideas', 'Movies']);
});

test('saved posts begin Unsorted, belong to one Board, reorder, and detach on unsave', async () => {
  const owner = await account('Board organizer');
  const author = await account('Board author');
  const first = await createPost(author.id, { content: 'First saved opinion', category: 'Life', visibility: 'public', media: [] });
  const second = await createPost(author.id, { content: 'Second saved opinion', category: 'Movies', visibility: 'public', media: [] });
  await toggleSavedPost(owner.id, first.id);
  await toggleSavedPost(owner.id, second.id);
  const boards = await listSavedBoards(owner.id);
  assert.equal(boards.every(board => board.postCount === 0), true);
  const firstBoard = boards[0];
  const secondBoard = boards[1];
  assert.equal((await moveSavedPostToBoard(owner.id, first.id, firstBoard.id)).status, 'moved');
  assert.equal((await moveSavedPostToBoard(owner.id, second.id, firstBoard.id)).status, 'moved');
  let refreshed = await listSavedBoards(owner.id);
  assert.deepEqual(refreshed.find(board => board.id === firstBoard.id).postIds, [second.id, first.id]);
  assert.equal((await moveSavedPostToBoard(owner.id, first.id, secondBoard.id)).status, 'moved');
  refreshed = await listSavedBoards(owner.id);
  assert.deepEqual(refreshed.find(board => board.id === firstBoard.id).postIds, [second.id]);
  assert.deepEqual(refreshed.find(board => board.id === secondBoard.id).postIds, [first.id]);
  await moveSavedPostToBoard(owner.id, second.id, secondBoard.id);
  await reorderSavedBoardPosts(secondBoard.id, owner.id, [first.id, second.id]);
  refreshed = await listSavedBoards(owner.id);
  assert.deepEqual(refreshed.find(board => board.id === secondBoard.id).postIds, [first.id, second.id]);
  await toggleSavedPost(owner.id, first.id);
  assert.deepEqual(await listSavedPostIds(owner.id), [second.id]);
  refreshed = await listSavedBoards(owner.id);
  assert.equal(refreshed.some(board => board.postIds.includes(first.id)), false);
});

test('public profile Boards expose only eligible posts and keep private Boards private', async () => {
  const owner = await account('Public board owner');
  const visitor = await account('Public board visitor');
  const visible = await createPost(owner.id, { content: 'Visible saved work', category: 'Life', visibility: 'public', media: [] });
  const anonymous = await createPost(owner.id, { content: 'Anonymous saved work', category: 'Life', visibility: 'public', anonymous: true, media: [] });
  await toggleSavedPost(owner.id, visible.id);
  await toggleSavedPost(owner.id, anonymous.id);
  const created = await createSavedBoard(owner.id, { title: 'Public Picks', description: 'Safe public references', icon: 'bookmark', color: 'teal', visibility: 'private' });
  await moveSavedPostToBoard(owner.id, visible.id, created.board.id);
  await moveSavedPostToBoard(owner.id, anonymous.id, created.board.id);
  assert.equal((await getPublicProfile(owner.id, visitor.id)).collections.some(item => item.id === created.board.id), false);
  await updateSavedBoard(created.board.id, owner.id, { visibility: 'public' });
  const publicBoard = (await getPublicProfile(owner.id, visitor.id)).collections.find(item => item.id === created.board.id);
  assert.ok(publicBoard);
  assert.deepEqual(publicBoard.postIds, [visible.id]);
  assert.equal(publicBoard.hiddenPostCount, 1);
});

test('Saved Pinboard UI includes responsive drawer, drag targets, search and profile Boards', async () => {
  const [app, styles] = await Promise.all([
    readFile(new URL('../app.js', import.meta.url), 'utf8'),
    readFile(new URL('../styles.css', import.meta.url), 'utf8')
  ]);
  assert.match(app, /SAVED PINBOARD/);
  assert.match(app, /data-board-drop/);
  assert.match(app, /class="saved-search"/);
  assert.match(app, /function renderSavedBoardsRail/);
  assert.match(app, /function profileBoardsPanel/);
  assert.match(styles, /\.saved-pin-grid/);
  assert.match(styles, /\.saved-boards-rail/);
  assert.match(styles, /@media\(max-width:620px\).*\.saved-pin-grid/s);
});
