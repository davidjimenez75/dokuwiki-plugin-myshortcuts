/**
 * DokuWiki Plugin myshortcuts (JavaScript Component)
 *
 * @license GPL 2 http://www.gnu.org/licenses/gpl-2.0.html
 * @author David Jiménez <davidjimenez75@gmail.com>
 */

var MyShortcutsPlugin = {

    /**
     * Language strings
     */
    lang: {
        en: {
            selectSnippet: 'Select a Snippet',
            noSnippets: 'No snippets configured. Please add snippets in the plugin settings.',
            snippetsEditOnly: 'Snippets can only be inserted in edit mode. Press {0} to edit first.',
            cancel: 'Cancel (ESC)',
            editorNotFound: 'Editor not found.',
            saveNotInEdit: 'MyShortcuts: Save button not found. Are you in edit mode?'
        },
        es: {
            selectSnippet: 'Seleccionar un Fragmento',
            noSnippets: 'No hay fragmentos configurados. Por favor añade fragmentos en la configuración del plugin.',
            snippetsEditOnly: 'Los fragmentos solo se pueden insertar en modo edición. Presiona {0} para editar primero.',
            cancel: 'Cancelar (ESC)',
            editorNotFound: 'Editor no encontrado.',
            saveNotInEdit: 'MyShortcuts: Botón de guardar no encontrado. ¿Estás en modo edición?'
        }
    },

    /**
     * Get current language
     */
    getLang: function() {
        // Try to detect DokuWiki language
        if (typeof JSINFO !== 'undefined' && JSINFO.lang) {
            return JSINFO.lang;
        }
        // Fallback to browser language
        var browserLang = navigator.language || navigator.userLanguage;
        return browserLang.split('-')[0];
    },

    /**
     * Get translated string
     */
    getString: function(key) {
        var currentLang = MyShortcutsPlugin.getLang();
        var strings = MyShortcutsPlugin.lang[currentLang] || MyShortcutsPlugin.lang.en;
        return strings[key] || MyShortcutsPlugin.lang.en[key] || key;
    },

    /**
     * Initialize the plugin
     */
    init: function() {
        // Check if config is available
        if (typeof MYSHORTCUTS_CONFIG === 'undefined') {
            return;
        }

        // Add keyboard event listener
        document.addEventListener('keydown', function(e) {
            MyShortcutsPlugin.handleKeyPress(e);
        });
    },

    /**
     * Parse keyboard shortcut string (e.g., "ctrl+e", "alt+s")
     */
    parseShortcut: function(shortcut) {
        if (!shortcut) return null;

        var parts = shortcut.toLowerCase().split('+');
        var result = {
            ctrl: false,
            alt: false,
            shift: false,
            meta: false,
            key: ''
        };

        parts.forEach(function(part) {
            part = part.trim();
            if (part === 'ctrl' || part === 'control') {
                result.ctrl = true;
            } else if (part === 'alt') {
                result.alt = true;
            } else if (part === 'shift') {
                result.shift = true;
            } else if (part === 'meta' || part === 'cmd') {
                result.meta = true;
            } else {
                result.key = part;
            }
        });

        return result;
    },

    /**
     * Check if pressed keys match a shortcut
     */
    matchesShortcut: function(event, shortcut) {
        var parsed = MyShortcutsPlugin.parseShortcut(shortcut);
        if (!parsed) return false;

        var key = event.key.toLowerCase();

        return (
            event.ctrlKey === parsed.ctrl &&
            event.altKey === parsed.alt &&
            event.shiftKey === parsed.shift &&
            event.metaKey === parsed.meta &&
            key === parsed.key
        );
    },

    /**
     * Handle keyboard shortcuts
     */
    handleKeyPress: function(e) {
        var config = MYSHORTCUTS_CONFIG;

        // Edit shortcut
        if (MyShortcutsPlugin.matchesShortcut(e, config.shortcutEdit)) {
            e.preventDefault();
            MyShortcutsPlugin.triggerEdit();
            return;
        }

        // Save shortcut
        if (MyShortcutsPlugin.matchesShortcut(e, config.shortcutSave)) {
            e.preventDefault();
            MyShortcutsPlugin.triggerSave();
            return;
        }

        // Snippet shortcut
        if (MyShortcutsPlugin.matchesShortcut(e, config.shortcutSnippet)) {
            e.preventDefault();
            MyShortcutsPlugin.showSnippetDialog();
            return;
        }
    },

    /**
     * Trigger edit action
     */
    triggerEdit: function() {
        // Look for edit button in DokuWiki
        var editBtn = document.querySelector('button[name="do"][value="edit"]') ||
                     document.querySelector('a.action.edit') ||
                     document.querySelector('a[href*="do=edit"]');

        if (editBtn) {
            editBtn.click();
        } else {
            // Construct edit URL manually
            var url = window.location.href;
            if (url.indexOf('?') > -1) {
                url += '&do=edit';
            } else {
                url += '?do=edit';
            }
            window.location.href = url;
        }
    },

    /**
     * Trigger save action
     */
    triggerSave: function() {
        // Only works in edit mode
        var saveBtn = document.querySelector('#edbtn__save') ||
                     document.getElementById('edbtn__save') ||
                     document.querySelector('button[name="do"][value="save"]');

        if (saveBtn) {
            saveBtn.click();
        } else {
            console.log(MyShortcutsPlugin.getString('saveNotInEdit'));
        }
    },

    /**
     * Show snippet selection dialog
     */
    showSnippetDialog: function() {
        var config = MYSHORTCUTS_CONFIG;

        if (!config.snippets || config.snippets.length === 0) {
            alert(MyShortcutsPlugin.getString('noSnippets'));
            return;
        }

        // Check if we're in edit mode
        var editor = document.getElementById('wiki__text');
        if (!editor) {
            var msg = MyShortcutsPlugin.getString('snippetsEditOnly').replace('{0}', config.shortcutEdit);
            alert(msg);
            return;
        }

        // Remove any existing dialogs first
        var existingOverlays = document.querySelectorAll('.myshortcuts-overlay');
        existingOverlays.forEach(function(overlay) {
            overlay.parentNode.removeChild(overlay);
        });

        // Create dialog
        var dialog = MyShortcutsPlugin.createSnippetDialog(config.snippets);
        document.body.appendChild(dialog);

        // Focus first item
        var firstItem = dialog.querySelector('.myshortcuts-snippet-item');
        if (firstItem) {
            firstItem.focus();
        }
    },

    /**
     * Create snippet selection dialog
     */
    createSnippetDialog: function(snippets) {
        var overlay = document.createElement('div');
        overlay.className = 'myshortcuts-overlay';

        // Store snippets map for keyboard access
        overlay._snippetsMap = {};

        var dialog = document.createElement('div');
        dialog.className = 'myshortcuts-dialog';

        var header = document.createElement('h3');
        header.textContent = MyShortcutsPlugin.getString('selectSnippet');
        dialog.appendChild(header);

        var list = document.createElement('div');
        list.className = 'myshortcuts-snippet-list';

        snippets.forEach(function(snippet, index) {
            var item = document.createElement('button');
            item.className = 'myshortcuts-snippet-item';
            item.setAttribute('tabindex', '0');
            item.setAttribute('data-index', index);
            item.setAttribute('data-number', snippet.number || snippet.label);

            // Store snippet in map for keyboard access
            overlay._snippetsMap[snippet.number || snippet.label] = snippet.text;

            var keyIndicator = document.createElement('span');
            keyIndicator.className = 'myshortcuts-key-indicator';
            keyIndicator.textContent = snippet.number || snippet.label;
            item.appendChild(keyIndicator);

            var content = document.createElement('div');
            content.className = 'myshortcuts-snippet-content';

            var text = document.createElement('div');
            text.className = 'myshortcuts-snippet-preview';
            text.textContent = snippet.text.substring(0, 80) + (snippet.text.length > 80 ? '...' : '');
            content.appendChild(text);

            item.appendChild(content);

            item.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                MyShortcutsPlugin.insertSnippet(snippet.text);
                MyShortcutsPlugin.closeDialog(overlay);
            });

            list.appendChild(item);
        });

        dialog.appendChild(list);

        var closeBtn = document.createElement('button');
        closeBtn.className = 'myshortcuts-close-btn';
        closeBtn.textContent = MyShortcutsPlugin.getString('cancel');
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            MyShortcutsPlugin.closeDialog(overlay);
        });
        dialog.appendChild(closeBtn);

        overlay.appendChild(dialog);

        // Handle keyboard shortcuts
        overlay.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                e.preventDefault();
                MyShortcutsPlugin.closeDialog(overlay);
                return;
            }

            // Handle number keys (1-9, 0)
            var key = e.key;
            if (/^[0-9]$/.test(key)) {
                e.preventDefault();
                var snippetText = overlay._snippetsMap[key];
                if (snippetText) {
                    MyShortcutsPlugin.insertSnippet(snippetText);
                    MyShortcutsPlugin.closeDialog(overlay);
                }
            }
        });

        // Close on overlay click
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                MyShortcutsPlugin.closeDialog(overlay);
            }
        });

        return overlay;
    },

    /**
     * Close dialog
     */
    closeDialog: function(overlay) {
        // Remove all overlays as a safety measure
        var allOverlays = document.querySelectorAll('.myshortcuts-overlay');
        allOverlays.forEach(function(o) {
            if (o.parentNode) {
                o.parentNode.removeChild(o);
            }
        });
    },

    /**
     * Insert snippet into editor
     */
    insertSnippet: function(text) {
        var editor = document.getElementById('wiki__text');
        if (!editor) {
            alert(MyShortcutsPlugin.getString('editorNotFound'));
            return;
        }

        // Get cursor position
        var startPos = editor.selectionStart;
        var endPos = editor.selectionEnd;

        // Insert text at cursor position
        var beforeText = editor.value.substring(0, startPos);
        var afterText = editor.value.substring(endPos, editor.value.length);
        editor.value = beforeText + text + afterText;

        // Set cursor position after inserted text
        var newPos = startPos + text.length;
        editor.selectionStart = newPos;
        editor.selectionEnd = newPos;

        // Focus editor
        editor.focus();
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        MyShortcutsPlugin.init();
    });
} else {
    MyShortcutsPlugin.init();
}
