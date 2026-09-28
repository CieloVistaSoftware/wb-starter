// NotesModal Component Module
// Encapsulates all logic for the notes modal

import { ensureBehaviorCss } from './style-loader.js';
import { setRule } from './dynamic-style.js';

export class NotesModal {
  constructor() {
    // Its stylesheet: nothing else loads notes-modal.css (#779).
    ensureBehaviorCss('notes-modal');
    // Inject modal markup if not present
    if (!document.getElementById('notesModal')) {
      // #779: every element here was styled by a style="" attribute; the
      // rules are notes-modal.css now, keyed on these classes. The ids and
      // the original classes stay -- code below (and x-notes' own CSS) find
      // elements by them.
      const modalHtml = `
        <div id="notesModal" class="x-notes__modal x-notes-modal" tabindex="-1">
          <button id="closeNotesModal" class="x-notes-modal__close">Close</button>
          <div class="x-notes__resize-handle-modal x-notes-modal__resize"></div>
          <h2 class="x-notes-modal__title">Notes</h2>
          <form id="addNoteForm" class="x-notes-modal__form">
            <textarea id="newNoteInput" class="x-notes-modal__input" placeholder="Add a note..."></textarea>
            <button type="submit" class="x-notes-modal__btn x-notes-modal__btn--add">Add</button>
            <button type="button" id="readIssuesBtn" class="x-notes-modal__btn x-notes-modal__btn--read">Read</button>
          </form>
          <div id="notesList"></div>
          <div id="issuesModal" class="x-notes-modal__issues">
            <div class="x-notes-modal__issues-panel">
              <h3 class="x-notes-modal__issues-title">Top 10 Issues</h3>
              <button id="closeIssuesModal" class="x-notes-modal__issues-close">Close</button>
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
    this.resizeHandle = document.querySelector('.x-notes__resize-handle-modal');
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
      this.notesModal.classList.add('x-notes-modal--open');
      this.notesModal.focus && this.notesModal.focus();
    }
  }

  hide() {
    if (this.notesModal) {
      this.notesModal.classList.remove('x-notes-modal--open');
    }
  }

  saveNotes() {
    localStorage.setItem('modalNotes', JSON.stringify(this.notes));
  }

  renderNotes() {
    this.notesList.innerHTML = '';
    this.notes.forEach((note, i) => {
      const noteDiv = document.createElement('div');
      noteDiv.className = 'x-notes-modal__note';
      if (this.editingIndex === i) {
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.value = note;
        editInput.className = 'x-notes-modal__edit';
        noteDiv.appendChild(editInput);
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Save';
        saveBtn.className = 'x-notes-modal__action x-notes-modal__action--save';
        saveBtn.onclick = () => {
          this.notes[i] = editInput.value;
          this.editingIndex = null;
          this.saveNotes();
          this.renderNotes();
        };
        noteDiv.appendChild(saveBtn);
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'x-notes-modal__action x-notes-modal__action--cancel';
        cancelBtn.onclick = () => {
          this.editingIndex = null;
          this.renderNotes();
        };
        noteDiv.appendChild(cancelBtn);
      } else {
        const noteText = document.createElement('span');
        noteText.textContent = note;
        noteText.className = 'x-notes-modal__note-text';
        noteDiv.appendChild(noteText);
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'x-notes-modal__action x-notes-modal__action--edit';
        editBtn.onclick = () => {
          this.editingIndex = i;
          this.renderNotes();
        };
        noteDiv.appendChild(editBtn);
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'x-notes-modal__action x-notes-modal__action--delete';
        deleteBtn.onclick = () => {
          this.notes.splice(i, 1);
          this.saveNotes();
          this.renderNotes();
        };
        noteDiv.appendChild(deleteBtn);
        const appendBtn = document.createElement('button');
        appendBtn.textContent = 'Append';
        appendBtn.className = 'x-notes-modal__action x-notes-modal__action--append';
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
            issuesTableContainer.innerHTML = '<div class="x-notes-modal__issues-msg">No issues found in the log.</div>';
          } else {
            let table = '<table class="x-notes-modal__table">';
            table += '<thead><tr><th>#</th><th>Level</th><th>Message</th><th>Error</th><th>URL</th></tr></thead>';
            table += '<tbody>';
            errors.forEach((e, i) => {
              table += `<tr>
                <td>${i+1}</td>
                <td>${e.level||''}</td>
                <td>${e.message||''}</td>
                <td>${e.data && e.data.error ? e.data.error : ''}</td>
                <td>${e.url||''}</td>
              </tr>`;
            });
            table += '</tbody></table>';
            issuesTableContainer.innerHTML = table;
          }
          issuesModal.classList.add('x-notes-modal__issues--open');
        } catch (err) {
          issuesTableContainer.innerHTML = '<div class="x-notes-modal__issues-msg x-notes-modal__issues-msg--error">Failed to read issues: ' + err.message + '</div>';
          issuesModal.classList.add('x-notes-modal__issues--open');
        }
      };
      closeIssuesModal.onclick = () => {
        issuesModal.classList.remove('x-notes-modal__issues--open');
      };
      // Allow clicking outside the modal to close
      issuesModal.addEventListener('click', (e) => {
        if (e.target === issuesModal) issuesModal.classList.remove('x-notes-modal__issues--open');
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
        document.body.classList.add('x-notes-modal-resizing');
        e.preventDefault();
      });
      document.addEventListener('mousemove', (e) => {
        if (!this.isResizing) return;
        let newWidth = Math.max(300, Math.min(window.innerWidth * 0.66, this.startWidth + (e.clientX - this.startX)));
        let newHeight = Math.max(200, this.startHeight + (e.clientY - this.startY));
        // A dragged size: a generated rule, not the style attribute (#779).
        setRule(this.notesModal, 'size', { width: newWidth + 'px', height: newHeight + 'px' });
      });
      document.addEventListener('mouseup', () => {
        if (this.isResizing) {
          this.isResizing = false;
          document.body.classList.remove('x-notes-modal-resizing');
        }
      });
    }
  }
}

// Helper to initialize globally
window.NotesModalInstance = new NotesModal();
window.showNotesModal = () => window.NotesModalInstance.show();
window.hideNotesModal = () => window.NotesModalInstance.hide();
