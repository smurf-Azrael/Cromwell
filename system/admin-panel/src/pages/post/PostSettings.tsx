import 'date-fns';

import { resolvePageRoute, serviceLocator, TPost, TTag } from '@cromwell/core';
import DateFnsUtils from '@date-io/date-fns';
import { Button, Checkbox, FormControlLabel, IconButton, Popover, TextField, Tooltip } from '@material-ui/core';
import { Close as CloseIcon } from '@material-ui/icons';
import { Autocomplete } from '@material-ui/lab';
import { KeyboardDatePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import React, { useState } from 'react';

import ImagePicker from '../../components/imagePicker/ImagePicker';
import styles from './PostSettings.module.scss';


const PostSettings = (props: {
    postData?: Partial<TPost>;
    isSettingsOpen: boolean;
    anchorEl: Element;
    allTags?: TTag[] | null;
    onClose: (newData: Partial<TPost>) => void;
    isSaving?: boolean;
    handleUnpublish: () => void;
}) => {
    const { postData } = props;
    const [title, setTitle] = useState<string | undefined>(postData?.title ?? null);
    const [mainImage, setMainImage] = useState<string | undefined>(postData?.mainImage ?? null);
    const [pageDescription, setPageDescription] = useState<string | undefined>(postData?.pageDescription ?? null);
    const [pageKeywords, setPageKeywords] = useState<string[] | undefined>(postData?.meta?.keywords ?? null);
    const [pageTitle, setPageTitle] = useState<string | undefined>(postData?.pageTitle ?? null);
    const [slug, setSlug] = useState<string | undefined>(postData?.slug ?? null);
    const [tags, setTags] = useState<TTag[] | undefined>(postData?.tags ?? []);
    const [publishDate, setPublishDate] = useState<Date | undefined | null>(postData?.publishDate ?? null);
    const [featured, setFeatured] = useState<boolean | undefined | null>(postData?.featured ?? null);

    const handleChangeTags = (event: any, newValue: TTag[]) => {
        setTags(newValue);
    }
    const handleChangeKeywords = (event: any, newValue: string[]) => {
        setPageKeywords(newValue);
    }

    const handleClose = () => {
        const newData = Object.assign({}, postData);
        newData.title = title;
        newData.mainImage = mainImage;
        newData.pageDescription = pageDescription;
        newData.pageTitle = pageTitle;
        newData.slug = slug;
        newData.tags = tags;
        newData.publishDate = publishDate;
        newData.featured = featured;
        if (pageKeywords) {
            if (!newData.meta) newData.meta = {};
            newData.meta.keywords = pageKeywords;
        }
        props.onClose(newData);
    }

    let pageFullUrl;
    if (slug) {
        pageFullUrl = serviceLocator.getFrontendUrl() + resolvePageRoute('post', { slug: slug ?? postData.id });
    }

    return (
        <Popover
            disableEnforceFocus
            open={props.isSettingsOpen}
            elevation={0}
            anchorEl={props.anchorEl}
            onClose={handleClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
            }}
            classes={{ paper: styles.popover }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
            }}
        >
            <div className={styles.PostSettings}>
                <p className={styles.headerText}>Post meta</p>
                <IconButton className={styles.closeBtn}
                    id="post-settings-close-btn"
                    onClick={handleClose}>
                    <CloseIcon />
                </IconButton>
                <TextField
                    label="Title"
                    value={title ?? ''}
                    fullWidth
                    className={styles.settingItem}
                    onChange={e => setTitle(e.target.value)}
                />
                <TextField
                    label="Page URL"
                    className={styles.settingItem}
                    fullWidth
                    value={slug ?? ''}
                    onChange={e => setSlug(e.target.value)}
                    helperText={pageFullUrl}
                />
                <ImagePicker
                    label="Main image"
                    onChange={(val) => setMainImage(val)}
                    value={mainImage}
                    className={styles.imageBox}
                    backgroundSize='cover'
                    showRemove
                />
                <Autocomplete
                    multiple
                    className={styles.settingItem}
                    options={props.allTags ?? []}
                    defaultValue={tags?.map(tag => (props.allTags ?? []).find(allTag => allTag.name === tag.name)) ?? []}
                    getOptionLabel={(option) => option.name}
                    onChange={handleChangeTags}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            variant="standard"
                            label="Tags"
                        />
                    )}
                />
                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                    <KeyboardDatePicker
                        fullWidth
                        disableToolbar
                        variant="inline"
                        format="MM/dd/yyyy"
                        margin="normal"
                        label="Publish date"
                        value={publishDate}
                        onChange={setPublishDate}
                        KeyboardButtonProps={{
                            'aria-label': 'change date',
                        }}
                    />
                </MuiPickersUtilsProvider>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={featured}
                            onChange={() => setFeatured(!featured)}
                            color="primary"
                        />
                    }
                    style={{ margin: '10px 0' }}
                    className={styles.settingItem}
                    label="Featured post"
                />
                <TextField
                    label="Meta title"
                    className={styles.settingItem}
                    fullWidth
                    value={pageTitle ?? ''}
                    onChange={e => setPageTitle(e.target.value)}
                />
                <TextField
                    label="Meta description"
                    className={styles.settingItem}
                    fullWidth
                    value={pageDescription ?? ''}
                    onChange={e => setPageDescription(e.target.value)}
                />
                <Autocomplete
                    multiple
                    freeSolo
                    options={[]}
                    className={styles.settingItem}
                    value={(pageKeywords ?? []) as any}
                    getOptionLabel={(option) => option}
                    onChange={handleChangeKeywords}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            variant="standard"
                            label="Meta keywords"
                        />
                    )}
                />
                {postData?.published && (
                    <Tooltip title="Remove post from publication">
                        <Button variant="contained" color="primary"
                            className={styles.publishBtn}
                            size="small"
                            disabled={props.isSaving}
                            onClick={props.handleUnpublish}
                        >Unpublish</Button>
                    </Tooltip>
                )}
            </div>
        </Popover>
    )
}

export default PostSettings;