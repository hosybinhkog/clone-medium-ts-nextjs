import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import React, { useState } from "react";
import Header from "../../components/Header";
import { urlFor, sanityClient } from "../../sanity";
import PortableText from "react-portable-text";
import { Post } from "../../typings";
import { useForm, SubmitHandler } from "react-hook-form";

interface DetailsPostProps {
  post: Post;
}

interface FormInput {
  name: string;
  email: string;
  comment: string;
  _id: string;
}

const DetailsPost: NextPage<DetailsPostProps> = ({
  post,
}: DetailsPostProps) => {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<FormInput>();

  const [submitted, setSubmitted] = useState<boolean>(false);

  const onSubmit: SubmitHandler<FormInput> = async (data) => {
    await fetch("/api/createComment", {
      method: "POST",
      body: JSON.stringify(data),
    })
      .then(() => {
        setSubmitted(true);
      })
      .catch((err) => {
        setSubmitted(false);
      });
  };

  return (
    <main>
      <Header />
      <img
        className="w-full object-cover h-40"
        src={urlFor(post.mainImage).url()}
        alt={post.title}
      />

      <article className="max-w-3xl mx-auto p-5">
        <h1 className="text-3xl mt-10 mb-3">{post.title}</h1>
        <h2 className="text-xl font-light text-gray-500 mb-2">
          {post.description}
        </h2>
        <div className="flex items-center space-x-2">
          <img
            className="h-10 w-10 rounded-full object-cover"
            src={urlFor(post.author.image)?.url()}
            alt=""
          />
          <p className="font-extrabold text-sm">
            Blog post by{" "}
            <span className="text-green-600">
              {post.author?.name || "noname"}
            </span>{" "}
            - Published at {new Date(post._createdAt).toLocaleString()}
          </p>
        </div>
        <div className="mt-10">
          <PortableText
            dataset={process.env.NEXT_PUBLIC_SANITY_DATASET}
            projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}
            content={post.body}
            serializers={{
              h1: (props: any) => (
                <h1 className="text-2xl font-bold my-5" {...props} />
              ),
              h2: (props: any) => (
                <h2 className="text-xl font-bold my-5" {...props} />
              ),
              unknownMark: (props: any) => (
                <span className="bg-green-400 text-white" {...props} />
              ),
              normal: (props: any) => (
                <p className="text-xs text-light" {...props} />
              ),
              link: ({ href, children }: any) => (
                <a href={href} className="text-blue-500 hover:underline ">
                  {children}
                </a>
              ),
            }}
          />
        </div>
      </article>
      <hr className="max-w-lg my-5 mx-auto border border-yellow-500" />

      {submitted ? (
        <div className="flex flex-col p-10 my-10 bg-yellow-500 text-white max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold">
            Thanks you for submitting your comment!
          </h3>
          <p>Once it has been approved, it will appear below!</p>
        </div>
      ) : (
        <form
          className="flex flex-col p-5 max-w-2xl mx-auto mb-10"
          onSubmit={handleSubmit(onSubmit)}
        >
          <h3 className="text-sm text-yellow-500">Enjoyed this article?</h3>
          <h4 className="text-3xl font-bold">Leave a comment below!</h4>
          <hr className="py-3 mt-2" />
          <input type="hidden" value={post._id} {...register("_id")} />
          <label htmlFor="" className="block mb-5">
            <span className="text-gray-700">Name</span>
            <input
              type="text"
              {...register("name", { required: true })}
              className=" shadow border rounded py-2 px-2 form-input mt-1 block w-full ring-yellow-500 focus:ring outline-none"
              placeholder="Messi"
            />
          </label>
          <label htmlFor="" className="block mb-5">
            <span className="text-gray-700">Email</span>
            <input
              type="email"
              {...register("email", { required: true })}
              className=" shadow border rounded py-2 px-2 form-input mt-1 block w-full ring-yellow-500 focus:ring outline-none"
              placeholder="Messi@Messi"
            />
          </label>
          <label htmlFor="" className="block mb-5">
            <span className="text-gray-700">Comment</span>
            <textarea
              rows={8}
              {...register("comment", { required: true })}
              className="shadow rounded border py-2 px-3 form-textarea mt-1 block w-full ring-yellow-500 focus:ring outline-none ring-0"
              placeholder="Comment..."
            />
          </label>

          <div className="flex flex-col p-5">
            {errors.name && (
              <span className="text-red-500">- The Name Field is required</span>
            )}
            {errors.email && (
              <span className="text-red-500">
                - The Email Field is required
              </span>
            )}
            {errors.comment && (
              <span className="text-red-500">
                - The Comment Field is required
              </span>
            )}
          </div>
          <input
            type="submit"
            className="shadow bg-yellow-500 hover:bg-yellow-400 focus:shadow-outline focus:outline-none text-white font-bold cursor-pointer py-2 px-4 rounded duration-200 ease-in-out"
          />
        </form>
      )}

      {/* //comments */}

      <div className="max-w-2xl mx-auto flex flex-col p-10 my-10 shadow-yellow-500 shadow rounded-sm space-y-2">
        <h3 className="text-4xl">Comments</h3>
        <hr className="pb-2" />
        {post.comments ? (
          post.comments.map((comment) => (
            <div key={comment._id}>
              <p>
                <span className="text-yellow-500">{comment.name}</span> :{" "}
                {comment.comment}
              </p>
            </div>
          ))
        ) : (
          <p>0 comments</p>
        )}
      </div>
    </main>
  );
};

export default DetailsPost;

export const getStaticPaths: GetStaticPaths = async () => {
  const queryStr = `*[_type=="post"]{
    _id,
    slug{
      current
    }
  }`;

  const posts: [Post] = await sanityClient.fetch(queryStr);

  const paths = posts.map((post) => ({
    params: {
      slug: post.slug.current,
    },
  }));

  return {
    paths,
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const query = `
    *[_type=="post" && slug.current == $slug][0]{
      _id,
      _createdAt,
      title,
      author->{
        name,
        image
      },
      'comments': *[
        _type=="comment" && post._ref == ^._id && approved == true],
        description,
        mainImage,
        slug,
        body
    }
  `;

  const post = await sanityClient.fetch(query, {
    slug: params?.slug,
  });

  if (!post) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      post,
    },
    revalidate: 60,
  };
};
