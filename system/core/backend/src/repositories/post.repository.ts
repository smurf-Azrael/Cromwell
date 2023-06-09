import { TDeleteManyInput, TPagedList, TPagedParams, TPost, TPostInput } from '@cromwell/core';
import readingTime from 'reading-time';
import sanitizeHtml from 'sanitize-html';
import { EntityRepository, getCustomRepository, SelectQueryBuilder, Brackets } from 'typeorm';

import { PostFilterInput } from '../models/filters/post.filter';
import { Post } from '../models/entities/post.entity';
import { Tag } from '../models/entities/tag.entity';
import { getLogger } from '../helpers/logger';
import { PagedParamsInput } from '../models/inputs/paged-params.input';
import { checkEntitySlug, getPaged, handleBaseInput } from '../helpers/base-queries';
import { BaseRepository } from './base.repository';
import { TagRepository } from './tag.repository';
import { UserRepository } from './user.repository';

const logger = getLogger();

@EntityRepository(Post)
export class PostRepository extends BaseRepository<Post> {

    constructor() {
        super(Post)
    }

    async getPosts(params: TPagedParams<Post>): Promise<TPagedList<Post>> {
        logger.log('PostRepository::getPosts');
        return this.getPaged(params)
    }

    async getPostById(id: string): Promise<Post | undefined> {
        logger.log('PostRepository::getPostById id: ' + id);
        return this.getById(id);
    }

    async getPostBySlug(slug: string): Promise<Post | undefined> {
        logger.log('PostRepository::getPostBySlug slug: ' + slug);
        return this.getBySlug(slug);
    }

    private async handleBasePostInput(post: Post, input: TPostInput) {
        const author = await getCustomRepository(UserRepository).getUserById(input.authorId);
        if (!author) throw new Error(`Author for the new post was not found`);

        handleBaseInput(post, input);

        if (input.tagIds) {
            const tags = await getCustomRepository(TagRepository).getTagsByIds(input.tagIds);
            post.tags = tags;
        }

        if (input.readTime) {
            post.readTime = input.readTime;
        } else if (input.content) {
            const text = sanitizeHtml(input.content ?? '', {
                allowedTags: []
            });
            post.readTime = readingTime(text).minutes + '';
        }

        post.title = input.title;
        post.mainImage = input.mainImage ?? null;
        post.content = input.content ? sanitizeHtml(input.content, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'iframe']),
            allowedAttributes: {
                a: ['href', 'name', 'target'],
                '*': ['href', 'class', 'src', 'align', 'alt', 'title', 'width', 'height', 'style']
            },
        }) : input.content;
        post.delta = input.delta;
        post.excerpt = input.excerpt;
        post.published = input.published;
        post.featured = input.featured;
        post.authorId = input.authorId;
        post.publishDate = input.publishDate;
    }

    async createPost(createPost: TPostInput, id?: string): Promise<Post> {
        logger.log('PostRepository::createPost');
        let post = new Post();
        if (id) post.id = id;

        await this.handleBasePostInput(post, createPost);
        post = await this.save(post);
        await checkEntitySlug(post, Post);

        return post;
    }

    async updatePost(id: string, updatePost: TPostInput): Promise<Post> {
        logger.log('PostRepository::updatePost id: ' + id);

        let post = await this.findOne({
            where: { id }
        });
        if (!post) throw new Error(`Post ${id} not found!`);

        await this.handleBasePostInput(post, updatePost);
        post = await this.save(post);
        await checkEntitySlug(post, Post);

        return post;
    }

    async deletePost(id: string): Promise<boolean> {
        logger.log('PostRepository::deletePost; id: ' + id);

        const post = await this.getPostById(id);
        if (!post) {
            logger.error('PostRepository::deletePost failed to find post by id');
            return false;
        }
        const res = await this.delete(id);
        return true;
    }

    applyPostFilter(qb: SelectQueryBuilder<TPost>, filterParams?: PostFilterInput) {

        if (filterParams?.tagIds && filterParams.tagIds.length > 0) {
            qb.leftJoin(`${this.metadata.tablePath}.tags`, getCustomRepository(TagRepository).metadata.tablePath)
            qb.andWhere(`${getCustomRepository(TagRepository).metadata.tablePath}.id IN (:...ids)`, { ids: filterParams.tagIds });
        }
        // Search by title
        if (filterParams?.titleSearch && filterParams.titleSearch !== '') {
            const titleSearch = `%${filterParams.titleSearch}%`;
            const query = `${this.metadata.tablePath}.title ${this.getSqlLike()} :titleSearch`;
            qb.andWhere(query, { titleSearch });
        }

        if (filterParams?.authorId && filterParams.authorId !== '') {
            const authorId = filterParams.authorId;
            const query = `${this.metadata.tablePath}.${this.quote('authorId')} = :authorId`;
            qb.andWhere(query, { authorId });
        }

        // Filter by published
        if (filterParams?.published !== undefined && filterParams?.published !== null) {

            if (filterParams.published === true) {
                qb.andWhere(`${this.metadata.tablePath}.published = ${this.getSqlBoolStr(true)}`);
            }

            if (filterParams.published === false) {
                const brackets = new Brackets(subQb => {
                    subQb.where(`${this.metadata.tablePath}.published = ${this.getSqlBoolStr(false)}`);
                    subQb.orWhere(`${this.metadata.tablePath}.published IS NULL`);
                });
                qb.andWhere(brackets);
            }
        }

        // Filter by featured
        if (filterParams?.featured !== undefined && filterParams?.featured !== null) {

            if (filterParams.featured === true) {
                qb.andWhere(`${this.metadata.tablePath}.featured = ${this.getSqlBoolStr(true)}`);
            }

            if (filterParams.featured === false) {
                const brackets = new Brackets(subQb => {
                    subQb.where(`${this.metadata.tablePath}.featured = ${this.getSqlBoolStr(false)}`);
                    subQb.orWhere(`${this.metadata.tablePath}.featured IS NULL`);
                });
                qb.andWhere(brackets);
            }
        }
        return qb;
    }

    async getFilteredPosts(pagedParams?: PagedParamsInput<Post>, filterParams?: PostFilterInput): Promise<TPagedList<TPost>> {
        const qb = this.createQueryBuilder(this.metadata.tablePath);
        qb.select();
        this.applyPostFilter(qb, filterParams);
        return await getPaged(qb, this.metadata.tablePath, pagedParams);
    }

    async deleteManyFilteredPosts(input: TDeleteManyInput, filterParams?: PostFilterInput): Promise<boolean | undefined> {
        // Select first, because JOIN with DELETE is not supported by Typeorm (such a shame), 
        // we need it for post filter with tags (see above). 
        const qb = this.createQueryBuilder(this.metadata.tablePath).select(['id']);
        this.applyPostFilter(qb, filterParams);
        this.applyDeleteMany(qb, input);
        const ids: { id: string | number }[] = await qb.execute();

        const deleteQb = this.createQueryBuilder(this.metadata.tablePath).delete();
        this.applyDeleteMany(deleteQb, {
            all: false,
            ids: ids.map(id => id?.id + ''),
        });

        await deleteQb.execute();
        return true;
    }

    async getTagsOfPost(postId: string): Promise<Tag[] | undefined | null> {
        return (await this.findOne(postId, {
            relations: ['tags']
        }))?.tags;
    }
}
