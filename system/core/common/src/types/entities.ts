import { TPagedList, TStoreListItem } from './data';

export type TBasePageEntity = {
    /**
     * DB id
     */
    id: string;
    /**
     * Slug for page route
     */
    slug?: string;
    /**
     * Page meta title (SEO)
     */
    pageTitle?: string;
    /**
     * Page meta description (SEO)
     */
    pageDescription?: string;
    /**
     * Other meta (SEO) data
     */
    meta?: TBasePageMeta | null;
    /**
     * DB createDate
     */
    createDate?: Date;
    /**
     * DB updateDate
     */
    updateDate?: Date;
    /**
     * Is displaying at frontend
     */
    isEnabled?: boolean;
}

export type TBasePageMeta = {
    keywords?: string[];
    socialImage?: string;
}

export type TDBAuxiliaryColumns = 'id' | 'createDate' | 'updateDate';

export type TBasePageEntityInput = Omit<TBasePageEntity, TDBAuxiliaryColumns>;


/**
 * ProductCategory
 */
export type TProductCategoryCore = {
    /**
     * Name of the category (h1)
     */
    name: string;
    /**
     * Href of main image
     */
    mainImage?: string;
    /**
     * Description (HTML allowed)
     */
    description?: string;
    /**
     * Description in JSON format
     */
    descriptionDelta?: string;
    /**
     * DB children
     */
    children?: TProductCategory[];
    /**
     * DB parent
     */
    parent?: TProductCategory | null;
    /**
     * Products in category
     */
    products?: TPagedList<TProduct>;
}

export type TProductCategory = TProductCategoryCore & TBasePageEntity;

export type TProductCategoryInput = TBasePageEntityInput & Omit<TProductCategoryCore, 'children' | 'parent' | 'products'> & {
    parentId?: string;
};

export type TProductCategoryFilter = {
    nameSearch?: string;
}


/**
 * PRODUCT
 */
export type TProduct = TBasePageEntity & {
    /**
     * Name of the product (h1)
     */
    name?: string;
    /**
     * Main category of product
     */
    mainCategoryId?: string;
    /**
     * Categories of the prooduct
     */
    categories?: TProductCategory[];
    /**
     * Price. Will be discount price if oldPrice is specified
     */
    price?: number;
    /**
     * Price before sale, optional
     */
    oldPrice?: number;
    /**
     * SKU
     */
    sku?: string;
    /**
     * Href of main image
     */
    mainImage?: string;
    /**
     * Hrefs of iamges
     */
    images?: string[];
    /**
     * Description (HTML allowed)
     */
    description?: string;
    /**
     * Description in JSON format
     */
    descriptionDelta?: string;
    /**
     * Rating data
     */
    rating?: TProductRating;
    /**
     * Customer reviews 
     */
    reviews?: TProductReview[];
    /**
     * Custom attributes
     */
    attributes?: TAttributeInstance[];
    /**
     * Qnt of page requests
     */
    views?: number;
}

export type TProductRating = {
    /**
     * Rating 1-5
     */
    average?: number;
    /**
     * Number of customer reviews
     */
    reviewsNumber?: number;
}

export type TProductInput = Omit<TProduct, TDBAuxiliaryColumns | 'categories' | 'rating' | 'reviews'> & {
    categoryIds?: string[];
};

export type TProductFilter = {
    minPrice?: number;
    maxPrice?: number;
    attributes?: TProductFilterAttribute[];
    nameSearch?: string;
}
export type TProductFilterAttribute = {
    key: string;
    values: string[];
}

export type TFilteredProductList = TPagedList<TProduct> & {
    filterMeta: TProductFilterMeta;
}

export type TProductFilterMeta = {
    minPrice?: number;
    maxPrice?: number;
}


/**
 * POST
 */
export type TPost = {
    /**
     * Title of post (h1)
     */
    title?: string | null;
    /**
     * User-author
     */
    author?: TUser;
    /**
     * Id of user-author
     */
    authorId?: string;
    /**
     * Href of main image
     */
    mainImage?: string | null;
    /**
     * Estimated time in minutes to read the post
     */
    readTime?: string | null;
    /**
     * Tags / categories to show post
     */
    tags?: TTag[] | null;
    /**
     * Post content, HTML
     */
    content?: string | null;
    /**
     * Post content, stringified JSON from text editor
     */
    delta?: string | null;
    /**
     * Short description to display in blog list
     */
    excerpt?: string | null;
    /**
     * Is published?
     */
    published?: boolean | null;
    /**
     * Publish date
     */
    publishDate?: Date | null;
    /**
     * Is post featured?
     */
    featured?: boolean | null;

} & TBasePageEntity;

