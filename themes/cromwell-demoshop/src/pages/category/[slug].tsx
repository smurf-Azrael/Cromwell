import React from 'react';
import { TCromwellPage, TProductCategory, TGetStaticProps } from '@cromwell/core';
import { Link } from '@cromwell/core-frontend';
import { CContainer, getGraphQLClient } from '@cromwell/core-frontend';
import Layout from '../../components/layout/Layout';
import { Product } from '../../components/product/Product';
//@ts-ignore
import commonStyles from '../../styles/common.module.scss';
//@ts-ignore
import styles from '../../styles/pages/Category.module.scss';

interface ProductProps {
    data?: {
        productCategory: TProductCategory;
    };
}
const ProductCategory: TCromwellPage<ProductProps> = (props) => {
    console.log('ProductThemePage props', props);
    const category = props.data ? props.data.productCategory : undefined;
    return (
        <Layout>
            <div className={commonStyles.content}>
                <div className={styles.content}>
                    <div className={styles.sidebar}>
                        <h3>Filters..</h3>
                    </div>
                    <div className={styles.main}>
                        <div className={styles.productList}>
                            {category && category.products && category.products.map(p => {
                                return (
                                    <Product data={p} className={styles.product} />
                                )
                            })}
                        </div>
                    </div>
                </div>

            </div>
        </Layout>
    );
}

export const getStaticProps: TGetStaticProps = async (context) => {
    // console.log('context', context)
    const slug = (context && context.params) ? context.params.slug : null;
    console.log('CategoryThemePage::getStaticProps: slug', slug, 'context.params', context.params)
    let data = null;
    if (slug) {
        try {
            data = await getGraphQLClient().request(
                `query getProductCategory {
                    productCategory(slug: "${slug}") {
                      id
                      name
                      products(pagedParams: {
                        pageSize: 20
                      }) {
                        id
                        slug
                        name
                        pageTitle
                        price
                        mainImage
                      }
                    }
                  }
            `);
        } catch (e) {
            console.error('Product::getStaticProps', e)
        }
    } else {
        console.error('Product::getStaticProps: !pid')
    }

    return {
        data: data
    }

}

export const getStaticPaths = () => {
    return {
        paths: [],
        fallback: true
    };
}

export default ProductCategory;
