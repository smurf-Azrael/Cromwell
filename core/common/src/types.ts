import { NextPage } from 'next';
import { ComponentType } from 'react';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

type ParsedUrlQuery = NodeJS.Dict<string | string[]>;
export type StaticPageContext<Q extends ParsedUrlQuery = ParsedUrlQuery> = {
    params?: Q;
    preview?: boolean;
    previewData?: any;
    pluginsConfig?: Record<string, any>;
}
export type TGetStaticProps<
    P extends { [key: string]: any } = { [key: string]: any },
    Q extends ParsedUrlQuery = ParsedUrlQuery> = (ctx: StaticPageContext) => Promise<P>;


export type TCromwellPage<Props = {}> = NextPage<Props & TCromwellPageCoreProps>;

export type TCromwellPageCoreProps = {
    pluginsData: Record<string, any>;
    childStaticProps: Record<string, any>;
    pageConfig: TPageConfig;
    appConfig: TAppConfig;
    appCustomConfig: Record<string, any>;
}

export type PageName = keyof {
    index;
    product;
    blog;
}

export type TDataComponentProps<Data> = {
    pluginName: string;
    component: React.ComponentType<Data>;
}

export type TCmsConfig = {
    apiPort: number;
    adminPanelPort: number;
    frontendPort: number;
    themeName: string;
    defaultPageSize: number;
    defaultCurrency: string;
}

export type TAppConfig = {
    pagesDir?: string;
    /** Custom HTML add into head of every page */
    headHtml?: string;
}

export type TThemeConfig = {
    pages: TPageConfig[];
    plugins: Record<string, {
        pages: string[],
        options: Record<string, any>
    }>;
    appConfig: TAppConfig;
    /**
     * Custom config that will be available at every page in the Store inside pageConfig props
     */
    appCustomConfig?: Record<string, any>,
    globalModifications?: TCromwellBlockData[];
}

export type TPageInfo = {
    route: string;
    name: string;
    title?: string;
    description?: string;
}

export type TPageConfig = TPageInfo & {
    modifications: TCromwellBlockData[];
    pageCustomConfig: Record<string, any>;
}


export type TCromwellStore = {
    pluginsData?: Record<string, any>;
    cmsconfig?: TCmsConfig;
    pageConfig?: TPageConfig;
    appCustomConfig?: Record<string, any>;
    appConfig?: TAppConfig;
    importPlugin?: (pluginName: string) => { default: ComponentType } | undefined;
    importDynamicPlugin?: (pluginName: string) => ComponentType | undefined;
    rebuildPage?: (path: string) => void;
    components: Record<string, React.ComponentType<CommonComponentProps>>;
}

declare global {
    namespace NodeJS {
        interface Global {
            CromwellStore: TCromwellStore;
        }
    }
    interface Window {
        CromwellStore: TCromwellStore;
    }
}

export type TBlockDestinationPositionType = 'before' | 'after' | 'inside';

export type TCromwellBlockType = 'container' | 'plugin' | 'text' | 'HTML' | 'image' | 'gallery';

export type TCromwellBlockData = {
    /**
     * Component's type
     */
    type: TCromwellBlockType;

    /**
     * Component's id, must be unique in a page.
     */
    componentId: string;

    /**
     * If true, indicates that this component was created in builder and it doesn't exist in JSX.
     * Exists only in page's config. 
     */
    isVirtual?: boolean;

    /**
     * Id of Destination Component where this component will be displayed. 
     * Works only for virtual blocks.
     */
    destinationComponentId?: string;

    /**
     * Position around Destination Component where this component will be displayed.
     * Works only for virtual blocks.
     */
    destinationPosition?: TBlockDestinationPositionType;

    /**
     * Plugin's name to render inside component. Same name must be in cromwell.config.json
     */
    pluginName?: string;

    /**
     * Custom editable plugin's config
     */
    pluginConfig?: Record<string, any>;

    /**
     * 
     * CSS styles to apply to this block.
     */
    styles?: string;

    /**
     * Non-virtual blocks that exist in JSX cannot be deleted (or moved) in theme's source code by user
     * but user can set isDeleted flag that will tell Blocks to render null instead
     */
    isDeleted?: boolean;

    /** For "image" block */
    imageSource?: string;
    /** For "HTML" block */
    innerHTML?: string;
    /** For gallery block */
    gallerySettings?: TGallerySettings;
}

