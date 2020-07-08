import React from 'react';
import gql from 'graphql-tag';
import { CromwellPageType, ProductType, GetStaticPropsType, Link, GraphQLPaths } from '@cromwell/core';
import { CContainerBlock, getGraphQLClient } from '@cromwell/core-frontend';

interface ProductProps {
    data?: {
        product: ProductType;
    };
}
const Product: CromwellPageType<ProductProps> = (props) => {
    console.log('ProductThemePage props', props);
    const product = props.data ? props.data.product : undefined;
    return (
        <div>ProductTemp
            <Link href='/'><a>HOME</a></Link>
            {
                product && (
                    <div>
                        {product.name}
                        <p></p>
                    </div>
                )
            }
            <CContainerBlock id="3" />
        </div>
    );
}

export const getStaticProps: GetStaticPropsType = async (context) => {
    // console.log('context', context)
    const slug = (context && context.params) ? context.params.slug : null;
    console.log('ProductThemePage::getStaticProps: pid', slug, 'context.params', context.params)
    let data = null;
    if (slug) {
        try {
            data = await getGraphQLClient().request(
                `query getproduct {
                    product(slug: "${slug}") {
                        id
                        slug
                        name
                        pageTitle
                        price
                        mainImage
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

export default Product;
