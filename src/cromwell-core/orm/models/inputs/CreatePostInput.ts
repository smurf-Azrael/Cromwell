import { InputType, Field, ID } from "type-graphql";
import { Post } from '../entities/Post';
import { Author } from '../entities/Author';

@InputType({ description: "New Post data" })
export class CreatePostInput implements Partial<Post> {
  @Field()
  title: string;

  @Field(type => ID)
  authorId: string;

  @Field()
  content: string;
}