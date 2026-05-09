const test = require('node:test');
const assert = require('node:assert/strict');
const { createJiti } = require('jiti');
const jiti = createJiti(__filename);

const {
  countSessionMessages,
  selectLatestConversationEntries,
  formatSessionPushSummary,
} = jiti('../index.ts');

function messageEntry(id, role, content) {
  return {
    type: 'message',
    id,
    parentId: null,
    timestamp: new Date(0).toISOString(),
    message: { role, content, timestamp: 0 },
  };
}

function customEntry(id) {
  return { type: 'custom', id, parentId: null, timestamp: new Date(0).toISOString(), customType: 'x' };
}

test('countSessionMessages counts only message entries', () => {
  const entries = [messageEntry('u1', 'user', 'hello'), customEntry('c1'), messageEntry('a1', 'assistant', [])];
  assert.equal(countSessionMessages(entries), 2);
});

test('selectLatestConversationEntries returns last user message and following entries', () => {
  const entries = [
    messageEntry('u1', 'user', 'old'),
    messageEntry('a1', 'assistant', [{ type: 'text', text: 'old reply' }]),
    messageEntry('u2', 'user', 'new'),
    messageEntry('a2', 'assistant', [{ type: 'text', text: 'new reply' }]),
  ];
  assert.deepEqual(selectLatestConversationEntries(entries).map((entry) => entry.id), ['u2', 'a2']);
});

test('formatSessionPushSummary can count total session messages separately from current branch', () => {
  const branch = [messageEntry('u2', 'user', 'new question'), messageEntry('a2', 'assistant', [{ type: 'text', text: 'new answer' }])];
  const allEntries = [messageEntry('u1', 'user', 'old'), messageEntry('a1', 'assistant', [{ type: 'text', text: 'old reply' }]), ...branch];
  assert.equal(formatSessionPushSummary(branch, allEntries), 'Current session messages: 4\n\n🧑 User:\nnew question\n\n🤖 pi:\nnew answer');
});

test('formatSessionPushSummary includes total message count and latest conversation', () => {
  const entries = [
    messageEntry('u1', 'user', 'old'),
    messageEntry('a1', 'assistant', [{ type: 'text', text: 'old reply' }]),
    messageEntry('u2', 'user', 'new question'),
    messageEntry('a2', 'assistant', [{ type: 'text', text: 'new answer' }]),
  ];
  assert.equal(formatSessionPushSummary(entries), 'Current session messages: 4\n\n🧑 User:\nnew question\n\n🤖 pi:\nnew answer');
});

test('formatSessionPushSummary aggregates tool calls instead of rendering them as messages', () => {
  const entries = [
    messageEntry('u1', 'user', 'please inspect'),
    messageEntry('a1', 'assistant', [
      { type: 'text', text: 'I will inspect.' },
      { type: 'toolCall', id: 'call-1', name: 'read', arguments: { path: 'README.md' } },
      { type: 'toolCall', id: 'call-2', name: 'bash', arguments: { command: 'pwd' } },
    ]),
    messageEntry('t1', 'toolResult', [{ type: 'text', text: 'tool output should not render' }]),
    messageEntry('a2', 'assistant', [{ type: 'text', text: 'Done.' }]),
  ];
  assert.equal(
    formatSessionPushSummary(entries),
    'Current session messages: 4\n\n🧑 User:\nplease inspect\n\n🤖 pi:\nI will inspect.\n\n2 times tool called\n\n🤖 pi:\nDone.',
  );
});

test('formatSessionPushSummary folds repeated tool-only assistant messages into one aggregate line', () => {
  const entries = [
    messageEntry('u1', 'user', 'please inspect'),
    messageEntry('a1', 'assistant', [{ type: 'toolCall', id: 'call-1', name: 'read', arguments: { path: 'README.md' } }]),
    messageEntry('t1', 'toolResult', [{ type: 'text', text: 'tool output should not render' }]),
    messageEntry('a2', 'assistant', [{ type: 'toolCall', id: 'call-2', name: 'bash', arguments: { command: 'pwd' } }]),
    messageEntry('t2', 'toolResult', [{ type: 'text', text: 'more tool output should not render' }]),
    messageEntry('a3', 'assistant', [{ type: 'text', text: 'Done.' }]),
  ];
  assert.equal(
    formatSessionPushSummary(entries),
    'Current session messages: 6\n\n🧑 User:\nplease inspect\n\n2 times tool called\n\n🤖 pi:\nDone.',
  );
});
