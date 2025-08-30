// api.js — data layer (initially imperfect). Your team must reconcile API <-> UI <-> Tests.
(function(){
  const STORAGE_KEY = 'contacts_v1'; // Fixed: tests expect 'contacts_v1'
  let contacts = [];

  function _load(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      contacts = raw ? JSON.parse(raw) : [];
      if(!Array.isArray(contacts)) contacts = [];
    }catch(e){ contacts = []; }
  }
  function _save(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  }
  _load();

  // Expected by tests (see tests.js): addContact({name,email,phone}) -> {ok:boolean, error?:string}
  function addContact(obj){
    // Fixed: Added proper validation, duplicate check, and phone rules
    
    // Check if email already exists
    if (contacts.some(c => c.email === obj.email)) {
      return { ok: false, error: 'Email already exists' };
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(obj.email)) {
      return { ok: false, error: 'Invalid email format' };
    }
    
    // Phone validation - 10-13 digits numeric
    const phoneRegex = /^\d{10,13}$/;
    if (!phoneRegex.test(obj.phone)) {
      return { ok: false, error: 'Invalid phone format - must be 10-13 digits' };
    }
    
    contacts.push({ name: obj.name, email: obj.email, phone: obj.phone });
    _save();
    return { ok: true };
  }

  // Expected: getContacts() returns sorted by name ASC
  function getContacts(){
    // Fixed: return sorted copy by name ascending
    return contacts.slice().sort((a, b) => a.name.localeCompare(b.name));
  }

  // Expected: case-insensitive match by name/email
  function searchContacts(q){
    // Fixed: case-insensitive search by both name and email
    const query = q.toLowerCase();
    return contacts.filter(c => 
      (c.name || '').toLowerCase().includes(query) || 
      (c.email || '').toLowerCase().includes(query)
    );
  }

  // Expected: remove by email
  function removeContact(email){
    // Fixed: removes by email correctly
    const before = contacts.length;
    contacts = contacts.filter(c => c.email !== email);
    _save();
    return (contacts.length !== before);
  }

  // Helper for tests to simulate reload
  function _resetApi(){
    // Fixed: Clear in-memory array and reload from storage to simulate app reload
    contacts = [];
    _load();
  }

  window.api = { addContact, getContacts, searchContacts, removeContact, _resetApi, _load, _save };
})();
