![Logo](ext/icons/icon.svg)

# Tab Saver

<strong>There is a continuation of this addon <a href="https://github.com/Reeywhaar/tabsaver-2">TabSaver 2</a>. Check it out! First version of this addon is unlikely to be updated, it works though.</strong>

WebExtension to manage your tabs.
With this extension you can save tabs in current window and open them later.

[Install from addons.mozilla.org](https://addons.mozilla.org/en-US/firefox/addon/vyrtsev-tab-saver/)

### Caveats

Current state of Firefox WebExtension Api restricts opening of privileged urls (such as `file:///`, `chrome:`, `about:`, etc..) so placeholder page will be opened where you can copy link to clipboard and manually paste it into the location bar. Sad.

### Screenshots

![main](screenshots/main-assets/main.png)
![tabs](screenshots/main-assets/tabs.png)

## FAQ

#### When I click on `remove tab` button, nothing happens

Click and hold button. Such action made to prevent accidental remove. Other buttons with such behavior are `Undo`, `Replace TabSet`, `Remove TabSet`.

#### I don't need Window TabSets, can I hide them?

Yes. Such preference available in addon's preferences. Click on cog icon in the panel's bottom right corner, to access preferences.

#### What does `•` dot sumbol before tab's link means?

It means that tab is pinned.

#### What is `Unknown` label near tab's link.

It means that tab's container was removed

#### Can I open TabSaver in sidebar?

Yes, you can detach popup panel as well.

#### Can I have tab's title near tab's link?

Yes, available in preferences.

#### Can I have tab's favicon near tab's link?

Yes, available in preferences.

# How to build

First install dependencies: `npm install`.

Second compile js with webpack `npm run compile:prod`

Then, If you want to build artifact: `./node_modules/.bin/web-ext build -s ext`. _this will create zip archive in ./web-ext-artifacts_

And If you want to run extension in dev mode: `./node_modules/.bin/web-ext run -s ext`

# CHANGELOG

## `v.0.2.7`

- Revert to 0.2.4 version as there are some complications with recent versions

## `v.0.2.6`

- Technical release

## `v.0.2.5`

- Style improvements. Code cleanup
- Updated dependencies

## `v.0.2.4`

- Style improvements. Fixed controls interaction with text and scrollbars
- Size of the window is now saved
- Updated to Vue 3

## `v.0.2.3`

- Style improvements. Theme now obeys firefox's theme (dark, light)

## `v.0.2.2`

- Fixed active tab highlighting in Firefox versions >= 101
  https://bugzilla.mozilla.org/show_bug.cgi?id=1779926

## `v.0.2.1`

- Fixed tab opening in private mode. Thanks to [Crikxi](https://github.com/Reeywhaar/tabsaver/pull/29)

## `v.0.2.0`

- Updated icon
- Updated code dependencies

## `v.0.1.7`

- Updated dependencies

## `v.0.1.6`

- Updated dependencies

## `v.0.1.5`

- Option to open tab in same tab

## `v.0.1.4`

- Fixed import issue

## `v.0.1.3`

- Refine drag'n'drop
- Minor refactoring

## `v.0.1.2`

- Show border over element when dragging

## `v.0.1.1`

### Features

- Reload tab icon added (shift click to cache free reload, middle click to duplicate)
- Reload all window tabs icon added (shift click to cache free reload)

### Changes

- Undo button's text changed to icon
- Code fixes
- Controls hover behavior

## `v.0.1.0`

### Features

- Extension options page
- Ability to manage window's tabs
- Undo feature
- Detachable panel
- Sidebar panel
- Color may be assigned to TabSet
- Options to show tab's
  - tab's title
  - favicon
  - count
- Dark/light themes support

### Fixes

- Panel works in private window

## `v.0.0.1`

There were dragons...
