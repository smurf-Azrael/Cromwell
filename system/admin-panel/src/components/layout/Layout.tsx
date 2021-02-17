import 'react-toastify/dist/ReactToastify.css';

import { createMuiTheme, ThemeProvider } from '@material-ui/core';
import React, { Suspense } from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import PageErrorBoundary from '../errorBoundaries/PageErrorBoundary';
import LoadBox from '../loadBox/LoadBox';
import { pageInfos } from '../../constants/PageInfos';
import Page404 from '../../pages/404page/404page';
import Sidebar from '../sidebar/Sidebar';
import classes from './Layout.module.scss';
import FileManager from '../fileManager/FileManager';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#673ab7',
      light: '#8561c5',
      dark: '#482880',
    },
    secondary: {
      main: '#910081',
      light: '#910081',
      dark: '#910081',
    }
  },
});


function Layout() {
  return (
    <ThemeProvider theme={theme}>
      <div className={classes.Layout}>
        <BrowserRouter>
          <div className={classes.sidebar}>
            <Sidebar />
          </div>
          <div className={classes.main}>
            <Switch>
              {pageInfos.map(page => {
                return (
                  <Route exact={!page.baseRoute} path={page.route} key={page.name} >
                    <PageErrorBoundary>
                      <Suspense fallback={<LoadBox />}>
                        <page.component />
                      </Suspense>
                    </PageErrorBoundary>
                  </Route>
                )
              })}
              <Route key={'404'} >
                <Page404 />
              </Route>
            </Switch>
            <div style={{ fontSize: '8px' }}>Icons made by <a href="http://www.freepik.com/" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon"> www.flaticon.com</a></div>
          </div>
        </BrowserRouter>
        <ToastContainer />
        <FileManager />
      </div>
    </ThemeProvider>
  );
}

export default Layout;
