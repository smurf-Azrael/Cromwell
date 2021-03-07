import { logFor, TPagedList, TPagedParams, TUserInput } from '@cromwell/core';
import { EntityRepository } from 'typeorm';
import bcrypt from 'bcrypt';

import { User } from '../entities/User';
import { handleBaseInput } from './BaseQueries';
import { BaseRepository } from './BaseRepository';
import { getLogger } from '../helpers/constants';

const logger = getLogger('detailed');
const bcryptSaltRounds = 10;

@EntityRepository(User)
export class UserRepository extends BaseRepository<User> {

    constructor() {
        super(User)
    }

    async getUsers(params?: TPagedParams<User>): Promise<TPagedList<User>> {
        logger.log('UserRepository::getUsers');
        return this.getPaged(params)
    }

    async getUserById(id: string): Promise<User | undefined> {
        logger.log('UserRepository::getUserById id: ' + id);
        return this.getById(id);
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
        logger.log('UserRepository::getUserByEmail email: ' + email);

        const user = await this.findOne({
            where: { email }
        });

        return user;
    }

    async getUserBySlug(slug: string): Promise<User | undefined> {
        logger.log('UserRepository::getUserBySlug slug: ' + slug);
        return this.getBySlug(slug);
    }

    async handleUserInput(user: User, userInput: TUserInput) {
        user.fullName = userInput.fullName;
        user.email = userInput.email;
        user.avatar = userInput.avatar;
        if (userInput.password) {
            const hashedPass = await bcrypt.hash(userInput.password, bcryptSaltRounds);
            user.password = hashedPass;
        }
    }

    async createUser(createUser: TUserInput): Promise<User> {
        logger.log('UserRepository::createUser');
        let user = new User();

        handleBaseInput(user, createUser);
        await this.handleUserInput(user, createUser);

        user = await this.save(user);
        return user;
    }

    async updateUser(id: string, updateUser: TUserInput): Promise<User> {
        logger.log('UserRepository::updateUser id: ' + id);

        let user = await this.findOne({
            where: { id }
        });
        if (!user) throw new Error(`User ${id} not found!`);

        handleBaseInput(user, updateUser);
        await this.handleUserInput(user, updateUser);

        user = await this.save(user);
        return user;
    }

    async deleteUser(id: string): Promise<boolean> {
        logger.log('UserRepository::deleteUser; id: ' + id);

        const user = await this.getUserById(id);
        if (!user) {
            console.log('UserRepository::deleteUser failed to find user by id');
            return false;
        }
        const res = await this.delete(id);
        return true;

    }

}