export type TPostInput = Omit<TPost, TDBAuxiliaryColumns | 'author' | 'tags'> & {
    authorId: string;
    tagIds?: string[] | null;
};

export type TPostFilter = {
    authorId?: string;
    titleSearch?: string;
    tagIds?: string[];
    published?: boolean;
    featured?: boolean | null;
}

export type TTag = TBasePageEntity & {
    name: string;
    color?: string | null;
    image?: string | null;
    description?: string | null;
    descriptionDelta?: string | null;
}

export type TTagInput = Omit<TTag, TDBAuxiliaryColumns>;


/**
 * USER / AUTHOR
 */
export type TUser = TBasePageEntity & {
    /**
     * Name
     */
    fullName: string;
    /**
     * E-mail
     */
    email: string;
    /**
     * Avatar image
     */
    avatar?: string;
    bio?: string;
    phone?: string;
    address?: string;
    role?: TUserRole;
}
export type TUserRole = 'administrator' | 'author' | 'customer' | 'guest';
export type TAuthRole = TUserRole | 'self' | 'all';

export type TCreateUser = Omit<TUser, TDBAuxiliaryColumns> & {
    password?: string;
};

export type TUpdateUser = Omit<TUser, TDBAuxiliaryColumns>;

export type TUserFilter = {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    role?: TUserRole;
}


/**
 * Attribute
 */
export type TAttribute = TBasePageEntity & {
    key: string;
    values: TAttributeValue[];
    type: 'radio' | 'checkbox';
    icon?: string;
    required?: boolean;
}

export type TAttributeInput = Omit<TAttribute, TDBAuxiliaryColumns>;

export type TAttributeValue = {
    value: string;
    icon?: string;
}

export type TAttributeInstance = {
    key: string;
    values: TAttributeInstanceValue[];
}

export type TAttributeInstanceValue = {
    value: string;
    productVariant?: TAttributeProductVariant;
}

export type TAttributeProductVariant = {
    name?: string;
    price?: number;
    oldPrice?: number;
    sku?: string;
    mainImage?: string;
    images?: string[];
    description?: string;
    descriptionDelta?: string;
}


/**
 * ProductReview
 */
export type TProductReviewCore = {
    productId: string;
    title?: string;
    description?: string;
    rating?: number;
    userName?: string;
    userEmail?: string;
    userId?: string;
    approved?: boolean;
}

export type TProductReview = TProductReviewCore & TBasePageEntity;

export type TProductReviewInput = TProductReviewCore & TBasePageEntityInput;

export type TProductReviewFilter = {
    productId?: string;
    userName?: string;
    userId?: string;
    approved?: boolean;
}


/**
 * Store order
 */
export type TOrderCore = {
    id?: string;
    createDate?: Date;
    updateDate?: Date;
    status?: string;
    cart?: string | TStoreListItem[];
    orderTotalPrice?: number;
    cartTotalPrice?: number;
    cartOldTotalPrice?: number;
    shippingPrice?: number;
    totalQnt?: number;
    userId?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    customerAddress?: string;
    customerComment?: string;
    shippingMethod?: string;
    paymentMethod?: string;
    fromUrl?: string;
    currency?: string;
}

export type TOrder = TOrderCore;

export type TOrderInput = TOrderCore;

export type TOrderFilter = {
    status?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    orderId?: string;
    dateFrom?: string;
    dateTo?: string;
}

export type TPaymentSession = TOrderCore & {
    paymentOptions?: {
        name?: string;
        link?: string;
    }[];
    successUrl?: string;
    cancelUrl?: string;
}


/**
 * Blog comment
 */
export type TPostCommentCore = {
    postId: string;
    title?: string;
    comment?: string;
    userName?: string;
    userEmail?: string;
    userId?: string;
    approved?: boolean;
}

export type TPostComment = TPostCommentCore & TBasePageEntity;

export type TPostCommentInput = TPostCommentCore & TBasePageEntityInput;


/**
 * Theme entity
 */
