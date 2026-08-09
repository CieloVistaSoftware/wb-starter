// NotesModal Component Module
// Encapsulates all logic for the notes modal

export class NotesModal {
  constructor() {
    // Inject modal markup if not present
    if (!document.getElementById('notesModal')) {
      const modalHtml = `
        <div id="notesModal" class="wb-notes__modal" tabindex="-1" style="display:none;position:fixed;top:10%;left:50%;transform:translateX(-50%);background:#222;color:#fff;z-index:10000;padding:2rem;border-radius:12px;min-width:340px;max-width:90vw;box-shadow:0 8px 32px #000a;">
          <button id="closeNotesModal" style="position:absolute;top:1rem;right:1rem;background:#ef4444;color:#fff;border:none;border-radius:4px;padding:0.5rem 1rem;cursor:pointer;font-size:1rem;">Close</button>
          <div class="wb-notes__resize-handle-modal" style="position:absolute;bottom:0;right:0;width:24px;height:24px;cursor:nwse-resize;"></div>
          <h2 style="margin-top:0;margin-bottom:1rem;">Notes</h2>
          <form id="addNoteForm" style="display:flex;gap:0.5rem;margin-bottom:1rem;align-items:flex-start;">
            <textarea id="newNoteInput" placeholder="Add a note..." style="flex:1;padding:0.75rem;border-radius:4px;border:none;background:#333;color:#fff;min-height:72px;resize:vertical;font-family:inherit;font-size:1rem;"></textarea>
            <button type="submit" style="background:#6366f1;color:#fff;border:none;border-radius:4px;padding:0.5rem 1rem;cursor:pointer;height:2.5rem;align-self:flex-start;">Add</button>
            <button type="button" id="readIssuesBtn" style="background:#10b981;color:#fff;border:none;border-radius:4px;padding:0.5rem 1rem;cursor:pointer;margin-left:0.5rem;height:2.5rem;align-self:flex-start;">Read</button>
          </form>
          <div id="notesList"></div>
          <div id="issuesModal" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.7);z-index:11000;align-items:center;justify-content:center;">
            <div style="background:#222;color:#fff;padding:2rem;border-radius:12px;max-width:90vw;max-height:80vh;overflow:auto;box-shadow:0 8px 32px #000a;position:relative;">
              <h3 style="margin-top:0;">Top 10 Issues</h3>
              <button id="closeIssuesModal" style="position:absolute;top:1.5rem;right:2.5rem;background:#ef4444;color:#fff;border:none;border-radius:4px;padding:0.3rem 0.8rem;cursor:pointer;">Close</button>
              <div id="issuesTableContainer"></div>
            </div>
          </div>
        </div>
      `;
      const container = document.createElement('div');
      container.innerHTML = modalHtml;
      document.body.appendChild(container.firstElementChild);
    }
    this.notesModal = document.getElementById('notesModal');
    this.closeNotesModal = document.getElementById('closeNotesModal');
    this.resizeHandle = document.querySelector('.wb-notes__resize-handle-modal');
    this.addNoteForm = document.getElementById('addNoteForm');
    this.newNoteInput = document.getElementById('newNoteInput');
    this.notesList = document.getElementById('notesList');
    this.isResizing = false;
    this.startX = 0;
    this.startY = 0;
    this.startWidth = 0;
    this.startHeight = 0;
    this.notes = JSON.parse(localStorage.getItem('modalNotes') || '[]');
    this.editingIndex = null;
    this.init();
  }

  show() {
    if (this.notesModal) {
      this.notesModal.style.display = 'block';
      this.notesModal.focus && this.notesModal.focus();
    }
  }

  hide() {
    if (this.notesModal) {
      this.notesModal.style.display = 'none';
    }
  }

  saveNotes() {
    localStorage.setItem('modalNotes', JSON.stringify(this.notes));
  }

  renderNotes() {
    this.notesList.innerHTML = '';
    this.notes.forEach((note, i) => {
      const noteDiv = document.createElement('div');
      noteDiv.style.background = '#333';
      noteDiv.style.color = '#fff';
      noteDiv.style.borderRadius = '6px';
      noteDiv.style.padding = '0.75rem';
      noteDiv.style.marginBottom = '1rem';
      noteDiv.style.display = 'flex';
      noteDiv.style.alignItems = 'center';
      noteDiv.style.gap = '0.5rem';
      if (this.editingIndex === i) {
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.value = note;
        editInput.style.flex = '1';
        editInput.style.padding = '0.5rem';
        editInput.style.borderRadius = '4px';
        editInput.style.border = 'none';
        editInput.style.background = '#222';
        editInput.style.color = '#fff';
        noteDiv.appendChild(editInput);
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.style.background = '#10b981';
        saveBtn.style.color = '#fff';
        saveBtn.style.border = 'none';
        saveBtn.style.borderRadius = '4px';
        saveBtn.style.padding = '0.3rem 0.7rem';
        saveBtn.style.cursor = 'pointer';
        saveBtn.onclick = () => {
          this.notes[i] = editInput.value;
          this.editingIndex = null;
          this.saveNotes();
          this.renderNotes();
        };
        noteDiv.appendChild(saveBtn);
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.background = '#ef4444';
        cancelBtn.style.color = '#fff';
        cancelBtn.style.border = 'none';
        cancelBtn.style.borderRadius = '4px';
        cancelBtn.style.padding = '0.3rem 0.7rem';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.onclick = () => {
          this.editingIndex = null;
          this.renderNotes();
        };
        noteDiv.appendChild(cancelBtn);
      } else {
        const noteText = document.createElement('span');
        noteText.textContent = note;
        noteText.style.flex = '1';
        noteDiv.appendChild(noteText);
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.style.background = '#6366f1';
        editBtn.style.color = '#fff';
        editBtn.style.border = 'none';
        editBtn.style.borderRadius = '4px';
        editBtn.style.padding = '0.3rem 0.7rem';
        editBtn.style.cursor = 'pointer';
        editBtn.onclick = () => {
          this.editingIndex = i;
          this.renderNotes();
        };
        noteDiv.appendChild(editBtn);
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.style.background = '#ef4444';
        deleteBtn.style.color = '#fff';
        deleteBtn.style.border = 'none';
        deleteBtn.style.borderRadius = '4px';
        deleteBtn.style.padding = '0.3rem 0.7rem';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.onclick = () => {
          this.notes.splice(i, 1);
          this.saveNotes();
          this.renderNotes();
        };
        noteDiv.appendChild(deleteBtn);
        const appendBtn = document.createElement('button');
        appendBtn.textContent = 'Append';
        appendBtn.style.background = '#f59e42';
        appendBtn.style.color = '#fff';
        appendBtn.style.border = 'none';
        appendBtn.style.borderRadius = '4px';
        appendBtn.style.padding = '0.3rem 0.7rem';
        appendBtn.style.cursor = 'pointer';
        appendBtn.onclick = () => {
          this.editingIndex = null;
          this.newNoteInput.value = '';
          this.newNoteInput.focus();
        };
        noteDiv.appendChild(appendBtn);
      }
      this.notesList.appendChild(noteDiv);
    });
  }

