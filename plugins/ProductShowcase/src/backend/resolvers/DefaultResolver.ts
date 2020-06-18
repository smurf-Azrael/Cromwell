import { Resolver, Query, Mutation, Arg, FieldResolver, Root } from "type-graphql";
import { ProductCategory } from '@cromwell/core-backend';
import { CreateProductCategory } from '@cromwell/core-backend';
import { UpdateProductCategory } from '@cromwell/core-backend';
import { PagedParamsInput } from '@cromwell/core-backend';
import { ProductCategoryRepository } from '@cromwell/core-backend';
import { ProductRepository } from '@cromwell/core-backend';
import { getCustomRepository } from "typeorm";
import { ProductType, ProductCategoryType } from "@cromwell/core";
import { Product } from '@cromwell/core-backend';


@Resolver(ProductCategory)
export default class ProductCategoryResolver {

    private get repo() { return getCustomRepository(ProductCategoryRepository) }

    @Query(() => ProductCategory)
    async productCategory(@Arg("slug") slug: string) {
        return await this.repo.getProductCategoryBySlug(slug);
    }

    @FieldResolver(() => [Product])
    async products(@Root() productCategory: ProductCategory, @Arg("pagedParams") pagedParams: PagedParamsInput<ProductType>): Promise<ProductType[]> {
        return await getCustomRepository(ProductRepository).getProductsFromCategory(productCategory.id, pagedParams);
    }
}