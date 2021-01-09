const constants = require('./src/constants');

module.exports = {
    type: 'theme',
    main: {
        themeName: "@cromwell/theme-store",
        title: "Store",
        previewImage: "static/shopping-cart.png",
        description: "Online store theme",
        adminPanelDir: "dist/adminPanel",
        palette: {
            primaryColor: constants.primaryColor
        },
        globalCss: [
            "react-toastify/dist/ReactToastify.css",
            '../styles/global.scss'
        ],
        headHtml: "<link href=\"https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700;900&display=swap\" rel=\"stylesheet\" /><meta name=\"viewport\" content=\"width=device-width\"><meta property=\"og:appConfig_headHtml\" content=\"blah_blah\" key=\"blah_blah\" />"
    },
    rollupConfig: () => {
        const commonjs = require('@rollup/plugin-commonjs');
        const json = require('@rollup/plugin-json');
        const typescript = require('@rollup/plugin-typescript');
        const postcss = require('rollup-plugin-postcss');
        const { terser } = require('rollup-plugin-terser');
        return {
            main: {
                plugins: [
                    commonjs(),
                    typescript(),
                    json(),
                    // terser(),
                ]
            },
            adminPanel: {
                plugins: [
                    commonjs(),
                    typescript(),
                    json(),
                    postcss({
                        extract: false,
                        modules: true,
                        writeDefinitions: false,
                        inject: true,
                        use: ['sass'],
                    }),
                    // terser()
                ]
            }
        }
    },
    pages: [
        {
            "route": "index",
            "name": "Home page",
            "title": "Home page",
            "modifications": [
                {
                    "type": "gallery",
                    "id": "main_gallery_01",
                    "gallery": {
                        "images": [
                            {
                                "src": "/themes/@cromwell/theme-store/main_banner_1.png",
                                "href": "/pages/some_page"
                            },
                            {
                                "src": "/themes/@cromwell/theme-store/main_banner_2.png",
                                "href": "/pages/some_page"
                            },
                            {
                                "src": "/themes/@cromwell/theme-store/main_banner_3.png",
                                "href": "/pages/some_page"
                            },
                            {
                                "src": "/themes/@cromwell/theme-store/main_banner_4.png",
                                "href": "/pages/some_page"
                            }
                        ],
                        "width": "100%",
                        "ratio": 3.75,
                        "showPagination": true
                    }
                },
                {
                    "type": "plugin",
                    "id": "main_showcase",
                    "plugin": {
                        "pluginName": "@cromwell/plugin-product-showcase"
                    }
                }
            ]
        },
        {
            "route": "category/[slug]",
            "name": "Product category page",
            "title": "Product category page",
            "isDynamic": true,
            "modifications": [
                {
                    "type": "plugin",
                    "id": "Category_ProductFilter_Plugin",
                    "parentId": "Category_ProductFilter",
                    "isVirtual": true,
                    "plugin": {
                        "pluginName": "@cromwell/plugin-product-filter"
                    }
                }
            ]
        },
        {
            "route": "product/[slug]",
            "name": "Product page",
            "title": "Product page",
            "isDynamic": true,
            "modifications": [
                {
                    "type": "plugin",
                    "id": "Product_ProductShowcase_Plugin",
                    "parentId": "Product_ProductShowcase",
                    "index": 1,
                    "isVirtual": true,
                    "plugin": {
                        "pluginName": "@cromwell/plugin-product-showcase"
                    }
                }
            ],
            adminPanelProps: {
                product: {
                    "id": "401",
                    "slug": "401",
                    "name": "Top Laptop",
                    "price": 231,
                    "oldPrice": 869,
                    "views": 0,
                    "images": [
                        "/themes/@cromwell/theme-store/product_3.jpg",
                        "/themes/@cromwell/theme-store/product_2.jpg",
                        "/themes/@cromwell/theme-store/product.jpg",
                        "/themes/@cromwell/theme-store/product.jpg",
                        "/themes/@cromwell/theme-store/product_3.jpg"
                    ],
                    "description": "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat.</p><ul><li><i class=\"porto-icon-ok\"></i>Any Product types that You want - Simple, Configurable</li><li><i class=\"porto-icon-ok\"></i>Downloadable/Digital Products, Virtual Products</li><li><i class=\"porto-icon-ok\"></i>Inventory Management with Backordered items</li></ul><p>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, <br>quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>",
                    "pageTitle": null,
                    "rating": {
                        "average": 3.25,
                        "reviewsNumber": 6
                    },
                    "reviews": {
                        "elements": [
                            {
                                "title": "Nothing special",
                                "productId": "401"
                            },
                            {
                                "title": "Just awesome",
                                "productId": "401"
                            },
                            {
                                "title": "All good",
                                "productId": "401"
                            }
                        ]
                    },
                    "attributes": [
                        {
                            "key": "Color",
                            "values": [
                                {
                                    "value": "Purple",
                                    "productVariant": {
                                        "images": [
                                            "/themes/@cromwell/theme-store/product_3.jpg"
                                        ]
                                    }
                                }
                            ]
                        },
                        {
                            "key": "Size",
                            "values": [
                                {
                                    "value": "38"
                                },
                                {
                                    "value": "40"
                                },
                                {
                                    "value": "42"
                                },
                                {
                                    "value": "44"
                                }
                            ]
                        }
                    ]
                }
            }
        },
        {
            "route": "pages/some_page",
            "name": "Custom page",
            "title": "Some custom page",
            "modifications": [
                {
                    "type": "plugin",
                    "id": "5",
                    "plugin": {
                        "pluginName": "@cromwell/plugin-product-showcase"
                    }
                },
                {
                    "type": "HTML",
                    "id": "1",
                    "parentId": "somep_1",
                },
                {
                    "type": "text",
                    "id": "3",
                    "parentId": "somep_1",
                    "index": "0"
                },
            ]
        }
    ],
    themeCustomConfig: {
        "store": {},
        "header": {
            "logo": "/themes/@cromwell/theme-store/shopping-cart.png",
            "contactPhone": "+123 (456) 78-90",
            "welcomeMessage": "Welcome message",
            "topLinks": [
                {
                    "title": "Contact us",
                    "href": "/contact-us"
                },
                {
                    "title": "Blog",
                    "href": "/blog"
                },
                {
                    "title": "Sign in",
                    "href": "/sign-in"
                }
            ]
        },
        "product": {
            "customTabs": [
                {
                    "label": "Custom tab",
                    "html": "<div><p>Custom tab</p></div>"
                }
            ]
        }
    },
    globalModifications: [
        {
            "type": "plugin",
            "id": "header_main_menu",
            "plugin": {
                "pluginName": "@cromwell/plugin-main-menu"
            }
        }
    ]
};