export class NotesModal {
    notesModal: HTMLElement;
    closeNotesModal: HTMLElement;
    resizeHandle: Element;
    addNoteForm: HTMLElement;
    newNoteInput: HTMLElement;
    notesList: HTMLElement;
    isResizing: boolean;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    notes: any;
    editingIndex: any;
    show(): void;
    hide(): void;
    saveNotes(): void;
    renderNotes(): void;
    init(): void;
}
//# sourceMappingURL=notes-modal.d.ts.map