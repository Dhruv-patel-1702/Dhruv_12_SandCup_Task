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

  function addContact(obj){
    
    if (contacts.some(c => c.email === obj.email)) {
      return { ok: false, error: 'Email already exists' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(obj.email)) {
      return { ok: false, error: 'Invalid email format' };
    }
    
    const phoneRegex = /^\d{10,13}$/;
    if (!phoneRegex.test(obj.phone)) {
      return { ok: false, error: 'Invalid phone format - must be 10-13 digits' };
    }
    
    contacts.push({ name: obj.name, email: obj.email, phone: obj.phone });
    _save();
    return { ok: true };
  }

  function getContacts(){
    return contacts.slice().sort((a, b) => a.name.localeCompare(b.name));
  }

  function searchContacts(q){
    const query = q.toLowerCase();
    return contacts.filter(c => 
      (c.name || '').toLowerCase().includes(query) || 
      (c.email || '').toLowerCase().includes(query)
    );
  }

 
  function removeContact(email){
    const before = contacts.length;
    contacts = contacts.filter(c => c.email !== email);
    _save();
    return (contacts.length !== before);
  }

  function _resetApi(){
    contacts = [];
    _load();
  }

  window.api = { addContact, getContacts, searchContacts, removeContact, _resetApi, _load, _save };
})();