export type TGallerySettings = {
    images: {
        src: string;
        href?: string
    }[],
    height?: number | string;
    width?: number | string;
    /** = width / height */
    ratio?: number;
    showNav?: boolean;
    showPagination?: boolean;
    showScrollbar?: boolean;
}

export type TDBEntity = keyof {
    Post;
    Product;
    ProductCategory;
}

export type GraphQLPathsType = { [K in TDBEntity]: TGraphQLNode };

export type TGraphQLNode = {
    getOneById: string;
    getOneBySlug: string;
    getMany: string;
    create: string;
    update: string;
    delete: string;
}

export type TBasePageEntityType = {
    // DB id
    id: string;
    // Slug for page route
    slug: string;
    // Page SEO title
    pageTitle: string;
    // DB createDate
    createDate: Date;
    // DB updateDate
    updateDate: Date;
    // Is displaying at frontend
    isEnabled: boolean;
}

type DBAuxiliaryColumns = 'id' | 'createDate' | 'updateDate';

export type BasePageEntityInputType = Omit<TBasePageEntityType, DBAuxiliaryColumns>;

export type TProductCategory = TBasePageEntityType & {
    // Name of the category (h1)
    name: string;
    // Href of main image
    mainImage: string;
    // Description (HTML allowed)
    description: string;
    // DB children
    children: TProductCategory[];
    // DB parent
    parent: TProductCategory;
    // Products in category
    products: TProduct[];
}

export type ProductCategoryInputType = Omit<TProductCategory, DBAuxiliaryColumns | 'children' | 'parent' | 'products'> & {
    parentId: string;
    childIds: string[];
};

export interface TProduct extends TBasePageEntityType {
    // Name of the product (h1)
    name: string;
    // Categories of the prooduct
    categories: TProductCategory[];
    // Price. Will be discount price if oldPrice is specified
    price: string;
    // Price before sale, optional
    oldPrice: string | null;
    // Href of main image
    mainImage: string;
    // Hrefs of iamges
    images: string[];
    // Description (HTML allowed)
    description: string;
    // Rating 1-5
    rating: number
}

export type TProductInput = Omit<TProduct, DBAuxiliaryColumns | 'categories' | 'rating'> & {
    categoryIds: string[];
};

export interface TPost extends TBasePageEntityType {
    // Title of post (h1)
    title: string;
    // DB id of author
    authorId: string;
    // Href of main image
    mainImage: string;
    // Short description (HTML allowed)
    description: string;
    // Post content (HTML allowed)
    content: string;
}

export type TPostInput = Omit<TProduct, DBAuxiliaryColumns>;


export interface TAuthor extends TBasePageEntityType {

    id: string;

    name: string;
}

export type TPagedParams<Entity> = {
    pageNumber?: number;
    pageSize?: number;
    orderBy?: keyof Entity;
    order?: 'ASC' | 'DESC';
}


export type TCromwellBlockProps = {
    id: string;
    type?: TCromwellBlockType;
    className?: string;
    content?: React.ComponentType<{
        data?: TCromwellBlockData,
        blockRef?: React.RefObject<HTMLDivElement>
    }>;
}

export type TContentComponentProps = {
    id: string;
    config?: TCromwellBlockData;
    children?: React.ReactNode
}

export type TPluginConfig = {
    name: string;
    adminDir?: string;
    frontendDir?: string;
    backend?: {
        resolversDir?: string;
        entitiesDir?: string;
    }
}

export type CommonComponentProps = {
    data: TProduct
}
