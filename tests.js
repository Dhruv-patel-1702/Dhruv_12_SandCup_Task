// tests.js — QA owns this file. Do not edit during challenge (candidates may read, not modify).
(function(){
  const log = (...a)=>console.log('[TEST]', ...a);
  const resultsEl = document.getElementById('results');
  const runBtn = document.getElementById('run-tests');
  const resetBtn = document.getElementById('reset-data');

  const STORAGE_KEY = 'contacts_v1'; // Contract expected by QA

  function li(state, text){
    const el = document.createElement('li');
    el.textContent = text;
    el.className = state;
    resultsEl.appendChild(el);
  }
  function pass(t){ li('pass', '✓ ' + t); }
  function fail(t){ li('fail', '✗ ' + t); }
  function info(t){ li('info', '• ' + t); }

  function clearUI(){
    resultsEl.innerHTML = '';
  }

  function getStored(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch(e){ return []; }
  }

  function resetAll(){
    // wipe both expected and any stray keys
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('contact_v1');
    if (window.api && api._resetApi) api._resetApi();
  }

  function assert(cond, msg){ if(cond) pass(msg); else fail(msg); return !!cond; }

  async function run(){
    clearUI();
    info('Resetting data...');
    resetAll();

    // 1. addContact validates and persists
    let r = api.addContact({ name: 'Aisha', email: 'aisha@example.com', phone: '9876543210' });
    assert(r && r.ok, 'addContact returns {ok:true} for valid data');

    // Unique email enforced
    r = api.addContact({ name: 'Aisha Clone', email: 'aisha@example.com', phone: '9876543211' });
    assert(r && !r.ok && /unique|exists/i.test(r.error||''), 'Duplicate email is rejected with a helpful error');

    // Email validation
    r = api.addContact({ name: 'Bad Email', email: 'bad@', phone: '9876543210' });
    assert(r && !r.ok && /email/i.test(r.error||''), 'Invalid email is rejected');

    // Phone validation 10–13 digits numeric
    r = api.addContact({ name: 'Bad Phone', email: 'p@example.com', phone: '12ab' });
    assert(r && !r.ok && /phone/i.test(r.error||''), 'Invalid phone is rejected');

    // 2. getContacts returns sorted by name ASC
    api.addContact({ name: 'Zeno', email: 'z@z.com', phone: '9999999999' });
    api.addContact({ name: 'Bala', email: 'b@b.com', phone: '9999999999' });
    const list = api.getContacts().map(x=>x.name);
    const sorted = list.slice().sort((a,b)=>a.localeCompare(b));
    assert(JSON.stringify(list) === JSON.stringify(sorted), 'getContacts returns list sorted by name ascending');

    // 3. searchContacts is case-insensitive and searches name OR email
    const s1 = api.searchContacts('aisha');
    const s2 = api.searchContacts('B@B.COM');
    assert(s1.length >= 1 && s1.some(x=>x.email==='aisha@example.com'), 'searchContacts matches by name/email (case-insensitive) [aisha]');
    assert(s2.length >= 1 && s2.some(x=>x.email==='b@b.com'), 'searchContacts matches by name/email (case-insensitive) [B@B.COM]');

    // 4. removeContact removes by email
    const before = api.getContacts().length;
    const removed = api.removeContact('b@b.com');
    const after = api.getContacts().length;
    assert(removed === true && after === (before - 1), 'removeContact removes by email and returns true');

    // 5. Persistence: contacts survive reload (storage key contract)
    // simulate "app reload"
    if (api._resetApi) api._resetApi();
    const fromStorage = getStored();
    assert(Array.isArray(fromStorage) && fromStorage.length >= 2, 'Contacts persisted under correct key');

    info('All tests completed.');
  }

  runBtn.addEventListener('click', run);
  resetBtn.addEventListener('click', ()=>{ resetAll(); clearUI(); info('Data cleared. Ready.'); });

  // Auto-run on load to show current state
  window.addEventListener('load', run);
})();
