/**
 * @author NetFeez <netfeez.dev@gmail.com>.
 * @description Vizui is a module to create web applications SPA with js/ts.
 * @license Apache-2.0
 */

export { default, App } from './core/App.js';
export { Config } from './core/Config.js';

/**
 * The events and event emitter classes.
 * This classes are provided by @netfeez/common.
 * Depflow gets the files directly from the repository.
 * TThis is a temporary solution until the package is published to npm
 * and we make a method to auto-sync the files.
 * We are this to help with the development and deployment of VizUI.
 * We need an importmap o rewrite the imports to point to the local files.
 * We do not make VizUI depend of an external compilation, probably we make Depflow as a builder for this project.
 */
export { Events, EventsEmitter } from './events/index.js';

export { DomObserver } from './core/element/DomObserver.js';
export { Element } from './core/element/Element.js';
export { Node } from './core/element/Node.js';

export { Component } from './core/component/Component.js';
export { Layout } from './core/component/Layout.js';
export { View } from './core/component/View.js';

export { Context } from './state/Context.js';
export { Store } from './state/Store.js';
export { CSS as Css } from './utilities/CSS.js';

export { symbols } from './core/symbols.js';
export { Router, Guard, History } from './core/router/index.js';
export { HttpClient, Request, Response, Body } from './network/http-client/HttpClient.js';
export { NetworkError } from './network/http-client/NetworkError.js';
export { Socket } from './network/Socket.js';

export { Utilities } from './Utilities.js';
