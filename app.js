// app.js — UI glue. Some pieces intentionally off; coordinate with API and QA to pass tests.
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const form = $("#contact-form");
  const list = $("#list");
  const query = $("#query");
  const addBtn = $("#addBtn");
  const clearBtn = $("#clearBtn");

  function validateName(name) {
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!name.trim()) {
      return { valid: false, error: "Name is required" };
    }
    if (!nameRegex.test(name)) {
      return { valid: false, error: "Name can only contain letters and spaces" };
    }
    return { valid: true };
  }

  function validateEmail(email) {

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.trim()) {
      return { valid: false, error: "Email is required" };
    }
    if (!emailRegex.test(email)) {  
      return { valid: false, error: "Please enter a valid email format (e.g., name@example.com)" };
    }
    return { valid: true };
  }

  function validatePhone(phone) {
    if (/[^0-9]/.test(phone)) {
      return { valid: false, error: "Phone number can only contain digits (0-9)" };
    }
    
    if (!phone.trim()) {
      return { valid: false, error: "Phone is required" };
    }
    
    if (phone.length !== 10) {
      return { valid: false, error: "Phone number must be exactly 10 digits" };
    }
    
    return { valid: true };
  }

  function showError(fieldId, message) {
    const existingError = $(`#${fieldId}-error`);
    if (existingError) {
      existingError.remove();
    }
    
    const field = $(`#${fieldId}`);
    const errorDiv = document.createElement("div");
    errorDiv.id = `${fieldId}-error`;
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    errorDiv.style.color = "red";
    errorDiv.style.fontSize = "12px";
    errorDiv.style.marginTop = "4px";
    
    field.parentNode.insertBefore(errorDiv, field.nextSibling);
  }

  function clearError(fieldId) {
    const error = $(`#${fieldId}-error`);
    if (error) {
      error.remove();
    }
  }

  function render(items) {
    list.innerHTML = "";
    items.forEach((c) => {
      const li = document.createElement("li");
      const left = document.createElement("div");
      left.innerHTML = `<strong>${c.name}</strong><br><small>${c.email} • ${
        c.phone || ""
      }</small>`;
      const right = document.createElement("div");
      const del = document.createElement("button");
      del.textContent = "Remove";
      del.addEventListener("click", () => {
        api.removeContact(c.email);
        refresh();
      });
      right.appendChild(del);
      li.append(left, right);
      list.appendChild(li);
    });
  }

  function refresh() {
    const items = api.getContacts();
    render(items);
  }

  refresh();

  $("#name").addEventListener("input", (e) => {
    clearError("name");
    let value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
    
    e.target.value = value;
  });

  $("#email").addEventListener("input", () => {
    clearError("email");
  });

  $("#name").addEventListener("paste", (e) => {
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    const lettersOnly = pastedText.replace(/[^a-zA-Z\s]/g, '');
    e.target.value = lettersOnly;
  });

  $("#name").addEventListener("keydown", (e) => {
    if ([8, 9, 27, 13, 37, 38, 39, 40, 46, 32].indexOf(e.keyCode) !== -1) {
      return;
    }
    
    if ((e.keyCode >= 65 && e.keyCode <= 90) || (e.keyCode >= 97 && e.keyCode <= 122)) {
      return;
    }
    
    e.preventDefault();
  });

  $("#phone").addEventListener("input", (e) => {
    clearError("phone");
    
    let value = e.target.value.replace(/[^0-9]/g, '');
    
    if (value.length > 10) {
      value = value.substring(0, 10);
    }
    
    if (value.length > 0 && value[0] === '0') {
      value = value.substring(1); 
    }
    
    e.target.value = value;
  });

  $("#phone").addEventListener("paste", (e) => {
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    const digitsOnly = pastedText.replace(/[^0-9]/g, '');
    
    let finalValue = digitsOnly;
    
    if (finalValue.length > 10) {
      finalValue = finalValue.substring(0, 10);
    }
    
    if (finalValue.length > 0 && finalValue[0] === '0') {
      finalValue = finalValue.substring(1); // Remove the first zero
    }
    
    e.target.value = finalValue;
  });

  $("#phone").addEventListener("keydown", (e) => {
    if ([8, 9, 27, 13, 37, 38, 39, 40, 46].indexOf(e.keyCode) !== -1) {
      return;
    }
    
    if (e.keyCode >= 48 && e.keyCode <= 57) {
      if (e.target.value.length >= 10) {
        e.preventDefault();
        return;
      }
      return;
    }
    
    e.preventDefault();
  });

  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    
    clearError("name");
    clearError("email");
    clearError("phone");
    
    const name = $("#name").value.trim();
    const email = $("#email").value.trim();
    const phone = $("#phone").value.trim();
    
    const nameValidation = validateName(name);
    const emailValidation = validateEmail(email);
    const phoneValidation = validatePhone(phone);
    
    let hasErrors = false;
    
    if (!nameValidation.valid) {
      showError("name", nameValidation.error);
      hasErrors = true;
    }
    
    if (!emailValidation.valid) {
      showError("email", emailValidation.error);
      hasErrors = true;
    }
    
    if (!phoneValidation.valid) {
      showError("phone", phoneValidation.error);
      hasErrors = true;
    }
    
    if (hasErrors) {
      return;
    }
    
    const res = api.addContact({ name, email, phone });
    if (!res || !res.ok) {
      alert(res && res.error ? res.error : "Failed to add contact.");
      return;
    }
    form.reset();
    refresh();
  });

  clearBtn.addEventListener("click", () => {
    const items = api.getContacts();
    items.forEach((x) => api.removeContact(x.email));
    refresh();
  });


  query.addEventListener("input", () => {
    const q = query.value;
    const items = q ? api.searchContacts(q) : api.getContacts();
    render(items);
  });

  window.UI = { render, refresh };
})();
