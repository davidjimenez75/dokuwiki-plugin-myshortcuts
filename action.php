<?php

use dokuwiki\Extension\ActionPlugin;
use dokuwiki\Extension\EventHandler;
use dokuwiki\Extension\Event;

/**
 * DokuWiki Plugin myshortcuts (Action Component)
 *
 * @license GPL 2 http://www.gnu.org/licenses/gpl-2.0.html
 * @author David Jiménez <davidjimenez75@gmail.com>
 */
class action_plugin_myshortcuts extends ActionPlugin
{
    /** @inheritDoc */
    public function register(EventHandler $controller)
    {
        $controller->register_hook('TPL_METAHEADER_OUTPUT', 'BEFORE', $this, 'handleMetaheaderOutput');
        $controller->register_hook('DOKUWIKI_STARTED', 'AFTER', $this, 'loadAssets');
    }

    /**
     * Load JavaScript and CSS files
     */
    public function loadAssets()
    {
        global $conf;

        // Add JavaScript file
        $JSINFO['plugins']['myshortcuts'] = true;
    }

    /**
     * Pass configuration to JavaScript
     *
     * @param Event $event Event object
     * @param mixed $param optional parameter passed when event was registered
     * @return void
     */
    public function handleMetaheaderOutput(Event $event, $param)
    {
        // Get plugin configuration
        $shortcutEdit = $this->getConf('shortcut_edit');
        $shortcutSave = $this->getConf('shortcut_save');
        $shortcutSnippet = $this->getConf('shortcut_snippet');

        // Build snippets array from individual configurations
        // Order: 1-9, then 0 (as per keyboard layout)
        $snippets = [];
        $snippetNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

        foreach ($snippetNumbers as $num) {
            $snippetText = $this->getConf('snippet_' . $num);
            if (!empty($snippetText)) {
                $snippets[] = [
                    'label' => $num,
                    'number' => $num,
                    'text' => $snippetText
                ];
            }
        }

        // Add CSS file
        $event->data['link'][] = [
            'type' => 'text/css',
            'rel' => 'stylesheet',
            'href' => DOKU_BASE . 'lib/plugins/myshortcuts/style.css'
        ];

        // Create JavaScript configuration object
        $script = '/* MyShortcuts Plugin Config */' . "\n";
        $script .= 'var MYSHORTCUTS_CONFIG = ' . json_encode([
            'shortcutEdit' => $shortcutEdit,
            'shortcutSave' => $shortcutSave,
            'shortcutSnippet' => $shortcutSnippet,
            'snippets' => $snippets
        ], JSON_PRETTY_PRINT) . ';';

        // Add inline script to page (must come before main script)
        $event->data['script'][] = [
            'type' => 'text/javascript',
            '_data' => $script,
        ];

        // Add main JavaScript file
        $event->data['script'][] = [
            'type' => 'text/javascript',
            'src' => DOKU_BASE . 'lib/plugins/myshortcuts/script.js',
        ];
    }
}
