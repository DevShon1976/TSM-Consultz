/**
 * TSM Foundation: Collaboration v1.0
 * Comments, @mentions, task assignments, document attachments, and meeting
 * notes attached to any record (order, lead, request, mission...) across any
 * War Room. Persists through TSMState when available.
 *
 * Usage:
 *   TSMCollaboration.addComment('order:O-4471', 'Carrier delay confirmed, @finance please hold invoice', 'T-dawg');
 *   TSMCollaboration.assignTask('order:O-4471', { title: 'Call carrier', assignee: 'ops-team' });
 *   TSMCollaboration.attach('order:O-4471', { name: 'BOL.pdf', url: '/uploads/bol.pdf' });
 *   TSMCollaboration.addMeetingNote('order:O-4471', 'War room 7/1: agreed to expedite via air freight.');
 *   TSMCollaboration.getThread('order:O-4471'); // everything above, chronological
 */

(function (global) {
  'use strict';

  function _bus() { return global.TSMBus || global.TSMEventBus || null; }
  function _uid(p) { return `${p}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`; }

  const _threads = {}; // recordKey -> [] entries, chronological

  function _append(recordKey, entry) {
    if (!_threads[recordKey]) _threads[recordKey] = [];
    _threads[recordKey].push(entry);

    if (global.TSMState && typeof global.TSMState.push === 'function') {
      global.TSMState.push('collaboration', { recordKey, entry });
    }
    const bus = _bus();
    if (bus && bus.emit) bus.emit('COLLABORATION_ENTRY_ADDED', { recordKey, entry });
    return entry;
  }

  function _extractMentions(text) {
    const matches = text.match(/@[\w.-]+/g) || [];
    return matches.map(m => m.slice(1));
  }

  function addComment(recordKey, text, author = 'unknown') {
    const mentions = _extractMentions(text);
    return _append(recordKey, { id: _uid('CMT'), type: 'comment', text, author, mentions, ts: Date.now() });
  }

  function assignTask(recordKey, task = {}) {
    return _append(recordKey, {
      id: _uid('TSK'), type: 'task_assignment',
      title: task.title || 'Untitled task', assignee: task.assignee || null,
      dueDate: task.dueDate || null, status: 'pending', ts: Date.now()
    });
  }

  function completeTask(recordKey, taskId, completedBy = 'unknown') {
    const thread = _threads[recordKey] || [];
    const task = thread.find(e => e.id === taskId && e.type === 'task_assignment');
    if (!task) return null;
    task.status = 'complete';
    task.completedBy = completedBy;
    task.completedAt = Date.now();
    const bus = _bus();
    if (bus && bus.emit) bus.emit('COLLABORATION_TASK_COMPLETE', { recordKey, taskId, completedBy });
    return task;
  }

  function attach(recordKey, file = {}) {
    return _append(recordKey, { id: _uid('DOC'), type: 'attachment', name: file.name || 'file', url: file.url || null, uploadedBy: file.uploadedBy || 'unknown', ts: Date.now() });
  }

  function addMeetingNote(recordKey, note, author = 'unknown') {
    return _append(recordKey, { id: _uid('NOTE'), type: 'meeting_note', text: note, author, ts: Date.now() });
  }

  function getThread(recordKey) {
    return (_threads[recordKey] || []).slice();
  }

  function getMentionsFor(username) {
    const out = [];
    Object.keys(_threads).forEach(recordKey => {
      _threads[recordKey].forEach(e => {
        if (e.mentions && e.mentions.includes(username)) out.push({ recordKey, entry: e });
      });
    });
    return out;
  }

  global.TSMCollaboration = { addComment, assignTask, completeTask, attach, addMeetingNote, getThread, getMentionsFor };

  console.info('[TSMCollaboration] Foundation module v1.0 initialized.');

})(window);
