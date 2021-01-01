import { getCmsSettings, TCmsSettings, TThemeEntity, TThemeMainConfig } from '@cromwell/core';
import { getGraphQLClient, getRestAPIClient } from '@cromwell/core-frontend';
import { Badge, Button, Card, CardActionArea, CardActions, CardContent, Typography } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';

import { LoadingStatus } from '../../components/loadBox/LoadingStatus';
import { ManagerLogger } from '../../components/managerLogger/ManagerLogger';
import { themeEditPageInfo } from '../../constants/PageInfos';
import styles from './ThemeList.module.scss';

export default function ThemeList() {
    const [infos, setInfos] = useState<TThemeMainConfig[]>([]);
    const [themeList, setThemeList] = useState<TThemeEntity[] | null>(null);
    const [isListLoading, setIsListLoading] = useState<boolean>(true);
    const [isChangingTheme, setIsChangingTheme] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [cmsConfig, setCmsConfig] = useState<TCmsSettings | undefined>(getCmsSettings());
    const history = useHistory();
    const client = getRestAPIClient();

    const getThemeList = async () => {
        const updatedConfig = await client?.getCmsSettingsAndSave();
        setCmsConfig(updatedConfig);

        // Get info by parsing directory 
        const infos = await client?.getThemesInfo();
        infos?.sort((a, b) => (updatedConfig && a.themeName === updatedConfig.themeName) ? -1 : 1)
        if (infos) setInfos(infos);
        setIsListLoading(false);

        // Get info from DB
        const graphQLClient = getGraphQLClient();
        if (graphQLClient) {
            try {
                const themeEntities: TThemeEntity[] = await graphQLClient.getAllEntities('Theme',
                    graphQLClient.ThemeFragment, 'ThemeFragment');
                if (themeEntities && Array.isArray(themeEntities)) setThemeList(themeEntities);
            } catch (e) {
                console.error(e);
            }
        }
        setIsLoading(false);
    }
    useEffect(() => {
        getThemeList();
    }, []);

    const handleSetActiveTheme = async (info: TThemeMainConfig) => {
        if (client) {
            setIsChangingTheme(true);
            setIsLoading(true);
            const success = await client.changeTheme(info.themeName);
            if (success) {
                toast.success('Applied a new theme');
            } else {
                toast.error('Failed to set a new theme');
            }
            const updatedConfig = await client.getCmsSettings();
            infos?.sort((a, b) => (updatedConfig && a.themeName === updatedConfig.themeName) ? -1 : 1)
            setCmsConfig(updatedConfig);
            setIsChangingTheme(false);
            setIsLoading(false);
        }
    }

    const handleRebuildTheme = async () => {
        if (client) {
            setIsChangingTheme(true);
            setIsLoading(true);
            const success = await client.rebuildTheme();
            if (success) {
                toast.success('Rebuilded');
            } else {
                toast.error('Failed to rebuild theme');
            }
            setIsChangingTheme(false);
            setIsLoading(false);
        }
    }

    const handleInstallTheme = (themeName: string) => async () => {
        setIsLoading(true);
        let success = false;
        try {
            success = await client?.installTheme(themeName);
            await getThemeList();
        } catch (e) {
            console.error(e);
        }
        setIsLoading(false);

        if (success) {
            toast.success('Theme installed');
        } else {
            toast.error('Failed to install theme');
        }
    }

    return (
        <div className={styles.ThemeList}>
            {infos.map(info => {
                const isActive = Boolean(cmsConfig && cmsConfig.themeName === info.themeName);
                const entity = themeList?.find(ent => ent.name === info.themeName);
                const isInstalled = entity?.isInstalled ?? false;

                return (
                    <Card className={styles.themeCard} key={info.themeName}>
                        <CardActionArea>
                            <div
                                style={{ backgroundImage: `url("data:image/png;base64,${info.previewImage}")` }}
                                className={styles.themeImage}
                            ></div>
                            <CardContent>
                                <Badge color="secondary" badgeContent={isActive ? 'Active' : null}>
                                    <Typography gutterBottom variant="h5" component="h2" className={styles.themeTitle}>
                                        {info.title}
                                    </Typography>
                                </Badge>
                                <Typography variant="body2" color="textSecondary" component="p">
                                    {info.description}
                                </Typography>
                            </CardContent>
                        </CardActionArea>
                        <CardActions className={styles.themeActions} disableSpacing>
                            {!isInstalled && (
                                <Button size="small" color="primary" variant="contained"
                                    onClick={handleInstallTheme(info.themeName)}
                                    disabled={isChangingTheme}
                                >
                                    Install theme
                                </Button>
                            )}
                            {isInstalled && isActive && (
                                <Button size="small" color="primary" variant="contained"
                                    onClick={() => {
                                        const route = `${themeEditPageInfo.baseRoute}/${info.themeName}`;
                                        history.push(route);
                                    }}
                                    disabled={isChangingTheme}
                                >
                                    Edit theme
                                </Button>
                            )}
                            {isInstalled && !isActive && (
                                <Button size="small" color="primary" variant="contained"
                                    onClick={() => handleSetActiveTheme(info)}
                                    disabled={isChangingTheme}
                                >
                                    Set active
                                </Button>
                            )}
                            <Button size="small" color="primary" variant="outlined"
                                disabled={isChangingTheme}
                            >
                                Delete
                          </Button>
                            <Button size="small" color="primary" variant="outlined">
                                Info
                          </Button>
                            {isActive && (
                                <Button size="small" color="primary" variant="outlined"
                                    onClick={handleRebuildTheme}
                                    disabled={isChangingTheme}
                                >
                                    Rebuild
                                </Button>
                            )}
                        </CardActions>
                    </Card>
                )
            })}
            <ManagerLogger isActive={isChangingTheme} />
            <LoadingStatus isActive={isLoading} />
        </div>
    )
}
