import React from 'react';
import styles from './Header.module.scss';
import commonStyles from '../../styles/common.module.scss';
import { Button, Card, IconButton, Tooltip } from '@material-ui/core';
import {
    AddCircleOutline as AddCircleOutlineIcon,
    Delete as DeleteIcon,
    LibraryAdd as LibraryAddIcon,
    Settings as SettingsIcon,
} from '@material-ui/icons';

export default function Header() {
    return (
        <div className={styles.Header}>
            <img src="logo_small2.png" alt="logo" className={styles.logo} />
            <p className={commonStyles.text}>Admin Panel</p>
            <Tooltip title="Settings">
                <IconButton >
                    <SettingsIcon />
                </IconButton>
            </Tooltip>
        </div>
    )
}
