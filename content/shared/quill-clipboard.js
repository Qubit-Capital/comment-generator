// Custom Quill Clipboard Module
class CustomClipboard extends Quill.import('modules/clipboard') {
    constructor(quill, options) {
        super(quill, options);
        this.quill = quill;
    }

    onPaste(e) {
        // Handle link preview data
        if (e.clipboardData?.getData('text/link-preview')) {
            const selection = this.quill.getSelection();
            if (!selection) return;

            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            this.quill.insertText(selection.index, text, 'user');
            return;
        }

        // For all other paste events, use default behavior
        super.onPaste(e);
    }
}

// Register module
Quill.register('modules/clipboard', CustomClipboard, true);