export type TThemeEntityCore = {
    name: string;
    version?: string;
    isInstalled: boolean;
    hasAdminBundle?: boolean;
    title?: string;
    settings?: string;
    defaultSettings?: string;
    moduleInfo?: string;
    isUpdating?: boolean;
}

export type TThemeEntity = TThemeEntityCore & TBasePageEntity;

export type TThemeEntityInput = TThemeEntityCore & TBasePageEntityInput;


/**
 * Plugin entity
 */
export type TPluginEntityCore = {
    name: string;
    version?: string;
    title?: string;
    isInstalled: boolean;
    hasAdminBundle?: boolean;
    settings?: string;
    defaultSettings?: string;
    moduleInfo?: string;
    isUpdating?: boolean;
}

export type TPluginEntity = TPluginEntityCore & TBasePageEntity;

export type TPluginEntityInput = TPluginEntityCore & TBasePageEntityInput;


/**
 * DB CMS entity
 */
export type TCmsEntityCore = {
    /**
     * Pubic settings. Available from REST API endpoint without authentication.
     */
    publicSettings?: TCmsPublicSettings;

    /**
     * Admin settings. Available from REST API endpoint with administrator role authorization
     */
    adminSettings?: TCmsAdminSettings;

    /**
     * Internal settings.
     */
    internalSettings?: TCmsInternalSettings;
}

/**
 * Public CMS settings
 */
export type TCmsPublicSettings = {
    /**
     * Website's URL
     */
    url?: string;
    /**
    * Package name of currently used theme
    */
    themeName?: string;
    /**
     * Page size to use in lists, eg. at Product Category page
     */
    defaultPageSize?: number;
    /**
     * Available currencies in the store and rates between them to convert
     */
    currencies?: TCurrency[];
    /**
     * Default timezone in GMT, number +-
     */
    timezone?: number;
    /**
     * Default language
     */
    language?: string;
    /**
     * Website favicon
     */
    favicon?: string;
    /**
     * Website logo
     */
    logo?: string;
    /**
     * Standard shipping price if no shipment methods specified
     */
    defaultShippingPrice?: number;
    /**
     * Custom HTML code injection
     */
    headHtml?: string;
    footerHtml?: string;

    /**
     * HTTP Redirects for Next.js server 
     */
    redirects?: TCmsRedirect[];

    /**
     * HTTP rewrites for Next.js server
     */
    rewrites?: TCmsRedirect[];
}

/**
 * Admin (private) CMS settings
 */
export type TCmsAdminSettings = {
    /**
     * SMTP connection string to e-mail service provider
     */
    smtpConnectionString?: string;
    /**
     * E-mail to send mails from
     */
    sendFromEmail?: string;
}

/**
 * Internal CMS settings
 */
export type TCmsInternalSettings = {
    /**
    * Internal. CMS version, used for updates
    */
    version?: string;
    /**
     * Internal. https://github.com/CromwellCMS/Cromwell/blob/55046c48d9da0a44e4b11e7918c73876fcd1cfc1/system/manager/src/managers/baseManager.ts#L194:L206
     */
    versions?: TServiceVersions;
    /**
     * Internal. If false or not set, will launch installation at first Admin Panel visit.
     */
    installed?: boolean;
    /**
     * Internal. Recieve unstable beta-updates
     */
    beta?: boolean;
    /**
     * Internal. Is currently under update
     */
    isUpdating?: boolean;
}

export type TServiceVersions = {
    renderer?: number;
    server?: number;
    "api-server"?: number;
    admin?: number;
};

export type TCmsEntity = TCmsEntityCore & TBasePageEntity;


export type TCurrency = {
    id: string;
    tag: string;
    title?: string;
    /** Local curency symbols that will be added to price in getPriceWithCurrency method */
    symbol?: string;
    /** Ratio for currencies to compare: "USD": 1,"EURO": 0.83, "GBP": 0.72 etc. */
    ratio?: number;
}

export type TDeleteManyInput = {
    ids: string[];
    all?: boolean;
}

export type TCmsRedirectObject = {
    from?: string;
    to?: string;
    permanent?: boolean;
    statusCode?: number;
}

export type TCmsRedirectFunction = (pathname: string, search?: string | null) => TCmsRedirectObject | undefined | void;

export type TCmsRedirect = TCmsRedirectObject | TCmsRedirectFunction;