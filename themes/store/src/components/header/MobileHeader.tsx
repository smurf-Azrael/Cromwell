import { getCmsSettings } from '@cromwell/core';
import { CContainer, CPlugin, Link } from '@cromwell/core-frontend';
import { AppBar, IconButton, Slide, SwipeableDrawer, Toolbar, useScrollTrigger } from '@material-ui/core';
import {
    Close as CloseIcon,
    Equalizer as EqualizerIcon,
    Favorite as FavoriteIcon,
    Menu as MenuIcon,
    ShoppingCart as ShoppingCartIcon,
    Visibility as VisibilityIcon,
} from '@material-ui/icons';
import React, { useState } from 'react';

import { appState } from '../../helpers/AppState';
import { HeaderSearch } from './HeaderSearch';
import styles from './MobileHeader.module.scss';

export const MobileHeader = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const cmsConfig = getCmsSettings();

    const handleCloseMenu = () => {
        setMenuOpen(false);
    }
    const handleOpenMenu = () => {
        setMenuOpen(true);
    }

    const handleOpenCart = () => {
        appState.isCartOpen = true;
    }

    return (
        <>
            <Toolbar className={styles.dummyToolbar} />
            <HideOnScroll>
                <AppBar
                    className={styles.appBar}
                    color="transparent"
                >
                    <Toolbar>
                        <div className={styles.appBarContent}>
                            <div className={styles.leftActions}>
                                <div className={styles.logo}>
                                    <Link href="/">
                                        <img className={styles.logo} src={cmsConfig?.logo} alt="logo" />
                                    </Link>
                                </div>

                            </div>
                            <div className={styles.rightActions}>
                                <IconButton onClick={handleOpenCart}>
                                    <FavoriteIcon />
                                </IconButton>
                                <IconButton onClick={handleOpenCart}>
                                    <ShoppingCartIcon />
                                </IconButton>
                                <IconButton onClick={handleOpenMenu}>
                                    <MenuIcon />
                                </IconButton>
                            </div>
                        </div>
                    </Toolbar>
                </AppBar>
            </HideOnScroll>
            <SwipeableDrawer
                open={menuOpen}
                onClose={handleCloseMenu}
                onOpen={handleOpenMenu}
            >
                <div className={styles.drawer}>
                    <div className={styles.menuActions}>
                        <IconButton onClick={handleOpenCart}>
                            <VisibilityIcon />
                        </IconButton>
                        <IconButton onClick={handleOpenCart}>
                            <EqualizerIcon />
                        </IconButton>
                        <IconButton onClick={handleOpenCart}>
                            <FavoriteIcon />
                        </IconButton>
                        <IconButton onClick={handleOpenCart}>
                            <ShoppingCartIcon />
                        </IconButton>
                        <IconButton onClick={handleCloseMenu}>
                            <CloseIcon />
                        </IconButton>
                    </div>
                    <div className={styles.mobileSearch}>
                        <HeaderSearch />
                    </div>
                    <CContainer id="mobile_header_13">
                        <CPlugin id="header_main_menu" />
                    </CContainer>
                </div>
            </SwipeableDrawer>
        </>
    );
}

function HideOnScroll(props: { children: React.ReactElement }) {
    const trigger = useScrollTrigger();

    return (
        <Slide appear={false} direction="down" in={!trigger}>
            {props.children}
        </Slide>
    );
}