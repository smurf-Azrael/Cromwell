import { DBTableNames, TProductReview, TProductReviewInput, TPagedList, TPagedParams } from '@cromwell/core';
import { EntityRepository, Repository, getCustomRepository } from 'typeorm';

import { ProductReview } from '../entities/ProductReview';
import { getPaged, handleBaseInput } from './BaseQueries';
import { ProductRepository } from './ProductRepository';

@EntityRepository(ProductReview)
export class ProductReviewRepository extends Repository<ProductReview> {

    private productRepo = getCustomRepository(ProductRepository);
    async getProductReviews(params: TPagedParams<TProductReview>): Promise<TPagedList<TProductReview>> {
        return getPaged(this.createQueryBuilder(), DBTableNames.ProductReview, params);
    }

    async getProductReview(id: string): Promise<ProductReview> {
        const productReview = await this.findOne({
            where: { id }
        });
        if (!productReview) throw new Error(`ProductReview ${id} not found!`);
        return productReview;
    }

    async handleProductReviewInput(productReview: ProductReview, input: TProductReviewInput) {
        handleBaseInput(productReview, input);

        const product = await this.productRepo.getProductById(input.productId);
        if (!product) throw new Error(`ProductReviewRepository:handleProductReviewInput productId ${input.productId} not found!`);
        productReview.product = product;

        productReview.title = input.title;
        productReview.description = input.description;
        productReview.rating = input.rating;
        productReview.userName = input.userName;
    }

    async createProductReview(createProductReview: TProductReviewInput): Promise<TProductReview> {
        let productReview = new ProductReview();

        await this.handleProductReviewInput(productReview, createProductReview);

        productReview = await this.save(productReview);
        if (!productReview.slug) {
            productReview.slug = productReview.id;
            await this.save(productReview);
        }

        return productReview;
    }

    async updateProductReview(id: string, updateProductReview: TProductReviewInput): Promise<ProductReview> {
        let productReview = await this.findOne({
            where: { id }
        });
        if (!productReview) throw new Error(`ProductReview ${id} not found!`);

        await this.handleProductReviewInput(productReview, updateProductReview);

        productReview = await this.save(productReview);

        return productReview;
    }

    async deleteProductReview(id: string): Promise<boolean> {
        console.log('ProductReviewRepository::deleteProductReview; id: ' + id)

        const productReview = await this.getProductReview(id);
        if (!productReview) {
            console.log('ProductReviewRepository::deleteProductReview failed to find productReview by id');
            return false;
        }
        const res = await this.delete(id);
        return true;
    }


}