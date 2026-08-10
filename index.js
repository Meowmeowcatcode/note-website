```javascript
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

    // Notes are now stored in Supabase instead of localStorage
    let notes = [];
    let noteToDeleteId = null;

    // -----------------------------
    // LOAD NOTES WHEN PAGE OPENS
    // -----------------------------

    await loadNotes();

    // -----------------------------
    // EVENT LISTENERS
    // -----------------------------

    addNoteBtn.addEventListener("click", openAddNoteModal);
    closeModalBtn.addEventListener("click", closeAddNoteModal);
    noteForm.addEventListener("submit", handleNoteSubmit);
    searchInput.addEventListener("input", filterNotes);
    filterSelect.addEventListener("change", filterNotes);
    cancelDeleteBtn.addEventListener("click", closeConfirmModal);
    confirmDeleteBtn.addEventListener("click", confirmDeleteNote);

    // -----------------------------
    // LOAD NOTES FROM SUPABASE
    // -----------------------------

    async function loadNotes() {
        try {
            const {
                data: { user },
                error: userError
            } = await supabase.auth.getUser();

            if (userError) {
                console.error("Authentication error:", userError);
                return;
            }

            if (!user) {
                console.log("No user is logged in.");

                notesContainer.innerHTML = "";
                emptyState.style.display = "block";

                return;
            }

            const { data, error } = await supabase
                .from("notes")
                .select("*")
                .order("created_at", {
                    ascending: false
                });

            if (error) {
                console.error("Error loading notes:", error);
                alert("Could not load your notes.");
                return;
            }

            notes = data || [];

            renderNotes();
            updateEmptyState();

        } catch (error) {
            console.error("Unexpected error:", error);
        }
    }

    // -----------------------------
    // DISPLAY NOTES
    // -----------------------------

    function renderNotes(notesToRender = notes) {
        notesContainer.innerHTML = "";

        notesToRender.forEach((note) => {
            const noteElement = document.createElement("div");

            noteElement.className = "note-card fade-in";

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

        // Add delete button listeners
        document.querySelectorAll(".delete-btn").forEach((btn) => {
            btn.addEventListener("click", function () {
                noteToDeleteId = this.getAttribute("data-id");
                openConfirmModal();
            });
        });
    }

    // -----------------------------
    // SECURITY
    // Prevent note HTML from being injected
    // -----------------------------

    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text || "";
        return div.innerHTML;
    }

    // -----------------------------
    // TAG FUNCTIONS
    // -----------------------------

    function getTagClass(tag) {
        const classes = {
            work: "tag-work",
            personal: "tag-personal",
            ideas: "tag-ideas",
            reminders: "tag-reminders",
        };

        return classes[tag] || "";
    }

    function getTagIcon(tag) {
        const icons = {
            work: '<i class="fas fa-briefcase"></i>',
            personal: '<i class="fas fa-user"></i>',
            ideas: '<i class="fas fa-lightbulb"></i>',
            reminders: '<i class="fas fa-bell"></i>',
        };

        return icons[tag] || "";
    }

    function getTagName(tag) {
        const names = {
            work: "Work",
            personal: "Personal",
            ideas: "Ideas",
            reminders: "Reminders",
        };

        return names[tag] || tag;
    }

    // -----------------------------
    // DATE
    // -----------------------------

    function formatDate(dateString) {
        if (!dateString) return "";

        const date = new Date(dateString);

        return date.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    // -----------------------------
    // ADD NOTE MODAL
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

    // -----------------------------
    // DELETE MODAL
    // -----------------------------

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
    // SAVE NEW NOTE
    // -----------------------------

    async function handleNoteSubmit(e) {
        e.preventDefault();

        const {
            data: { user },
            error: userError
        } = await supabase.auth.getUser();

        if (userError || !user) {
            alert("Please log in before saving a note.");
            return;
        }

        const title = document.getElementById("noteTitle").value.trim();
        const content = document.getElementById("noteContent").value.trim();

        const selectedTag = document.querySelector(
            'input[name="noteTag"]:checked'
        );

        const tag = selectedTag ? selectedTag.value : "ideas";

        if (!title || !content) {
            return;
        }

        const { data, error } = await supabase
            .from("notes")
            .insert({
                user_id: user.id,
                title: title,
                content: content,
                tag: tag
            })
            .select()
            .single();

        if (error) {
            console.error("Error saving note:", error);
            alert("Could not save your note.");
            return;
        }

        // Add new note to the beginning
        notes.unshift(data);

        renderNotes();
        updateEmptyState();

        closeAddNoteModal();
        filterNotes();
    }

    // -----------------------------
    // DELETE NOTE
    // -----------------------------

    async function confirmDeleteNote() {
        if (!noteToDeleteId) {
            return;
        }

        const { error } = await supabase
            .from("notes")
            .delete()
            .eq("id", noteToDeleteId);

        if (error) {
            console.error("Error deleting note:", error);
            alert("Could not delete the note.");
            return;
        }

        // Remove it from the local array
        notes = notes.filter(
            (note) => note.id !== noteToDeleteId
        );

        renderNotes();
        updateEmptyState();
        filterNotes();
        closeConfirmModal();
    }

    // -----------------------------
    // SEARCH + FILTER
    // -----------------------------

    function filterNotes() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const filterValue = filterSelect.value;

        let filteredNotes = [...notes];

        if (searchTerm) {
            filteredNotes = filteredNotes.filter(
                (note) =>
                    (note.title || "")
                        .toLowerCase()
                        .includes(searchTerm) ||

                    (note.content || "")
                        .toLowerCase()
                        .includes(searchTerm)
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
    // EMPTY STATE
    // -----------------------------

    function updateEmptyState(notesToCheck = notes) {
        if (notesToCheck.length === 0) {
            emptyState.style.display = "block";
        } else {
            emptyState.style.display = "none";
        }
    }
});
```
