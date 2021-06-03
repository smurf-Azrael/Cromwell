import './helpers/importDependecies';

import { onStoreChange, setStoreItem } from '@cromwell/core';
import { getGraphQLClient, getRestAPIClient, TErrorInfo } from '@cromwell/core-frontend';
import { getModuleImporter } from '@cromwell/utils/build/importer.js';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux-ts';

import Layout from './components/layout/Layout';
import { toast } from './components/toast/toast';
import { loginPageInfo, welcomePageInfo } from './constants/PageInfos';
import { loadPlugins } from './helpers/loadPlugins';
import { store } from './redux/store';

const importer = getModuleImporter();

(async () => {

    try {
        const meta = await (await fetch('/admin/build/meta.json')).json();
        await importer.importSciptExternals(meta);
    } catch (e) {
        console.error(e);
    }

    let isInstalled = true;
    const restClient = getRestAPIClient();
    const graphClient = getGraphQLClient();

    const request = async <T>(req: Promise<T>): Promise<T> => {
        try {
            return await req;
        } catch (e) {
            console.error(e);
        }
    }
    const [
        settings,
        userInfo,
        themeConfig
    ] = await Promise.all([
        request(restClient?.getCmsSettingsAndSave({ disableLog: true })),
        request(restClient?.getUserInfo({ disableLog: true })),
        request(restClient?.getThemeConfig({ disableLog: true })),
    ]);

    // Redirect to /setup page if not installed
    if (settings && !settings.installed) {
        isInstalled = false;
        if (!window.location.hash.includes(welcomePageInfo.route)) {
            window.location.href = '/admin/#' + welcomePageInfo.route;
            // window.location.reload();
        }
    }

    const onUnauthorized = async () => {
        let userInfo;
        restClient?.setOnUnauthorized(null);
        graphClient?.setOnUnauthorized(null);
        try {
            userInfo = await restClient?.getUserInfo({ disableLog: true });
        } catch (e) {
            console.error(e);
        }
        restClient?.setOnUnauthorized(onUnauthorized);
        graphClient?.setOnUnauthorized(onUnauthorized);
        if (!userInfo?.id) {
            if (!window.location.hash.includes(loginPageInfo.route)) {
                window.location.href = '/admin/#' + loginPageInfo.route;
                // window.location.reload();
            }
        }
    }

    restClient?.setOnUnauthorized(onUnauthorized);
    graphClient?.setOnUnauthorized(onUnauthorized);


    const onRestApiError = (info: TErrorInfo) => {
        if (info?.statusCode === 429) {
            toast.error('Too many requests. Try again later');
        } else {
            if (info?.message && !info?.disableLog)
                toast.error(info.message);
        }
    }

    restClient?.onError(onRestApiError, 'app');


    const onGraphQlError = (message) => {
        if (message)
            toast.error(message);
    }
    graphClient?.onError(onGraphQlError, 'app');


    if (isInstalled) {
        if (window.location.hash.includes(welcomePageInfo.route)) {
            window.location.href = '/admin/#' + loginPageInfo.route;
        }

        // Redirect to /login page if not authorized
        if (!userInfo) {
            if (!window.location.hash.includes(loginPageInfo.route)) {
                window.location.href = '/admin/#' + loginPageInfo.route;
                // window.location.reload();
            }
        }
        setStoreItem('userInfo', userInfo);
    }

    if (themeConfig) {
        store.setStateProp({
            prop: 'activeTheme',
            payload: themeConfig,
        })
    }

    if (userInfo?.role) {
        setTimeout(() => loadPlugins({ onlyNew: true }), 50);
    } else {
        onStoreChange('userInfo', (info) => {
            if (info?.role) {
                setTimeout(() => loadPlugins({ onlyNew: true }), 50);
            }
        });
    }

    ReactDOM.render(
        React.createElement(
            Provider, { store, },
            React.createElement(Layout)
        ),
        document.getElementById('root')
    );
})();




