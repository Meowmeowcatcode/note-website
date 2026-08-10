
document.addEventListener("DOMContentLoaded", async function () {

    // =========================================================
    // ELEMENTS
    // =========================================================

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

    let notes = [];
    let noteToDeleteId = null;
    let currentUser = null;


    // =========================================================
    // CREATE LOGIN BOX
    // =========================================================

    createAuthUI();


    // =========================================================
    // AUTH UI
    // =========================================================

    function createAuthUI() {

        const container = document.querySelector(".container");

        const authBox = document.createElement("div");

        authBox.id = "authBox";

        authBox.innerHTML = `
            <div id="loginArea">

                <h2>Welcome to Mia's Notes</h2>

                <p>Log in to access your notes on any device.</p>

                <input
                    type="email"
                    id="authEmail"
                    placeholder="Email"
                >

                <input
                    type="password"
                    id="authPassword"
                    placeholder="Password"
                >

                <div class="auth-buttons">

                    <button id="loginBtn">
                        Log In
                    </button>

                    <button id="signupBtn">
                        Create Account
                    </button>

                </div>

                <p id="authMessage"></p>

            </div>

            <div id="loggedInArea" style="display:none;">

                <span id="loggedInEmail"></span>

                <button id="logoutBtn">
                    Log Out
                </button>

            </div>
        `;

        container.insertBefore(authBox, container.firstChild);


        document
            .getElementById("loginBtn")
            .addEventListener("click", login);

        document
            .getElementById("signupBtn")
            .addEventListener("click", signup);

        document
            .getElementById("logoutBtn")
            .addEventListener("click", logout);
    }


    // =========================================================
    // CHECK CURRENT USER
    // =========================================================

    const {
        data: {
            session
        }
    } = await supabase.auth.getSession();


    if (session) {

        currentUser = session.user;

        showLoggedIn();

        await loadNotes();

    } else {

        showLoggedOut();

    }


    // =========================================================
    // LISTEN FOR LOGIN / LOGOUT
    // =========================================================

    supabase.auth.onAuthStateChange(async function (event, session) {

        if (session) {

            currentUser = session.user;

            showLoggedIn();

            await loadNotes();

        } else {

            currentUser = null;

            notes = [];

            renderNotes();

            updateEmptyState();

            showLoggedOut();
        }
    });


    // =========================================================
    // SIGN UP
    // =========================================================

    async function signup() {

        const email =
            document.getElementById("authEmail").value.trim();

        const password =
            document.getElementById("authPassword").value;


        if (!email || !password) {

            showAuthMessage(
                "Please enter an email and password."
            );

            return;
        }


        if (password.length < 6) {

            showAuthMessage(
                "Password must be at least 6 characters."
            );

            return;
        }


        const {
            data,
            error
        } = await supabase.auth.signUp({
            email: email,
            password: password
        });


        if (error) {

            showAuthMessage(error.message);

            return;
        }


        if (data.session) {

            showAuthMessage(
                "Account created successfully!"
            );

        } else {

            showAuthMessage(
                "Account created! Check your email to confirm your account."
            );
        }
    }


    // =========================================================
    // LOGIN
    // =========================================================

    async function login() {

        const email =
            document.getElementById("authEmail").value.trim();

        const password =
            document.getElementById("authPassword").value;


        if (!email || !password) {

            showAuthMessage(
                "Please enter your email and password."
            );

            return;
        }


        const {
            data,
            error
        } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });


        if (error) {

            showAuthMessage(error.message);

            return;
        }


        currentUser = data.user;

        showLoggedIn();

        await loadNotes();
    }


    // =========================================================
    // LOGOUT
    // =========================================================

    async function logout() {

        const {
            error
        } = await supabase.auth.signOut();


        if (error) {

            console.error(
                "Logout error:",
                error
            );

            return;
        }


        notes = [];

        renderNotes();

        updateEmptyState();

        showLoggedOut();
    }


    // =========================================================
    // SHOW LOGGED IN
    // =========================================================

    function showLoggedIn() {

        document.getElementById(
            "loginArea"
        ).style.display = "none";


        document.getElementById(
            "loggedInArea"
        ).style.display = "flex";


        document.getElementById(
            "loggedInEmail"
        ).textContent = currentUser.email;
    }


    // =========================================================
    // SHOW LOGGED OUT
    // =========================================================

    function showLoggedOut() {

        document.getElementById(
            "loginArea"
        ).style.display = "block";


        document.getElementById(
            "loggedInArea"
        ).style.display = "none";


        notesContainer.innerHTML = "";

        emptyState.style.display = "block";
    }


    // =========================================================
    // AUTH MESSAGE
    // =========================================================

    function showAuthMessage(message) {

        const element =
            document.getElementById("authMessage");

        element.textContent = message;
    }


    // =========================================================
    // LOAD NOTES FROM SUPABASE
    // =========================================================

    async function loadNotes() {

        if (!currentUser) {
            return;
        }


        const {
            data,
            error
        } = await supabase
            .from("notes")
            .select("*")
            .order("created_at", {
                ascending: false
            });


        if (error) {

            console.error(
                "Error loading notes:",
                error
            );

            alert(
                "Could not load your notes."
            );

            return;
        }


        notes = data || [];


        renderNotes();

        updateEmptyState();
    }


    // =========================================================
    // RENDER NOTES
    // =========================================================

    function renderNotes(
        notesToRender = notes
    ) {

        notesContainer.innerHTML = "";


        notesToRender.forEach(function (note) {

            const noteElement =
                document.createElement("div");


            noteElement.className =
                "note-card fade-in";


            noteElement.innerHTML = `

                <div class="note-content">

                    <div class="note-header">

                        <h3 class="note-title">
                            ${escapeHtml(note.title)}
                        </h3>

                        <div class="note-actions">

                            <button
                                class="delete-btn"
                                data-id="${note.id}"
                            >
                                <i class="fas fa-trash"></i>
                            </button>

                        </div>

                    </div>

                    <p class="note-text">
                        ${escapeHtml(note.content)}
                    </p>

                    <div class="note-footer">

                        <span
                            class="note-tag ${getTagClass(note.tag)}"
                        >
                            ${getTagIcon(note.tag)}
                            ${getTagName(note.tag)}
                        </span>

                        <span class="note-date">
                            ${formatDate(note.created_at)}
                        </span>

                    </div>

                </div>
            `;


            notesContainer.appendChild(
                noteElement
            );
        });


        document
            .querySelectorAll(".delete-btn")
            .forEach(function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        noteToDeleteId =
                            this.getAttribute("data-id");

                        openConfirmModal();
                    }
                );
            });
    }


    // =========================================================
    // ESCAPE HTML
    // =========================================================

    function escapeHtml(text) {

        const div =
            document.createElement("div");

        div.textContent = text || "";

        return div.innerHTML;
    }


    // =========================================================
    // TAG FUNCTIONS
    // =========================================================

    function getTagClass(tag) {

        const classes = {

            work: "tag-work",

            personal: "tag-personal",

            ideas: "tag-ideas",

            reminders: "tag-reminders"
        };

        return classes[tag] || "";
    }


    function getTagIcon(tag) {

        const icons = {

            work:
                '<i class="fas fa-briefcase"></i>',

            personal:
                '<i class="fas fa-user"></i>',

            ideas:
                '<i class="fas fa-lightbulb"></i>',

            reminders:
                '<i class="fas fa-bell"></i>'
        };

        return icons[tag] || "";
    }


    function getTagName(tag) {

        const names = {

            work: "Work",

            personal: "Personal",

            ideas: "Ideas",

            reminders: "Reminders"
        };

        return names[tag] || tag;
    }


    // =========================================================
    // FORMAT DATE
    // =========================================================

    function formatDate(dateString) {

        if (!dateString) {
            return "";
        }


        const date =
            new Date(dateString);


        return date.toLocaleDateString(
            "en-US",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    }


    // =========================================================
    // ADD NOTE MODAL
    // =========================================================

    function openAddNoteModal() {

        if (!currentUser) {

            alert(
                "Please log in before adding a note."
            );

            return;
        }


        addNoteModal.classList.add(
            "active"
        );

        document.body.style.overflow =
            "hidden";
    }


    function closeAddNoteModal() {

        addNoteModal.classList.remove(
            "active"
        );

        document.body.style.overflow =
            "auto";

        noteForm.reset();
    }


    // =========================================================
    // CONFIRM DELETE MODAL
    // =========================================================

    function openConfirmModal() {

        confirmModal.classList.add(
            "active"
        );

        document.body.style.overflow =
            "hidden";
    }


    function closeConfirmModal() {

        confirmModal.classList.remove(
            "active"
        );

        document.body.style.overflow =
            "auto";

        noteToDeleteId = null;
    }


    // =========================================================
    // SAVE NOTE TO SUPABASE
    // =========================================================

    async function handleNoteSubmit(event) {

        event.preventDefault();


        if (!currentUser) {

            alert(
                "Please log in before saving a note."
            );

            return;
        }


        const title =
            document
                .getElementById("noteTitle")
                .value
                .trim();


        const content =
            document
                .getElementById("noteContent")
                .value
                .trim();


        const selectedTag =
            document.querySelector(
                'input[name="noteTag"]:checked'
            );


        const tag =
            selectedTag
                ? selectedTag.value
                : "ideas";


        if (!title || !content) {
            return;
        }


        const {
            data,
            error
        } = await supabase
            .from("notes")
            .insert({

                user_id: currentUser.id,

                title: title,

                content: content,

                tag: tag

            })
            .select()
            .single();


        if (error) {

            console.error(
                "Error saving note:",
                error
            );

            alert(
                "Could not save your note."
            );

            return;
        }


        notes.unshift(data);


        renderNotes();

        updateEmptyState();

        closeAddNoteModal();

        filterNotes();
    }


    // =========================================================
    // DELETE NOTE FROM SUPABASE
    // =========================================================

    async function confirmDeleteNote() {

        if (!noteToDeleteId) {
            return;
        }


        const {
            error
        } = await supabase
            .from("notes")
            .delete()
            .eq("id", noteToDeleteId);


        if (error) {

            console.error(
                "Error deleting note:",
                error
            );

            alert(
                "Could not delete the note."
            );

            return;
        }


        notes =
            notes.filter(function (note) {

                return note.id !==
                    noteToDeleteId;
            });


        renderNotes();

        updateEmptyState();

        filterNotes();

        closeConfirmModal();
    }


    // =========================================================
    // SEARCH + FILTER
    // =========================================================

    function filterNotes() {

        const searchTerm =
            searchInput.value
                .toLowerCase()
                .trim();


        const filterValue =
            filterSelect.value;


        let filteredNotes =
            [...notes];


        if (searchTerm) {

            filteredNotes =
                filteredNotes.filter(
                    function (note) {

                        return (

                            (note.title || "")
                                .toLowerCase()
                                .includes(searchTerm)

                            ||

                            (note.content || "")
                                .toLowerCase()
                                .includes(searchTerm)
                        );
                    }
                );
        }


        if (filterValue !== "all") {

            filteredNotes =
                filteredNotes.filter(
                    function (note) {

                        return note.tag ===
                            filterValue;
                    }
                );
        }


        renderNotes(
            filteredNotes
        );

        updateEmptyState(
            filteredNotes
        );
    }


    // =========================================================
    // EMPTY STATE
    // =========================================================

    function updateEmptyState(
        notesToCheck = notes
    ) {

        if (
            notesToCheck.length === 0
        ) {

            emptyState.style.display =
                "block";

        } else {

            emptyState.style.display =
                "none";
        }
    }


    // =========================================================
    // EVENT LISTENERS
    // =========================================================

    addNoteBtn.addEventListener(
        "click",
        openAddNoteModal
    );


    closeModalBtn.addEventListener(
        "click",
        closeAddNoteModal
    );


    noteForm.addEventListener(
        "submit",
        handleNoteSubmit
    );


    searchInput.addEventListener(
        "input",
        filterNotes
    );


    filterSelect.addEventListener(
        "change",
        filterNotes
    );


    cancelDeleteBtn.addEventListener(
        "click",
        closeConfirmModal
    );


    confirmDeleteBtn.addEventListener(
        "click",
        confirmDeleteNote
    );

});
