
const SUPABASE_URL = "https://wrfsbvklvxngamyyibrr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
"sb_publishable_IGLKqmkWcGvnqyknOmwsIw_6gCrqZMo";

const { createClient } = window.supabase;

const supabaseClient = createClient(
SUPABASE_URL,
SUPABASE_PUBLISHABLE_KEY
);

document.addEventListener("DOMContentLoaded", async function () { 
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
// Authentication
// -----------------------------

loginBtn.addEventListener("click", login);
signupBtn.addEventListener("click", signUp);
logoutBtn.addEventListener("click", logout);

async function signUp() {
const email = emailInput.value.trim();
const password = passwordInput.value;


if (!email || !password) {
  setAuthStatus("Enter an email and password.", "error");
  return;
}

if (password.length < 6) {
  setAuthStatus(
    "Password must be at least 6 characters.",
    "error"
  );
  return;
}

setAuthStatus("Creating your account...");

const { data, error } = await supabaseClient.auth.signUp({
  email,
  password,
});

if (error) {
  setAuthStatus(error.message, "error");
  return;
}

if (data.session) {
  setAuthStatus("Account created!", "success");
} else {
  setAuthStatus(
    "Account created. Check your email to confirm your account.",
    "success"
  );
}


}

async function login() {
const email = emailInput.value.trim();
const password = passwordInput.value;


if (!email || !password) {
  setAuthStatus("Enter your email and password.", "error");
  return;
}

setAuthStatus("Logging in...");

const { data, error } =
  await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

if (error) {
  setAuthStatus(error.message, "error");
  return;
}

currentUser = data.user;
await handleLoggedInUser();


}

async function logout() {
await supabaseClient.auth.signOut();


currentUser = null;
notes = [];

renderNotes();
updateEmptyState();

appContent.classList.add("logged-out");

emailInput.style.display = "";
passwordInput.style.display = "";
loginBtn.style.display = "";
signupBtn.style.display = "";
logoutBtn.style.display = "none";

setAuthStatus("You have been logged out.");

}

function setAuthStatus(message, type = "") {
authStatus.textContent = message;
authStatus.className = "auth-status";


if (type === "error") {
  authStatus.classList.add("auth-error");
}

if (type === "success") {
  authStatus.classList.add("auth-success");
}


}

async function handleLoggedInUser() {
if (!currentUser) return;


emailInput.style.display = "none";
passwordInput.style.display = "none";
loginBtn.style.display = "none";
signupBtn.style.display = "none";
logoutBtn.style.display = "";

appContent.classList.remove("logged-out");

setAuthStatus(
  `Logged in as ${currentUser.email}`,
  "success"
);

await loadNotes();
await migrateLocalNotes();

}

// Check whether someone is already logged in.
const {
data: { session },
} = await supabaseClient.auth.getSession();

if (session) {
currentUser = session.user;
await handleLoggedInUser();
}

// React to login/logout changes.
supabaseClient.auth.onAuthStateChange(async (_event, session) => {
if (session && session.user) {
currentUser = session.user;
await handleLoggedInUser();
} else {
currentUser = null;
}
});

// -----------------------------
// Notes
// -----------------------------

addNoteBtn.addEventListener("click", openAddNoteModal);
closeModalBtn.addEventListener("click", closeAddNoteModal);
noteForm.addEventListener("submit", handleNoteSubmit);

searchInput.addEventListener("input", filterNotes);
filterSelect.addEventListener("change", filterNotes);

cancelDeleteBtn.addEventListener("click", closeConfirmModal);
confirmDeleteBtn.addEventListener("click", confirmDeleteNote);

async function loadNotes() {
if (!currentUser) return;


const { data, error } = await supabaseClient
  .from("notes")
  .select("*")
  .eq("user_id", currentUser.id)
  .order("created_at", { ascending: false });

if (error) {
  console.error("Error loading notes:", error);
  setAuthStatus(
    "Could not load your notes: " + error.message,
    "error"
  );
  return;
}

notes = data || [];

renderNotes();
updateEmptyState();


}

async function handleNoteSubmit(e) {
e.preventDefault();


if (!currentUser) {
  setAuthStatus("Please log in first.", "error");
  return;
}

const title = document.getElementById("noteTitle").value.trim();
const content = document
  .getElementById("noteContent")
  .value.trim();

const selectedTag = document.querySelector(
  'input[name="noteTag"]:checked'
);

const tag = selectedTag ? selectedTag.value : "ideas";

if (!title || !content) {
  return;
}

const { data, error } = await supabaseClient
  .from("notes")
  .insert({
    user_id: currentUser.id,
    title,
    content,
    tag,
  })
  .select()
  .single();

if (error) {
  console.error("Error saving note:", error);
  alert("Could not save note: " + error.message);
  return;
}

notes.unshift(data);

renderNotes();
updateEmptyState();

closeAddNoteModal();
filterNotes();


}

async function confirmDeleteNote() {
if (!noteToDeleteId || !currentUser) {
closeConfirmModal();
return;
}


const { error } = await supabaseClient
  .from("notes")
  .delete()
  .eq("id", noteToDeleteId)
  .eq("user_id", currentUser.id);

if (error) {
  console.error("Error deleting note:", error);
  alert("Could not delete note: " + error.message);
  return;
}

notes = notes.filter((note) => note.id !== noteToDeleteId);

renderNotes();
updateEmptyState();
filterNotes();

closeConfirmModal();


}

// -----------------------------
// Display
// -----------------------------

function renderNotes(notesToRender = notes) {
notesContainer.innerHTML = "";


notesToRender.forEach((note) => {
  const noteElement = document.createElement("div");
  noteElement.className = "note-card fade-in";

  const title = escapeHtml(note.title);
  const content = escapeHtml(note.content);

  noteElement.innerHTML = `
    <div class="note-content">
      <div class="note-header">
        <h3 class="note-title">${title}</h3>

        <div class="note-actions">
          <button
            class="delete-btn"
            data-id="${note.id}"
            aria-label="Delete note"
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>

      <p class="note-text">${content}</p>

      <div class="note-footer">
        <span class="note-tag ${getTagClass(note.tag)}">
          ${getTagIcon(note.tag)}
          ${getTagName(note.tag)}
        </span>

        <span class="note-date">
          ${formatDate(note.created_at)}
        </span>
      </div>
    </div>
  `;

  notesContainer.appendChild(noteElement);
});

document.querySelectorAll(".delete-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    noteToDeleteId = this.getAttribute("data-id");
    openConfirmModal();
  });
});

}

