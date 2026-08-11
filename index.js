const SUPABASE_URL = "https://wrfsbvklvxngamyyibrr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
"sb_publishable_IGLKqmkWcGvnqyknOmwsIw_6gCrqZMo";

const supabaseClient = window.supabase.createClient(
SUPABASE_URL,
SUPABASE_PUBLISHABLE_KEY
);

document.addEventListener("DOMContentLoaded", function () {
// -----------------------------
// Get elements
// -----------------------------

const notesContainer = document.getElementById("notesContainer");
const addNoteBtn = document.getElementById("addNoteBtn");
const addNoteModal = document.getElementById("addNoteModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const noteForm = document.getElementById("noteForm");
const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const emptyState = document.getElementById("emptyState");

const confirmModal = document.getElementById("confirmModal");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authStatus = document.getElementById("authStatus");
const appContent = document.getElementById("appContent");

let notes = [];
let noteToDeleteId = null;
let currentUser = null;

// -----------------------------
// Check required elements
// -----------------------------

if (
!notesContainer ||
!addNoteBtn ||
!noteForm ||
!emailInput ||
!passwordInput ||
!loginBtn ||
!signupBtn ||
!logoutBtn
) {
console.error(
"Some required HTML elements are missing. Make sure you replaced index.html with the Supabase version."
);
return;
}

// -----------------------------
// Authentication
// -----------------------------

signupBtn.addEventListener("click", function () {
signUp();
});

loginBtn.addEventListener("click", function () {
logIn();
});

logoutBtn.addEventListener("click", function () {
logOut();
});

passwordInput.addEventListener("keydown", function (event) {
if (event.key === "Enter") {
logIn();
}
});

function setAuthStatus(message, type) {
authStatus.textContent = message;
authStatus.className = "auth-status";

```
if (type === "error") {
  authStatus.classList.add("auth-error");
}

if (type === "success") {
  authStatus.classList.add("auth-success");
}
```

}

async function signUp() {
const email = emailInput.value.trim();
const password = passwordInput.value;

```
if (!email) {
  setAuthStatus("Please enter your email.", "error");
  return;
}

if (!password) {
  setAuthStatus("Please enter a password.", "error");
  return;
}

if (password.length < 6) {
  setAuthStatus(
    "Your password must be at least 6 characters.",
    "error"
  );
  return;
}

signupBtn.disabled = true;
loginBtn.disabled = true;

setAuthStatus("Creating your account...");

try {
  const result = await supabaseClient.auth.signUp({
    email: email,
    password: password
  });

  if (result.error) {
    console.error("Supabase signup error:", result.error);
    setAuthStatus(result.error.message, "error");
    return;
  }

  if (result.data.session) {
    setAuthStatus(
      "Account created! You are now logged in.",
      "success"
    );

    currentUser = result.data.user;
    showLoggedInState();
    await loadNotes();
    await migrateOldNotes();
  } else {
    setAuthStatus(
      "Account created! Check your email to confirm your account, then log in.",
      "success"
    );
  }
} catch (error) {
  console.error("Signup error:", error);
  setAuthStatus(
    "Something went wrong while creating your account.",
    "error"
  );
} finally {
  signupBtn.disabled = false;
  loginBtn.disabled = false;
}
```

}

async function logIn() {
const email = emailInput.value.trim();
const password = passwordInput.value;

```
if (!email || !password) {
  setAuthStatus(
    "Enter your email and password.",
    "error"
  );
  return;
}

loginBtn.disabled = true;
signupBtn.disabled = true;

setAuthStatus("Logging in...");

try {
  const result = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (result.error) {
    console.error("Supabase login error:", result.error);
    setAuthStatus(result.error.message, "error");
    return;
  }

  currentUser = result.data.user;

  showLoggedInState();

  setAuthStatus(
    "Logged in as " + currentUser.email,
    "success"
  );

  await loadNotes();
  await migrateOldNotes();
} catch (error) {
  console.error("Login error:", error);
  setAuthStatus(
    "Something went wrong while logging in.",
    "error"
  );
} finally {
  loginBtn.disabled = false;
  signupBtn.disabled = false;
}
```

}

async function logOut() {
const result = await supabaseClient.auth.signOut();

```
if (result.error) {
  console.error("Logout error:", result.error);
  return;
}

currentUser = null;
notes = [];

renderNotes();
updateEmptyState();

emailInput.value = "";
passwordInput.value = "";

emailInput.style.display = "";
passwordInput.style.display = "";
loginBtn.style.display = "";
signupBtn.style.display = "";
logoutBtn.style.display = "none";

appContent.classList.add("logged-out");

setAuthStatus("You have been logged out.");
```

}

function showLoggedInState() {
emailInput.style.display = "none";
passwordInput.style.display = "none";
loginBtn.style.display = "none";
signupBtn.style.display = "none";
logoutBtn.style.display = "";

```
appContent.classList.remove("logged-out");
```

}

// -----------------------------
// Existing session
// -----------------------------

async function checkExistingSession() {
try {
const result = await supabaseClient.auth.getSession();

```
  if (result.error) {
    console.error("Session error:", result.error);
    return;
  }

  if (result.data.session) {
    currentUser = result.data.session.user;

    showLoggedInState();

    setAuthStatus(
      "Logged in as " + currentUser.email,
      "success"
    );

    await loadNotes();
    await migrateOldNotes();
  }
} catch (error) {
  console.error("Session check error:", error);
}
```

}

supabaseClient.auth.onAuthStateChange(function (event, session) {
if (session && session.user) {
currentUser = session.user;
} else {
currentUser = null;
}
});

// -----------------------------
// Load notes from Supabase
// -----------------------------

async function loadNotes() {
if (!currentUser) {
return;
}

```
const result = await supabaseClient
  .from("notes")
  .select("*")
  .eq("user_id", currentUser.id)
  .order("created_at", { ascending: false });

if (result.error) {
  console.error("Could not load notes:", result.error);

  setAuthStatus(
    "Could not load your notes: " + result.error.message,
    "error"
  );

  return;
}

notes = result.data || [];

renderNotes();
updateEmptyState();
```

}

// -----------------------------
// Add note
// -----------------------------

noteForm.addEventListener("submit", async function (event) {
event.preventDefault();

```
if (!currentUser) {
  setAuthStatus(
    "Please log in before creating a note.",
    "error"
  );
  return;
}

const title = document
  .getElementById("noteTitle")
  .value
  .trim();

const content = document
  .getElementById("noteContent")
  .value
  .trim();

const selectedTag = document.querySelector(
  'input[name="noteTag"]:checked'
);

const tag = selectedTag
  ? selectedTag.value
  : "ideas";

if (!title || !content) {
  return;
}

const submitButton = noteForm.querySelector(
  'button[type="submit"]'
);

if (submitButton) {
  submitButton.disabled = true;
}

const result = await supabaseClient
  .from("notes")
  .insert({
    user_id: currentUser.id,
    title: title,
    content: content,
    tag: tag
  })
  .select()
  .single();

if (submitButton) {
  submitButton.disabled = false;
}

if (result.error) {
  console.error("Could not save note:", result.error);

  alert(
    "Could not save your note: " +
      result.error.message
  );

  return;
}

notes.unshift(result.data);

renderNotes();
updateEmptyState();

closeAddNoteModal();
filterNotes();
```

});

// -----------------------------
// Delete note
// -----------------------------

confirmDeleteBtn.addEventListener(
"click",
async function () {
if (!currentUser || !noteToDeleteId) {
closeConfirmModal();
return;
}

```
  const result = await supabaseClient
    .from("notes")
    .delete()
    .eq("id", noteToDeleteId)
    .eq("user_id", currentUser.id);

  if (result.error) {
    console.error(
      "Could not delete note:",
      result.error
    );

    alert(
      "Could not delete your note: " +
        result.error.message
    );

    return;
  }

  notes = notes.filter(function (note) {
    return note.id !== noteToDeleteId;
  });

  renderNotes();
  updateEmptyState();
  filterNotes();

  closeConfirmModal();
}
```

);

// -----------------------------
// Render notes
// -----------------------------

function renderNotes(notesToRender) {
if (!notesToRender) {
notesToRender = notes;
}

```
notesContainer.innerHTML = "";

notesToRender.forEach(function (note) {
  const noteElement =
    document.createElement("div");

  noteElement.className = "note-card fade-in";

  const noteContent =
    document.createElement("div");

  noteContent.className = "note-content";

  const noteHeader =
    document.createElement("div");

  noteHeader.className = "note-header";

  const title =
    document.createElement("h3");

  title.className = "note-title";
  title.textContent = note.title;

  const actions =
    document.createElement("div");

  actions.className = "note-actions";

  const deleteButton =
    document.createElement("button");

  deleteButton.className = "delete-btn";
  deleteButton.setAttribute(
    "aria-label",
    "Delete note"
  );

  deleteButton.innerHTML =
    '<i class="fas fa-trash"></i>';

  deleteButton.addEventListener(
    "click",
    function () {
      noteToDeleteId = note.id;
      openConfirmModal();
    }
  );

  actions.appendChild(deleteButton);

  noteHeader.appendChild(title);
  noteHeader.appendChild(actions);

  const content =
    document.createElement("p");

  content.className = "note-text";
  content.textContent = note.content;

  const footer =
    document.createElement("div");

  footer.className = "note-footer";

  const tag =
    document.createElement("span");

  tag.className =
    "note-tag " + getTagClass(note.tag);

  tag.innerHTML =
    getTagIcon(note.tag) +
    " " +
    getTagName(note.tag);

  const date =
    document.createElement("span");

  date.className = "note-date";
  date.textContent =
    formatDate(note.created_at);

  footer.appendChild(tag);
  footer.appendChild(date);

  noteContent.appendChild(noteHeader);
  noteContent.appendChild(content);
  noteContent.appendChild(footer);

  noteElement.appendChild(noteContent);
  notesContainer.appendChild(noteElement);
});
```

}

// -----------------------------
// Search and filters
// -----------------------------

searchInput.addEventListener(
"input",
filterNotes
);

filterSelect.addEventListener(
"change",
filterNotes
);

function filterNotes() {
const searchTerm =
searchInput.value.toLowerCase().trim();

```
const filterValue =
  filterSelect.value;

let filteredNotes = notes.slice();

if (searchTerm) {
  filteredNotes =
    filteredNotes.filter(function (note) {
      return (
        note.title
          .toLowerCase()
          .includes(searchTerm) ||
        note.content
          .toLowerCase()
          .includes(searchTerm)
      );
    });
}

if (filterValue !== "all") {
  filteredNotes =
    filteredNotes.filter(function (note) {
      return note.tag === filterValue;
    });
}

renderNotes(filteredNotes);
updateEmptyState(filteredNotes);
```

}

// -----------------------------
// Tags
// -----------------------------

function getTagClass(tag) {
const classes = {
school: "tag-school",
random: "tag-random",
ideas: "tag-ideas",
reminders: "tag-reminders"
};

```
return classes[tag] || "";
```

}

function getTagIcon(tag) {
const icons = {
school: '<i class="fas fa-briefcase"></i>',
random: '<i class="fas fa-user"></i>',
ideas: '<i class="fas fa-lightbulb"></i>',
reminders: '<i class="fas fa-bell"></i>'
};

```
return icons[tag] || "";
```

}

function getTagName(tag) {
const names = {
school: "School",
random: "Random",
ideas: "Ideas",
reminders: "Reminders"
};

```
return names[tag] || tag;
```

}

// -----------------------------
// Dates
// -----------------------------

function formatDate(dateString) {
if (!dateString) {
return "";
}

```
const date = new Date(dateString);

return date.toLocaleString("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});
```

}

// -----------------------------
// Add note modal
// -----------------------------

addNoteBtn.addEventListener(
"click",
function () {
if (!currentUser) {
setAuthStatus(
"Please log in first.",
"error"
);
return;
}

```
  openAddNoteModal();
}
```

);

closeModalBtn.addEventListener(
"click",
closeAddNoteModal
);

function openAddNoteModal() {
addNoteModal.classList.add("active");
document.body.style.overflow = "hidden";
}

function closeAddNoteModal() {
addNoteModal.classList.remove("active");
document.body.style.overflow = "auto";
noteForm.reset();
}

// -----------------------------
// Delete confirmation modal
// -----------------------------

cancelDeleteBtn.addEventListener(
"click",
closeConfirmModal
);

function openConfirmModal() {
confirmModal.classList.add("active");
document.body.style.overflow = "hidden";
}

function closeConfirmModal() {
confirmModal.classList.remove("active");
document.body.style.overflow = "auto";
noteToDeleteId = null;
}

// -----------------------------
// Empty state
// -----------------------------

function updateEmptyState(notesToCheck) {
if (!notesToCheck) {
notesToCheck = notes;
}

```
if (notesToCheck.length === 0) {
  emptyState.style.display = "block";
} else {
  emptyState.style.display = "none";
}
```

}

// -----------------------------
// Import old localStorage notes
// -----------------------------

async function migrateOldNotes() {
if (!currentUser) {
return;
}

```
const migrationKey =
  "supabaseNotesMigrated_" +
  currentUser.id;

if (
  localStorage.getItem(migrationKey) ===
  "true"
) {
  return;
}

let oldNotes = [];

try {
  const storedNotes =
    localStorage.getItem("notes");

  if (storedNotes) {
    oldNotes = JSON.parse(storedNotes);
  }
} catch (error) {
  console.error(
    "Could not read old local notes:",
    error
  );

  return;
}

if (
  !Array.isArray(oldNotes) ||
  oldNotes.length === 0
) {
  localStorage.setItem(
    migrationKey,
    "true"
  );

  return;
}

const existingResult =
  await supabaseClient
    .from("notes")
    .select("id")
    .eq("user_id", currentUser.id)
    .limit(1);

if (existingResult.error) {
  console.error(
    "Could not check existing cloud notes:",
    existingResult.error
  );

  return;
}

if (
  existingResult.data &&
  existingResult.data.length > 0
) {
  localStorage.setItem(
    migrationKey,
    "true"
  );

  return;
}

const notesToImport =
  oldNotes.map(function (note) {
    return {
      user_id: currentUser.id,
      title: note.title || "Untitled",
      content: note.content || "",
      tag: [
        "school",
        "random",
        "ideas",
        "reminders"
      ].includes(note.tag)
        ? note.tag
        : "ideas",
      created_at:
        note.date ||
        new Date().toISOString()
    };
  });

const importResult =
  await supabaseClient
    .from("notes")
    .insert(notesToImport);

if (importResult.error) {
  console.error(
    "Could not import old notes:",
    importResult.error
  );

  return;
}

localStorage.setItem(
  migrationKey,
  "true"
);

await loadNotes();

setAuthStatus(
  "Your old notes were imported successfully.",
  "success"
);
```

}

// -----------------------------
// Start the application
// -----------------------------

checkExistingSession();
});
