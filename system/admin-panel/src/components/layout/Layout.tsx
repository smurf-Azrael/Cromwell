import 'gridlex/src/gridlex.scss';
import 'react-toastify/dist/ReactToastify.css';
import 'reset-css';

import { createMuiTheme, ThemeProvider } from '@material-ui/core';
import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import { pageInfos } from '../../constants/PageInfos';
import Page404 from '../../pages/404page/404page';
import Header from '../header/Header';
import Page from '../page/Page';
import Sidebar from '../sidebar/Sidebar';
import classes from './Layout.module.scss';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#673ab7',
      light: '#8561c5',
      dark: '#482880',
    },
    secondary: {
      main: '#d500f9',
      light: '#dd33fa',
      dark: '#9500ae',
    }
  },
});


function Layout() {
  return (
    <ThemeProvider theme={theme}>
      <div className={classes.Layout}>
        <BrowserRouter>
          <div className={classes.header}>
            <Header />
          </div>
          <div className={classes.main}>
            <div className={classes.sidebar}>
              <Sidebar />
            </div>
            <div className={classes.content}>
              <Switch>
                {pageInfos.map(page => {
                  return (
                    <Route exact={!page.baseRoute} path={page.route} key={page.name} >
                      <Page component={page.component} />
                    </Route>
                  )
                })}
                <Route key={'404'} >
                  <Page404 />
                </Route>
              </Switch>
            </div>
          </div>
        </BrowserRouter>
        <ToastContainer />
      </div>
    </ThemeProvider>
  );
}

export default Layout;
