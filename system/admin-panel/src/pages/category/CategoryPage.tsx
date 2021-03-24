import { gql } from '@apollo/client';
import { TPagedParams, TProductCategory, TProductCategoryInput } from '@cromwell/core';
import { getGraphQLClient } from '@cromwell/core-frontend';
import { Button, IconButton, MenuItem, TextField } from '@material-ui/core';
import { HighlightOffOutlined, Wallpaper as WallpaperIcon } from '@material-ui/icons';
import Quill from 'quill';
import React, { useEffect, useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import ImagePicker from '../../components/imagePicker/ImagePicker';
import Autocomplete from '../../components/autocomplete/Autocomplete';
import { getFileManager } from '../../components/fileManager/helpers';
import { toast } from '../../components/toast/toast';
import { categoryPageInfo } from '../../constants/PageInfos';
import { getQuillHTML, initQuillEditor } from '../../helpers/quill';
import styles from './CategoryPage.module.scss';
import { copySync } from 'fs-extra';

export default function CategoryPage() {
    const { id: categoryId } = useParams<{ id: string }>();
    const client = getGraphQLClient();
    const [notFound, setNotFound] = useState(false);
    const history = useHistory();
    const [category, setCategoryData] = useState<TProductCategory | undefined | null>(null);
    const editorId = 'category-description-editor';
    const quillEditor = useRef<Quill | null>(null);
    const [parentCategory, setParentCategory] = useState<TProductCategory | null>(null);

    const urlParams = new URLSearchParams(window.location.search);
    const parentIdParam = urlParams.get('parentId');

    const getProductCategory = async (id: string) => {
        let categoryData: TProductCategory | undefined;
        try {
            categoryData = await client?.getProductCategoryById(id,
                gql`
                    fragment AdminPanelProductCategoryFragment on ProductCategory {
                        id
                        slug
                        createDate
                        updateDate
                        isEnabled
                        pageTitle
                        name
                        mainImage
                        description
                        descriptionDelta
                        children {
                            id
                            slug
                        }
                        parent {
                            id
                            slug
                        }
                    }`,
                'AdminPanelProductCategoryFragment'
            );

        } catch (e) { console.error(e) }

        return categoryData;
    }

    const getParentCategory = async (parentId) => {
        try {
            const parent = await client.getProductCategoryById(parentId);
            if (parent) {
                setParentCategory(parent);
                handleParentCategoryChange(parent);
            }
        } catch (e) {
            console.error(e)
        }
    }

    const init = async () => {
        let categoryData;
        if (categoryId && categoryId !== 'new') {
            try {
                categoryData = await getProductCategory(categoryId);
            } catch (e) {
                console.error(e);
            }
            if (categoryData?.id) {
                setCategoryData(categoryData);
            } else setNotFound(true);

            if (categoryData?.parent?.id) {
                getParentCategory(categoryData?.parent?.id);
            }

        } else if (categoryId === 'new') {
            setCategoryData({} as any);
        }

        if (parentIdParam) {
            getParentCategory(parentIdParam);
        }

        let postContent;
        try {
            if (categoryData?.descriptionDelta)
                postContent = JSON.parse(categoryData.descriptionDelta);
        } catch (e) {
            console.error(e);
        }

        quillEditor.current = initQuillEditor(`#${editorId}`, postContent);
    }

    useEffect(() => {
        init();
    }, []);

    const handleInputChange = (prop: keyof TProductCategory, val: any) => {
        if (category) {
            setCategoryData(prevCat => {
                const cat = Object.assign({}, prevCat);
                (cat[prop] as any) = val;
                return cat;
            });
        }
    }

    const handleClearImage = async () => {
        handleInputChange('mainImage', undefined)
    }

    const handleSearchRequest = async (text: string, params: TPagedParams<TProductCategory>) => {
        return client?.getFilteredProductCategories({
            filterParams: {
                nameSearch: text
            },
            pagedParams: params
        });
    }

    const handleParentCategoryChange = (data: TProductCategory | null) => {
        if (data && category && data.id === category.id) return;

        setCategoryData(prevCat => {
            const cat = Object.assign({}, prevCat);
            cat.parent = data ?? undefined;
            return cat;
        });
    }

    const getInput = (): TProductCategoryInput => ({
        slug: category.slug,
        pageTitle: category.pageTitle,
        pageDescription: category.pageDescription,
        name: category.name,
        mainImage: category.mainImage,
        isEnabled: category.isEnabled,
        description: getQuillHTML(quillEditor.current, `#${editorId}`),
        descriptionDelta: JSON.stringify(quillEditor.current.getContents()),
        parentId: category.parent?.id,
        childIds: category.children?.map(child => child.id),
    });

    const handleSave = async () => {
        const inputData: TProductCategoryInput = getInput();

        if (categoryId === 'new') {
            try {
                const newData = await client?.createProductCategory(inputData);
                toast.success('Created category!');
                history.push(`${categoryPageInfo.baseRoute}/${newData.id}`)

                const categoryData = await getProductCategory(newData.id);
                if (categoryData?.id) {
                    setCategoryData(categoryData);
                }

            } catch (e) {
                toast.error('Failed to create category');
                console.error(e)
            }

        } else if (category?.id) {
            try {
                await client?.updateProductCategory(category.id, inputData);
                const categoryData = await getProductCategory(category.id);
                if (categoryData?.id) {
                    setCategoryData(categoryData);
                }
                toast.success('Saved!');
            } catch (e) {
                toast.error('Failed to save');
                console.error(e)
            }
        }

    }

    if (notFound) {
        return (
            <div className={styles.CategoryPage}>
                <div className={styles.notFoundPage}>
                    <p className={styles.notFoundText}>Category not found</p>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.CategoryPage}>
            <div className={styles.header}>
                <div></div>
                <div className={styles.headerActions}>
                    <Button variant="contained" color="primary"
                        className={styles.saveBtn}
                        size="small"
                        onClick={handleSave}>
                        Save</Button>
                </div>
            </div>
            <div className={styles.fields}>
                <TextField label="Name"
                    value={category?.name || ''}
                    fullWidth
                    className={styles.textField}
                    onChange={(e) => { handleInputChange('name', e.target.value) }}
                />
                <Autocomplete<TProductCategory>
                    loader={handleSearchRequest}
                    onSelect={handleParentCategoryChange}
                    getOptionLabel={(data) => `${data.name} (id: ${data.id}${data?.parent?.id ? `; parent id: ${data.parent.id}` : ''})`}
                    getOptionValue={(data) => data.name}
                    fullWidth
                    className={styles.textField}
                    defaultValue={parentCategory}
                    label={"Parent category"}
                />
                <ImagePicker
                    placeholder="No image"
                    onChange={(val) => {
                        handleInputChange('mainImage', val)
                    }}
                    value={category?.mainImage}
                    className={styles.imageBox}
                    showRemove
                />
                <div className={styles.descriptionEditor}>
                    <div style={{ height: '300px' }} id={editorId}></div>
                </div>
                <TextField label="Page slug (SEO URL)"
                    value={category?.slug || ''}
                    fullWidth
                    className={styles.textField}
                    onChange={(e) => { handleInputChange('slug', e.target.value) }}
                />
                <TextField label="Meta title (SEO)"
                    value={category?.pageTitle || ''}
                    fullWidth
                    className={styles.textField}
                    onChange={(e) => { handleInputChange('pageTitle', e.target.value) }}
                />
                <TextField label="Meta description (SEO)"
                    value={category?.pageDescription || ''}
                    fullWidth
                    className={styles.textField}
                    onChange={(e) => { handleInputChange('pageDescription', e.target.value) }}
                />
            </div>
        </div>
    );
}
