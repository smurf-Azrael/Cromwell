import { logFor, TPagedList, TPagedParams, TPostInput, TPost } from '@cromwell/core';
import sanitizeHtml from 'sanitize-html';
import { EntityRepository, getCustomRepository } from 'typeorm';
import { PagedParamsInput } from './../inputs/PagedParamsInput';

import { Post } from '../entities/Post';
import { handleBaseInput, checkEntitySlug, getPaged } from './BaseQueries';
import { BaseRepository } from './BaseRepository';
import { UserRepository } from './UserRepository';
import { PostFilterInput } from '../entities/filter/PostFilterInput';

@EntityRepository(Post)
export class PostRepository extends BaseRepository<Post> {

    constructor() {
        super(Post)
    }

    async getPosts(params: TPagedParams<Post>): Promise<TPagedList<Post>> {
        logFor('detailed', 'PostRepository::getPosts');
        return this.getPaged(params)
    }

    async getPostById(id: string): Promise<Post | undefined> {
        logFor('detailed', 'PostRepository::getPostById id: ' + id);
        return this.getById(id);
    }

    async getPostBySlug(slug: string): Promise<Post | undefined> {
        logFor('detailed', 'PostRepository::getPostBySlug slug: ' + slug);
        return this.getBySlug(slug);
    }

    private async handleBasePostInput(post: Post, input: TPostInput) {
        const author = await getCustomRepository(UserRepository).getUserById(input.authorId);
        if (!author) throw new Error(`Author for the new post was not found`);

        handleBaseInput(post, input);

        post.title = input.title;
        post.mainImage = input.mainImage ?? null;
        post.content = sanitizeHtml(input.content);
        post.delta = input.delta;
        post.isPublished = input.isPublished;
        post.authorId = input.authorId;
    }

    async createPost(createPost: TPostInput): Promise<Post> {
        logFor('detailed', 'PostRepository::createPost');
        let post = new Post();

        await this.handleBasePostInput(post, createPost);
        post = await this.save(post);
        await checkEntitySlug(post);

        return post;
    }

    async updatePost(id: string, updatePost: TPostInput): Promise<Post> {
        logFor('detailed', 'PostRepository::updatePost id: ' + id);

        let post = await this.findOne({
            where: { id }
        });
        if (!post) throw new Error(`Post ${id} not found!`);

        await this.handleBasePostInput(post, updatePost);
        post = await this.save(post);
        await checkEntitySlug(post);

        return post;
    }

    async deletePost(id: string): Promise<boolean> {
        logFor('detailed', 'PostRepository::deletePost; id: ' + id);

        const post = await this.getPostById(id);
        if (!post) {
            console.log('PostRepository::deletePost failed to find post by id');
            return false;
        }
        const res = await this.delete(id);
        return true;
    }

    async getFilteredPosts(pagedParams?: PagedParamsInput<Post>, filterParams?: PostFilterInput): Promise<TPagedList<TPost>> {

        const qb = this.createQueryBuilder(this.metadata.tablePath);
        qb.select();

        let isFirstAttr = true;
        const qbAddWhere: typeof qb.where = (where, params) => {
            if (isFirstAttr) {
                isFirstAttr = false;
                return qb.where(where, params);
            } else {
                return qb.andWhere(where as any, params);
            }
        }

        // Search by product name
        if (filterParams?.titleSearch && filterParams.titleSearch !== '') {
            const likeStr = `%${filterParams.titleSearch}%`;
            const query = `${this.metadata.tablePath}.title LIKE :likeStr`;
            qbAddWhere(query, { likeStr });
        }

        if (filterParams?.authorId) {
            const authorId = filterParams.authorId;
            const query = `${this.metadata.tablePath}.authorId = :authorId`;
            qbAddWhere(query, { authorId });
        }
        return await getPaged(qb, this.metadata.tablePath, pagedParams);
    }

}