function filterNotes() {
const searchTerm = searchInput.value.toLowerCase().trim();
const filterValue = filterSelect.value;

let filteredNotes = [...notes];

if (searchTerm) {
  filteredNotes = filteredNotes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchTerm) ||
      note.content.toLowerCase().includes(searchTerm)
  );
}

if (filterValue !== "all") {
  filteredNotes = filteredNotes.filter(
    (note) => note.tag === filterValue
  );
}

renderNotes(filteredNotes);
updateEmptyState(filteredNotes);


}

// -----------------------------
// Modals
// -----------------------------

function openAddNoteModal() {
addNoteModal.classList.add("active");
document.body.style.overflow = "hidden";
}

function closeAddNoteModal() {
addNoteModal.classList.remove("active");
document.body.style.overflow = "auto";
noteForm.reset();
}

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
// Helpers
// -----------------------------

function getTagClass(tag) {
const classes = {
school: "tag-school",
random: "tag-random",
ideas: "tag-ideas",
reminders: "tag-reminders",
};


return classes[tag] || "";

}

function getTagIcon(tag) {
const icons = {
school: '<i class="fas fa-briefcase"></i>',
random: '<i class="fas fa-user"></i>',
ideas: '<i class="fas fa-lightbulb"></i>',
reminders: '<i class="fas fa-bell"></i>',
};

return icons[tag] || "";


}

function getTagName(tag) {
const names = {
school: "School",
random: "Random",
ideas: "Ideas",
reminders: "Reminders",
};


return names[tag] || tag;


}

function formatDate(dateString) {
if (!dateString) return "";


const date = new Date(dateString);

return date.toLocaleString("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});


}

function updateEmptyState(notesToCheck = notes) {
if (!notesToCheck || notesToCheck.length === 0) {
emptyState.style.display = "block";
} else {
emptyState.style.display = "none";
}
}

function escapeHtml(value) {
const div = document.createElement("div");
div.textContent = value ?? "";
return div.innerHTML;
}

// -----------------------------
// Import old localStorage notes
// -----------------------------

async function migrateLocalNotes() {
if (!currentUser) return;


const migrationKey = `supabaseNotesMigrated_${currentUser.id}`;

if (localStorage.getItem(migrationKey) === "true") {
  return;
}

let oldNotes = [];

try {
  oldNotes = JSON.parse(
    localStorage.getItem("notes") || "[]"
  );
} catch (error) {
  console.error("Could not read old notes:", error);
  return;
}

if (!Array.isArray(oldNotes) || oldNotes.length === 0) {
  localStorage.setItem(migrationKey, "true");
  return;
}

const { data: existingNotes, error: existingError } =
  await supabaseClient
    .from("notes")
    .select("id")
    .eq("user_id", currentUser.id)
    .limit(1);

if (existingError) {
  console.error(
    "Could not check existing notes:",
    existingError
  );
  return;
}

// Only import local notes if this account has no cloud notes yet.
if (existingNotes && existingNotes.length > 0) {
  localStorage.setItem(migrationKey, "true");
  return;
}

const notesToInsert = oldNotes.map((note) => ({
  user_id: currentUser.id,
  title: note.title || "Untitled",
  content: note.content || "",
  tag: [
    "school",
    "random",
    "ideas",
    "reminders",
  ].includes(note.tag)
    ? note.tag
    : "ideas",
  created_at: note.date || new Date().toISOString(),
}));

const { error: insertError } = await supabaseClient
  .from("notes")
  .insert(notesToInsert);

if (insertError) {
  console.error(
    "Could not migrate old notes:",
    insertError
  );
  return;
}

localStorage.setItem(migrationKey, "true");

await loadNotes();

setAuthStatus(
  "Your old notes were imported successfully.",
  "success"
);

}
});
