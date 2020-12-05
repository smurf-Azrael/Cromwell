import { TDBEntity, TGraphQLNode } from './types/data';
import { getCmsConfig } from './GlobalStore';

export enum BasePageNames {
    Index = 'index',
    Product = 'product',
    Blog = 'blog',
    ProductCategory = 'product_category'
}
export enum BasePagePaths {
    Index = '/',
    Product = '/product',
    Blog = '/blog',
    ProductCategory = '/category'
}

export const GraphQLPaths: { [K in TDBEntity]: TGraphQLNode } = {
    Generic: {
        getOneBySlug: "getBySlug",
        getOneById: "getById",
        getMany: "getAll",
        getManyPaged: "getPaged",
        create: "create",
        update: "update",
        delete: "delete"
    },
    Post: {
        getOneBySlug: "post",
        getOneById: "getPostById",
        getMany: "posts",
        create: "createPost",
        update: "updatePost",
        delete: "deletePost"
    },
    Product: {
        getOneBySlug: "product",
        getOneById: "getProductById",
        getMany: "products",
        create: "createProduct",
        update: "updateProduct",
        delete: "deleteProduct",
        getFromCategory: "getProductsFromCategory"
    },
    ProductCategory: {
        getOneBySlug: "productCategory",
        getOneById: "getProductCategoryById",
        getMany: "productCategories",
        create: "createProductCategory",
        update: "updateProductCategory",
        delete: "deleteProductCategory"
    },
    Attribute: {
        getOneBySlug: "",
        getOneById: "getAttribute",
        getMany: "getAttributes",
        create: "createAttribute",
        update: "updateAttribute",
        delete: "deleteAttribute"
    },
    ProductReview: {
        getOneBySlug: "",
        getOneById: "getProductReview",
        getMany: "getProductReviews",
        create: "createProductReview",
        update: "updateProductReview",
        delete: "deleteProductReview",
        getFromProduct: "getProductReviewsOfProduct"
    }
}

export const DBTableNames: { [K in TDBEntity]: string } = {
    Post: 'post',
    Product: 'product',
    ProductCategory: 'product_category',
    Attribute: 'attribute',
    ProductReview: 'product_review',
    Generic: '_Generic'
}

export const isServer = (): boolean => (typeof window === 'undefined');

export const currentApiVersion = '1.0.0';

export const apiV1BaseRoute = 'api/v1';
// export const isServer = (): boolean => true;


export const serviceLocator = {
    getApiUrl: () => {
        const cmsConfig = getCmsConfig();
        if (!cmsConfig) throw new Error('core:serviceLocator:getApiUrl !cmsConfig');
        const protocol = cmsConfig.protocol ? cmsConfig.protocol : 'http';

        if (cmsConfig.domain && cmsConfig.domain !== 'localhost') {
            return `${protocol}://${cmsConfig.domain}`
        } else {
            if (!cmsConfig.apiPort) throw new Error('core:serviceLocator:getApiUrl !apiPort');
            return `${protocol}://localhost:${cmsConfig.apiPort}`
        }
    },
    // Websocket API URL
    getApiWsUrl: () => {
        const cmsConfig = getCmsConfig();
        if (!cmsConfig) throw new Error('core:serviceLocator:getApiUrl !cmsConfig');
        const protocol = 'ws';

        if (cmsConfig.domain && cmsConfig.domain !== 'localhost') {
            return `${protocol}://${cmsConfig.domain}`
        } else {
            if (!cmsConfig.apiPort) throw new Error('core:serviceLocator:getApiWsUrl !apiPort');
            return `${protocol}://localhost:${cmsConfig.apiPort}`
        }
    },
    getManagerUrl: () => {
        const cmsConfig = getCmsConfig();
        if (!cmsConfig) throw new Error('core:serviceLocator:getManagerUrl !cmsConfig');
        const protocol = cmsConfig.protocol ? cmsConfig.protocol : 'http';

        if (cmsConfig.domain && cmsConfig.domain !== 'localhost') {
            return `${protocol}://${cmsConfig.domain}`
        } else {
            if (!cmsConfig.managerPort) throw new Error('core:serviceLocator:getApiUrl !apiPort');
            return `${protocol}://localhost:${cmsConfig.managerPort}`
        }
    },
    getManagerWsUrl: () => {
        // Only available at localhost for usage of API Server (as a proxy)
        const cmsConfig = getCmsConfig();
        if (!cmsConfig) throw new Error('core:serviceLocator:getManagerWS !cmsConfig');
        const protocol = 'ws';

        if (!cmsConfig.managerPort) throw new Error('core:serviceLocator:getApiUrl !apiPort');
        return `${protocol}://localhost:${cmsConfig.managerPort}`
    },
    getFrontendUrl: () => {
        const cmsConfig = getCmsConfig();
        if (!cmsConfig) throw new Error('core:serviceLocator:getFrontendUrl !cmsConfig');
        const protocol = cmsConfig.protocol ? cmsConfig.protocol : 'http';

        if (cmsConfig.domain && cmsConfig.domain !== 'localhost') {
            return `${protocol}://${cmsConfig.domain}`
        } else {
            if (!cmsConfig.frontendPort) throw new Error('core:serviceLocator:getFrontendUrl !frontendPort');
            return `${protocol}://localhost:${cmsConfig.frontendPort}`
        }
    },
    getAdminPanelUrl: () => {
        const cmsConfig = getCmsConfig();
        if (!cmsConfig) throw new Error('core:serviceLocator:getAdminPanelUrl !cmsConfig');
        const protocol = cmsConfig.protocol ? cmsConfig.protocol : 'http';

        if (cmsConfig.domain && cmsConfig.domain !== 'localhost') {
            return `${protocol}://${cmsConfig.domain}/admin`
        } else {
            if (!cmsConfig.adminPanelPort) throw new Error('core:serviceLocator:getAdminPanelUrl !adminPanelPort');
            return `${protocol}://localhost:${cmsConfig.adminPanelPort}`
        }
    }

};

export enum ECommonComponentNames {
    ProductCard = 'ProductCard',
    Post = 'Post'
}