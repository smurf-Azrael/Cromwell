import 'quill/dist/quill.snow.css';

import { getStoreItem, TPost, TPostInput } from '@cromwell/core';
import { getGraphQLClient } from '@cromwell/core-frontend';
import { Button, IconButton, MenuItem, Tooltip } from '@material-ui/core';
import { NavigateBefore as NavigateBeforeIcon, Settings as SettingsIcon } from '@material-ui/icons';
import Quill from 'quill';
import React, { useEffect, useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import { getFileManager } from '../../components/fileManager/helpers';
import { toast } from '../../components/toast/toast';
import { postListInfo } from '../../constants/PageInfos';
import styles from './Post.module.scss';

const Post = (props) => {
    const { id: postId } = useParams<{ id: string }>();
    const [postData, setPostData] = useState<TPost | undefined>(undefined);
    const client = getGraphQLClient();
    const [isLoading, setIsloading] = useState(false);
    const mode = getStoreItem('environment')?.mode;
    const quillEditor = useRef<Quill | null>(null);
    const history = useHistory();

    const getPostData = async (): Promise<TPost | undefined> => {
        setIsloading(true);
        let post;
        try {
            post = await client?.getPostById(postId);
            if (post) setPostData(post);
        } catch (e) { console.log(e) }
        setIsloading(false);
        return post;
    }

    const initEditor = (postContent?: any) => {
        quillEditor.current = new Quill('#editor', {
            theme: 'snow',
            placeholder: 'Let`s write an awesome story!',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    [{ 'font': [] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'align': [] }],
                    ['link', 'blockquote', 'code-block'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    [{ 'script': 'sub' }, { 'script': 'super' }],
                    [{ 'indent': '-1' }, { 'indent': '+1' }],
                    [{ 'color': [] }, { 'background': [] }],
                    ['clean'],
                    ['image']
                ]
            },
        });

        const toolbar = quillEditor.current.getModule('toolbar');
        toolbar.addHandler('image', async (prop) => {
            const photoPath = await getFileManager()?.getPhoto();
            if (photoPath) {
                const selection = quillEditor.current.getSelection();
                quillEditor.current.insertEmbed(selection.index, 'image', photoPath);
            }
        });

        if (postContent) {
            quillEditor.current.setContents(postContent);
        }
    }

    const init = async () => {
        const post = await getPostData();
        let postContent: any = null;
        if (post?.delta) {
            try {
                postContent = JSON.parse(post?.delta);
            } catch (e) { console.error(e) }
        }
        initEditor(postContent);
    }

    useEffect(() => {
        init();
    }, []);


    const handleSave = async () => {
        console.log(quillEditor.current.getContents());
        quillEditor.current.disable()
        const outerHTML = document.querySelector('#editor')?.outerHTML;

        if (postData?.id && outerHTML) {
            const updatePost: TPostInput = {
                slug: postData.slug,
                pageTitle: postData.pageTitle,
                title: postData.title,
                mainImage: postData.mainImage,
                isPublished: postData.isPublished,
                isEnabled: postData.isEnabled,
                authorId: postData?.author?.id,
                delta: JSON.stringify(quillEditor.current.getContents()),
                content: outerHTML
            }
            await client?.updatePost(postData.id, updatePost);

            toast.success('Saved!');
        }
    }

    return (
        <div className={styles.Post}>
            <div className={styles.postHeader}>
                <MenuItem className={styles.backIcon}
                    onClick={() => history.push(postListInfo.route)}
                >
                    <NavigateBeforeIcon style={{ marginLeft: '-8px' }} />
                    <p>Back</p>
                </MenuItem>
                <div>
                    <Tooltip title="Settings">
                        <IconButton >
                            <SettingsIcon />
                        </IconButton>
                    </Tooltip>
                    <Button variant="contained" color="primary"
                        className={styles.saveBtn}
                        size="small"
                        onClick={handleSave}>
                        Save</Button>
                </div>
            </div>
            <div className={styles.editor} id="editor"></div>
        </div>
    );
}

export default Post;