  init() {
    if (this.closeNotesModal) {
      this.closeNotesModal.onclick = () => this.hide();
    }
    if (this.addNoteForm) {
      this.addNoteForm.onsubmit = (e) => {
        e.preventDefault();
        const val = this.newNoteInput.value.trim();
        if (!val) return;
        // Always add as new note, never edit/append
        this.notes.unshift(val);
        this.newNoteInput.value = '';
        this.editingIndex = null;
        this.saveNotes();
        this.renderNotes();
      };
    }
      // Add event for Read button
    const readBtn = document.getElementById('readIssuesBtn');
    const issuesModal = document.getElementById('issuesModal');
    const closeIssuesModal = document.getElementById('closeIssuesModal');
    const issuesTableContainer = document.getElementById('issuesTableContainer');
    if (readBtn && issuesModal && closeIssuesModal && issuesTableContainer) {
      readBtn.onclick = async () => {
        try {
          const resp = await fetch('data/errors.json');
          if (!resp.ok) throw new Error('Could not load errors.json');
          const data = await resp.json();
          const errors = (data.errors || []).slice(0, 10);
          if (!errors.length) {
            issuesTableContainer.innerHTML = '<div style="padding:1rem;">No issues found in the log.</div>';
          } else {
            let table = '<table style="border-collapse:collapse;width:100%;font-size:0.98rem;">';
            table += '<thead><tr style="background:#333;"><th style="padding:0.5rem 0.7rem;border-bottom:1px solid #444;">#</th><th style="padding:0.5rem 0.7rem;border-bottom:1px solid #444;">Level</th><th style="padding:0.5rem 0.7rem;border-bottom:1px solid #444;">Message</th><th style="padding:0.5rem 0.7rem;border-bottom:1px solid #444;">Error</th><th style="padding:0.5rem 0.7rem;border-bottom:1px solid #444;">URL</th></tr></thead>';
            table += '<tbody>';
            errors.forEach((e, i) => {
              table += `<tr style="background:${i%2===0?'#282828':'#232323'};">
                <td style="padding:0.5rem 0.7rem;text-align:center;">${i+1}</td>
                <td style="padding:0.5rem 0.7rem;">${e.level||''}</td>
                <td style="padding:0.5rem 0.7rem;">${e.message||''}</td>
                <td style="padding:0.5rem 0.7rem;">${e.data && e.data.error ? e.data.error : ''}</td>
                <td style="padding:0.5rem 0.7rem;word-break:break-all;">${e.url||''}</td>
              </tr>`;
            });
            table += '</tbody></table>';
            issuesTableContainer.innerHTML = table;
          }
          issuesModal.style.display = 'flex';
        } catch (err) {
          issuesTableContainer.innerHTML = '<div style="padding:1rem;color:#ef4444;">Failed to read issues: ' + err.message + '</div>';
          issuesModal.style.display = 'flex';
        }
      };
      closeIssuesModal.onclick = () => {
        issuesModal.style.display = 'none';
      };
      // Allow clicking outside the modal to close
      issuesModal.addEventListener('click', (e) => {
        if (e.target === issuesModal) issuesModal.style.display = 'none';
      });
    }
    this.renderNotes();
    // Resize logic
    if (this.resizeHandle) {
      this.resizeHandle.addEventListener('mousedown', (e) => {
        this.isResizing = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.startWidth = this.notesModal.offsetWidth;
        this.startHeight = this.notesModal.offsetHeight;
        document.body.style.cursor = 'nwse-resize';
        e.preventDefault();
      });
      document.addEventListener('mousemove', (e) => {
        if (!this.isResizing) return;
        let newWidth = Math.max(300, Math.min(window.innerWidth * 0.66, this.startWidth + (e.clientX - this.startX)));
        let newHeight = Math.max(200, this.startHeight + (e.clientY - this.startY));
        this.notesModal.style.width = newWidth + 'px';
        this.notesModal.style.height = newHeight + 'px';
      });
      document.addEventListener('mouseup', () => {
        if (this.isResizing) {
          this.isResizing = false;
          document.body.style.cursor = '';
        }
      });
    }
  }
}

// Helper to initialize globally
window.NotesModalInstance = new NotesModal();
window.showNotesModal = () => window.NotesModalInstance.show();
window.hideNotesModal = () => window.NotesModalInstance.hide();
